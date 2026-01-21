import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  Edit3,
  AlertTriangle,
  XCircle,
  User,
  Clock,
  X,
  ExternalLink,
  ShieldAlert,
  FileWarning,
} from "lucide-react";

interface SubmittedCase {
  id: string;
  user_id: string;
  message_id: string;
  user_issue: string;
  ai_response: string;
  selected_remedies: string[];
  category: string;
  sub_category?: string | null;
  status: string;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  is_critical?: boolean;
  is_ai_locked?: boolean;
  medical_disclaimer?: string | null;
  assigned_specialty?: string | null;
  assigned_specialties?: string[] | null;
  assignment_reason?: string | null;
  is_fallback_assignment?: boolean;
}

interface CaseReviewCardProps {
  caseData: SubmittedCase;
  onUpdate: () => void;
  roleLabel: string;
}

export function CaseReviewCard({ caseData, onUpdate, roleLabel }: CaseReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [addDisclaimer, setAddDisclaimer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAction = async (newStatus: string, isCritical: boolean = false) => {
    // Require notes for actions that need explanation
    if ((newStatus === "modified" || newStatus === "rejected" || newStatus === "critical") && !notes.trim()) {
      toast.error("Please add notes explaining your decision");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare update data
      const updateData: Record<string, unknown> = {
        status: newStatus,
        reviewer_id: user?.id,
        reviewer_notes: notes.trim() || `${roleLabel} ${newStatus} this case.`,
        reviewed_at: new Date().toISOString(),
        is_critical: isCritical,
        is_ai_locked: isCritical, // Lock AI suggestions for critical cases
      };

      // Add disclaimer if provided
      if (addDisclaimer && disclaimer.trim()) {
        updateData.medical_disclaimer = disclaimer.trim();
      }

      // Update the case status
      const { error } = await supabase
        .from("submitted_cases")
        .update(updateData)
        .eq("id", caseData.id);

      if (error) throw error;

      // Create alert(s) to notify the user
      const alerts = [];
      
      // Main review alert
      const alertMessage = getAlertMessage(newStatus, roleLabel, notes.trim(), isCritical);
      const alertSeverity = isCritical ? "critical" : 
                           newStatus === "rejected" ? "high" : 
                           newStatus === "modified" ? "medium" : "low";
      
      alerts.push({
        user_id: caseData.user_id,
        alert_type: isCritical ? "critical_case" : "case_review",
        message: alertMessage,
        severity: alertSeverity,
      });

      // Additional critical case alert for urgent consultation
      if (isCritical) {
        alerts.push({
          user_id: caseData.user_id,
          alert_type: "urgent_consultation",
          message: `🚨 URGENT: Your health case requires immediate professional attention. Please schedule a consultation with a healthcare provider as soon as possible. AI recommendations for this case have been suspended pending professional evaluation.`,
          severity: "critical",
        });
      }

      // Disclaimer alert if added
      if (addDisclaimer && disclaimer.trim()) {
        alerts.push({
          user_id: caseData.user_id,
          alert_type: "medical_disclaimer",
          message: `📋 Medical Disclaimer from ${roleLabel}: ${disclaimer.trim()}`,
          severity: "medium",
        });
      }

      const { error: alertError } = await supabase
        .from("alerts")
        .insert(alerts);

      if (alertError) {
        console.error("Error creating alerts:", alertError);
      }

      toast.success(isCritical ? "Case marked as critical - user notified" : `Case ${newStatus} successfully`);
      setIsExpanded(false);
      setNotes("");
      setDisclaimer("");
      setAddDisclaimer(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating case:", error);
      toast.error("Failed to update case");
    } finally {
      setSubmitting(false);
    }
  };

  const getAlertMessage = (status: string, role: string, reviewerNotes: string, isCritical: boolean): string => {
    const roleTitle = role === "Doctor" ? "Doctor" : "Wellness Advisor";
    
    if (isCritical) {
      return `🚨 CRITICAL ALERT: A ${roleTitle} has identified your case as requiring urgent attention. ${reviewerNotes}. Please seek immediate professional consultation. Do not rely on previous AI suggestions for this condition.`;
    }
    
    switch (status) {
      case "approved":
        return `✅ Your health case has been verified by a ${roleTitle}. The recommended solution has been approved as safe and appropriate.${reviewerNotes ? ` Note: ${reviewerNotes}` : ""}`;
      case "modified":
        return `📝 A ${roleTitle} has reviewed your case and provided modifications. Please check the updated recommendations: ${reviewerNotes}`;
      case "rejected":
        return `⚠️ IMPORTANT: A ${roleTitle} has determined that the AI suggestion is not appropriate for your case. ${reviewerNotes}. Please consult a healthcare professional before proceeding.`;
      default:
        return `Your case has been reviewed by a ${roleTitle}.`;
    }
  };

  const getStatusBadge = (status: string, isCritical?: boolean) => {
    if (isCritical) {
      return <Badge className="bg-red-600/20 text-red-600 border-red-600/30 animate-pulse">Critical</Badge>;
    }
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Approved</Badge>;
      case "modified":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Modified</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Rejected</Badge>;
      case "critical":
        return <Badge className="bg-red-600/20 text-red-600 border-red-600/30">Critical</Badge>;
      case "in_review":
        return <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">In Review</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Pending</Badge>;
    }
  };

  return (
    <Card className={`overflow-hidden border-border/50 hover:border-primary/30 transition-colors ${caseData.is_critical ? 'border-red-500/50 bg-red-500/5' : ''}`}>
      <CardHeader className="pb-3 bg-muted/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Case ID: {caseData.id.slice(0, 8)}...
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(caseData.status, caseData.is_critical)}
            <Badge 
              variant="outline" 
              className={`capitalize ${
                caseData.category === 'medical' 
                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' 
                  : 'bg-purple-500/10 text-purple-600 border-purple-500/30'
              }`}
            >
              {caseData.category}
            </Badge>
            {caseData.sub_category && (
              <Badge variant="secondary" className="text-xs capitalize">
                {caseData.sub_category.replace('_', ' ')}
              </Badge>
            )}
            <Link to={`/case/${caseData.id}`}>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <Clock className="w-3 h-3" />
          {new Date(caseData.created_at).toLocaleString()}
        </div>
        
        {/* Assigned specialties */}
        {(caseData.assigned_specialties && caseData.assigned_specialties.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs text-muted-foreground">Assigned to:</span>
            {caseData.assigned_specialties.map((spec, idx) => (
              <Badge key={idx} variant="outline" className="text-xs bg-primary/5 border-primary/30">
                {spec}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Assignment reason info */}
        {caseData.assignment_reason && (
          <div className={`mt-2 text-xs px-2 py-1 rounded ${caseData.is_fallback_assignment ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'}`}>
            {caseData.is_fallback_assignment && <AlertTriangle className="w-3 h-3 inline mr-1" />}
            {caseData.assignment_reason}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">User's Issue</h4>
            <p className="text-foreground bg-muted/50 p-3 rounded-lg text-sm">{caseData.user_issue}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">AI Suggestion</h4>
            {caseData.is_ai_locked ? (
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-sm text-red-600 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                AI suggestions locked for this critical case
              </div>
            ) : (
              <p className="text-foreground bg-primary/5 border border-primary/20 p-3 rounded-lg text-sm whitespace-pre-wrap">
                {caseData.ai_response}
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">User-Selected Solution(s)</h4>
            <ul className="space-y-1">
              {caseData.selected_remedies.map((remedy, idx) => (
                <li 
                  key={idx} 
                  className="bg-secondary/10 border border-secondary/30 p-2 rounded-lg text-sm flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <span>{remedy}</span>
                </li>
              ))}
            </ul>
          </div>

          {isExpanded ? (
            <div className="space-y-3 pt-2 border-t border-border">
              <Textarea
                placeholder={`Add your professional notes, modifications, or concerns...`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
              
              {/* Medical Disclaimer Option */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="add-disclaimer" 
                  checked={addDisclaimer}
                  onCheckedChange={(checked) => setAddDisclaimer(checked === true)}
                />
                <Label htmlFor="add-disclaimer" className="text-sm cursor-pointer">
                  Add medical disclaimer
                </Label>
              </div>
              
              {addDisclaimer && (
                <Textarea
                  placeholder="Enter medical disclaimer (e.g., 'This advice does not replace professional medical consultation...')"
                  value={disclaimer}
                  onChange={(e) => setDisclaimer(e.target.value)}
                  className="min-h-[60px] border-amber-500/50"
                />
              )}
              
              <div className="flex flex-wrap gap-2">
                {/* Approve */}
                <Button
                  onClick={() => handleAction("approved")}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                
                {/* Modify */}
                <Button
                  onClick={() => handleAction("modified")}
                  disabled={submitting}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-500/10"
                  size="sm"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Modify
                </Button>
                
                {/* Reject */}
                <Button
                  onClick={() => handleAction("rejected")}
                  disabled={submitting}
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-500/10"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Advice
                </Button>
                
                {/* Mark Critical */}
                <Button
                  onClick={() => handleAction("critical", true)}
                  disabled={submitting}
                  variant="destructive"
                  size="sm"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Mark Critical
                </Button>
                
                {/* Cancel */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false);
                    setNotes("");
                    setDisclaimer("");
                    setAddDisclaimer(false);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
              
              {/* Critical Case Warning */}
              <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-600">
                <FileWarning className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Critical cases:</strong> Marking as critical will immediately notify the user, recommend urgent consultation, and lock AI suggestions for this case.
                </span>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsExpanded(true)}
              className="w-full"
              variant="outline"
            >
              Review This Case
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
