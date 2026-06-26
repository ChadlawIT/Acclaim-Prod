import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Check, 
  AlertTriangle, 
  Download, 
  Upload, 
  Send, 
  FileText, 
  Calendar,
  PoundSterling,
  Printer,
  Trash2,
  RefreshCw,
  Search,
  Bell,
  Building2,
  X,
  Paperclip
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { validateFile, ACCEPTED_FILE_TYPES_STRING, MAX_FILE_SIZE_MB, ACCEPTED_FILE_TYPES_DISPLAY } from "@/lib/fileValidation";

interface CaseDetailProps {
  case: any;
}

export default function CaseDetail({ case: caseData }: CaseDetailProps) {
  const [newMessage, setNewMessage] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileQueueErrors, setFileQueueErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [messageAttachment, setMessageAttachment] = useState<File | null>(null);
  const [messageAttachmentError, setMessageAttachmentError] = useState<string | null>(null);
  const [isDragOverAttachment, setIsDragOverAttachment] = useState(false);
  const [activeTab, setActiveTab] = useState("timeline");
  const [messageSearch, setMessageSearch] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");
  const [notifyOnUpload, setNotifyOnUpload] = useState(true);
  const [selectedMessageForView, setSelectedMessageForView] = useState<any | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [dialogReplyMessage, setDialogReplyMessage] = useState("");
  const [dialogReplyFile, setDialogReplyFile] = useState<File | null>(null);
  const [dialogReplyFileError, setDialogReplyFileError] = useState<string | null>(null);
  const [dialogReplyIsDragOver, setDialogReplyIsDragOver] = useState(false);
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = !!(user as any)?.isSuperAdmin;

  // Organisations list for the super-admin "change organisation" control
  const { data: organisations } = useQuery<any[]>({
    queryKey: ["/api/admin/organisations"],
    enabled: isSuperAdmin,
  });

  const changeOrganisationMutation = useMutation({
    mutationFn: async (organisationId: number) => {
      return await apiRequest("PUT", `/api/admin/cases/${caseData.id}/organisation`, { organisationId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organisations"] });
      setOrgDialogOpen(false);
      toast({
        title: "Organisation Updated",
        description: "The case has been moved to the selected organisation.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorised",
          description: "You are not authorised to perform this action.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to change the case organisation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOpenOrgDialog = () => {
    setSelectedOrgId(caseData.organisationId ? String(caseData.organisationId) : "");
    setOrgDialogOpen(true);
  };

  // Calculate accurate outstanding amount
  const getTotalPayments = () => {
    if (!payments || !Array.isArray(payments) || payments.length === 0) return 0;
    return payments.reduce((sum: number, payment: any) => {
      const numericAmount = parseFloat(payment.amount || 0);
      return sum + (isNaN(numericAmount) ? 0 : numericAmount);
    }, 0);
  };

  const getOutstandingAmount = () => {
    // Use the static outstanding amount from the database
    return parseFloat(caseData.outstandingAmount || 0);
  };

  const handlePaymentsClick = () => {
    setActiveTab("payments");
    // Scroll to payments section after a brief delay to allow tab to render
    setTimeout(() => {
      const paymentsSection = document.querySelector('[data-tab="payments"]');
      if (paymentsSection) {
        paymentsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const handleMessagesClick = () => {
    setActiveTab("messages");
    // Scroll to messages section after a brief delay to allow tab to render
    setTimeout(() => {
      const messagesSection = document.querySelector('[data-tab="messages"]');
      if (messagesSection) {
        messagesSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const getLastMessage = () => {
    if (!messages || !Array.isArray(messages) || messages.length === 0) return null;
    return messages[0]; // Messages are ordered by newest first
  };

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/cases", caseData.id, "activities"],
    enabled: !!caseData.id,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/cases", caseData.id, "documents"],
    enabled: !!caseData.id,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/cases", caseData.id, "messages"],
    enabled: !!caseData.id,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ["/api/cases", caseData.id, "payments"],
    enabled: !!caseData.id,
    // Faster refresh for real-time payment updates
    staleTime: 30 * 1000, // 30 seconds - data is considered fresh for only 30 seconds
    cacheTime: 60 * 1000, // 1 minute cache time
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: true, // Continue refreshing even when tab is not active
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Check if this case is muted for the current user
  const { data: muteStatus, isLoading: muteStatusLoading } = useQuery({
    queryKey: ["/api/cases", caseData.id, "muted"],
    enabled: !!caseData.id,
  });

  const muteCaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/cases/${caseData.id}/mute`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Case Muted",
        description: "You will no longer receive notifications for this case.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseData.id, "muted"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to mute case.",
        variant: "destructive",
      });
    },
  });

  const unmuteCaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/cases/${caseData.id}/unmute`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Case Unmuted",
        description: "You will now receive notifications for this case.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseData.id, "muted"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to unmute case.",
        variant: "destructive",
      });
    },
  });

  const handleToggleMute = () => {
    if (muteStatus?.muted) {
      unmuteCaseMutation.mutate();
    } else {
      muteCaseMutation.mutate();
    }
  };

  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: number) => {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete activity: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Activity Deleted",
        description: "Timeline entry has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseData.id, "activities"] });
    },
    onError: (error: any) => {
      console.error("Error deleting activity:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete activity.",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const attachFile = messageData.attachmentFile || messageAttachment;
      if (attachFile) {
        const formData = new FormData();
        formData.append("caseId", messageData.caseId);
        formData.append("recipientType", messageData.recipientType);
        formData.append("recipientId", messageData.recipientId);
        formData.append("subject", messageData.subject);
        formData.append("content", messageData.content);
        formData.append("attachment", attachFile);
        
        const response = await fetch("/api/messages", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error("Failed to send message");
        }
        
        return response.json();
      } else {
        await apiRequest("POST", "/api/messages", messageData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseData.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      // Also invalidate documents cache since attachments are now saved as documents
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseData.id, "documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setNewMessage("");
      setMessageSubject("");
      setMessageAttachment(null);
      // Reset message attachment file input
      const messageFileInput = document.getElementById("message-attachment") as HTMLInputElement;
      if (messageFileInput) messageFileInput.value = "";
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, notify, fileName }: { file: File; notify: boolean; fileName: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caseId", caseData.id.toString());
      if (fileName && fileName.trim()) {
        formData.append("customFileName", fileName.trim());
      }
      // Admin uploads notify users, regular users notify admin
      if (user?.isAdmin) {
        formData.append("notifyUsers", notify.toString());
      } else {
        formData.append("notifyAdmin", notify.toString());
      }
      
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseData.id, "documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setSelectedFile(null);
      setCustomFileName("");
      setNotifyOnUpload(true);
      // Reset file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("DELETE", `/api/admin/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseData.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest("DELETE", `/api/admin/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseData.id, "documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  // Track message view mutation
  const trackMessageViewMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("POST", "/api/track/view", { itemType: "message", itemId: messageId });
    },
  });

  // Helper to truncate message content for preview
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  // Handle opening message popup and track view
  const handleOpenMessage = (message: any) => {
    setSelectedMessageForView(message);
    setMessageDialogOpen(true);
    setDialogReplyMessage("");
    trackMessageViewMutation.mutate(message.id);
  };

  // Handle reply from message dialog
  const handleDialogReply = () => {
    if (!dialogReplyMessage.trim() || !selectedMessageForView) return;
    
    const fromName = selectedMessageForView.senderName || selectedMessageForView.senderEmail || 'Unknown';
    const replyContent = `${dialogReplyMessage}\n\n--- Original Message ---\nFrom: ${fromName}\nDate: ${formatDate(selectedMessageForView.createdAt)}\nSubject: ${selectedMessageForView.subject}\n\n${selectedMessageForView.content}`;
    
    sendMessageMutation.mutate({
      caseId: caseData.id,
      recipientType: "organisation",
      recipientId: "support",
      subject: `Re: ${selectedMessageForView.subject || 'Message'}`,
      content: replyContent,
      attachmentFile: dialogReplyFile,
    }, {
      onSuccess: () => {
        setDialogReplyMessage("");
        setDialogReplyFile(null);
        setDialogReplyFileError(null);
        setMessageDialogOpen(false);
      }
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const subject = messageSubject.trim() || `Message regarding case ${caseData.accountNumber}`;

    sendMessageMutation.mutate({
      caseId: caseData.id,
      recipientType: "organisation",
      recipientId: "support",
      subject: subject,
      content: newMessage,
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCustomFileName("");
    }
  };

  const handleFileUpload = () => {
    if (!selectedFile) return;
    // Build final filename with original extension
    const ext = selectedFile.name.split('.').pop();
    const finalFileName = customFileName.trim() ? `${customFileName.trim()}.${ext}` : selectedFile.name;
    uploadDocumentMutation.mutate({ file: selectedFile, notify: notifyOnUpload, fileName: finalFileName });
  };

  const addFilesToQueue = (incoming: FileList | File[]) => {
    const files = Array.from(incoming);
    const errors: Record<string, string> = {};
    const valid: File[] = [];
    files.forEach(f => {
      const v = validateFile(f);
      if (!v.isValid) errors[f.name] = v.error || "Invalid file";
      else valid.push(f);
    });
    setFileQueueErrors(prev => ({ ...prev, ...errors }));
    setSelectedFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !existing.has(f.name))];
    });
  };

  const removeFromQueue = (name: string) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== name));
    setFileQueueErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const uploadQueue = async () => {
    for (const file of selectedFiles) {
      await new Promise<void>((resolve, reject) => {
        uploadDocumentMutation.mutate(
          { file, notify: notifyOnUpload, fileName: file.name },
          { onSuccess: () => resolve(), onError: (e) => reject(e) }
        );
      });
    }
    setSelectedFiles([]);
    setFileQueueErrors({});
  };

  const getStageBadge = (status: string, stage: string) => {
    if (status === "resolved" || status?.toLowerCase() === "closed") {
      return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Closed</Badge>;
    }
    
    // Normalize stage for consistent comparison
    const normalizedStage = stage?.toLowerCase().replace(/[_-\s]/g, '');
    
    switch (normalizedStage) {
      case "initialcontact":
      case "prelegal":
        return <Badge className="bg-blue-100 text-blue-800">Pre-Legal</Badge>;
      case "claim":
        return <Badge className="bg-yellow-100 text-yellow-800">Claim</Badge>;
      case "judgment":
      case "judgement":
        return <Badge className="bg-orange-100 text-orange-800">Judgment</Badge>;
      case "enforcement":
        return <Badge className="bg-red-100 text-red-800">Enforcement</Badge>;
      case "paymentplan":
        return <Badge className="bg-green-100 text-green-800">Payment Plan</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "legalaction":
        return <Badge className="bg-orange-100 text-orange-800">Legal Action</Badge>;
      default:
        // Display the actual stage name, formatted nicely
        const formattedStage = stage?.replace(/[_-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') || 'Active';
        return <Badge className="bg-gray-100 text-gray-800">{formattedStage}</Badge>;
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Mutation to track document views
  const trackDocumentViewMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest("POST", "/api/track/view", { type: "document", id: documentId });
    },
  });

  const handleDownload = (documentId: number) => {
    // Track the view for read receipts
    trackDocumentViewMutation.mutate(documentId);
    window.open(`/api/documents/${documentId}/download`, '_blank');
  };

  const handleVisualTimeline = () => {
    if (!caseData) {
      toast({
        title: "No Data",
        description: "No case data available to display timeline.",
        variant: "destructive",
      });
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Could not open timeline window');
      }

      const currentDate = formatDate(new Date().toISOString());
      const totalPayments = getTotalPayments();
      const outstandingAmount = getOutstandingAmount();
      
      // Create timeline with ONLY case activities (no portal actions)
      // Timeline should only contain data pushed from SOS, never portal activity
      const timelineEvents: any[] = [];
      
      // Only add activities from case_activities table (these come from SOS)
      if (activities && Array.isArray(activities)) {
        activities.forEach((activity: any) => {
          if (activity && activity.createdAt) {
            // Remove codes like "TL0016", "AC0123" etc. from the description
            let cleanTitle = activity.description || 'Activity';
            cleanTitle = cleanTitle.replace(/^[A-Z]{2}\d{4}\s*[-:]?\s*/g, '').trim();
            cleanTitle = cleanTitle.replace(/\s*\([A-Z]{2}\d{4}\)\s*/g, '').trim();
            cleanTitle = cleanTitle.replace(/\s*-\s*[A-Z]{2}\d{4}\s*/g, '').trim();
            
            timelineEvents.push({
              id: `activity_${activity.id}`,
              date: activity.createdAt,
              type: 'activity',
              title: cleanTitle || 'Activity',
              description: activity.activityType || ''
            });
          }
        });
      }
      
      // Sort events reverse chronologically (newest first)
      if (timelineEvents.length > 0) {
        timelineEvents.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });
      }
      
      // SVG clock icon — same as on-screen
      const clockSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Case Timeline - ${caseData.accountNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f4f6f8;
              color: #1f2937;
              padding: 32px 16px;
            }
            .page {
              max-width: 780px;
              margin: 0 auto;
            }

            /* ── Header ── */
            .header {
              border-bottom: 2px solid #0d9488;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 15px;
            }
            .company-name { font-size: 1.1em; font-weight: 600; color: #0d9488; }
            .report-date  { font-size: 0.85em; color: #6b7280; }
            .case-title   { font-size: 1.5em; font-weight: 600; color: #1f2937; margin: 0; }
            .case-ref     { font-size: 0.95em; color: #6b7280; margin-top: 5px; }

            /* summary row */
            .summary-row {
              display: flex;
              gap: 40px;
              padding: 20px 0;
              border-bottom: 1px solid #e5e7eb;
              margin-bottom: 30px;
            }
            .summary-item { flex: 1; }
            .summary-label { font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px; }
            .summary-value { font-size: 1.1em; font-weight: 600; color: #1f2937; }

            /* ── Timeline card ── */
            .timeline-card {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              padding: 24px 28px;
              box-shadow: 0 1px 4px rgba(0,0,0,0.05);
            }
            .timeline-heading {
              font-size: 0.72em;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #9ca3af;
              font-weight: 600;
              margin-bottom: 24px;
            }

            /* ── Timeline rows ── */
            .timeline { position: relative; }
            .tl-row {
              display: flex;
              gap: 16px;
              position: relative;
            }
            .tl-left {
              display: flex;
              flex-direction: column;
              align-items: center;
              flex-shrink: 0;
              width: 36px;
            }
            /* Alternating circles */
            .tl-circle {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              position: relative;
              z-index: 1;
            }
            .tl-circle.even {
              background: #0d9488;
              box-shadow: 0 0 0 3px #ccfbf1;
              color: white;
            }
            .tl-circle.odd {
              background: #ccfbf1;
              box-shadow: 0 0 0 3px #e4faf5;
              color: #0d9488;
            }
            .tl-line {
              width: 2px;
              flex: 1;
              background: #e5e7eb;
              margin: 4px 0;
              min-height: 24px;
            }
            /* event card */
            .tl-content {
              flex: 1;
              padding-bottom: 20px;
            }
            .tl-card {
              background: white;
              border: 1px solid #f3f4f6;
              border-radius: 12px;
              padding: 12px 16px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            }
            .tl-title { font-size: 0.9em; font-weight: 600; color: #111827; line-height: 1.4; }
            .tl-meta  { font-size: 0.75em; color: #9ca3af; margin-top: 5px; }

            .no-events { text-align: center; padding: 40px; color: #9ca3af; font-style: italic; font-size: 0.9em; }

            .footer {
              text-align: center;
              font-size: 0.75em;
              color: #d1d5db;
              margin-top: 24px;
              padding-top: 16px;
            }

            @media print {
              body { background: white; padding: 0; }
              .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .tl-circle { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="page">

            <div class="header">
              <div class="header-top">
                <div class="company-name">Acclaim</div>
                <div class="report-date">Generated: ${currentDate}</div>
              </div>
              <h1 class="case-title">${caseData.caseName}</h1>
              <div class="case-ref">Account: ${caseData.accountNumber}</div>
            </div>

            <div class="summary-row">
              <div class="summary-item">
                <div class="summary-label">Status</div>
                <div class="summary-value">${caseData.status || 'Active'}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Outstanding</div>
                <div class="summary-value">${formatCurrency(outstandingAmount)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Payments</div>
                <div class="summary-value">${formatCurrency(totalPayments)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Events</div>
                <div class="summary-value">${timelineEvents.length}</div>
              </div>
            </div>

            <!-- Timeline -->
            <div class="timeline-card">
              <div class="timeline-heading">Case Timeline</div>

              ${timelineEvents.length > 0 ? `
                <div class="timeline">
                  ${timelineEvents.map((event, idx) => {
                    const isLast  = idx === timelineEvents.length - 1;
                    const shade   = idx % 2 === 0 ? 'even' : 'odd';
                    const iconCol = idx % 2 === 0 ? 'white' : '#0d9488';
                    return `
                      <div class="tl-row">
                        <div class="tl-left">
                          <div class="tl-circle ${shade}" style="color:${iconCol}">
                            ${clockSvg}
                          </div>
                          ${isLast ? '' : '<div class="tl-line"></div>'}
                        </div>
                        <div class="tl-content" style="${isLast ? 'padding-bottom:0' : ''}">
                          <div class="tl-card">
                            <div class="tl-title">${event.title}</div>
                            <div class="tl-meta">${formatDateOnly(event.date)}${event.description ? ' · ' + event.description : ''}</div>
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : `<div class="no-events">No timeline events have been recorded for this case.</div>`}
            </div>

            <div class="footer">Acclaim Credit Management &amp; Recovery</div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      toast({
        title: "Visual Timeline Opened",
        description: "The visual timeline report has been opened in a new window.",
      });
    } catch (error) {
      console.error('Error generating visual timeline:', error);
      toast({
        title: "Timeline Generation Failed",
        description: "Failed to generate visual timeline. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrintCase = () => {
    if (!caseData) {
      toast({
        title: "No Data",
        description: "No case data available to print.",
        variant: "destructive",
      });
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Could not open print window');
      }

      const currentDate = formatDate(new Date().toISOString());
      const totalPayments = getTotalPayments();
      const outstandingAmount = getOutstandingAmount();
      
      // Helper function to get status text and class for print
      const getStatusForPrint = (status: string, stage: string) => {
        if (status === "resolved" || status?.toLowerCase() === "closed") {
          return { text: 'Closed', class: 'status-resolved' };
        }
        
        const normalizedStage = stage?.toLowerCase().replace(/[_-]/g, '');
        
        switch (normalizedStage) {
          case "paymentplan":
            return { text: 'Payment Plan', class: 'status-resolved' };
          case "legalaction":
            return { text: 'Legal Action', class: 'status-legal' };
          case "prelegal":
            return { text: 'Pre-Legal', class: 'status-progress' };
          default:
            return { text: 'In Progress', class: 'status-progress' };
        }
      };
      
      const statusInfo = getStatusForPrint(caseData.status, caseData.stage);
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Case Details - ${caseData.accountNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0f766e; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; color: #0f766e; }
            .header p { margin: 5px 0; color: #666; }
            .section { margin-bottom: 30px; }
            .section h2 { font-size: 18px; margin-bottom: 15px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .section h3 { font-size: 16px; margin-bottom: 10px; color: #555; }
            .case-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .info-card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .info-label { font-size: 12px; color: #666; margin-bottom: 5px; text-transform: uppercase; }
            .info-value { font-size: 16px; font-weight: bold; color: #333; }
            .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .status-resolved { background-color: #dcfce7; color: #166534; }
            .status-progress { background-color: #fef3c7; color: #92400e; }
            .status-legal { background-color: #fee2e2; color: #991b1b; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .currency { text-align: right; font-weight: bold; }
            .date { font-size: 11px; color: #666; }
            .message-content { background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin: 5px 0; }
            .message-meta { font-size: 10px; color: #666; margin-bottom: 5px; }
            .no-data { text-align: center; color: #666; font-style: italic; padding: 20px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Case Details Report</h1>
            <p><strong>Account Number:</strong> ${caseData.accountNumber}</p>
            <p><strong>Case:</strong> ${caseData.caseName}</p>
            <p>Generated on: ${currentDate}</p>
          </div>
          
          <div class="section">
            <h2>Case Information</h2>
            <div class="case-info">
              <div class="info-card">
                <div class="info-label">Status</div>
                <div class="info-value">
                  <span class="status-badge ${statusInfo.class}">
                    ${statusInfo.text}
                  </span>
                </div>
              </div>
              <div class="info-card">
                <div class="info-label">Original Amount</div>
                <div class="info-value">${formatCurrency(caseData.originalAmount)}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Outstanding Amount</div>
                <div class="info-value">${formatCurrency(outstandingAmount)}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Total Payments</div>
                <div class="info-value">${formatCurrency(totalPayments)}</div>
              </div>
            </div>
            
            <div class="case-info">
              <div class="info-card">
                <div class="info-label">Debtor Type</div>
                <div class="info-value">${caseData.debtorType || 'Not specified'}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Created Date</div>
                <div class="info-value">${formatDate(caseData.createdAt)}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Last Updated</div>
                <div class="info-value">${formatDate(caseData.updatedAt)}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Stage</div>
                <div class="info-value">${caseData.stage || 'Initial'}</div>
              </div>
            </div>
            

            
            ${caseData.notes ? `
              <div class="info-card" style="grid-column: 1 / -1;">
                <div class="info-label">Notes</div>
                <div class="info-value">${caseData.notes}</div>
              </div>
            ` : ''}
          </div>

          <div class="section">
            <h2>Payment History</h2>
            ${payments && payments.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  ${payments.map((payment: any) => {
                    const numericAmount = parseFloat(payment.amount || 0);
                    
                    return `
                      <tr>
                        <td class="date">${formatDateOnly(payment.paymentDate || payment.createdAt)}</td>
                        <td class="currency">${formatCurrency(isNaN(numericAmount) ? 0 : numericAmount)}</td>
                        <td>${payment.paymentMethod || 'N/A'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              <div style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                <strong>Total Payments: ${formatCurrency(totalPayments)}</strong>
              </div>
            ` : '<div class="no-data">No payments recorded</div>'}
          </div>

          <div class="section">
            <h2>Case Timeline</h2>
            ${activities && activities.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${activities.map((activity: any) => `
                    <tr>
                      <td class="date">${formatDateOnly(activity.createdAt)}</td>
                      <td>${activity.description || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div class="no-data">No timeline activities recorded</div>'}
          </div>

          <div class="section">
            <h2>Documents</h2>
            ${documents && documents.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Upload Date</th>
                    <th>File Size</th>
                  </tr>
                </thead>
                <tbody>
                  ${documents.map((doc: any) => `
                    <tr>
                      <td>${doc.fileName || 'N/A'}</td>
                      <td class="date">${formatDateOnly(doc.createdAt)}</td>
                      <td>${doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div class="no-data">No documents uploaded</div>'}
          </div>

          <div class="section">
            <h2>Messages</h2>
            ${messages && messages.length > 0 ? `
              <div>
                ${messages.map((message: any) => `
                  <div class="message-content">
                    <div class="message-meta">
                      <strong>From:</strong> ${message.senderName || 'Unknown'} | 
                      <strong>Date:</strong> ${formatDate(message.createdAt)} | 
                      <strong>Subject:</strong> ${message.subject || 'No subject'}
                    </div>
                    <div style="white-space: pre-wrap;">${message.content || 'No content'}</div>
                  </div>
                `).join('')}
              </div>
            ` : '<div class="no-data">No messages recorded</div>'}
          </div>
          
          <div class="section">
            <p style="text-align: center; color: #666; font-size: 12px; margin-top: 40px;">
              All amounts are in GBP. Report generated on ${currentDate}
            </p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Just open the report in a new tab without printing
      printWindow.onload = () => {
        // Window remains open for user to view, print manually if needed
      };
      
      toast({
        title: "Case Report Opened",
        description: "The case report has been opened in a new tab.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Case Actions Bar - Mobile Friendly */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <Bell className={`h-4 w-4 ${muteStatus?.muted ? 'text-gray-400' : 'text-acclaim-teal'}`} />
          <span className="text-sm font-medium text-gray-700">Case Notifications</span>
          <Switch
            checked={!muteStatus?.muted}
            onCheckedChange={() => handleToggleMute()}
            disabled={muteCaseMutation.isPending || unmuteCaseMutation.isPending || muteStatusLoading}
            title={muteStatus?.muted ? "Turn on notifications for this case" : "Turn off notifications for this case"}
          />
          <span className="text-xs text-gray-500">
            {muteStatusLoading ? "Loading..." : muteStatus?.muted ? "Off" : "On"}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {isSuperAdmin && (
            <Button
              onClick={handleOpenOrgDialog}
              variant="outline"
              size="sm"
              title="Super admins only: change which organisation this case belongs to"
              className="border-acclaim-teal text-acclaim-teal hover:bg-acclaim-teal hover:text-white w-full sm:w-auto"
              data-testid="button-change-organisation"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Change Organisation
              <Badge variant="secondary" className="ml-2 text-[10px] font-medium">
                Super admin
              </Badge>
            </Button>
          )}
          <Button 
            onClick={handlePrintCase}
            variant="outline"
            size="sm"
            className="border-acclaim-teal text-acclaim-teal hover:bg-acclaim-teal hover:text-white w-full sm:w-auto"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Case PDF
          </Button>
        </div>
      </div>

      {/* Super-admin: change the organisation this case is linked to */}
      <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
        <DialogContent data-testid="dialog-change-organisation">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Change Organisation
              <Badge variant="secondary" className="text-[10px] font-medium">
                Super admin only
              </Badge>
            </DialogTitle>
            <DialogDescription>
              This action is only available to super admins. Move this case to a
              different organisation. Its documents and payments move with it, and it
              will no longer be visible to the previous organisation's users.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="organisation-select">Organisation</Label>
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger
                id="organisation-select"
                className="mt-2"
                data-testid="select-organisation"
              >
                <SelectValue placeholder="Select an organisation" />
              </SelectTrigger>
              <SelectContent>
                {(organisations || []).map((org: any) => (
                  <SelectItem
                    key={org.id}
                    value={String(org.id)}
                    data-testid={`option-organisation-${org.id}`}
                  >
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOrgDialogOpen(false)}
              data-testid="button-cancel-organisation"
            >
              Cancel
            </Button>
            <Button
              onClick={() => changeOrganisationMutation.mutate(parseInt(selectedOrgId))}
              disabled={
                !selectedOrgId ||
                selectedOrgId === String(caseData.organisationId) ||
                changeOrganisationMutation.isPending
              }
              className="bg-acclaim-teal hover:bg-acclaim-teal/90 text-white"
              data-testid="button-confirm-organisation"
            >
              {changeOrganisationMutation.isPending ? "Moving..." : "Move Case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Case Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-xl">{caseData.caseName}</CardTitle>
            {getStageBadge(caseData.status, caseData.stage)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Account Number</p>
              <p className="font-medium">{caseData.accountNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Outstanding Amount</p>
              <p className="font-medium">{formatCurrency(getOutstandingAmount())}</p>
              <p className="text-xs text-gray-500 mt-1">*May include interest and recovery costs</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Payments</p>
              <button 
                onClick={handlePaymentsClick}
                className="font-medium text-green-600 hover:text-green-800 hover:underline cursor-pointer text-left"
              >
                {formatCurrency(getTotalPayments())}
              </button>
              <p className="text-xs text-gray-500 mt-1">Click to view details</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Original Amount</p>
              <p className="font-medium">{formatCurrency(caseData.originalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Case Handler</p>
              <p className="font-medium">{caseData.assignedTo || "Unassigned"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Message</p>
              {getLastMessage() ? (
                <button 
                  onClick={handleMessagesClick}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                >
                  <p className="truncate max-w-48">
                    {getLastMessage()?.content || "No content"}
                  </p>
                </button>
              ) : (
                <p className="font-medium text-gray-400">No messages yet</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {getLastMessage() ? 
                  `${formatDate(getLastMessage().createdAt)} - Click to view` : 
                  "Start a conversation"
                }
              </p>
            </div>
          </div>

          {/* Additional Debt Information */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Additional Charges</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Costs Added</p>
                <p className="font-medium">{formatCurrency(caseData.costsAdded || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">Legal costs</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Interest Added</p>
                <p className="font-medium">{formatCurrency(caseData.interestAdded || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">Accrued interest charges</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Other Fees</p>
                <p className="font-medium">{formatCurrency(caseData.feesAdded || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">Compensation, administrative and other fees</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Additional Charges:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency((parseFloat(caseData.costsAdded || 0) + parseFloat(caseData.interestAdded || 0) + parseFloat(caseData.feesAdded || 0)))}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Case Timeline</CardTitle>
                <Button 
                  onClick={handleVisualTimeline}
                  variant="outline"
                  size="sm"
                  className="border-acclaim-teal text-acclaim-teal hover:bg-acclaim-teal hover:text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Visual Timeline
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-6 py-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                        <div className="w-0.5 h-10 bg-gray-100" />
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="py-2">
                  {activities.map((activity: any, idx: number) => {
                    // Alternate between two teal shades
                    const even = idx % 2 === 0;
                    const ringCls = even ? "ring-teal-200"    : "ring-teal-100";
                    const bgCls   = even ? "bg-teal-600"      : "bg-teal-100";
                    const textCls = even ? "text-white"       : "text-teal-600";
                    const iconEl  = <Clock className="h-4 w-4" />;

                    const isLast = idx === activities.length - 1;

                    return (
                      <div key={activity.id} className="flex gap-4 group">
                        {/* Left: icon + connector line */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ring-2 ${ringCls} ${bgCls} ${textCls} z-10`}>
                            {iconEl}
                          </div>
                          {!isLast && (
                            <div className="w-px flex-1 bg-gray-200 my-1" style={{ minHeight: "2rem" }} />
                          )}
                        </div>

                        {/* Right: content card */}
                        <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                          <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">
                                {activity.description}
                              </p>
                              {user?.isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this timeline entry? This action cannot be undone.")) {
                                      deleteActivityMutation.mutate(activity.id);
                                    }
                                  }}
                                  className="h-7 w-7 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                  disabled={deleteActivityMutation.isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Calendar className="h-3 w-3" />
                                {formatDateOnly(activity.createdAt)}
                              </span>
                              {activity.performedBy && (
                                <span className="text-xs text-gray-400">
                                  · {activity.performedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No timeline activities found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle>Documents</CardTitle>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search documents..."
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                    className="pl-8 h-9 w-full sm:w-48"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* ── Drag-drop upload zone ── */}
              <div>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES_STRING}
                  className="sr-only"
                  onChange={(e) => { if (e.target.files) addFilesToQueue(e.target.files); e.target.value = ''; }}
                />
                <label
                  htmlFor="file-upload"
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files) addFilesToQueue(e.dataTransfer.files);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
                    isDragOver
                      ? "border-teal-400 bg-teal-50"
                      : "border-gray-200 bg-gray-50 hover:border-teal-300 hover:bg-teal-50/50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDragOver ? "bg-teal-100" : "bg-white border border-gray-200"}`}>
                    <Upload className={`h-5 w-5 transition-colors ${isDragOver ? "text-teal-600" : "text-gray-400"}`} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium transition-colors ${isDragOver ? "text-teal-700" : "text-gray-600"}`}>
                      {isDragOver ? "Drop files here" : "Click to browse or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ACCEPTED_FILE_TYPES_DISPLAY} · max {MAX_FILE_SIZE_MB}MB each
                    </p>
                  </div>
                </label>

                {/* Errors for invalid files */}
                {Object.entries(fileQueueErrors).map(([name, err]) => (
                  <p key={name} className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <span className="font-medium">{name}:</span> {err}
                  </p>
                ))}

                {/* File queue */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedFiles.map((f) => (
                      <div key={f.name} className="flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-200 rounded-lg">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          f.name.match(/\.pdf$/i) ? "bg-red-50 text-red-500 border border-red-100"
                          : f.name.match(/\.docx?$/i) ? "bg-blue-50 text-blue-500 border border-blue-100"
                          : f.name.match(/\.xlsx?$/i) ? "bg-green-50 text-green-600 border border-green-100"
                          : "bg-gray-50 text-gray-500 border border-gray-100"
                        }`}>
                          {f.name.split('.').pop()?.toUpperCase().slice(0, 4)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                          <p className="text-xs text-gray-400">{Math.round(f.size / 1024)} KB</p>
                        </div>
                        <button onClick={() => removeFromQueue(f.name)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <Button
                      onClick={uploadQueue}
                      disabled={uploadDocumentMutation.isPending}
                      className="w-full bg-acclaim-teal hover:bg-acclaim-teal/90 mt-1"
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadDocumentMutation.isPending
                        ? "Uploading…"
                        : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""}`}
                    </Button>
                  </div>
                )}
              </div>

              {/* ── Document list ── */}
              {documentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-xl" />
                  ))}
                </div>
              ) : documents && documents.filter((doc: any) => {
                if (!documentSearch.trim()) return true;
                return doc.fileName?.toLowerCase().includes(documentSearch.toLowerCase());
              }).length > 0 ? (
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {documents
                    .filter((doc: any) => {
                      if (!documentSearch.trim()) return true;
                      return doc.fileName?.toLowerCase().includes(documentSearch.toLowerCase());
                    })
                    .map((doc: any) => {
                      const ext = doc.fileName?.split('.').pop()?.toUpperCase() || "—";
                      const extColor =
                        ext === "PDF" ? "bg-red-50 text-red-500 border-red-100"
                        : ["DOC","DOCX"].includes(ext) ? "bg-blue-50 text-blue-500 border-blue-100"
                        : ["XLS","XLSX"].includes(ext) ? "bg-green-50 text-green-600 border-green-100"
                        : ["JPG","JPEG","PNG"].includes(ext) ? "bg-purple-50 text-purple-500 border-purple-100"
                        : "bg-gray-50 text-gray-500 border-gray-100";
                      return (
                        <div key={doc.id} className="flex items-center gap-4 px-4 py-3.5 bg-white hover:bg-gray-50 transition-colors group">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0 border ${extColor}`}>
                            {ext.slice(0, 4)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{doc.fileName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(doc.createdAt)}{doc.fileSize ? ` · ${Math.round(doc.fileSize / 1024)} KB` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {user?.isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this document?")) {
                                    deleteDocumentMutation.mutate(doc.id);
                                  }
                                }}
                                className="h-8 w-8 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={deleteDocumentMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm">No documents yet</p>
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4" data-tab="messages">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle>Messages</CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search messages..."
                      value={messageSearch}
                      onChange={(e) => setMessageSearch(e.target.value)}
                      className="pl-8 h-9 w-full sm:w-48"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const sendMessageSection = document.getElementById('send-message-section');
                      if (sendMessageSection) {
                        sendMessageSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setTimeout(() => {
                          const textarea = document.getElementById('message');
                          if (textarea) textarea.focus();
                        }, 500);
                      }
                    }}
                    className="bg-acclaim-teal text-white hover:bg-acclaim-teal/90 flex-shrink-0"
                  >
                    <Send className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Create Message</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {messages
                    .filter((message: any) => {
                      if (!messageSearch.trim()) return true;
                      const searchLower = messageSearch.toLowerCase();
                      return (
                        message.subject?.toLowerCase().includes(searchLower) ||
                        message.content?.toLowerCase().includes(searchLower) ||
                        message.senderName?.toLowerCase().includes(searchLower)
                      );
                    })
                    .map((message: any) => {
                      const fromAdmin = message.senderIsAdmin;
                      return (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${fromAdmin ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 ${
                          fromAdmin ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-600"
                        }`}>
                          {(message.senderName || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[78%] group`}>
                          {/* Name + time */}
                          <div className={`flex items-center gap-2 mb-1 ${fromAdmin ? "flex-row-reverse" : "flex-row"}`}>
                            <span className="text-xs font-semibold text-gray-600">{message.senderName || 'Unknown'}</span>
                            <span className="text-[10px] text-gray-400">{formatDate(message.createdAt)}</span>
                            {user?.isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Are you sure you want to delete this message?")) {
                                    deleteMessageMutation.mutate(message.id);
                                  }
                                }}
                                className="text-red-400 hover:text-red-600 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={deleteMessageMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>

                          {/* Subject line if present */}
                          {message.subject && (
                            <p className={`text-[11px] font-semibold mb-1 ${fromAdmin ? "text-right text-teal-700" : "text-left text-gray-500"}`}>
                              {message.subject}
                            </p>
                          )}

                          {/* Bubble body */}
                          <div
                            className={`px-4 py-3 rounded-2xl cursor-pointer transition-opacity hover:opacity-90 ${
                              fromAdmin
                                ? "bg-teal-600 text-white rounded-tr-sm"
                                : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                            }`}
                            onClick={() => handleOpenMessage(message)}
                          >
                            <p className="text-sm leading-relaxed">{truncateContent(message.content, 400)}</p>
                            {message.attachmentFileName && (
                              <div className={`mt-2 flex items-center gap-1.5 text-xs ${fromAdmin ? "text-teal-100" : "text-teal-600"}`}>
                                <FileText className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{message.attachmentFileName}</span>
                              </div>
                            )}
                          </div>
                          <p className={`text-[10px] text-gray-400 mt-1 ${fromAdmin ? "text-right" : "text-left"}`}>
                            Click to read full message
                          </p>
                        </div>
                      </div>
                    )})}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No messages found</p>
                </div>
              )}
              
              {/* Send Message Form */}
              <div id="send-message-section" className="mt-6 pt-6 border-t">
                <Label htmlFor="message" className="text-sm font-medium">
                  Send Message
                </Label>
                <div className="mt-2 space-y-3">
                  <div>
                    <Label htmlFor="message-subject" className="text-sm font-medium text-gray-700">
                      Subject (Optional)
                    </Label>
                    <Input
                      id="message-subject"
                      type="text"
                      placeholder="Enter subject (if blank, will default to case reference)"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
                
                {/* Message Attachment Section */}
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Attach File <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <input
                    id="message-attachment"
                    type="file"
                    accept={ACCEPTED_FILE_TYPES_STRING}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        const validation = validateFile(file);
                        if (!validation.isValid) { setMessageAttachmentError(validation.error); setMessageAttachment(null); e.target.value = ''; return; }
                      }
                      setMessageAttachmentError(null);
                      setMessageAttachment(file);
                      e.target.value = '';
                    }}
                  />
                  {!messageAttachment ? (
                    <label
                      htmlFor="message-attachment"
                      onDragOver={(e) => { e.preventDefault(); setIsDragOverAttachment(true); }}
                      onDragLeave={() => setIsDragOverAttachment(false)}
                      onDrop={(e) => {
                        e.preventDefault(); setIsDragOverAttachment(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) { const v = validateFile(file); if (!v.isValid) { setMessageAttachmentError(v.error); } else { setMessageAttachmentError(null); setMessageAttachment(file); } }
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 px-4 py-5 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center ${
                        isDragOverAttachment ? "border-teal-400 bg-teal-50 dark:bg-teal-900/20" : "border-gray-200 bg-gray-50 dark:bg-gray-800/50 hover:border-teal-300 hover:bg-teal-50/50"
                      }`}
                    >
                      <Paperclip className={`h-5 w-5 transition-colors ${isDragOverAttachment ? "text-teal-600" : "text-gray-400"}`} />
                      <span className={`text-sm transition-colors ${isDragOverAttachment ? "text-teal-700 dark:text-teal-300" : "text-gray-500"}`}>
                        {isDragOverAttachment ? "Drop file here" : "Click to browse or drag a file here"}
                      </span>
                      <span className="text-xs text-gray-400">{ACCEPTED_FILE_TYPES_DISPLAY} · {MAX_FILE_SIZE_MB}MB</span>
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                      {(() => {
                        const ext = messageAttachment.name.split('.').pop()?.toUpperCase() || '?';
                        const extColor = ext === 'PDF' ? 'bg-red-50 text-red-500 border-red-100' : ['DOC','DOCX'].includes(ext) ? 'bg-blue-50 text-blue-500 border-blue-100' : ['XLS','XLSX'].includes(ext) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ['PNG','JPG','JPEG','GIF','WEBP'].includes(ext) ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100';
                        return <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border ${extColor}`}>{ext.slice(0,4)}</div>;
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{messageAttachment.name}</p>
                        <p className="text-xs text-gray-400">{(messageAttachment.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button onClick={() => setMessageAttachment(null)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {messageAttachmentError && (
                    <p className="text-xs text-red-600 flex items-center gap-1">{messageAttachmentError}</p>
                  )}
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="mt-3 bg-acclaim-teal hover:bg-acclaim-teal/90"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4" data-tab="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PoundSterling className="h-5 w-5 mr-2" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : payments && payments.length > 0 ? (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment: any) => {
                          const numericAmount = parseFloat(payment.amount || 0);
                          
                          return (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">
                                {formatDateOnly(payment.paymentDate)}
                              </TableCell>
                              <TableCell>
                                <span className="text-green-600 font-semibold">
                                  {formatCurrency(isNaN(numericAmount) ? 0 : numericAmount)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {payment.paymentMethod || "N/A"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Payment Summary */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">Total Payments Received</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(getTotalPayments())}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(getOutstandingAmount())}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">*May include interest and recovery costs</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <PoundSterling className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No payments recorded yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Payments will appear here when they are recorded by the recovery team
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Message View Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={(open) => {
        setMessageDialogOpen(open);
        if (!open) {
          setDialogReplyMessage("");
          setDialogReplyFile(null);
          setDialogReplyFileError(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0 pb-3 border-b">
            <DialogTitle className="text-lg font-semibold">
              {selectedMessageForView?.subject || "Message"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              From: {selectedMessageForView?.senderName || "Unknown"} • {selectedMessageForView ? formatDate(selectedMessageForView.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Message body */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedMessageForView?.content}
              </p>
            </div>

            {/* Attachment */}
            {selectedMessageForView?.attachmentFileName && (
              <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  {(() => {
                    const ext = (selectedMessageForView.attachmentFileName.split('.').pop() || '').toUpperCase();
                    const extColor = ext === 'PDF' ? 'bg-red-50 text-red-500 border-red-100' : ['DOC','DOCX'].includes(ext) ? 'bg-blue-50 text-blue-500 border-blue-100' : ['XLS','XLSX'].includes(ext) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ['PNG','JPG','JPEG','GIF','WEBP'].includes(ext) ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100';
                    return <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border ${extColor}`}>{ext.slice(0,4) || '?'}</div>;
                  })()}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{selectedMessageForView.attachmentFileName}</p>
                    <p className="text-xs text-gray-400">{selectedMessageForView.attachmentFileSize ? Math.round(selectedMessageForView.attachmentFileSize / 1024) : 0} KB</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`/api/messages/${selectedMessageForView?.id}/download`, '_blank')}
                  className="text-acclaim-teal hover:text-acclaim-teal/80 shrink-0"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            )}

            {/* Reply Section */}
            <div className="pt-4 border-t space-y-3">
              <Label className="text-sm font-semibold">Reply</Label>
              <Textarea
                placeholder="Type your reply..."
                value={dialogReplyMessage}
                onChange={(e) => setDialogReplyMessage(e.target.value)}
                rows={4}
              />

              {/* Attachment */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Attachment <span className="font-normal text-gray-400">(optional)</span>
                </Label>
                <input
                  id="dialog-reply-attachment"
                  type="file"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      const v = validateFile(file);
                      if (!v.isValid) { setDialogReplyFileError(v.error!); return; }
                    }
                    setDialogReplyFileError(null);
                    setDialogReplyFile(file);
                    e.target.value = '';
                  }}
                />
                {!dialogReplyFile ? (
                  <label
                    htmlFor="dialog-reply-attachment"
                    onDragOver={(e) => { e.preventDefault(); setDialogReplyIsDragOver(true); }}
                    onDragLeave={() => setDialogReplyIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setDialogReplyIsDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) { const v = validateFile(file); if (!v.isValid) { setDialogReplyFileError(v.error!); } else { setDialogReplyFileError(null); setDialogReplyFile(file); } }
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 px-4 py-5 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center ${
                      dialogReplyIsDragOver ? "border-teal-400 bg-teal-50 dark:bg-teal-900/20" : "border-gray-200 bg-gray-50 dark:bg-gray-800/50 hover:border-teal-300 hover:bg-teal-50/50"
                    }`}
                  >
                    <Paperclip className={`h-5 w-5 ${dialogReplyIsDragOver ? "text-teal-600" : "text-gray-400"}`} />
                    <span className={`text-sm ${dialogReplyIsDragOver ? "text-teal-700 dark:text-teal-300" : "text-gray-500"}`}>
                      {dialogReplyIsDragOver ? "Drop file here" : "Click to browse or drag a file here"}
                    </span>
                    <span className="text-xs text-gray-400">{ACCEPTED_FILE_TYPES_DISPLAY} · {MAX_FILE_SIZE_MB}MB</span>
                  </label>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                    {(() => {
                      const ext = (dialogReplyFile.name.split('.').pop() || '').toUpperCase();
                      const extColor = ext === 'PDF' ? 'bg-red-50 text-red-500 border-red-100' : ['DOC','DOCX'].includes(ext) ? 'bg-blue-50 text-blue-500 border-blue-100' : ['XLS','XLSX'].includes(ext) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ['PNG','JPG','JPEG','GIF','WEBP'].includes(ext) ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100';
                      return <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border ${extColor}`}>{ext.slice(0,4)}</div>;
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{dialogReplyFile.name}</p>
                      <p className="text-xs text-gray-400">{(dialogReplyFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button onClick={() => { setDialogReplyFile(null); setDialogReplyFileError(null); }} className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {dialogReplyFileError && <p className="text-xs text-red-600">{dialogReplyFileError}</p>}
              </div>

              <Button
                onClick={handleDialogReply}
                disabled={!dialogReplyMessage.trim() || sendMessageMutation.isPending}
                className="bg-acclaim-teal hover:bg-acclaim-teal/90 w-full"
                data-testid="button-dialog-send-reply"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendMessageMutation.isPending ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
