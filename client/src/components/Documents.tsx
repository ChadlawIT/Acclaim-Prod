import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Search, Upload, Calendar, User, Trash2, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { validateFile, ACCEPTED_FILE_TYPES_STRING, MAX_FILE_SIZE_MB, ACCEPTED_FILE_TYPES_DISPLAY } from "@/lib/fileValidation";
import CaseDetail from "./CaseDetail";

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [notifyOnUpload, setNotifyOnUpload] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [caseDetailsOpen, setCaseDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const documentsPerPage = 20;
  
  // Audit dialog state (admin only)
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [auditDocumentId, setAuditDocumentId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["/api/documents"],
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
        description: "Failed to load documents",
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

  const getCaseDetails = (caseId: number) => {
    return cases?.find((c: any) => c.id === caseId);
  };

  const filteredDocuments = documents?.filter((doc: any) => {
    const searchLower = searchTerm.toLowerCase();
    
    // Handle nested document structure
    const docData = doc.documents || doc;
    
    // Exclude documents without a caseId (general documents)
    if (!docData.caseId) {
      return false;
    }
    
    const caseDetails = getCaseDetails(docData.caseId);
    
    return (
      (docData.fileName && docData.fileName.toLowerCase().includes(searchLower)) ||
      (docData.fileType && docData.fileType.toLowerCase().includes(searchLower)) ||
      (caseDetails && caseDetails.accountNumber && caseDetails.accountNumber.toLowerCase().includes(searchLower)) ||
      (caseDetails && caseDetails.caseName && caseDetails.caseName.toLowerCase().includes(searchLower)) ||
      (caseDetails && caseDetails.organisationName && caseDetails.organisationName.toLowerCase().includes(searchLower))
    );
  }) || [];

  // Pagination calculations
  const totalPages = Math.ceil(filteredDocuments.length / documentsPerPage);
  const startIndex = (currentPage - 1) * documentsPerPage;
  const endIndex = startIndex + documentsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Reset pagination when search changes
  const resetPagination = () => {
    setCurrentPage(1);
  };

  useEffect(() => {
    resetPagination();
  }, [searchTerm]);

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, caseId, notify, fileName }: { file: File; caseId: string; notify: boolean; fileName: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caseId", caseId);
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
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
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

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest("DELETE", `/api/admin/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: any) => {
      const isForbidden = error?.message?.includes('403') || error?.message?.includes('Super admin');
      if (isForbidden) {
        toast({
          title: "Access Denied",
          description: "Only super admins can delete documents. Please contact a super admin to perform this action.",
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
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  // Mutation to track document views
  const trackViewMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest("POST", "/api/track/view", { type: "document", id: documentId });
    },
  });

  // Query for document audit history (admin only)
  const { data: documentAuditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["/api/admin/audit/item/document", auditDocumentId],
    queryFn: async () => {
      if (!auditDocumentId) return [];
      const response = await fetch(`/api/admin/audit/item/document/${auditDocumentId}`, {
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
    enabled: !!auditDocumentId && user?.isAdmin,
  });

  const handleDownload = (documentId: number) => {
    // Track the view for read receipts
    trackViewMutation.mutate(documentId);
    window.open(`/api/documents/${documentId}/download`, '_blank');
  };

  const handleUploadAll = async () => {
    if (!selectedFiles.length || !selectedCaseId) {
      toast({
        title: "Error",
        description: "Please select a case and at least one file before uploading",
        variant: "destructive",
      });
      return;
    }
    setUploadProgress({ done: 0, total: selectedFiles.length });
    let successCount = 0;
    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        await uploadDocumentMutation.mutateAsync({
          file: selectedFiles[i],
          caseId: selectedCaseId,
          notify: notifyOnUpload,
          fileName: selectedFiles[i].name,
        });
        successCount++;
        setUploadProgress({ done: i + 1, total: selectedFiles.length });
      } catch {
        // individual errors are handled by mutation onError
      }
    }
    if (successCount > 0) {
      toast({
        title: "Upload complete",
        description: `${successCount} of ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} uploaded successfully`,
      });
      handleCloseUploadDialog();
    } else {
      setUploadProgress(null);
    }
  };

  const addFilesToQueue = (incoming: FileList | File[]) => {
    const newFiles: File[] = [];
    const newErrors: string[] = [];
    Array.from(incoming).forEach((f) => {
      const validation = validateFile(f);
      if (!validation.isValid) {
        newErrors.push(`${f.name}: ${validation.error}`);
      } else if (!selectedFiles.find((e) => e.name === f.name && e.size === f.size)) {
        newFiles.push(f);
      }
    });
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    if (newErrors.length) setFileErrors((prev) => [...prev, ...newErrors]);
  };

  const removeFromQueue = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFiles([]);
    setFileErrors([]);
    setIsDragOver(false);
    setUploadProgress(null);
    setSelectedCaseId("");
    setNotifyOnUpload(true);
  };

  const handleCaseClick = (caseId: number) => {
    const caseData = cases?.find((c: any) => c.id === caseId);
    if (caseData) {
      setSelectedCase(caseData);
      setCaseDetailsOpen(true);
    }
  };

  const handleOpenAuditDialog = (documentId: number) => {
    setAuditDocumentId(documentId);
    setAuditDialogOpen(true);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (fileType?.includes('word') || fileType?.includes('document')) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    if (fileType?.includes('image')) {
      return <FileText className="h-5 w-5 text-green-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const groupDocumentsByCase = (docs: any[]) => {
    const grouped = docs.reduce((acc: any, doc: any) => {
      const docData = doc.documents || doc;
      // Only include documents that have a caseId (exclude general documents)
      if (!docData.caseId) {
        return acc;
      }
      const caseId = docData.caseId;
      if (!acc[caseId]) {
        acc[caseId] = [];
      }
      acc[caseId].push(docData);
      return acc;
    }, {});
    return grouped;
  };

  const groupedDocuments = groupDocumentsByCase(paginatedDocuments);

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl">Document Library</CardTitle>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white hover:bg-acclaim-teal/10 text-[#008a8a] border border-[#008a8a] w-full sm:w-auto" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload Documents</DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  {/* Case selector */}
                  <div>
                    <Label htmlFor="case-select">Select Case</Label>
                    <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a case..." />
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
                        {cases
                          ?.filter((caseItem: any) => {
                            if (!caseSearchTerm) return true;
                            const search = caseSearchTerm.toLowerCase();
                            return (
                              caseItem.caseName?.toLowerCase().includes(search) ||
                              caseItem.accountNumber?.toLowerCase().includes(search) ||
                              caseItem.debtorName?.toLowerCase().includes(search)
                            );
                          })
                          .map((caseItem: any) => (
                            <SelectItem key={caseItem.id} value={caseItem.id.toString()}>
                              {caseItem.accountNumber} - {caseItem.caseName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Drag-drop zone */}
                  <div>
                    <Label>Files</Label>
                    <p className="text-xs text-gray-500 mt-0.5 mb-2">
                      Max {MAX_FILE_SIZE_MB}MB per file · {ACCEPTED_FILE_TYPES_DISPLAY}
                    </p>
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                        ${isDragOver
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-teal-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        if (e.dataTransfer.files.length) addFilesToQueue(e.dataTransfer.files);
                      }}
                      onClick={() => document.getElementById('doc-file-input')?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Drag &amp; drop files here, or <span className="text-teal-600">browse</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Multiple files supported</p>
                      <input
                        id="doc-file-input"
                        type="file"
                        multiple
                        accept={ACCEPTED_FILE_TYPES_STRING}
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) addFilesToQueue(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </div>

                    {/* Validation errors */}
                    {fileErrors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {fileErrors.map((err, i) => (
                          <p key={i} className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded flex items-start gap-2">
                            <X className="h-3 w-3 mt-0.5 shrink-0" />
                            {err}
                          </p>
                        ))}
                        <button onClick={() => setFileErrors([])} className="text-xs text-gray-400 hover:text-gray-600 mt-1">Clear errors</button>
                      </div>
                    )}

                    {/* File queue */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {selectedFiles.map((file, idx) => {
                          const ext = file.name.split('.').pop()?.toLowerCase() || '';
                          const isPdf = file.type.includes('pdf') || ext === 'pdf';
                          const isWord = file.type.includes('word') || ['doc','docx'].includes(ext);
                          const isSheet = file.type.includes('sheet') || file.type.includes('excel') || ['xls','xlsx','csv'].includes(ext);
                          const iconColour = isPdf ? 'text-red-500' : isWord ? 'text-blue-500' : isSheet ? 'text-emerald-600' : 'text-gray-400';
                          const bgColour = isPdf ? 'bg-red-50' : isWord ? 'bg-blue-50' : isSheet ? 'bg-emerald-50' : 'bg-gray-100';
                          const isDone = uploadProgress && idx < uploadProgress.done;
                          return (
                            <div key={idx} className={`flex items-center gap-3 px-3 py-2.5 ${isDone ? 'bg-teal-50/50 dark:bg-teal-900/10' : 'bg-white dark:bg-gray-900'}`}>
                              <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${bgColour}`}>
                                <FileText className={`h-3.5 w-3.5 ${iconColour}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                                <p className="text-[10px] text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                              {isDone ? (
                                <span className="text-[10px] font-medium text-teal-600">✓ Uploaded</span>
                              ) : uploadProgress ? (
                                <span className="text-[10px] text-gray-400">Queued…</span>
                              ) : (
                                <button
                                  onClick={() => removeFromQueue(idx)}
                                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Notify toggle */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Checkbox
                      id="notify-upload"
                      checked={notifyOnUpload}
                      onCheckedChange={(v) => setNotifyOnUpload(!!v)}
                    />
                    <Label htmlFor="notify-upload" className="text-sm cursor-pointer">
                      {user?.isAdmin ? 'Notify users by email when uploaded' : 'Notify Acclaim by email when uploaded'}
                    </Label>
                  </div>

                  {/* Progress bar */}
                  {uploadProgress && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Uploading…</span>
                        <span>{uploadProgress.done} / {uploadProgress.total}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-300"
                          style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      onClick={handleUploadAll}
                      disabled={uploadDocumentMutation.isPending || !selectedFiles.length || !selectedCaseId}
                      className="bg-acclaim-teal hover:bg-acclaim-teal/90"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadDocumentMutation.isPending
                        ? `Uploading ${uploadProgress?.done ?? 0} of ${uploadProgress?.total ?? selectedFiles.length}…`
                        : `Upload ${selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}File${selectedFiles.length !== 1 ? 's' : ''}`}
                    </Button>
                    <Button variant="outline" onClick={handleCloseUploadDialog} disabled={uploadDocumentMutation.isPending}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by filename, case or organisation..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetPagination();
              }}
              className="pl-10 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Document Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {isLoading ? "..." : documents?.length || 0}
                </p>
              </div>
              <FileText className="h-5 w-5 sm:h-8 sm:w-8 text-acclaim-teal hidden sm:block" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">PDF</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {isLoading ? "..." : documents?.filter((d: any) => {
                    const docData = d.documents || d;
                    return docData.fileType?.includes('pdf');
                  }).length || 0}
                </p>
              </div>
              <FileText className="h-5 w-5 sm:h-8 sm:w-8 text-red-500 hidden sm:block" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Word</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {isLoading ? "..." : documents?.filter((d: any) => {
                    const docData = d.documents || d;
                    return docData.fileType?.includes('word') || docData.fileType?.includes('document');
                  }).length || 0}
                </p>
              </div>
              <FileText className="h-5 w-5 sm:h-8 sm:w-8 text-blue-500 hidden sm:block" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Other</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {isLoading ? "..." : documents?.filter((d: any) => {
                    const docData = d.documents || d;
                    return !docData.fileType?.includes('pdf') && !docData.fileType?.includes('word') && !docData.fileType?.includes('document');
                  }).length || 0}
                </p>
              </div>
              <FileText className="h-5 w-5 sm:h-8 sm:w-8 text-green-500 hidden sm:block" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <CardTitle className="text-base sm:text-lg">
              All Documents ({filteredDocuments.length})
            </CardTitle>
            {filteredDocuments.length > documentsPerPage && (
              <span className="text-xs sm:text-sm text-gray-500 font-normal">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedDocuments).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedDocuments).map(([caseId, caseDocuments]: [string, any]) => {
                const caseDetails = getCaseDetails(parseInt(caseId));
                return (
                  <div key={caseId}>
                    {/* Case group header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 rounded-full bg-teal-500 shrink-0" />
                      <button
                        onClick={() => handleCaseClick(parseInt(caseId))}
                        className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors truncate"
                      >
                        {caseDetails ? `${caseDetails.accountNumber} — ${caseDetails.caseName}` : 'Case Documents'}
                      </button>
                      {caseDetails?.organisationName && (
                        <span className="text-xs text-gray-400 shrink-0">· {caseDetails.organisationName}</span>
                      )}
                      <span className="text-xs text-gray-400 shrink-0 ml-auto">{(caseDocuments as any[]).length} {(caseDocuments as any[]).length === 1 ? 'file' : 'files'}</span>
                    </div>

                    {/* Document rows */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-800 pl-3">
                      {(caseDocuments as any[]).map((doc: any) => {
                        const ext = doc.fileName?.split('.').pop()?.toLowerCase() || '';
                        const isPdf = doc.fileType?.includes('pdf') || ext === 'pdf';
                        const isWord = doc.fileType?.includes('word') || doc.fileType?.includes('document') || ['doc','docx'].includes(ext);
                        const isImage = doc.fileType?.includes('image') || ['jpg','jpeg','png','gif','webp'].includes(ext);
                        const isSheet = doc.fileType?.includes('sheet') || doc.fileType?.includes('excel') || ['xls','xlsx','csv'].includes(ext);
                        const iconColour = isPdf ? 'text-red-500' : isWord ? 'text-blue-500' : isImage ? 'text-green-500' : isSheet ? 'text-emerald-600' : 'text-gray-400';
                        const bgColour = isPdf ? 'bg-red-50 dark:bg-red-900/20' : isWord ? 'bg-blue-50 dark:bg-blue-900/20' : isImage ? 'bg-green-50 dark:bg-green-900/20' : isSheet ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-100 dark:bg-gray-800';
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-0 group"
                          >
                            {/* file type icon */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bgColour}`}>
                              <FileText className={`h-4 w-4 ${iconColour}`} />
                            </div>
                            {/* info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                {doc.fileName}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {formatDate(doc.createdAt)}
                                {doc.fileSize && <span className="ml-1.5">· {formatFileSize(doc.fileSize)}</span>}
                              </p>
                            </div>
                            {/* actions — always visible on mobile, fade-in on desktop */}
                            <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc.id)}
                                className="h-7 w-7 p-0 text-gray-400 hover:text-teal-600"
                                title="Download"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              {user?.isAdmin && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenAuditDialog(doc.id)}
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-purple-600"
                                    title="View download history"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this document?")) {
                                        deleteDocumentMutation.mutate(doc.id);
                                      }
                                    }}
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                                    disabled={deleteDocumentMutation.isPending}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">
                {searchTerm ? "No documents match your search" : "No documents found"}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Documents will appear here once uploaded.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {filteredDocuments.length > documentsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredDocuments.length)} of {filteredDocuments.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-8 px-2 sm:px-3"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            <span className="text-xs sm:text-sm text-gray-600 px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-2 sm:px-3"
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Case Details Popup */}
      {selectedCase && (
        <Dialog open={caseDetailsOpen} onOpenChange={setCaseDetailsOpen}>
          <DialogContent className="max-w-[90vw] max-h-[92vh] overflow-y-auto w-[95vw]">
            <DialogHeader>
              <DialogTitle>Case Details</DialogTitle>
              <DialogDescription>
                View comprehensive case information including timeline, documents, and messages.
              </DialogDescription>
            </DialogHeader>
            <CaseDetail case={selectedCase} />
          </DialogContent>
        </Dialog>
      )}

      {/* Document Audit Dialog (Admin Only) */}
      {user?.isAdmin && (
        <Dialog open={auditDialogOpen} onOpenChange={(open) => {
          setAuditDialogOpen(open);
          if (!open) setAuditDocumentId(null);
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600" />
                Document Download History
              </DialogTitle>
              <DialogDescription>
                See who has downloaded this document and when.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {auditLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : documentAuditLogs && documentAuditLogs.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {documentAuditLogs.map((log: any) => (
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
                  <p>No downloads recorded yet</p>
                  <p className="text-xs mt-1">Downloads are tracked when users access documents</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
