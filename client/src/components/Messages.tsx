import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Send, MessageSquare, Plus, User, Paperclip, Download, Trash2, Search, Filter, Calendar, X, FileSpreadsheet, History, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { trackRecentlyViewed } from "@/lib/recentlyViewed";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { validateFile, ACCEPTED_FILE_TYPES_STRING, MAX_FILE_SIZE_MB, ACCEPTED_FILE_TYPES_DISPLAY } from "@/lib/fileValidation";
import CaseDetail from "./CaseDetail";
import acclaimRoseLogo from "@assets/acclaim_rose_transparent_1768474381340.png";

export default function Messages() {
  const [newMessage, setNewMessage] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [viewingMessage, setViewingMessage] = useState<any>(null);
  const [messageViewOpen, setMessageViewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string>("");
  const [isDragOverAttachment, setIsDragOverAttachment] = useState(false);
  const [linkedCaseId, setLinkedCaseId] = useState<string>("");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);

  // Inline reply state (inside the message view dialog)
  const [showViewReply, setShowViewReply] = useState(false);
  const viewReplyRef = useRef<HTMLDivElement>(null);
  const viewDialogScrollRef = useRef<HTMLDivElement>(null);
  const [viewReplyText, setViewReplyText] = useState("");
  const [viewReplyFile, setViewReplyFile] = useState<File | null>(null);
  const [viewReplyFileError, setViewReplyFileError] = useState<string | null>(null);
  const [viewReplyIsDragOver, setViewReplyIsDragOver] = useState(false);

  // Audit dialog state (admin only)
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [auditMessageId, setAuditMessageId] = useState<number | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");
  const [searchSender, setSearchSender] = useState("");
  const [searchCaseId, setSearchCaseId] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [caseSearchTerm, setCaseSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 20; // Show 20 messages per page

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/messages"],
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
        description: "Failed to load messages",
        variant: "destructive",
      });
    },
  });

  const { data: cases } = useQuery({
    queryKey: ["/api/cases"],
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

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const formData = new FormData();
      formData.append("recipientType", messageData.recipientType);
      formData.append("recipientId", messageData.recipientId);
      formData.append("subject", messageData.subject);
      formData.append("content", messageData.content);

      if (messageData.caseId) {
        formData.append("caseId", messageData.caseId);
      }

      const attachFile = messageData.attachmentFile || selectedFile;
      if (attachFile) {
        formData.append("attachment", attachFile);
        if (customFileName.trim()) {
          formData.append("customFileName", customFileName.trim());
        }
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      // Also invalidate documents cache since attachments are now saved as documents
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setNewMessage("");
      setNewSubject("");
      setSelectedFile(null);
      setLinkedCaseId("");
      setDialogOpen(false);
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

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("DELETE", `/api/admin/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    },
    onError: (error: any) => {
      const isForbidden = error?.message?.includes('403') || error?.message?.includes('Super admin');
      if (isForbidden) {
        toast({
          title: "Access Denied",
          description: "Only super admins can delete messages. Please contact a super admin to perform this action.",
          variant: "destructive",
        });
        return;
      }
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

  // Mutation to track message views
  const trackViewMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("POST", "/api/track/view", { type: "message", id: messageId });
    },
  });

  // Query for message audit history (admin only)
  const { data: messageAuditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["/api/admin/audit/item/message", auditMessageId],
    queryFn: async () => {
      if (!auditMessageId) return [];
      const response = await fetch(`/api/admin/audit/item/message/${auditMessageId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch audit logs");
      }
      return response.json();
    },
    enabled: !!auditMessageId && user?.isAdmin,
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !newSubject.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }

    let messageContent = newMessage;

    // If this is a reply, include the original message
    if (replyingTo) {
      const fromName = replyingTo.senderName || replyingTo.senderEmail || replyingTo.senderId;
      messageContent = `${newMessage}\n\n--- Original Message ---\nFrom: ${fromName}\nDate: ${formatDate(replyingTo.createdAt)}\nSubject: ${replyingTo.subject}\n\n${replyingTo.content}`;
    }

    sendMessageMutation.mutate({
      recipientType: "organisation",
      recipientId: "support",
      subject: newSubject,
      content: messageContent,
      caseId: linkedCaseId && linkedCaseId !== "none" ? linkedCaseId : undefined,
    });
  };

const handleReply = (message: any) => {
  setReplyingTo(message);
  setNewSubject(`Re: ${message.subject}`);
  setNewMessage("");
  if (message.caseId) {
    setLinkedCaseId(message.caseId.toString());
  } else {
    setLinkedCaseId("");
  }
  setDialogOpen(true);
};

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setReplyingTo(null);
    setNewMessage("");
    setNewSubject("");
    setSelectedFile(null);
    setCustomFileName("");
    setLinkedCaseId("");
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      handleCloseDialog();
    }
  };

  const handleMessageClick = (message: any) => {
    setViewingMessage(message);
    setMessageViewOpen(true);
    // Track the view for read receipts
    trackViewMutation.mutate(message.id);
  };

  const handleOpenAuditDialog = (messageId: number) => {
    setAuditMessageId(messageId);
    setAuditDialogOpen(true);
  };

  const handleCloseMessageView = () => {
    setMessageViewOpen(false);
    setViewingMessage(null);
    setShowViewReply(false);
    setViewReplyText("");
    setViewReplyFile(null);
    setViewReplyFileError(null);
  };

  const handleViewDialogReply = () => {
    if (!viewReplyText.trim() || !viewingMessage) return;
    const fromName = viewingMessage.senderName || viewingMessage.senderEmail || 'Unknown';
    const content = `${viewReplyText}\n\n--- Original Message ---\nFrom: ${fromName}\nDate: ${formatDate(viewingMessage.createdAt)}\nSubject: ${viewingMessage.subject}\n\n${viewingMessage.content}`;
    sendMessageMutation.mutate({
      recipientType: "organisation",
      recipientId: "support",
      subject: `Re: ${viewingMessage.subject}`,
      content,
      caseId: viewingMessage.caseId ? viewingMessage.caseId.toString() : undefined,
      attachmentFile: viewReplyFile,
    }, {
      onSuccess: () => {
        setShowViewReply(false);
        setViewReplyText("");
        setViewReplyFile(null);
        setViewReplyFileError(null);
      }
    });
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

  const getCaseAccountNumber = (caseId: number) => {
    const caseData = cases?.find((c: any) => c.id === caseId);
    return caseData?.accountNumber || `Case #${caseId}`;
  };

  const handleCaseClick = (caseId: number) => {
    const caseData = cases?.find((c: any) => c.id === caseId);
    if (caseData) {
      handleCloseMessageView();
      setSelectedCase(caseData);
      setCaseDialogOpen(true);
      trackRecentlyViewed(caseId);
    }
  };

  const totalMessages = messages?.length || 0;

  // Filter messages based on search criteria
  const filteredMessages = useMemo(() => {
    if (!messages) return [];

    return messages.filter((message: any) => {
      // Text search in subject, content, and organisation
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        // Get case data to check organisation name
        const caseData = message.caseId ? cases?.find((c: any) => c.id === message.caseId) : null;
        const matchesText = 
          message.subject?.toLowerCase().includes(searchLower) ||
          message.content?.toLowerCase().includes(searchLower) ||
          caseData?.organisationName?.toLowerCase().includes(searchLower) ||
          caseData?.caseName?.toLowerCase().includes(searchLower);
        if (!matchesText) return false;
      }

      // Date range filter
      if (searchDateFrom) {
        const messageDate = new Date(message.createdAt);
        const fromDate = new Date(searchDateFrom);
        if (messageDate < fromDate) return false;
      }

      if (searchDateTo) {
        const messageDate = new Date(message.createdAt);
        const toDate = new Date(searchDateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (messageDate > toDate) return false;
      }

      // Sender filter
      if (searchSender) {
        const senderLower = searchSender.toLowerCase();
        const matchesSender = 
          message.senderName?.toLowerCase().includes(senderLower) ||
          message.senderEmail?.toLowerCase().includes(senderLower);
        if (!matchesSender) return false;
      }

      // Case ID filter
      if (searchCaseId) {
        const caseSearchTerm = searchCaseId.toLowerCase();
        if (message.caseId) {
          const caseData = cases?.find((c: any) => c.id === message.caseId);
          const matchesCase = 
            caseData?.accountNumber?.toLowerCase().includes(caseSearchTerm) ||
            caseData?.caseName?.toLowerCase().includes(caseSearchTerm) ||
            message.caseId.toString().includes(caseSearchTerm);
          if (!matchesCase) return false;
        } else {
          return false; // No case associated with this message
        }
      }

      return true;
    });
  }, [messages, searchTerm, searchDateFrom, searchDateTo, searchSender, searchCaseId, cases]);

  // Pagination logic
  const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);
  const startIndex = (currentPage - 1) * messagesPerPage;
  const endIndex = startIndex + messagesPerPage;
  const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Clear all search filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setSearchDateFrom("");
    setSearchDateTo("");
    setSearchSender("");
    setSearchCaseId("");
    resetPagination();
  };

  // Export messages state
  const [isExporting, setIsExporting] = useState(false);

  // Export messages to Excel
  const handleExportMessages = async () => {
    if (!searchDateFrom && !searchDateTo) {
      toast({
        title: "Date Range Required",
        description: "Please select at least a 'Date From' or 'Date To' to export messages.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (searchDateFrom) params.append('from', searchDateFrom);
      if (searchDateTo) params.append('to', searchDateTo);

      const response = await fetch(`/api/messages/export?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to export messages');
      }

      // Get the blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Messages_Export.xlsx';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: "Messages have been exported to Excel successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export messages",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and New Message Button */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl">Messages</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="flex-1 sm:flex-none border-acclaim-teal text-acclaim-teal hover:bg-acclaim-teal hover:text-white text-xs sm:text-sm h-9"
              >
                <Filter className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{showAdvancedSearch ? "Hide Filters" : "Show Filters"}</span>
                <span className="sm:hidden ml-1">Filter</span>
              </Button>
              <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button className="flex-1 sm:flex-none bg-acclaim-teal hover:bg-acclaim-teal/90 text-xs sm:text-sm h-9">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">New Message</span>
                    <span className="sm:hidden ml-1">New</span>
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {replyingTo ? `Reply to: ${replyingTo.subject}` : "Send New Message"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Enter message subject"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                    />
                  </div>
                  {replyingTo && (
                    <div className="p-3 bg-gray-50 rounded border-l-4 border-acclaim-teal">
                      <p className="text-sm font-medium text-gray-700 mb-1">Original Message:</p>
                      <p className="text-sm text-gray-600">{replyingTo.content}</p>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <div>
  <Label htmlFor="linkedCase">
    Link to Case {replyingTo?.caseId ? "" : "(optional)"}
  </Label>
  {replyingTo?.caseId ? (
    <div className="mt-1 flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-md text-sm text-teal-800">
      <span className="font-medium">
        {cases?.find((c: any) => c.id === replyingTo.caseId)
          ? `${cases.find((c: any) => c.id === replyingTo.caseId).accountNumber} — ${cases.find((c: any) => c.id === replyingTo.caseId).caseName}`
          : `Case #${replyingTo.caseId}`}
      </span>
    </div>
  ) : (
    <Select value={linkedCaseId} onValueChange={setLinkedCaseId}>
      <SelectTrigger>
        <SelectValue placeholder="Select a case to link this message to..." />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2 border-b" onKeyDown={(e) => e.stopPropagation()}>
          <Input
            placeholder="Search cases..."
            value={caseSearchTerm}
            onChange={(e) => setCaseSearchTerm(e.target.value)}
            className="h-8"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        <SelectItem value="none">No case (general message)</SelectItem>
        {cases
          ?.filter((c: any) => {
            if (!caseSearchTerm) return true;
            const search = caseSearchTerm.toLowerCase();
            return (
              c.caseName?.toLowerCase().includes(search) ||
              c.accountNumber?.toLowerCase().includes(search) ||
              c.debtorName?.toLowerCase().includes(search)
            );
          })
          .map((c: any) => (
            <SelectItem key={c.id} value={c.id.toString()}>
              {c.accountNumber} - {c.caseName}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )}
  {replyingTo?.caseId ? (
    <p className="text-xs text-teal-700 mt-1">
      This reply is automatically linked to the same case as the original message.
    </p>
  ) : linkedCaseId && linkedCaseId !== "none" ? (
    <p className="text-xs text-gray-600 mt-1">
      Message will be stored against the selected case and visible to others in your organisation with access to this case.
    </p>
  ) : (
    <p className="text-xs text-amber-600 mt-1">
      As this message is not linked to a case, it will only be visible to you and Acclaim - not others in your organisation.
    </p>
  )}
</div>
                  <div className="space-y-2">
                    <Label>Attachment <span className="text-gray-400 font-normal">(optional)</span></Label>
                    {linkedCaseId && linkedCaseId !== "none" ? (
                      <>
                        <input
                          id="attachment"
                          type="file"
                          accept={ACCEPTED_FILE_TYPES_STRING}
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setCustomFileName("");
                            if (file) {
                              const validation = validateFile(file);
                              if (!validation.isValid) { setFileValidationError(validation.error); setSelectedFile(null); e.target.value = ''; return; }
                            }
                            setFileValidationError(null);
                            setSelectedFile(file);
                            e.target.value = '';
                          }}
                        />
                        {!selectedFile ? (
                          <label
                            htmlFor="attachment"
                            onDragOver={(e) => { e.preventDefault(); setIsDragOverAttachment(true); }}
                            onDragLeave={() => setIsDragOverAttachment(false)}
                            onDrop={(e) => {
                              e.preventDefault(); setIsDragOverAttachment(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) { const v = validateFile(file); if (!v.isValid) { setFileValidationError(v.error); } else { setFileValidationError(null); setSelectedFile(file); } }
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
                              const ext = selectedFile.name.split('.').pop()?.toUpperCase() || '?';
                              const extColor = ext === 'PDF' ? 'bg-red-50 text-red-500 border-red-100' : ['DOC','DOCX'].includes(ext) ? 'bg-blue-50 text-blue-500 border-blue-100' : ['XLS','XLSX'].includes(ext) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ['PNG','JPG','JPEG','GIF','WEBP'].includes(ext) ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100';
                              return <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border ${extColor}`}>{ext.slice(0,4)}</div>;
                            })()}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{selectedFile.name}</p>
                              <p className="text-xs text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button onClick={() => { setSelectedFile(null); setFileValidationError(null); }} className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-1">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        File attachments are only available when linking the message to a case.
                      </p>
                    )}
                    {fileValidationError && (
                      <p className="text-xs text-red-600">{fileValidationError}</p>
                    )}
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !newSubject.trim() || sendMessageMutation.isPending}
                    className="w-full bg-acclaim-teal hover:bg-acclaim-teal/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search Panel */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          {/* Basic Search */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by subject, content, case or organisation..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    resetPagination();
                  }}
                  className="pl-10 h-9 sm:h-10 text-sm"
                />
              </div>
              {(searchTerm || searchDateFrom || searchDateTo || searchSender || searchCaseId) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-500 hover:text-gray-700 h-9 px-2 sm:px-3"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Clear</span>
                </Button>
              )}
            </div>

            {/* Advanced Search */}
            {showAdvancedSearch && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="dateFrom" className="text-xs sm:text-sm">From</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={searchDateFrom}
                      onChange={(e) => {
                        setSearchDateFrom(e.target.value);
                        resetPagination();
                      }}
                      className="mt-1 h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo" className="text-xs sm:text-sm">To</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={searchDateTo}
                      onChange={(e) => {
                        setSearchDateTo(e.target.value);
                        resetPagination();
                      }}
                      className="mt-1 h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sender" className="text-xs sm:text-sm">Sender</Label>
                    <Input
                      id="sender"
                      placeholder="Name/email..."
                      value={searchSender}
                      onChange={(e) => {
                        setSearchSender(e.target.value);
                        resetPagination();
                      }}
                      className="mt-1 h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="caseSearch" className="text-xs sm:text-sm">Case</Label>
                    <Input
                      id="caseSearch"
                      placeholder="Case #/name..."
                      value={searchCaseId}
                      onChange={(e) => {
                        setSearchCaseId(e.target.value);
                        resetPagination();
                      }}
                      className="mt-1 h-9 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Export to Excel Button */}
                <div className="flex items-center justify-end p-3 sm:p-4 bg-gray-50 rounded-lg border-t border-gray-200">
                  <Button
                    onClick={handleExportMessages}
                    disabled={isExporting || (!searchDateFrom && !searchDateTo)}
                    variant="outline"
                    className="border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 text-xs sm:text-sm h-9"
                    title={(!searchDateFrom && !searchDateTo) 
                      ? "Select a date range to enable export" 
                      : "Export messages within the selected date range to Excel"
                    }
                  >
                    <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export to Excel"}</span>
                    <span className="sm:hidden ml-1">XLS</span>
                  </Button>
                </div>

              </div>
            )}

            {/* Search Results Summary with Pagination Info */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-xs sm:text-sm text-gray-600">
              <span className="text-center sm:text-left">
                {startIndex + 1}-{Math.min(endIndex, filteredMessages.length)} of {filteredMessages.length}
                <span className="hidden sm:inline"> messages</span>
                {filteredMessages.length !== totalMessages && <span className="hidden sm:inline"> (filtered from {totalMessages})</span>}
              </span>
              {totalPages > 1 && (
                <span className="text-accent-foreground">
                  Page {currentPage}/{totalPages}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message View Dialog */}
      <Dialog open={messageViewOpen} onOpenChange={handleCloseMessageView}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Fixed header */}
          <DialogHeader className="flex-shrink-0 pb-3 border-b">
            <DialogTitle className="text-lg font-semibold pr-6">
              {viewingMessage?.subject}
            </DialogTitle>
          </DialogHeader>

          {viewingMessage && (
            <div ref={viewDialogScrollRef} className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Sender row + action buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${viewingMessage.senderIsAdmin ? 'bg-white border-2 border-acclaim-teal' : 'bg-white border-2 border-blue-300'}`}>
                    {viewingMessage.senderIsAdmin ? (
                      <img src={acclaimRoseLogo} alt="Acclaim" className="w-8 h-8 object-contain" />
                    ) : (
                      <User className="h-5 w-5 text-acclaim-teal" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {viewingMessage.senderName || viewingMessage.senderEmail || 'Unknown'}
                      </p>
                      <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                        {viewingMessage.senderIsAdmin ? "Acclaim" : (viewingMessage.senderOrganisationName || "User")}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(viewingMessage.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:flex-shrink-0">
                  <Button
                    variant={showViewReply ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowViewReply(v => {
                        if (!v) {
                          setTimeout(() => {
                            const container = viewDialogScrollRef.current;
                            if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                          }, 80);
                        }
                        return !v;
                      });
                    }}
                    className={showViewReply
                      ? "bg-acclaim-teal text-white hover:bg-acclaim-teal/90"
                      : "text-acclaim-teal border-acclaim-teal hover:bg-acclaim-teal hover:text-white"}
                    data-testid="button-view-reply-toggle"
                  >
                    <MessageSquare className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{showViewReply ? "Cancel" : "Reply"}</span>
                  </Button>
                  {user?.isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAuditDialog(viewingMessage.id)}
                        className="text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white"
                        title="View read receipts"
                      >
                        <Eye className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Views</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this message?")) {
                            deleteMessageMutation.mutate(viewingMessage.id);
                            handleCloseMessageView();
                          }
                        }}
                        className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                        disabled={deleteMessageMutation.isPending}
                        title="Delete message"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">{deleteMessageMutation.isPending ? "Deleting..." : "Delete"}</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Case link */}
              {viewingMessage.caseId && (
                <div className="bg-acclaim-teal/5 border border-acclaim-teal/20 p-3 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Case:</span>{" "}
                    <button
                      onClick={() => handleCaseClick(viewingMessage.caseId)}
                      className="text-acclaim-teal hover:text-acclaim-teal/80 font-medium underline cursor-pointer"
                    >
                      {getCaseAccountNumber(viewingMessage.caseId)}
                    </button>
                    {(() => {
                      const caseData = cases?.find((c: any) => c.id === viewingMessage.caseId);
                      return caseData?.caseName ? (
                        <span className="text-gray-600 dark:text-gray-400 ml-1">— {caseData.caseName}</span>
                      ) : null;
                    })()}
                  </p>
                </div>
              )}

              {/* Message body */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm">
                  {viewingMessage.content}
                </div>
              </div>

              {/* Existing attachment */}
              {viewingMessage.attachmentFileName && (
                <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    {(() => {
                      const ext = (viewingMessage.attachmentFileName.split('.').pop() || '').toUpperCase();
                      const extColor = ext === 'PDF' ? 'bg-red-50 text-red-500 border-red-100' : ['DOC','DOCX'].includes(ext) ? 'bg-blue-50 text-blue-500 border-blue-100' : ['XLS','XLSX'].includes(ext) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ['PNG','JPG','JPEG','GIF','WEBP'].includes(ext) ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100';
                      return <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border ${extColor}`}>{ext.slice(0,4) || '?'}</div>;
                    })()}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{viewingMessage.attachmentFileName}</p>
                      <p className="text-xs text-gray-400">{(viewingMessage.attachmentFileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => window.open(`/api/messages/${viewingMessage.id}/download`, '_blank')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}

              {/* Inline reply panel */}
              {showViewReply && (
                <div ref={viewReplyRef} className="pt-4 border-t space-y-3">
                  <Label className="text-sm font-semibold">Reply</Label>
                  <Textarea
                    placeholder="Type your reply..."
                    value={viewReplyText}
                    onChange={(e) => setViewReplyText(e.target.value)}
                    rows={4}
                    data-testid="textarea-view-reply"
                  />

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Attachment <span className="font-normal text-gray-400">(optional)</span>
                    </Label>
                    <input
                      id="view-reply-attachment"
                      type="file"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          const v = validateFile(file);
                          if (!v.isValid) { setViewReplyFileError(v.error!); return; }
                        }
                        setViewReplyFileError(null);
                        setViewReplyFile(file);
                        e.target.value = '';
                      }}
                    />
                    {!viewReplyFile ? (
                      <label
                        htmlFor="view-reply-attachment"
                        onDragOver={(e) => { e.preventDefault(); setViewReplyIsDragOver(true); }}
                        onDragLeave={() => setViewReplyIsDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault(); setViewReplyIsDragOver(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) { const v = validateFile(file); if (!v.isValid) { setViewReplyFileError(v.error!); } else { setViewReplyFileError(null); setViewReplyFile(file); } }
                        }}
                        className={`flex flex-col items-center justify-center gap-1.5 px-4 py-5 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center ${
                          viewReplyIsDragOver ? "border-teal-400 bg-teal-50 dark:bg-teal-900/20" : "border-gray-200 bg-gray-50 dark:bg-gray-800/50 hover:border-teal-300 hover:bg-teal-50/50"
                        }`}
                      >
                        <Paperclip className={`h-5 w-5 ${viewReplyIsDragOver ? "text-teal-600" : "text-gray-400"}`} />
                        <span className={`text-sm ${viewReplyIsDragOver ? "text-teal-700 dark:text-teal-300" : "text-gray-500"}`}>
                          {viewReplyIsDragOver ? "Drop file here" : "Click to browse or drag a file here"}
                        </span>
                        <span className="text-xs text-gray-400">{ACCEPTED_FILE_TYPES_DISPLAY} · {MAX_FILE_SIZE_MB}MB</span>
                      </label>
                    ) : (
                      <div className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                        {(() => {
                          const ext = (viewReplyFile.name.split('.').pop() || '').toUpperCase();
                          const extColor = ext === 'PDF' ? 'bg-red-50 text-red-500 border-red-100' : ['DOC','DOCX'].includes(ext) ? 'bg-blue-50 text-blue-500 border-blue-100' : ['XLS','XLSX'].includes(ext) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ['PNG','JPG','JPEG','GIF','WEBP'].includes(ext) ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100';
                          return <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border ${extColor}`}>{ext.slice(0,4)}</div>;
                        })()}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{viewReplyFile.name}</p>
                          <p className="text-xs text-gray-400">{(viewReplyFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={() => { setViewReplyFile(null); setViewReplyFileError(null); }} className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-1">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {viewReplyFileError && <p className="text-xs text-red-600">{viewReplyFileError}</p>}
                  </div>

                  <Button
                    onClick={handleViewDialogReply}
                    disabled={!viewReplyText.trim() || sendMessageMutation.isPending}
                    className="bg-acclaim-teal hover:bg-acclaim-teal/90 w-full"
                    data-testid="button-view-send-reply"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendMessageMutation.isPending ? "Sending..." : "Send Reply"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Messages List */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">
            All Messages ({filteredMessages.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-start gap-3 p-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedMessages && paginatedMessages.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedMessages.map((message: any) => {
                const senderLabel = message.senderName || message.senderEmail || 'Unknown';
                const caseData = message.caseId ? cases?.find((c: any) => c.id === message.caseId) : null;
                return (
                  <div
                    key={message.id}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer group"
                    onClick={() => handleMessageClick(message)}
                  >
                    {/* avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${message.senderIsAdmin ? 'bg-white border-2 border-acclaim-teal' : 'bg-white border-2 border-blue-300'}`}>
                      {message.senderIsAdmin ? (
                        <img src={acclaimRoseLogo} alt="Acclaim" className="w-7 h-7 object-contain" />
                      ) : (
                        <User className="text-acclaim-teal h-4 w-4" />
                      )}
                    </div>
                    {/* body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                          {senderLabel}
                          {message.senderIsAdmin && (
                            <span className="ml-1.5 text-[10px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wide">· Acclaim</span>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-400 shrink-0">{formatDate(message.createdAt)}</p>
                      </div>
                      {message.subject && (
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-0.5">
                          {message.subject}
                          {message.attachmentFileName && (
                            <Paperclip className="inline h-3 w-3 text-gray-400 ml-1.5 shrink-0" />
                          )}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {caseData && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">
                            <MessageSquare className="h-2.5 w-2.5" />
                            {caseData.caseName}
                            {caseData.organisationName && (
                              <span className="text-gray-400 font-normal"> · {caseData.organisationName}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* reply button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-acclaim-teal shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReply(message);
                      }}
                      title="Reply to this message"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">No messages found</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Tap "New" above to start a conversation.
              </p>
            </div>
          )}
        </CardContent>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 border-t bg-gray-50">
            <p className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              {startIndex + 1}-{Math.min(endIndex, filteredMessages.length)} of {filteredMessages.length}
            </p>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="text-acclaim-teal border-acclaim-teal hover:bg-acclaim-teal hover:text-white h-8 px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">&lt;</span>
              </Button>

              {/* Page numbers - show fewer on mobile */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, index) => {
                  let pageNumber;
                  if (totalPages <= 3) {
                    pageNumber = index + 1;
                  } else if (currentPage <= 2) {
                    pageNumber = index + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNumber = totalPages - 2 + index;
                  } else {
                    pageNumber = currentPage - 1 + index;
                  }

                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`h-8 w-8 p-0 ${currentPage === pageNumber 
                        ? "bg-acclaim-teal hover:bg-acclaim-teal/90 text-white" 
                        : "text-acclaim-teal border-acclaim-teal hover:bg-acclaim-teal hover:text-white"
                      }`}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="text-acclaim-teal border-acclaim-teal hover:bg-acclaim-teal hover:text-white h-8 px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">&gt;</span>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Case Detail Dialog */}
      <Dialog open={caseDialogOpen} onOpenChange={setCaseDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[92vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle>Case Details - {selectedCase?.caseName}</DialogTitle>
            <DialogDescription>
              View comprehensive case information including timeline, documents, and messages.
            </DialogDescription>
          </DialogHeader>
          {selectedCase && (
            <CaseDetail case={selectedCase} />
          )}
        </DialogContent>
      </Dialog>

      {/* Message Audit Dialog (Admin Only) */}
      {user?.isAdmin && (
        <Dialog open={auditDialogOpen} onOpenChange={(open) => {
          setAuditDialogOpen(open);
          if (!open) setAuditMessageId(null);
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600" />
                Message View History
              </DialogTitle>
              <DialogDescription>
                See who has viewed this message and when.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {auditLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : messageAuditLogs && messageAuditLogs.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {messageAuditLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {log.userEmail || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {log.ipAddress && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            IP: {log.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No views recorded yet</p>
                  <p className="text-xs mt-1">Views are tracked when users open messages</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
