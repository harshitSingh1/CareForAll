/**
 * Case classification utilities for matching user issues to specialties
 * IMPORTANT: Keep specialty lists in sync with DoctorProfileSetup.tsx
 * 
 * This file defines 20+ medical specialties that the AI classifies cases into.
 * Doctors can filter their workbench by any of these specialties.
 */

export type Category = 'medical' | 'wellness';

export type SubCategory = 
  // Wellness categories
  | 'stress'
  | 'anxiety'
  | 'depression'
  | 'burnout'
  | 'sleep'
  | 'lifestyle'
  // Medical categories
  | 'general_medicine'
  | 'cardiology'
  | 'dermatology'
  | 'pediatrics'
  | 'gynecology'
  | 'orthopedics'
  | 'neurology'
  | 'psychiatry'
  | 'gastroenterology'
  | 'pulmonology'
  | 'endocrinology'
  | 'nephrology'
  | 'urology'
  | 'ophthalmology'
  | 'ent'
  | 'oncology'
  | 'rheumatology'
  | 'infectious_disease'
  | 'allergy_immunology'
  | 'emergency_medicine'
  | 'other';

export interface CaseClassification {
  category: Category;
  subCategory: SubCategory;
  suggestedSpecialties: string[];
  confidence: 'high' | 'medium' | 'low';
  keywords: string[];
}

// Keywords mapped to sub-categories
const keywordMap: Record<SubCategory, string[]> = {
  // Wellness
  stress: ['stress', 'stressed', 'overwhelm', 'overwhelmed', 'pressure', 'tense', 'tension', 'burnt out', 'overworked'],
  anxiety: ['anxiety', 'anxious', 'worry', 'worried', 'panic', 'nervous', 'fear', 'fearful', 'scared', 'phobia', 'restless'],
  depression: ['depress', 'depressed', 'depression', 'sad', 'hopeless', 'worthless', 'empty', 'lonely', 'grief', 'loss', 'melancholy'],
  burnout: ['burnout', 'burnt out', 'exhausted', 'drained', 'fatigue', 'tired all the time', 'no motivation', 'unmotivated'],
  sleep: ['sleep', 'insomnia', 'cant sleep', "can't sleep", 'nightmares', 'night terrors', 'sleeping too much', 'oversleep', 'drowsy'],
  lifestyle: ['diet', 'exercise', 'weight', 'nutrition', 'fitness', 'eating habits', 'healthy living', 'wellness routine', 'self-care'],
  
  // Medical
  general_medicine: ['fever', 'cold', 'flu', 'cough', 'pain', 'ache', 'infection', 'virus', 'bacteria', 'sick', 'unwell', 'nausea', 'vomit', 'weakness', 'fatigue'],
  cardiology: ['heart', 'chest pain', 'palpitation', 'blood pressure', 'hypertension', 'cardiac', 'cardiovascular', 'heart attack', 'angina', 'arrhythmia'],
  dermatology: ['skin', 'rash', 'acne', 'eczema', 'psoriasis', 'dermatitis', 'itch', 'hives', 'mole', 'hair loss', 'alopecia', 'fungal', 'ringworm'],
  pediatrics: ['child', 'baby', 'infant', 'toddler', 'kid', 'pediatric', 'children', 'newborn', 'vaccination', 'growth'],
  gynecology: ['menstrual', 'period', 'pregnancy', 'pregnant', 'menopause', 'ovary', 'uterus', 'pcos', 'fertility', 'contraception', 'breast'],
  orthopedics: ['bone', 'joint', 'fracture', 'sprain', 'arthritis', 'back pain', 'spine', 'knee', 'hip', 'shoulder', 'muscle', 'ligament', 'tendon'],
  neurology: ['headache', 'migraine', 'dizziness', 'vertigo', 'seizure', 'numbness', 'tingling', 'memory', 'brain', 'nerve', 'stroke', 'paralysis'],
  psychiatry: ['mental health', 'psychiatric', 'psychosis', 'bipolar', 'schizophrenia', 'ocd', 'ptsd', 'trauma', 'addiction', 'substance', 'hallucination'],
  gastroenterology: ['stomach', 'digestion', 'acid reflux', 'heartburn', 'constipation', 'diarrhea', 'ibs', 'liver', 'gallbladder', 'ulcer', 'bloating', 'gastric'],
  pulmonology: ['lungs', 'breathing', 'asthma', 'bronchitis', 'pneumonia', 'copd', 'shortness of breath', 'wheezing', 'chest congestion', 'respiratory'],
  endocrinology: ['diabetes', 'thyroid', 'hormones', 'insulin', 'metabolism', 'pituitary', 'adrenal', 'blood sugar', 'hyperthyroid', 'hypothyroid'],
  nephrology: ['kidney', 'renal', 'dialysis', 'urinary', 'creatinine', 'kidney stone', 'kidney failure'],
  urology: ['bladder', 'prostate', 'urination', 'erectile', 'uti', 'urinary tract', 'incontinence', 'testicular'],
  ophthalmology: ['eye', 'vision', 'blind', 'cataract', 'glaucoma', 'retina', 'glasses', 'blurry vision', 'eye pain', 'conjunctivitis'],
  ent: ['ear', 'nose', 'throat', 'hearing', 'sinus', 'tonsil', 'adenoid', 'snoring', 'voice', 'larynx', 'tinnitus', 'ear pain'],
  oncology: ['cancer', 'tumor', 'chemotherapy', 'radiation', 'malignant', 'benign', 'lump', 'biopsy', 'oncologist'],
  rheumatology: ['autoimmune', 'lupus', 'fibromyalgia', 'gout', 'rheumatoid', 'inflammation', 'joint swelling', 'connective tissue'],
  infectious_disease: ['hiv', 'aids', 'hepatitis', 'tuberculosis', 'tb', 'malaria', 'dengue', 'covid', 'infectious', 'contagious'],
  allergy_immunology: ['allergy', 'allergic', 'anaphylaxis', 'food allergy', 'hay fever', 'immune', 'immunodeficiency', 'autoimmune'],
  emergency_medicine: ['emergency', 'accident', 'trauma', 'urgent', 'severe pain', 'bleeding', 'unconscious', 'poisoning', 'overdose'],
  other: []
};

// Sub-categories mapped to category
const subCategoryToCategory: Record<SubCategory, Category> = {
  // Wellness
  stress: 'wellness',
  anxiety: 'wellness',
  depression: 'wellness',
  burnout: 'wellness',
  sleep: 'wellness',
  lifestyle: 'wellness',
  // Medical
  general_medicine: 'medical',
  cardiology: 'medical',
  dermatology: 'medical',
  pediatrics: 'medical',
  gynecology: 'medical',
  orthopedics: 'medical',
  neurology: 'medical',
  psychiatry: 'medical',
  gastroenterology: 'medical',
  pulmonology: 'medical',
  endocrinology: 'medical',
  nephrology: 'medical',
  urology: 'medical',
  ophthalmology: 'medical',
  ent: 'medical',
  oncology: 'medical',
  rheumatology: 'medical',
  infectious_disease: 'medical',
  allergy_immunology: 'medical',
  emergency_medicine: 'medical',
  other: 'medical'
};

// Sub-categories mapped to specialties (MUST match doctor profile specialties)
// NOTE: All wellness categories should include Psychiatry since mental health professionals often have that specialty
const subCategoryToSpecialties: Record<SubCategory, string[]> = {
  // Wellness - include Psychiatry in ALL wellness categories for broader matching
  stress: ['Mental Wellness', 'Psychology', 'Counseling', 'Stress Management', 'Psychiatry', 'Behavioral Health'],
  anxiety: ['Mental Wellness', 'Psychology', 'Psychiatry', 'Counseling', 'Behavioral Health'],
  depression: ['Mental Wellness', 'Psychology', 'Psychiatry', 'Counseling', 'Behavioral Health'],
  burnout: ['Mental Wellness', 'Psychology', 'Counseling', 'Stress Management', 'Psychiatry', 'Behavioral Health'],
  sleep: ['Sleep Medicine', 'Mental Wellness', 'Psychology', 'Neurology', 'Psychiatry'],
  lifestyle: ['Mental Wellness', 'Counseling', 'General Medicine', 'Behavioral Health'],
  // Medical - include General Medicine broadly for fallback matching
  general_medicine: ['General Medicine', 'Internal Medicine', 'Other'],
  cardiology: ['Cardiology', 'General Medicine', 'Internal Medicine'],
  dermatology: ['Dermatology', 'General Medicine'],
  pediatrics: ['Pediatrics', 'General Medicine'],
  gynecology: ['Gynecology', 'Obstetrics', 'General Medicine'],
  orthopedics: ['Orthopedics', 'Sports Medicine', 'General Medicine'],
  neurology: ['Neurology', 'General Medicine', 'Psychiatry'],
  psychiatry: ['Psychiatry', 'Mental Wellness', 'Psychology', 'Behavioral Health'],
  gastroenterology: ['Gastroenterology', 'General Medicine', 'Internal Medicine'],
  pulmonology: ['Pulmonology', 'General Medicine'],
  endocrinology: ['Endocrinology', 'Diabetology', 'General Medicine'],
  nephrology: ['Nephrology', 'General Medicine'],
  urology: ['Urology', 'General Medicine'],
  ophthalmology: ['Ophthalmology', 'General Medicine'],
  ent: ['ENT (Ear, Nose, Throat)', 'General Medicine'],
  oncology: ['Oncology', 'General Medicine'],
  rheumatology: ['Rheumatology', 'General Medicine'],
  infectious_disease: ['Infectious Disease', 'General Medicine'],
  allergy_immunology: ['Allergy & Immunology', 'General Medicine'],
  emergency_medicine: ['Emergency Medicine', 'General Medicine'],
  other: ['General Medicine', 'Other', 'Internal Medicine']
};

// Mental wellness specialties - cases matching these should go to advisors
// SYNCED with DoctorProfileSetup.tsx wellnessSpecialties
export const mentalWellnessSpecialties = [
  'Mental Wellness',
  'Psychology', 
  'Counseling',
  'Stress Management',
  'Sleep Medicine',
  'Behavioral Health',
  'Other'
];

// Medical specialties (20+ options) - SYNCED with DoctorProfileSetup.tsx medicalSpecialties
export const medicalSpecialties = [
  'General Medicine',
  'Internal Medicine',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'Psychiatry',
  'Orthopedics',
  'Gynecology',
  'Obstetrics',
  'Gastroenterology',
  'Pulmonology',
  'Endocrinology',
  'Diabetology',
  'Nephrology',
  'Urology',
  'Ophthalmology',
  'ENT (Ear, Nose, Throat)',
  'Oncology',
  'Rheumatology',
  'Infectious Disease',
  'Allergy & Immunology',
  'Emergency Medicine',
  'Sports Medicine',
  'Other'
];

// All specialties combined (for filters)
export const allSpecialties = [...new Set([...mentalWellnessSpecialties, ...medicalSpecialties])];

/**
 * Classifies a user's issue into category and sub-category
 */
export function classifyCase(userIssue: string): CaseClassification {
  const lowerIssue = userIssue.toLowerCase();
  const matchedKeywords: string[] = [];
  const subCategoryScores: Partial<Record<SubCategory, number>> = {};

  // Score each sub-category based on keyword matches
  for (const [subCategory, keywords] of Object.entries(keywordMap)) {
    for (const keyword of keywords) {
      if (lowerIssue.includes(keyword)) {
        const score = (subCategoryScores[subCategory as SubCategory] || 0) + keyword.length;
        subCategoryScores[subCategory as SubCategory] = score;
        matchedKeywords.push(keyword);
      }
    }
  }

  // Find the best matching sub-category
  let bestSubCategory: SubCategory = 'other';
  let bestScore = 0;

  for (const [subCategory, score] of Object.entries(subCategoryScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestSubCategory = subCategory as SubCategory;
    }
  }

  const category = subCategoryToCategory[bestSubCategory];
  const suggestedSpecialties = subCategoryToSpecialties[bestSubCategory];

  // Determine confidence based on number of matching keywords
  const uniqueKeywords = [...new Set(matchedKeywords)];
  let confidence: 'high' | 'medium' | 'low';
  if (uniqueKeywords.length >= 3) {
    confidence = 'high';
  } else if (uniqueKeywords.length >= 1) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    category,
    subCategory: bestSubCategory,
    suggestedSpecialties,
    confidence,
    keywords: uniqueKeywords
  };
}

/**
 * Gets display name for sub-category
 */
export function getSubCategoryDisplayName(subCategory: SubCategory): string {
  const displayNames: Record<SubCategory, string> = {
    // Wellness
    stress: 'Stress Management',
    anxiety: 'Anxiety & Worry',
    depression: 'Depression & Mood',
    burnout: 'Burnout Recovery',
    sleep: 'Sleep Issues',
    lifestyle: 'Lifestyle & Wellness',
    // Medical
    general_medicine: 'General Medicine',
    cardiology: 'Heart & Cardiovascular',
    psychiatry: 'Psychiatric Care',
    dermatology: 'Skin & Hair',
    pediatrics: 'Child Health',
    gynecology: "Women's Health",
    orthopedics: 'Bone & Joint',
    neurology: 'Brain & Nerves',
    gastroenterology: 'Digestive System',
    pulmonology: 'Lungs & Respiratory',
    endocrinology: 'Hormones & Metabolism',
    nephrology: 'Kidney Health',
    urology: 'Urinary & Reproductive',
    ophthalmology: 'Eye Health',
    ent: 'Ear, Nose & Throat',
    oncology: 'Cancer Care',
    rheumatology: 'Autoimmune & Joints',
    infectious_disease: 'Infectious Diseases',
    allergy_immunology: 'Allergies & Immunity',
    emergency_medicine: 'Emergency Care',
    other: 'Other'
  };
  return displayNames[subCategory] || subCategory;
}

/**
 * Gets specialty options relevant to a classification
 */
export function getRelevantSpecialties(classification: CaseClassification): { specialty: string; isRecommended: boolean }[] {
  const allOptions = classification.category === 'wellness' 
    ? mentalWellnessSpecialties 
    : medicalSpecialties;

  return allOptions.map(specialty => ({
    specialty,
    isRecommended: classification.suggestedSpecialties.includes(specialty)
  }));
}
