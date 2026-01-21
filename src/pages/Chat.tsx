import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, Heart, Pill, Apple, Brain, Shield, Stethoscope, CheckCircle, Clock, ArrowRight, AlertTriangle, BadgeCheck, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { chatService } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { autoAssignProfessional } from "@/lib/caseAssignment";
import type { AssignmentResult } from "@/lib/caseAssignment";
import { classifyCase, CaseClassification, getSubCategoryDisplayName } from "@/lib/caseClassification";

type StructuredResponse = {
  summary: string;
  remedies: string[];
  precautions: string;
  consultDoctor: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  structured?: StructuredResponse;
  timestamp: Date;
  previousUserMessage?: string;
};

type SelectedRemedies = {
  [messageId: string]: string[];
};

type SubmittedCase = {
  messageId: string;
  status: string;
  reviewerNotes?: string | null;
  category?: string;
  reviewedAt?: string | null;
  assignedSpecialties?: string[];  // Changed to array for multiple specialists
  isFallback?: boolean;
};

const parseStructuredContent = (content: string): StructuredResponse | null => {
  try {
    const parsed = JSON.parse(content);
    if (parsed.summary && Array.isArray(parsed.remedies)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRemedies, setSelectedRemedies] = useState<SelectedRemedies>({});
  const [submittedCases, setSubmittedCases] = useState<SubmittedCase[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setIsAuthenticated(true);
      setUserId(user.id);
      await loadMessages();
      await loadSelectedRemedies(user.id);
      await loadSubmittedCases(user.id);
    };
    checkAuth();
  }, [navigate]);

  const loadSubmittedCases = async (uid: string) => {
    const { data, error } = await supabase
      .from('submitted_cases')
      .select('message_id, status, reviewer_notes, category, reviewed_at, assigned_specialty, is_fallback_assignment, sub_category')
      .eq('user_id', uid);
    
    if (!error && data) {
      setSubmittedCases(data.map(c => ({ 
        messageId: c.message_id, 
        status: c.status,
        reviewerNotes: c.reviewer_notes,
        category: c.category,
        reviewedAt: c.reviewed_at,
        // Store suggested specialties based on classification
        assignedSpecialties: c.assigned_specialty ? [c.assigned_specialty] : [],
        isFallback: c.is_fallback_assignment
      })));
    }
  };

  const loadSelectedRemedies = async (uid: string) => {
    const { data, error } = await supabase
      .from('selected_remedies')
      .select('*')
      .eq('user_id', uid);
    
    if (!error && data) {
      const grouped: SelectedRemedies = {};
      data.forEach(item => {
        if (!grouped[item.message_id]) {
          grouped[item.message_id] = [];
        }
        grouped[item.message_id].push(item.remedy_text);
      });
      setSelectedRemedies(grouped);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await chatService.getMessages('health');
      if (data.length === 0) {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your CareForAll health and wellness assistant. I'm here to provide guidance on health concerns, mental wellness support, diet suggestions, and coping strategies. How can I help you today?",
            timestamp: new Date(),
          },
        ]);
      } else {
        const formattedMessages: Message[] = [];
        let lastUserMessage = "";
        
        data.forEach(msg => {
          const structured = msg.role === 'assistant' ? parseStructuredContent(msg.content) : null;
          const message: Message = {
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            structured: structured || undefined,
            timestamp: new Date(msg.created_at),
          };
          
          if (msg.role === 'user') {
            lastUserMessage = msg.content;
          } else if (msg.role === 'assistant') {
            message.previousUserMessage = lastUserMessage;
          }
          
          formattedMessages.push(message);
        });
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const handleRemedyToggle = async (messageId: string, remedy: string, checked: boolean) => {
    if (!userId) return;

    if (checked) {
      const { error } = await supabase.from('selected_remedies').insert({
        user_id: userId,
        message_id: messageId,
        remedy_text: remedy,
      });
      
      if (!error) {
        setSelectedRemedies(prev => ({
          ...prev,
          [messageId]: [...(prev[messageId] || []), remedy]
        }));
      }
    } else {
      const { error } = await supabase
        .from('selected_remedies')
        .delete()
        .eq('user_id', userId)
        .eq('message_id', messageId)
        .eq('remedy_text', remedy);
      
      if (!error) {
        setSelectedRemedies(prev => ({
          ...prev,
          [messageId]: (prev[messageId] || []).filter(r => r !== remedy)
        }));
      }
    }
  };

  // Directly submit and auto-route to recommended specialists (no user selection)
  const handleSubmitForReview = async (message: Message) => {
    if (!userId || !message.structured) return;
    
    const selected = selectedRemedies[message.id] || [];
    if (selected.length === 0) {
      toast({
        title: "No remedies selected",
        description: "Please select at least one remedy before proceeding.",
        variant: "destructive",
      });
      return;
    }

    const userIssue = message.previousUserMessage || "Health concern";
    const classification = classifyCase(userIssue);
    
    setSubmitting(message.id);

    try {
      // Insert the case with enhanced classification data
      const { data: insertedCase, error } = await supabase.from('submitted_cases').insert({
        user_id: userId,
        message_id: message.id,
        user_issue: userIssue,
        ai_response: JSON.stringify(message.structured),
        selected_remedies: selected,
        category: classification.category,
        sub_category: classification.subCategory,
        status: 'pending_review',
      }).select('id').single();

      if (error) throw error;

      // Auto-assign to all recommended specialists
      let assignmentResult: AssignmentResult = { 
        professionalIds: [], 
        specialties: [], 
        reasons: [], 
        isFallback: false 
      };
      
      if (insertedCase?.id) {
        assignmentResult = await autoAssignProfessional(
          insertedCase.id, 
          classification.category, 
          classification
        );
      }

      // Use specialties from the assignment result (filtered to valid ones for category)
      const displaySpecialties = assignmentResult.specialties.length > 0 
        ? assignmentResult.specialties 
        : classification.suggestedSpecialties;

      setSubmittedCases(prev => [...prev, { 
        messageId: message.id, 
        status: 'pending_review', 
        category: classification.category,
        assignedSpecialties: displaySpecialties,
        isFallback: assignmentResult.isFallback
      }]);

      toast({
        title: "Sent for expert review",
        description: `Case routed to ${displaySpecialties.slice(0, 2).join(', ')}${displaySpecialties.length > 2 ? ` +${displaySpecialties.length - 2} more` : ''} specialists.`,
      });
    } catch (error) {
      console.error('Error submitting case:', error);
      toast({
        title: "Submission failed",
        description: "Could not submit for review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  };

  const getCaseStatus = (messageId: string) => {
    return submittedCases.find(c => c.messageId === messageId);
  };

  const quickSuggestions = [
    { icon: Heart, text: "I'm feeling stressed", category: "mental" },
    { icon: Pill, text: "Home remedy for headache", category: "health" },
    { icon: Apple, text: "Healthy diet suggestions", category: "nutrition" },
    { icon: Brain, text: "Coping strategies for anxiety", category: "mental" },
  ];

  const handleSend = async () => {
    if (!input.trim() || !isAuthenticated) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const conversationHistory = messages.map(m => ({ 
        role: m.role, 
        content: m.structured ? JSON.stringify(m.structured) : m.content 
      }));
      conversationHistory.push({ role: "user", content: userMessage.content });

      await chatService.sendMessage(conversationHistory, 'health');
      await loadMessages();
      
      toast({
        title: "Response received",
        description: "AI has provided guidance based on your question.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickSuggestion = (text: string) => {
    setInput(text);
  };

  const renderStatusBadge = (caseData: SubmittedCase) => {
    const { status, category, reviewerNotes, reviewedAt, assignedSpecialties, isFallback } = caseData;
    const isDoctor = category === 'medical';
    const primarySpecialty = assignedSpecialties?.[0];
    const expertLabel = primarySpecialty || (isDoctor ? 'Doctor' : 'Wellness Advisor');
    
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; bgClass?: string }> = {
      pending_review: { label: "Awaiting expert review", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      in_review: { label: "Under review", variant: "default", icon: <Stethoscope className="h-3 w-3" /> },
      approved: { 
        label: `Verified by ${expertLabel}`, 
        variant: "default", 
        icon: <BadgeCheck className="h-3 w-3" />,
        bgClass: "bg-green-600 hover:bg-green-700"
      },
      modified: { 
        label: `Reviewed by ${expertLabel}`, 
        variant: "default", 
        icon: <UserCheck className="h-3 w-3" />,
        bgClass: "bg-blue-600 hover:bg-blue-700"
      },
      flagged: { 
        label: `Safety Warning from ${expertLabel}`, 
        variant: "destructive", 
        icon: <AlertTriangle className="h-3 w-3" /> 
      },
    };

    const config = statusConfig[status] || statusConfig.pending_review;

    return (
      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge 
            variant={config.variant} 
            className={`flex items-center gap-1 ${config.bgClass || ''}`}
          >
            {config.icon}
            {config.label}
          </Badge>
          
          {/* Show fallback warning */}
          {isFallback && status === 'pending_review' && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/50">
              <AlertTriangle className="h-3 w-3 mr-1" />
              General review
            </Badge>
          )}
        </div>
        
        {/* Show specialist tags - whom the case was sent to */}
        {status === 'pending_review' && assignedSpecialties && assignedSpecialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-xs text-muted-foreground">Sent to:</span>
            {assignedSpecialties.map((specialty, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className="text-xs bg-primary/5 border-primary/30"
              >
                {specialty}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Show expert notes if available */}
        {reviewerNotes && (status === 'approved' || status === 'modified' || status === 'flagged') && (
          <div className={`rounded-lg p-3 text-sm ${
            status === 'flagged' 
              ? 'bg-destructive/10 border border-destructive/30' 
              : status === 'modified'
              ? 'bg-blue-500/10 border border-blue-500/30'
              : 'bg-green-500/10 border border-green-500/30'
          }`}>
            <div className="flex items-start gap-2">
              {status === 'flagged' ? (
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              ) : (
                <BadgeCheck className={`h-4 w-4 shrink-0 mt-0.5 ${status === 'modified' ? 'text-blue-600' : 'text-green-600'}`} />
              )}
              <div>
                <p className="font-medium text-xs mb-1">
                  {status === 'flagged' ? 'Safety Warning' : 'Expert Notes'}
                </p>
                <p className="text-muted-foreground">{reviewerNotes}</p>
              </div>
            </div>
          </div>
        )}
        
        {reviewedAt && (
          <p className="text-xs text-muted-foreground">
            Reviewed on {new Date(reviewedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  };

  const renderStructuredResponse = (message: Message) => {
    const { structured, id } = message;
    if (!structured) return null;

    const selected = selectedRemedies[id] || [];
    const caseStatus = getCaseStatus(id);
    const isSubmitted = !!caseStatus;

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div>
          <p className="text-sm sm:text-base leading-relaxed">{structured.summary}</p>
        </div>

        {/* Remedies */}
        {structured.remedies.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Pill className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Possible Remedies</span>
              {!isSubmitted && selected.length > 0 && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {selected.length} selected
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {structured.remedies.map((remedy, idx) => (
                <Card 
                  key={idx} 
                  className={`p-3 transition-all ${
                    isSubmitted 
                      ? selected.includes(remedy) 
                        ? 'border-primary bg-primary/5' 
                        : 'opacity-50'
                      : selected.includes(remedy) 
                        ? 'border-primary bg-primary/5 cursor-pointer' 
                        : 'border-border/50 hover:border-primary/50 cursor-pointer'
                  }`}
                  onClick={() => !isSubmitted && handleRemedyToggle(id, remedy, !selected.includes(remedy))}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={selected.includes(remedy)}
                      onCheckedChange={(checked) => !isSubmitted && handleRemedyToggle(id, remedy, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={isSubmitted}
                    />
                    <span className="text-sm flex-1">{remedy}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Precautions */}
        {structured.precautions && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Precautions</span>
            </div>
            <p className="text-sm text-muted-foreground">{structured.precautions}</p>
          </div>
        )}

        {/* When to Consult Doctor */}
        {structured.consultDoctor && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">When to Consult a Doctor</span>
            </div>
            <p className="text-sm text-muted-foreground">{structured.consultDoctor}</p>
          </div>
        )}

        {/* Submit Button or Status */}
        {isSubmitted ? (
          renderStatusBadge(caseStatus)
        ) : (
          selected.length > 0 && (
            <Button 
              onClick={() => handleSubmitForReview(message)}
              disabled={submitting === id}
              className="w-full mt-3"
              size="sm"
            >
              {submitting === id ? (
                "Submitting..."
              ) : (
                <>
                  Proceed with Selected Solution
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )
        )}
      </div>
    );
  };

  const renderPlainMessage = (content: string) => {
    return <p className="text-sm sm:text-base leading-relaxed">{content}</p>;
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex-1 pt-20 pb-4 flex flex-col overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col max-w-4xl flex-1 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 shrink-0"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-primary p-2 rounded-2xl">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">AI Health Assistant</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Get instant guidance, verified by healthcare professionals
            </p>
          </motion.div>

          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 shrink-0"
            >
              <p className="text-sm text-muted-foreground mb-3">Quick suggestions:</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {quickSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleQuickSuggestion(suggestion.text)}
                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-left group"
                  >
                    <div className={`p-2 rounded-xl bg-gradient-${suggestion.category === "mental" ? "secondary" : "primary"} group-hover:scale-110 transition-transform`}>
                      <suggestion.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium">{suggestion.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <Card className="flex-1 p-4 sm:p-6 mb-4 overflow-hidden bg-card/30 backdrop-blur-sm border-border/50 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="bg-gradient-primary p-2 rounded-2xl h-fit shrink-0">
                        <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-2xl ${
                        message.role === "user"
                          ? "bg-gradient-primary text-primary-foreground"
                          : "bg-muted/50"
                      }`}
                    >
                      {message.role === "assistant" && message.structured 
                        ? renderStructuredResponse(message)
                        : renderPlainMessage(message.content)
                      }
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {message.role === "user" && (
                      <div className="bg-gradient-accent p-2 rounded-2xl h-fit shrink-0">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 sm:gap-3"
                >
                  <div className="bg-gradient-primary p-2 rounded-2xl h-fit">
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                  <div className="bg-muted/50 p-3 sm:p-4 rounded-2xl">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </Card>

          <div className="flex gap-2 sm:gap-3 shrink-0">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your health question..."
              className="flex-1 rounded-full px-4 sm:px-6 py-5 sm:py-6 text-sm sm:text-base bg-card/50 backdrop-blur-sm border-border/50 focus-visible:ring-primary"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="lg"
              className="rounded-full px-6 sm:px-8"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3 shrink-0">
            💡 Important recommendations are reviewed by certified healthcare professionals
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;