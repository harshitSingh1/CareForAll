import { supabase } from "@/integrations/supabase/client";
import { CaseClassification, mentalWellnessSpecialties, medicalSpecialties, allSpecialties } from "./caseClassification";

export interface AssignmentResult {
  professionalIds: string[];
  specialties: string[];
  reasons: string[];
  isFallback: boolean;
}

/**
 * Auto-assigns a submitted case to ALL available professionals matching the suggested specialties.
 * Creates assignment rows in case_assignments for each professional.
 */
export async function autoAssignProfessional(
  caseId: string,
  category: 'medical' | 'wellness',
  classification?: CaseClassification
): Promise<AssignmentResult> {
  try {
    const requiredRole = category === 'medical' ? 'doctor' : 'advisor';
    const validSpecialties = category === 'medical' ? medicalSpecialties : mentalWellnessSpecialties;

    // Determine target specialties - filter to only those valid for the category
    // Also include specialties from secondary_specialties of available professionals for broader matching
    let targetSpecialties: string[] = [];
    if (classification?.suggestedSpecialties) {
      targetSpecialties = classification.suggestedSpecialties.filter(s => validSpecialties.includes(s));
    }
    // If no matches found, use broader defaults that include common specialties
    if (targetSpecialties.length === 0) {
      targetSpecialties = category === 'medical' 
        ? ['General Medicine', 'Internal Medicine', 'Other'] 
        : ['Mental Wellness', 'Psychology', 'Psychiatry', 'Counseling', 'Behavioral Health'];
    }

    // Get all verified available professionals with matching primary OR secondary specialty
    const { data: matchingProfiles, error: profileError } = await supabase
      .from('doctor_profiles')
      .select('user_id, specialty, secondary_specialties')
      .eq('is_verified', true)
      .eq('availability_status', 'available');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return { professionalIds: [], specialties: [], reasons: ['Error fetching profiles'], isFallback: false };
    }

    if (!matchingProfiles || matchingProfiles.length === 0) {
      // No available professionals at all - mark fallback
      await supabase.from('submitted_cases').update({
        assigned_specialties: targetSpecialties,
        assignment_reason: 'No available professionals found',
        is_fallback_assignment: true
      }).eq('id', caseId);
      return { professionalIds: [], specialties: targetSpecialties, reasons: ['No available professionals found'], isFallback: true };
    }

    // Filter by role
    const professionalIds = matchingProfiles.map(p => p.user_id);
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', requiredRole)
      .in('user_id', professionalIds);

    const eligibleIds = new Set((roleData || []).map(r => r.user_id));

    // Build list of matching professionals
    type MatchedPro = { userId: string; matchedSpecialty: string };
    const matchedProfessionals: MatchedPro[] = [];

    for (const profile of matchingProfiles) {
      if (!eligibleIds.has(profile.user_id)) continue;

      // Check primary specialty
      if (targetSpecialties.includes(profile.specialty)) {
        matchedProfessionals.push({ userId: profile.user_id, matchedSpecialty: profile.specialty });
        continue;
      }

      // Check secondary specialties
      const secondaries = (profile as any).secondary_specialties as string[] | undefined;
      if (secondaries && secondaries.length > 0) {
        const match = secondaries.find(s => targetSpecialties.includes(s));
        if (match) {
          matchedProfessionals.push({ userId: profile.user_id, matchedSpecialty: match });
        }
      }
    }

    let isFallback = false;
    let assignmentReason = `Auto-matched to ${targetSpecialties.join(', ')} based on case analysis`;

    // If no specialty match, fallback to all eligible professionals
    if (matchedProfessionals.length === 0) {
      isFallback = true;
      assignmentReason = `Specialist unavailable - assigned to all available ${requiredRole}s for general review`;

      for (const profile of matchingProfiles) {
        if (eligibleIds.has(profile.user_id)) {
          matchedProfessionals.push({ userId: profile.user_id, matchedSpecialty: profile.specialty });
        }
      }
    }

    // Update case with all suggested specialties so user sees the tags
    await supabase.from('submitted_cases').update({
      assigned_specialties: targetSpecialties,
      assignment_reason: assignmentReason,
      is_fallback_assignment: isFallback
    }).eq('id', caseId);

    // Insert assignment rows for each matched professional
    if (matchedProfessionals.length > 0) {
      const rows = matchedProfessionals.map(mp => ({
        case_id: caseId,
        professional_id: mp.userId,
        specialty: mp.matchedSpecialty,
        assignment_reason: assignmentReason,
        is_fallback: isFallback
      }));

      const { error: insertError } = await supabase.from('case_assignments').insert(rows);
      if (insertError) {
        console.error('Error inserting case_assignments:', insertError);
      }
    }

    return {
      professionalIds: matchedProfessionals.map(mp => mp.userId),
      specialties: targetSpecialties,
      reasons: [assignmentReason],
      isFallback
    };
  } catch (error) {
    console.error('Error in autoAssignProfessional:', error);
    return { professionalIds: [], specialties: [], reasons: ['Assignment error'], isFallback: false };
  }
}

/**
 * Gets available specialties for a category with professional counts
 */
export async function getAvailableSpecialties(category: 'medical' | 'wellness'): Promise<{ specialty: string; count: number }[]> {
  const requiredRole = category === 'medical' ? 'doctor' : 'advisor';

  try {
    const { data: profiles } = await supabase
      .from('doctor_profiles')
      .select('user_id, specialty, secondary_specialties')
      .eq('is_verified', true)
      .eq('availability_status', 'available');

    if (!profiles || profiles.length === 0) {
      return [];
    }

    const professionalIds = profiles.map(p => p.user_id);
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', requiredRole)
      .in('user_id', professionalIds);

    if (!roleData || roleData.length === 0) {
      return [];
    }

    const eligibleIds = new Set(roleData.map(r => r.user_id));

    const specialtyCounts: Record<string, number> = {};
    for (const profile of profiles) {
      if (eligibleIds.has(profile.user_id)) {
        specialtyCounts[profile.specialty] = (specialtyCounts[profile.specialty] || 0) + 1;

        const secondaries = (profile as any).secondary_specialties as string[] | undefined;
        if (secondaries) {
          for (const sec of secondaries) {
            specialtyCounts[sec] = (specialtyCounts[sec] || 0) + 1;
          }
        }
      }
    }

    return Object.entries(specialtyCounts)
      .map(([specialty, count]) => ({ specialty, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error getting available specialties:', error);
    return [];
  }
}
