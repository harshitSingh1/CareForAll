import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Clock,
  Stethoscope,
  Brain,
  CheckCircle2,
  Edit3,
  AlertTriangle,
  XCircle,
  FileText,
  History,
  Shield,
  Pill,
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
  status: string;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  assigned_professional_id: string | null;
  is_critical?: boolean;
  is_ai_locked?: boolean;
  medical_disclaimer?: string | null;
}

interface RelatedCase {
  id: string;
  user_issue: string;
  status: string;
  category: string;
  created_at: string;
}

type ParsedAIResponse = {
  summary: string;
  remedies: string[];
  precautions: string;
  consultDoctor: string;
};

export default function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<SubmittedCase | null>(null);
  const [relatedCases, setRelatedCases] = useState<RelatedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [addDisclaimer, setAddDisclaimer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [roleLabel, setRoleLabel] = useState("Professional");

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const loadCaseData = async () => {
    if (!caseId) return;

    try {
      // Load the case
      const { data: caseResult, error: caseError } = await supabase
        .from("submitted_cases")
        .select("*")
        .eq("id", caseId)
        .single();

      if (caseError) throw caseError;
      setCaseData(caseResult);

      // Determine role label
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        const userRoles = roles?.map(r => r.role) || [];
        if (userRoles.includes("doctor")) {
          setRoleLabel("Doctor");
        } else if (userRoles.includes("advisor")) {
          setRoleLabel("Wellness Advisor");
        }
      }

      // Load related cases (same user, same category)
      const { data: related, error: relatedError } = await supabase
        .from("submitted_cases")
        .select("id, user_issue, status, category, created_at")
        .eq("user_id", caseResult.user_id)
        .eq("category", caseResult.category)
        .neq("id", caseId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!relatedError && related) {
        setRelatedCases(related);
      }
    } catch (error) {
      console.error("Error loading case:", error);
      toast.error("Failed to load case details");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const parseAIResponse = (response: string): ParsedAIResponse | null => {
    try {
      return JSON.parse(response);
    } catch {
      return null;
    }
  };

  const handleAction = async (newStatus: string, isCritical: boolean = false) => {
    if (!caseData) return;
    
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
        is_ai_locked: isCritical,
      };

      // Add disclaimer if provided
      if (addDisclaimer && disclaimer.trim()) {
        updateData.medical_disclaimer = disclaimer.trim();
      }

      const { error } = await supabase
        .from("submitted_cases")
        .update(updateData)
        .eq("id", caseData.id);

      if (error) throw error;

      // Create alert(s) to notify the user
      const alerts = [];
      
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

      await supabase.from("alerts").insert(alerts);

      toast.success(isCritical ? "Case marked as critical - user notified" : `Case ${newStatus} successfully`);
      setIsReviewMode(false);
      setNotes("");
      setDisclaimer("");
      setAddDisclaimer(false);
      loadCaseData();
    } catch (error) {
      console.error("Error updating case:", error);
      toast.error("Failed to update case");
    } finally {
      setSubmitting(false);
    }
  };

  const getAlertMessage = (status: string, role: string, reviewerNotes: string, isCritical: boolean = false): string => {
    if (isCritical) {
      return `🚨 CRITICAL ALERT: A ${role} has identified your case as requiring urgent attention. ${reviewerNotes}. Please seek immediate professional consultation. Do not rely on previous AI suggestions for this condition.`;
    }
    
    switch (status) {
      case "approved":
        return `✅ Your health case has been verified by a ${role}. The recommended solution has been approved as safe and appropriate.${reviewerNotes ? ` Note: ${reviewerNotes}` : ""}`;
      case "modified":
        return `📝 A ${role} has reviewed your case and provided modifications. Please check the updated recommendations: ${reviewerNotes}`;
      case "rejected":
        return `⚠️ IMPORTANT: A ${role} has determined that the AI suggestion is not appropriate for your case. ${reviewerNotes}. Please consult a healthcare professional before proceeding.`;
      default:
        return `Your case has been reviewed by a ${role}.`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading case details...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Case not found</div>
      </div>
    );
  }

  const parsedResponse = parseAIResponse(caseData.ai_response);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {caseData.category === "medical" ? (
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Stethoscope className="w-6 h-6 text-primary" />
                  </div>
                ) : (
                  <div className="p-2 bg-secondary/10 rounded-xl">
                    <Brain className="w-6 h-6 text-secondary" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">Case Detail</h1>
                  <p className="text-sm text-muted-foreground">ID: {caseData.id.slice(0, 8)}...</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(caseData.status, caseData.is_critical)}
              <Badge variant="outline" className="capitalize">{caseData.category}</Badge>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Symptoms/Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    User's Symptoms / Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="bg-muted/50 p-4 rounded-lg">{caseData.user_issue}</p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Submitted on {new Date(caseData.created_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    AI-Generated Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {parsedResponse ? (
                    <>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Summary</h4>
                        <p className="text-sm bg-primary/5 p-3 rounded-lg border border-primary/20">
                          {parsedResponse.summary}
                        </p>
                      </div>
                      
                      {parsedResponse.remedies.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Pill className="w-4 h-4 text-primary" />
                            Suggested Remedies
                          </h4>
                          <ul className="space-y-2">
                            {parsedResponse.remedies.map((remedy, idx) => (
                              <li key={idx} className="text-sm bg-muted/50 p-2 rounded-lg">
                                {remedy}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {parsedResponse.precautions && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-amber-500" />
                            Precautions
                          </h4>
                          <p className="text-sm text-muted-foreground">{parsedResponse.precautions}</p>
                        </div>
                      )}

                      {parsedResponse.consultDoctor && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-red-500" />
                            When to Consult a Doctor
                          </h4>
                          <p className="text-sm text-muted-foreground">{parsedResponse.consultDoctor}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm bg-primary/5 p-3 rounded-lg border border-primary/20 whitespace-pre-wrap">
                      {caseData.ai_response}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* User-Selected Solutions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    User-Selected Solution(s)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {caseData.selected_remedies.map((remedy, idx) => (
                      <li 
                        key={idx} 
                        className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg text-sm flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{remedy}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Review Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Expert Review Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  {caseData.reviewer_notes && caseData.status !== "pending_review" ? (
                    <div className={`p-4 rounded-lg mb-4 ${
                      caseData.status === "critical" || caseData.is_critical
                        ? "bg-red-600/10 border border-red-600/30"
                        : caseData.status === "rejected"
                        ? "bg-red-500/10 border border-red-500/30"
                        : caseData.status === "approved"
                        ? "bg-green-500/10 border border-green-500/30"
                        : "bg-blue-500/10 border border-blue-500/30"
                    }`}>
                      <p className="text-sm font-medium mb-1">Previous Review Notes:</p>
                      <p className="text-sm text-muted-foreground">{caseData.reviewer_notes}</p>
                      {caseData.medical_disclaimer && (
                        <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded">
                          <p className="text-xs font-medium text-amber-600">Medical Disclaimer:</p>
                          <p className="text-xs text-muted-foreground">{caseData.medical_disclaimer}</p>
                        </div>
                      )}
                      {caseData.reviewed_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Reviewed on {new Date(caseData.reviewed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : null}

                  {caseData.is_ai_locked && (
                    <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-600">
                      <ShieldAlert className="w-5 h-5" />
                      <span>AI suggestions are locked for this critical case</span>
                    </div>
                  )}

                  {isReviewMode ? (
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Add your professional notes, modifications, or warnings..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[120px]"
                      />
                      
                      {/* Medical Disclaimer Option */}
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="add-disclaimer-detail" 
                          checked={addDisclaimer}
                          onCheckedChange={(checked) => setAddDisclaimer(checked === true)}
                        />
                        <Label htmlFor="add-disclaimer-detail" className="text-sm cursor-pointer">
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
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve Solution
                        </Button>
                        
                        {/* Modify */}
                        <Button
                          onClick={() => handleAction("modified")}
                          disabled={submitting}
                          variant="outline"
                          className="border-blue-500 text-blue-600 hover:bg-blue-500/10"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Solution
                        </Button>
                        
                        {/* Reject */}
                        <Button
                          onClick={() => handleAction("rejected")}
                          disabled={submitting}
                          variant="outline"
                          className="border-orange-500 text-orange-600 hover:bg-orange-500/10"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Advice
                        </Button>
                        
                        {/* Mark Critical */}
                        <Button
                          onClick={() => handleAction("critical", true)}
                          disabled={submitting}
                          variant="destructive"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Mark Critical
                        </Button>
                      </div>
                      
                      {/* Critical Case Warning */}
                      <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-600">
                        <FileWarning className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          <strong>Critical cases:</strong> Marking as critical will immediately notify the user, recommend urgent consultation, and lock AI suggestions for this case.
                        </span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsReviewMode(false);
                          setNotes("");
                          setDisclaimer("");
                          setAddDisclaimer(false);
                        }}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setIsReviewMode(true)}
                      className="w-full"
                    >
                      Review This Case
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Cases */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-5 h-5 text-muted-foreground" />
                    Past Related Cases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {relatedCases.length > 0 ? (
                    <ul className="space-y-2">
                      {relatedCases.map((related) => (
                        <li key={related.id}>
                          <Link
                            to={`/case/${related.id}`}
                            className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm line-clamp-2">{related.user_issue}</p>
                              {getStatusBadge(related.status)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(related.created_at).toLocaleDateString()}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No related cases found
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Case Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Case Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="outline" className="capitalize">{caseData.category}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    {getStatusBadge(caseData.status, caseData.is_critical)}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Submitted</span>
                    <span>{new Date(caseData.created_at).toLocaleDateString()}</span>
                  </div>
                  {caseData.reviewed_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reviewed</span>
                      <span>{new Date(caseData.reviewed_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
