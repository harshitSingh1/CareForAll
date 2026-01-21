import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VaultPinLock } from "@/components/VaultPinLock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  MessageSquare, 
  Heart, 
  Stethoscope,
  AlertTriangle,
  Calendar,
  FileText,
  Shield,
  Clock,
  ChevronRight,
  Upload,
  File,
  Trash2,
  Download,
  Plus
} from "lucide-react";

interface TimelineItem {
  id: string;
  type: 'chat' | 'checkin' | 'review' | 'alert' | 'consultation' | 'document';
  title: string;
  description: string;
  date: string;
  metadata?: Record<string, any>;
}

interface MedicalDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  description: string | null;
  document_date: string | null;
  hospital_name: string | null;
  created_at: string;
}

export default function Vault() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    description: '',
    documentDate: '',
    hospitalName: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
    };
    checkAuth();
  }, [navigate]);

  // Load vault data only after PIN unlock
  useEffect(() => {
    if (isUnlocked) {
      loadVaultData();
    }
  }, [isUnlocked]);

  // Show PIN lock screen if not unlocked
  if (!isUnlocked) {
    return <VaultPinLock onUnlock={() => setIsUnlocked(true)} />;
  }

  const loadVaultData = async () => {
    setLoading(true);
    try {
      const [chatsRes, checkInsRes, reviewsRes, alertsRes, consultationsRes, documentsRes] = await Promise.all([
        supabase.from('chat_messages').select('*').order('created_at', { ascending: false }),
        supabase.from('check_ins').select('*').order('created_at', { ascending: false }),
        supabase.from('doctor_reviews').select('*').order('created_at', { ascending: false }),
        supabase.from('alerts').select('*').order('created_at', { ascending: false }),
        supabase.from('consultations').select('*').order('created_at', { ascending: false }),
        supabase.from('medical_documents').select('*').order('created_at', { ascending: false }),
      ]);

      const items: TimelineItem[] = [];

      // Process chat messages
      if (chatsRes.data) {
        chatsRes.data.forEach(chat => {
          items.push({
            id: chat.id,
            type: 'chat',
            title: chat.role === 'user' ? 'Your Message' : 'AI Response',
            description: chat.content.substring(0, 150) + (chat.content.length > 150 ? '...' : ''),
            date: chat.created_at,
            metadata: { messageType: chat.message_type, role: chat.role },
          });
        });
      }

      // Process check-ins
      if (checkInsRes.data) {
        checkInsRes.data.forEach(checkIn => {
          items.push({
            id: checkIn.id,
            type: 'checkin',
            title: `Mood: ${checkIn.mood}`,
            description: checkIn.journal || 'No journal entry',
            date: checkIn.created_at,
            metadata: { mood: checkIn.mood },
          });
        });
      }

      // Process doctor reviews
      if (reviewsRes.data) {
        reviewsRes.data.forEach(review => {
          items.push({
            id: review.id,
            type: 'review',
            title: `Doctor Review: ${review.status}`,
            description: review.problem.substring(0, 150) + (review.problem.length > 150 ? '...' : ''),
            date: review.created_at,
            metadata: { status: review.status, doctorReply: review.doctor_reply },
          });
        });
      }

      // Process alerts
      if (alertsRes.data) {
        alertsRes.data.forEach(alert => {
          items.push({
            id: alert.id,
            type: 'alert',
            title: `Alert: ${alert.alert_type}`,
            description: alert.message,
            date: alert.created_at,
            metadata: { severity: alert.severity, isRead: alert.is_read },
          });
        });
      }

      // Process consultations
      if (consultationsRes.data) {
        consultationsRes.data.forEach(consultation => {
          items.push({
            id: consultation.id,
            type: 'consultation',
            title: `Consultation: ${consultation.specialty}`,
            description: consultation.purpose || 'General consultation',
            date: consultation.created_at,
            metadata: { status: consultation.status, scheduledAt: consultation.scheduled_at },
          });
        });
      }

      // Process medical documents - generate signed URLs
      if (documentsRes.data) {
        const docsWithSignedUrls = await Promise.all(
          documentsRes.data.map(async (doc) => {
            // Extract file path from stored URL
            const urlParts = doc.file_url.split('/');
            const fileName = urlParts.slice(-2).join('/'); // user_id/filename
            
            // Generate signed URL for secure access (1 hour expiry)
            const { data: signedData } = await supabase.storage
              .from('medical-documents')
              .createSignedUrl(fileName, 3600);
            
            return {
              ...doc,
              file_url: signedData?.signedUrl || doc.file_url
            };
          })
        );
        
        setDocuments(docsWithSignedUrls);
        docsWithSignedUrls.forEach(doc => {
          items.push({
            id: doc.id,
            type: 'document',
            title: doc.file_name,
            description: doc.description || `Medical document from ${doc.hospital_name || 'Unknown hospital'}`,
            date: doc.created_at,
            metadata: { 
              fileType: doc.file_type, 
              fileUrl: doc.file_url, 
              hospitalName: doc.hospital_name,
              documentDate: doc.document_date 
            },
          });
        });
      }

      // Sort by date
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTimeline(items);
    } catch (error) {
      console.error('Error loading vault data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('medical-documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Generate signed URL for secure access
      const { data: signedData, error: signedError } = await supabase.storage
        .from('medical-documents')
        .createSignedUrl(fileName, 3600); // 1 hour expiry

      if (signedError) throw signedError;

      // Save document record with the storage path (not the signed URL which expires)
      // We store a reference path that we can use to generate new signed URLs
      const { data: urlData } = supabase.storage
        .from('medical-documents')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('medical_documents')
        .insert({
          user_id: user.id,
          file_name: selectedFile.name,
          file_url: urlData.publicUrl, // Store the reference path
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          description: uploadForm.description || null,
          document_date: uploadForm.documentDate || null,
          hospital_name: uploadForm.hospitalName || null,
        });

      if (dbError) throw dbError;

      toast({
        title: "Document uploaded",
        description: "Your medical document has been securely stored",
      });

      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadForm({ description: '', documentDate: '', hospitalName: '' });
      loadVaultData();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, fileUrl: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const filePath = `${user.id}/${urlParts[urlParts.length - 1].split('?')[0]}`; // Remove query params

      // Delete from storage
      await supabase.storage.from('medical-documents').remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('medical_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      toast({
        title: "Document deleted",
        description: "The document has been removed from your vault",
      });

      loadVaultData();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      case 'checkin': return <Heart className="w-4 h-4" />;
      case 'review': return <Stethoscope className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'consultation': return <Calendar className="w-4 h-4" />;
      case 'document': return <File className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chat': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'checkin': return 'bg-pink-500/20 text-pink-700 dark:text-pink-300';
      case 'review': return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
      case 'alert': return 'bg-amber-500/20 text-amber-700 dark:text-amber-300';
      case 'consultation': return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'document': return 'bg-teal-500/20 text-teal-700 dark:text-teal-300';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  const filteredTimeline = timeline.filter(item => {
    const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: timeline.length,
    chats: timeline.filter(i => i.type === 'chat').length,
    checkins: timeline.filter(i => i.type === 'checkin').length,
    reviews: timeline.filter(i => i.type === 'review').length,
    alerts: timeline.filter(i => i.type === 'alert').length,
    consultations: timeline.filter(i => i.type === 'consultation').length,
    documents: timeline.filter(i => i.type === 'document').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                Personal Record Vault
              </h1>
              <p className="text-muted-foreground">
                Your secure health and wellness timeline
              </p>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Medical Document</DialogTitle>
                    <DialogDescription>
                      Upload your previous medical records, reports, or images
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div 
                      className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileSelect}
                      />
                      {selectedFile ? (
                        <div className="space-y-2">
                          <File className="w-10 h-10 mx-auto text-primary" />
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                          <p className="font-medium">Click to select a file</p>
                          <p className="text-sm text-muted-foreground">
                            Images, PDFs, or documents (max 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the document"
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="documentDate">Document Date</Label>
                        <Input
                          id="documentDate"
                          type="date"
                          value={uploadForm.documentDate}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, documentDate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hospitalName">Hospital/Clinic</Label>
                        <Input
                          id="hospitalName"
                          placeholder="Hospital name"
                          value={uploadForm.hospitalName}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, hospitalName: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleUpload} 
                      className="w-full"
                      disabled={!selectedFile || uploading}
                    >
                      {uploading ? "Uploading..." : "Upload Document"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: FileText },
            { label: 'Chats', value: stats.chats, icon: MessageSquare },
            { label: 'Check-ins', value: stats.checkins, icon: Heart },
            { label: 'Reviews', value: stats.reviews, icon: Stethoscope },
            { label: 'Alerts', value: stats.alerts, icon: AlertTriangle },
            { label: 'Consultations', value: stats.consultations, icon: Calendar },
            { label: 'Documents', value: stats.documents, icon: File },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <stat.icon className="w-4 h-4" />
                  <span className="text-xs">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'chat', 'checkin', 'review', 'alert', 'consultation', 'document'].map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className="capitalize"
              >
                {filter === 'all' ? 'All' : filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your records...</p>
            </div>
          ) : filteredTimeline.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No records found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try a different search term' : 'Start using CareForAll to build your health timeline'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTimeline.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{item.title}</h3>
                          <Badge variant="outline" className="capitalize text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString()}
                          </span>
                          {item.metadata?.hospitalName && (
                            <span>📍 {item.metadata.hospitalName}</span>
                          )}
                        </div>
                      </div>
                      {item.type === 'document' && item.metadata?.fileUrl && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(item.metadata?.fileUrl, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(item.id, item.metadata?.fileUrl)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
