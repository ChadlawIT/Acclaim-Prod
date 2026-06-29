import { useState, useEffect, useRef, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import ExcelJS from "exceljs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import { Users, Building, Plus, Edit, Trash2, Shield, UserPlus, AlertTriangle, ShieldCheck, ShieldAlert, ArrowLeft, Activity, FileText, CreditCard, Archive, ArchiveRestore, Download, Check, Eye, EyeOff, Mail, Bell, BellOff, FilePlus, FileX, BarChart3, Search, Crown, Calendar, CalendarOff, Pencil, LogOut, RefreshCw, ChevronDown, ChevronUp, ChevronRight, Clock, Send, History, KeyRound, Copy, HelpCircle, X, ClipboardList, ClipboardX, MapPin, Phone, Banknote, User, FileImage, FileSpreadsheet, FileVideo, Receipt, Scale } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { createUserSchema, updateUserSchema, createOrganisationSchema, updateOrganisationSchema } from "@shared/schema";
import { z } from "zod";
import { Link } from "wouter";
import ApiGuideDownload from "@/components/ApiGuideDownload";
import UserGuideDownload from "@/components/UserGuideDownload";
import UserGuideWordDownload from "@/components/UserGuideWordDownload";
import CaseManagementGuideDownload from "@/components/CaseManagementGuideDownload";
import ClosedCaseManagement from "@/components/ClosedCaseManagement";
import { EmailBroadcast } from "@/components/EmailBroadcast";
import { EscalationReportsTrigger } from "@/components/EscalationReportsTrigger";

// Documents List Component
function DocumentsList({ submissionId }: { submissionId: number }) {
  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['/api/admin/case-submissions', submissionId, 'documents'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/case-submissions/${submissionId}/documents`);
      return response.json();
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileStyle = (fileName: string): { icon: React.ElementType; cls: string; label: string } => {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') return { icon: FileText, cls: 'text-red-500 bg-red-50 border-red-100', label: 'PDF' };
    if (['doc', 'docx'].includes(ext)) return { icon: FileText, cls: 'text-blue-500 bg-blue-50 border-blue-100', label: 'Word' };
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: FileSpreadsheet, cls: 'text-green-600 bg-green-50 border-green-100', label: ext.toUpperCase() };
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return { icon: FileImage, cls: 'text-purple-500 bg-purple-50 border-purple-100', label: 'Image' };
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return { icon: FileVideo, cls: 'text-amber-500 bg-amber-50 border-amber-100', label: 'Video' };
    return { icon: FileText, cls: 'text-gray-500 bg-gray-50 border-gray-200', label: ext.toUpperCase() || 'File' };
  };

  if (isLoading) return <div className="text-sm text-gray-500 py-6 text-center">Loading documents…</div>;
  if (error) return <div className="text-sm text-red-500 py-6 text-center">Error loading documents</div>;

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No documents uploaded with this submission</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc: any) => {
        const { icon: Icon, cls, label } = getFileStyle(doc.fileName);
        const baseUrl = `/api/admin/case-submissions/documents/${doc.id}`;
        return (
          <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors group">
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${cls}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
              <p className="text-xs text-gray-500">{label} · {formatFileSize(doc.fileSize)} · Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-GB')}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => window.open(`${baseUrl}?inline=true`, '_blank')}
                title="Open in browser"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => window.open(baseUrl, '_blank')}
                title="Download file"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Documents Cell Component for table display
function DocumentsCell({ submissionId }: { submissionId: number }) {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/admin/case-submissions', submissionId, 'documents'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/case-submissions/${submissionId}/documents`);
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="text-sm">
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  const documentCount = documents?.length || 0;

  return (
    <div className="text-sm">
      <div className="flex items-center gap-1">
        <FileText className="h-3 w-3 text-gray-400" />
        <span className="text-xs text-gray-500">
          {documentCount} {documentCount === 1 ? 'document' : 'documents'}
        </span>
      </div>
    </div>
  );
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organisationId: number | null;
  organisationName?: string;
  createdAt: string;
  isAdmin?: boolean;
  phone?: string;
}

interface Organisation {
  id: number;
  name: string;
  createdAt: string;
  userCount: number;
  externalRef?: string;
  scheduledReportsEnabled?: boolean;
}

type CreateUserForm = z.infer<typeof createUserSchema>;
type UpdateUserForm = z.infer<typeof updateUserSchema>;
type CreateOrganisationForm = z.infer<typeof createOrganisationSchema>;
type UpdateOrganisationForm = z.infer<typeof updateOrganisationSchema>;

interface Case {
  id: number;
  accountNumber: string;
  caseName: string;
  debtorEmail: string;
  debtorPhone: string;
  originalAmount: string;
  outstandingAmount: string;
  status: string;
  stage: string;
  organisationId: number;
  organisationName?: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

interface CaseSubmission {
  id: number;
  submittedBy: string;
  
  // Client details (person who submitted)
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  
  // Case identification
  caseName: string;
  
  // Debtor type and details
  debtorType: string;
  
  // Individual/Sole Trader specific fields
  individualType?: string;
  tradingName?: string;
  
  // Organisation specific fields
  organisationName?: string;
  organisationTradingName?: string;
  companyNumber?: string;
  
  // Principal of Business details (for Individual/Sole Trader)
  principalSalutation?: string;
  principalFirstName?: string;
  principalLastName?: string;
  
  // Address details
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  
  // Contact details
  mainPhone?: string;
  altPhone?: string;
  mainEmail?: string;
  altEmail?: string;
  
  // Debt details
  debtDetails?: string;
  totalDebtAmount?: number;
  currency?: string;
  
  // Payment terms
  paymentTermsType?: string;
  paymentTermsDays?: number;
  paymentTermsOther?: string;
  
  // Invoice details
  singleInvoice?: string;
  firstOverdueDate?: string;
  lastOverdueDate?: string;
  
  // Additional information
  additionalInfo?: string;
  
  // System fields
  status: string;
  organisationId: number;
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;

  // Joined fields from API
  submittedByName?: string;
  clientOrganisationName?: string;
}

const DEFAULT_PAGE_SIZE = 21;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-between px-2 py-4 border-t">
      <div className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="px-2 text-sm">{currentPage}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last
        </Button>
      </div>
    </div>
  );
}

function PageSizeSelector({ pageSize, onPageSizeChange }: { pageSize: number; onPageSizeChange: (size: number) => void }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="whitespace-nowrap">Show</span>
      <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
        <SelectTrigger className="w-20 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_OPTIONS.map(n => (
            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="whitespace-nowrap">per page</span>
    </div>
  );
}

function CaseManagementTab({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteConfirmCase, setDeleteConfirmCase] = useState<Case | null>(null);
  const [archiveConfirmCase, setArchiveConfirmCase] = useState<Case | null>(null);
  const [expandedCaseId, setExpandedCaseId] = useState<number | null>(null);
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const casesTableTopRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [caseSearchFilter, setCaseSearchFilter] = useState("");
  const [restrictAccessCase, setRestrictAccessCase] = useState<Case | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [newCaseForm, setNewCaseForm] = useState({
    accountNumber: '',
    caseName: '',
    debtorEmail: '',
    debtorPhone: '',
    debtorAddress: '',
    debtorType: 'individual',
    originalAmount: '',
    outstandingAmount: '',
    status: 'new',
    stage: 'initial_contact',
    organisationId: '',
    externalRef: ''
  });

  // CSV Export functionality
  const exportCasesToCSV = () => {
    if (!cases || cases.length === 0) {
      toast({
        title: "No Data",
        description: "No cases available to export.",
        variant: "destructive",
      });
      return;
    }

    // Define CSV headers
    const headers = [
      'Account Number',
      'Case Name',
      'Debtor Email',
      'Debtor Phone',
      'Original Amount',
      'Outstanding Amount',
      'Status',
      'Stage',
      'Organisation',
      'Created Date',
      'Updated Date',
      'Archived',
      'Archived Date'
    ];

    // Convert cases to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...cases.map((case_: Case) => [
        `"${case_.accountNumber || ''}"`,
        `"${case_.caseName || ''}"`,
        `"${case_.debtorEmail || ''}"`,
        `"${case_.debtorPhone || ''}"`,
        `"${case_.originalAmount || ''}"`,
        `"${case_.outstandingAmount || ''}"`,
        `"${case_.status || ''}"`,
        `"${case_.stage || ''}"`,
        `"${case_.organisationName || ''}"`,
        `"${new Date(case_.createdAt).toLocaleDateString('en-GB')}"`,
        `"${new Date(case_.updatedAt).toLocaleDateString('en-GB')}"`,
        `"${case_.isArchived ? 'Yes' : 'No'}"`,
        `"${case_.archivedAt ? new Date(case_.archivedAt).toLocaleDateString('en-GB') : ''}"`
      ].join(','))
    ];

    // Create and download CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cases-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: `Successfully exported ${cases.length} cases to CSV.`,
    });
  };
  
  // Fetch all cases (including archived ones for admin)
  const { data: cases = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/cases/all'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/cases/all');
      const data = await response.json();
      return data;
    },
    retry: false,
  });

  // Fetch how many users are restricted per case (caseId -> count)
  const { data: restrictionCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ['/api/admin/cases/restriction-counts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/cases/restriction-counts');
      return await response.json();
    },
    retry: false,
  });

  // Fetch organisations for the new case form
  const { data: organisations = [] } = useQuery({
    queryKey: ['/api/admin/organisations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/organisations');
      return await response.json();
    },
    retry: false,
  });

  // Fetch users for access restrictions when a case is selected
  const { data: orgUsers = [] } = useQuery({
    queryKey: ['/api/admin/organisations', restrictAccessCase?.organisationId, 'users'],
    queryFn: async () => {
      if (!restrictAccessCase?.organisationId) return [];
      const response = await apiRequest('GET', `/api/admin/organisations/${restrictAccessCase.organisationId}/users`);
      return await response.json();
    },
    enabled: !!restrictAccessCase?.organisationId,
    retry: false,
  });

  // Fetch current access restrictions for selected case
  const { data: currentRestrictions } = useQuery({
    queryKey: ['/api/admin/cases', restrictAccessCase?.id, 'access-restrictions'],
    queryFn: async () => {
      if (!restrictAccessCase?.id) return { blockedUserIds: [] };
      const response = await apiRequest('GET', `/api/admin/cases/${restrictAccessCase.id}/access-restrictions`);
      return await response.json();
    },
    enabled: !!restrictAccessCase?.id,
    retry: false,
  });

  // Update blocked user IDs when restrictions are fetched
  useEffect(() => {
    if (currentRestrictions?.blockedUserIds) {
      setBlockedUserIds(currentRestrictions.blockedUserIds);
    }
  }, [currentRestrictions]);

  // Mutation to update access restrictions
  const updateAccessRestrictionsMutation = useMutation({
    mutationFn: async ({ caseId, blockedUserIds }: { caseId: number; blockedUserIds: string[] }) => {
      return await apiRequest('POST', `/api/admin/cases/${caseId}/access-restrictions`, { blockedUserIds });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases', variables.caseId, 'access-restrictions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases/restriction-counts'] });
      // Refresh the per-user restrictions dialog (lift/restore) so it reflects this change
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === '/api/admin/users' &&
          query.queryKey[2] === 'restrictions',
      });
      toast({
        title: "Access Updated",
        description: "Case visibility restrictions have been updated.",
      });
      setRestrictAccessCase(null);
      setBlockedUserIds([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update access restrictions.",
        variant: "destructive",
      });
    },
  });

  // Create new case mutation
  const createCaseMutation = useMutation({
    mutationFn: async (caseData: any) => {
      const response = await apiRequest('POST', '/api/external/cases', caseData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Case Created",
        description: "New case has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases/all'] });
      setShowNewCaseDialog(false);
      setNewCaseForm({
        accountNumber: '',
        caseName: '',
        debtorEmail: '',
        debtorPhone: '',
        debtorAddress: '',
        debtorType: 'individual',
        originalAmount: '',
        outstandingAmount: '',
        status: 'new',
        stage: 'initial_contact',
        organisationId: '',
        externalRef: ''
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create case. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitNewCase = () => {
    if (!newCaseForm.accountNumber || !newCaseForm.caseName || !newCaseForm.organisationId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Account Number, Case Name, Organisation).",
        variant: "destructive",
      });
      return;
    }

    const organisation = organisations.find((org: Organisation) => org.id === parseInt(newCaseForm.organisationId));
    if (!organisation) {
      toast({
        title: "Invalid Organisation",
        description: "Please select a valid organisation.",
        variant: "destructive",
      });
      return;
    }

    const caseData = {
      ...newCaseForm,
      organisationExternalRef: organisation.externalRef || organisation.name,
      assignedTo: 'Admin',
      externalRef: newCaseForm.externalRef || `ADMIN-${Date.now()}`
    };

    createCaseMutation.mutate(caseData);
  };

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  // Archive case mutation
  const archiveCaseMutation = useMutation({
    mutationFn: async (caseId: number) => {
      return await apiRequest('PUT', `/api/admin/cases/${caseId}/archive`);
    },
    onSuccess: () => {
      toast({
        title: "Case Archived",
        description: "Case has been successfully archived.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases/all'] });
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
        description: "Failed to archive case. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Unarchive case mutation
  const unarchiveCaseMutation = useMutation({
    mutationFn: async (caseId: number) => {
      return await apiRequest('PUT', `/api/admin/cases/${caseId}/unarchive`);
    },
    onSuccess: () => {
      toast({
        title: "Case Unarchived",
        description: "Case has been successfully unarchived.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases/all'] });
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
        description: "Failed to unarchive case. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete case mutation
  const deleteCaseMutation = useMutation({
    mutationFn: async (caseId: number) => {
      return await apiRequest('DELETE', `/api/admin/cases/${caseId}`);
    },
    onSuccess: () => {
      toast({
        title: "Case Deleted",
        description: "Case and all associated data have been permanently deleted.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases/all'] });
    },
    onError: (error: any) => {
      const isForbidden = error?.message?.includes('403') || error?.message?.includes('Super admin');
      if (isForbidden) {
        toast({
          title: "Access Denied",
          description: "Only super admins can delete cases. Please contact a super admin to perform this action.",
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
        description: "Failed to delete case. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter cases by search term
  const filteredCases = (caseSearchFilter.trim()
    ? cases.filter((case_: Case) => {
        const search = caseSearchFilter.toLowerCase();
        return (
          case_.accountNumber?.toLowerCase().includes(search) ||
          case_.caseName?.toLowerCase().includes(search) ||
          case_.debtorEmail?.toLowerCase().includes(search) ||
          case_.organisationName?.toLowerCase().includes(search) ||
          case_.status?.toLowerCase().includes(search) ||
          case_.stage?.toLowerCase().includes(search) ||
          String(case_.id).includes(search)
        );
      })
    : [...(cases || [])]).sort((a: Case, b: Case) => {
      const orgCompare = (a.organisationName || '').localeCompare(b.organisationName || '');
      if (orgCompare !== 0) return orgCompare;
      // Sort account numbers numerically (oldest/lowest first)
      const aNum = parseInt((a.accountNumber || '').replace(/\D/g, ''), 10);
      const bNum = parseInt((b.accountNumber || '').replace(/\D/g, ''), 10);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return (a.accountNumber || '').localeCompare(b.accountNumber || '');
    });

  // Pagination logic for cases
  const totalPages = Math.ceil((filteredCases?.length || 0) / pageSize);
  const paginatedCases = filteredCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) {
    return <div>Loading cases...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading cases: {error.message}</p>
        <p>Please try refreshing the page or contact support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by account, name, email, or organisation..."
            value={caseSearchFilter}
            onChange={(e) => {
              setCaseSearchFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <PageSizeSelector pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
        <div className="flex gap-2">

          <Button
            onClick={exportCasesToCSV}
            variant="outline"
            size="sm"
            className="gap-2"
            title="Export all cases to CSV file"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600 px-1">
          Total Cases: {cases.length} | Archived: {cases.filter((c: Case) => c.isArchived).length} | Active: {cases.filter((c: Case) => !c.isArchived).length} | Showing: {paginatedCases.length}
          {caseSearchFilter && ` (filtered from ${cases.length})`}
        </div>
      </div>
      
      {/* Scroll anchor for pagination */}
      <div ref={casesTableTopRef} className="scroll-mt-4" />
      {/* Unified Card Grid + Detail Panel */}
      <div className="relative">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedCases.map((case_: Case) => {
            const isSelected = expandedCaseId === case_.id;
            return (
              <button
                key={case_.id}
                onClick={() => setExpandedCaseId(isSelected ? null : case_.id)}
                data-testid={`card-case-${case_.id}`}
                className={`w-full text-left rounded-xl border p-4 shadow-sm hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400/40 ${case_.isArchived ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-900'} ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200 dark:border-gray-700'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{case_.accountNumber}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">{case_.caseName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {case_.isArchived ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        <Archive className="h-3 w-3" />Archived
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Active</span>
                    )}
                    <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isSelected ? 'rotate-90 text-blue-500' : ''}`} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate mb-2">{case_.organisationName || 'No organisation'}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">£{case_.outstandingAmount}</span>
                  <span className="text-xs text-gray-400">{case_.stage}</span>
                  {restrictionCounts[case_.id] > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full" data-testid={`badge-restricted-${case_.id}`}>
                      <EyeOff className="h-3 w-3" />{restrictionCounts[case_.id]}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Backdrop */}
        {expandedCaseId && <div className="hidden sm:block fixed inset-0 z-40" onClick={() => setExpandedCaseId(null)} aria-hidden="true" />}

        {/* Detail panel */}
        {expandedCaseId && (() => {
          const case_ = paginatedCases.find((c: Case) => c.id === expandedCaseId);
          if (!case_) return null;
          return (
            <div className="fixed inset-0 z-50 sm:inset-y-0 sm:right-0 sm:left-auto sm:top-0 sm:bottom-0 w-full sm:w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Case Details</h2>
                <button onClick={() => setExpandedCaseId(null)} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors" data-testid="button-close-case-panel">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Account Number</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{case_.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Case Name</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{case_.caseName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Organisation</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{case_.organisationName || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400 mb-0.5">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${case_.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>{case_.status}</span>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5">Stage</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{case_.stage}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5">Outstanding</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">£{case_.outstandingAmount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5">Original</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">£{case_.originalAmount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5">Archived</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{case_.isArchived ? 'Yes' : 'No'}</p>
                  </div>
                  {restrictionCounts[case_.id] > 0 && (
                    <div>
                      <p className="text-gray-400 mb-0.5">Restricted</p>
                      <p className="font-medium text-red-600 dark:text-red-400">{restrictionCounts[case_.id]} user{restrictionCounts[case_.id] !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-4 py-3 flex flex-col gap-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Actions</p>
                {case_.isArchived ? (
                  <button
                    onClick={() => { unarchiveCaseMutation.mutate(case_.id); setExpandedCaseId(null); }}
                    disabled={unarchiveCaseMutation.isPending}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left disabled:opacity-50"
                    data-testid="button-unarchive-case"
                  >
                    <ArchiveRestore className="h-4 w-4" /> Unarchive case
                  </button>
                ) : (
                  <button
                    onClick={() => { setArchiveConfirmCase(case_); }}
                    disabled={archiveCaseMutation.isPending}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left disabled:opacity-50"
                    data-testid="button-archive-case"
                  >
                    <Archive className="h-4 w-4" /> Archive case
                  </button>
                )}
                <button
                  onClick={() => { setRestrictAccessCase(case_); setBlockedUserIds([]); }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  data-testid="button-restrict-case"
                >
                  <EyeOff className="h-4 w-4" /> Manage access restrictions
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => setDeleteConfirmCase(case_)}
                    disabled={deleteCaseMutation.isPending}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left disabled:opacity-50"
                    data-testid="button-delete-case"
                  >
                    <Trash2 className="h-4 w-4" /> Delete case
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

            {/* Pagination */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={(page) => {
          setCurrentPage(page);
          requestAnimationFrame(() => {
            casesTableTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }} 
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmCase} onOpenChange={() => setDeleteConfirmCase(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Permanent Deletion Warning
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p className="font-medium">
                Are you sure you want to permanently delete case "{deleteConfirmCase?.caseName}"?
              </p>
              <div className="bg-red-50 p-3 rounded-md border border-red-200">
                <p className="text-sm text-red-800 font-medium">⚠️ This action cannot be undone!</p>
                <p className="text-sm text-red-700 mt-1">
                  This will permanently remove:
                </p>
                <ul className="text-sm text-red-700 mt-1 list-disc list-inside space-y-1">
                  <li>The case and all its details</li>
                  <li>All messages related to this case</li>
                  <li>All documents attached to this case</li>
                  <li>All payment records for this case</li>
                  <li>All activity history for this case</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Consider archiving the case instead if you want to hide it while preserving the data.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmCase(null)}
              disabled={deleteCaseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmCase) {
                  deleteCaseMutation.mutate(deleteConfirmCase.id);
                  setDeleteConfirmCase(null);
                }
              }}
              disabled={deleteCaseMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCaseMutation.isPending ? "Deleting..." : "Permanently Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={!!archiveConfirmCase} onOpenChange={() => setArchiveConfirmCase(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Archive className="h-5 w-5" />
              Archive Case
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p className="font-medium">
                Are you sure you want to archive case "{archiveConfirmCase?.caseName}"?
              </p>
              <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
                <p className="text-sm text-orange-800 font-medium">📦 Archiving will:</p>
                <ul className="text-sm text-orange-700 mt-1 list-disc list-inside space-y-1">
                  <li>Hide the case from normal operations</li>
                  <li>Preserve all data (messages, documents, payments)</li>
                  <li>Allow you to restore it later if needed</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                This is a safe operation that can be reversed by unarchiving the case.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setArchiveConfirmCase(null)}
              disabled={archiveCaseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (archiveConfirmCase) {
                  archiveCaseMutation.mutate(archiveConfirmCase.id);
                  setArchiveConfirmCase(null);
                }
              }}
              disabled={archiveCaseMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {archiveCaseMutation.isPending ? "Archiving..." : "Archive Case"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Case Dialog */}
      <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Submit New Case
            </DialogTitle>
            <DialogDescription>
              Create a new case that can be exported to CSV for upload to your external case management system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                value={newCaseForm.accountNumber}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, accountNumber: e.target.value })}
                placeholder="e.g., ACC-001"
              />
            </div>
            <div>
              <Label htmlFor="caseName">Case Name *</Label>
              <Input
                id="caseName"
                value={newCaseForm.caseName}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, caseName: e.target.value })}
                placeholder="e.g., John Smith vs ABC Ltd"
              />
            </div>
            <div>
              <Label htmlFor="debtorEmail">Debtor Email</Label>
              <Input
                id="debtorEmail"
                type="email"
                value={newCaseForm.debtorEmail}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, debtorEmail: e.target.value })}
                placeholder="debtor@example.com"
              />
            </div>
            <div>
              <Label htmlFor="debtorPhone">Debtor Phone</Label>
              <Input
                id="debtorPhone"
                value={newCaseForm.debtorPhone}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, debtorPhone: e.target.value })}
                placeholder="+44 20 1234 5678"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="debtorAddress">Debtor Address</Label>
              <Input
                id="debtorAddress"
                value={newCaseForm.debtorAddress}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, debtorAddress: e.target.value })}
                placeholder="Full address"
              />
            </div>
            <div>
              <Label htmlFor="debtorType">Debtor Type</Label>
              <Select value={newCaseForm.debtorType} onValueChange={(value) => setNewCaseForm({ ...newCaseForm, debtorType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="organisationId">Organisation *</Label>
              <Select value={newCaseForm.organisationId} onValueChange={(value) => setNewCaseForm({ ...newCaseForm, organisationId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organisation" />
                </SelectTrigger>
                <SelectContent>
                  {organisations.map((org: Organisation) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="originalAmount">Original Amount (£)</Label>
              <Input
                id="originalAmount"
                type="number"
                step="0.01"
                value={newCaseForm.originalAmount}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, originalAmount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="outstandingAmount">Outstanding Amount (£)</Label>
              <Input
                id="outstandingAmount"
                type="number"
                step="0.01"
                value={newCaseForm.outstandingAmount}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, outstandingAmount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newCaseForm.status} onValueChange={(value) => setNewCaseForm({ ...newCaseForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="stage">Stage</Label>
              <Select value={newCaseForm.stage} onValueChange={(value) => setNewCaseForm({ ...newCaseForm, stage: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="initial_contact">Initial Contact</SelectItem>
                  <SelectItem value="investigation">Investigation</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="legal_action">Legal Action</SelectItem>
                  <SelectItem value="recovery">Recovery</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="externalRef">External Reference</Label>
              <Input
                id="externalRef"
                value={newCaseForm.externalRef}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, externalRef: e.target.value })}
                placeholder="Leave blank for auto-generation"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowNewCaseDialog(false)} disabled={createCaseMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmitNewCase} disabled={createCaseMutation.isPending}>
              {createCaseMutation.isPending ? "Creating..." : "Create Case"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restrict Access Dialog */}
      <Dialog open={!!restrictAccessCase} onOpenChange={() => { setRestrictAccessCase(null); setBlockedUserIds([]); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EyeOff className="h-5 w-5" />
              Restrict Case Access
            </DialogTitle>
            <DialogDescription>
              Hide this case from specific users in the organisation. Blocked users will not see this case in their case list.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium mb-2">Case: {restrictAccessCase?.caseName}</p>
            <p className="text-xs text-gray-500 mb-4">Organisation: {restrictAccessCase?.organisationName}</p>
            
            {orgUsers.length === 0 ? (
              <p className="text-sm text-gray-500">No users found for this organisation.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <p className="text-sm text-gray-600 mb-2">Select users to hide this case from:</p>
                {orgUsers.filter((u: any) => !u.isAdmin).map((user: any) => (
                  <div key={user.id} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50">
                    <Checkbox
                      id={`block-${user.id}`}
                      checked={blockedUserIds.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setBlockedUserIds([...blockedUserIds, user.id]);
                        } else {
                          setBlockedUserIds(blockedUserIds.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <label htmlFor={`block-${user.id}`} className="flex-1 cursor-pointer">
                      <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            {blockedUserIds.length > 0 && (
              <p className="text-sm text-amber-600 mt-3">
                {blockedUserIds.length} user{blockedUserIds.length > 1 ? 's' : ''} will be blocked from viewing this case.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setRestrictAccessCase(null); setBlockedUserIds([]); }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (restrictAccessCase) {
                  updateAccessRestrictionsMutation.mutate({ 
                    caseId: restrictAccessCase.id, 
                    blockedUserIds 
                  });
                }
              }}
              disabled={updateAccessRestrictionsMutation.isPending}
            >
              {updateAccessRestrictionsMutation.isPending ? "Saving..." : "Save Restrictions"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CaseSubmissionsTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<CaseSubmission | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const submissionsTableTopRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Fetch case submissions
  const { data: submissions = [], isLoading, error } = useQuery({
    queryKey: selectedStatus === "all" ? ["/api/admin/case-submissions"] : ["/api/admin/case-submissions", selectedStatus],
    queryFn: async () => {
      const endpoint = selectedStatus === "all" 
        ? "/api/admin/case-submissions" 
        : `/api/admin/case-submissions/${selectedStatus}`;
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    retry: false,
  });

  // Update submission status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/case-submissions/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Submission status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/case-submissions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update submission status",
        variant: "destructive",
      });
    },
  });

  // Delete submission mutation
  const deleteSubmissionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/case-submissions/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Submission deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/case-submissions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete submission",
        variant: "destructive",
      });
    },
  });

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedSubmissions(new Set(submissions.map((s: CaseSubmission) => s.id)));
    } else {
      setSelectedSubmissions(new Set());
    }
  };

  // Handle individual row selection
  const handleRowSelect = (submissionId: number, checked: boolean) => {
    const newSelected = new Set(selectedSubmissions);
    if (checked) {
      newSelected.add(submissionId);
    } else {
      newSelected.delete(submissionId);
    }
    setSelectedSubmissions(newSelected);
    setSelectAll(newSelected.size === submissions.length);
  };

  // CSV Export functionality for submissions
  const exportSubmissionsToCSV = () => {
    const submissionsToExport = selectedSubmissions.size > 0 
      ? submissions.filter((s: CaseSubmission) => selectedSubmissions.has(s.id))
      : submissions;

    if (!submissionsToExport || submissionsToExport.length === 0) {
      toast({
        title: "No Data",
        description: selectedSubmissions.size > 0 
          ? "No case submissions selected for export." 
          : "No case submissions available to export.",
        variant: "destructive",
      });
      return;
    }

    // Define comprehensive CSV headers to capture all form data
    const headers = [
      'Submission ID',
      'Case Name',
      'Client Name',
      'Client Email', 
      'Client Phone',
      'Debtor Type',
      'Individual Type',
      'Trading Name',
      'Organisation Name',
      'Organisation Trading Name',
      'Company Number',
      'Principal Salutation',
      'Principal First Name',
      'Principal Last Name',
      'Address Line 1',
      'Address Line 2',
      'City',
      'County',
      'Postcode',
      'Main Phone',
      'Alt Phone',
      'Main Email',
      'Alt Email',
      'Debt Details',
      'Total Debt Amount',
      'Currency',
      'Payment Terms Type',
      'Payment Terms Days',
      'Payment Terms Other',
      'Single Invoice',
      'First Overdue Date',
      'Last Overdue Date',
      'Additional Info',
      'Organisation ID',
      'Status',
      'Submitted By',
      'Submitted Date',
      'Processed By',
      'Processed Date'
    ];

    // Convert submissions to CSV rows using actual database fields
    const csvRows = [
      headers.join(','), // Header row
      ...submissionsToExport.map((submission: CaseSubmission) => {
        return [
          `"${submission.id || ''}"`,
          `"${submission.caseName || ''}"`,
          `"${submission.clientName || ''}"`,
          `"${submission.clientEmail || ''}"`,
          `"${submission.clientPhone || ''}"`,
          `"${submission.debtorType || ''}"`,
          `"${submission.individualType || ''}"`,
          `"${submission.tradingName || ''}"`,
          `"${submission.organisationName || ''}"`,
          `"${submission.organisationTradingName || ''}"`,
          `"${submission.companyNumber || ''}"`,
          `"${submission.principalSalutation || ''}"`,
          `"${submission.principalFirstName || ''}"`,
          `"${submission.principalLastName || ''}"`,
          `"${submission.addressLine1 || ''}"`,
          `"${submission.addressLine2 || ''}"`,
          `"${submission.city || ''}"`,
          `"${submission.county || ''}"`,
          `"${submission.postcode || ''}"`,
          `"${submission.mainPhone || ''}"`,
          `"${submission.altPhone || ''}"`,
          `"${submission.mainEmail || ''}"`,
          `"${submission.altEmail || ''}"`,
          `"${submission.debtDetails || ''}"`,
          `"${submission.totalDebtAmount || ''}"`,
          `"${submission.currency || 'GBP'}"`,
          `"${submission.paymentTermsType || ''}"`,
          `"${submission.paymentTermsDays || ''}"`,
          `"${submission.paymentTermsOther || ''}"`,
          `"${submission.singleInvoice || ''}"`,
          `"${submission.firstOverdueDate || ''}"`,
          `"${submission.lastOverdueDate || ''}"`,
          `"${submission.additionalInfo || ''}"`,
          `"${submission.organisationId || ''}"`,
          `"${submission.status || ''}"`,
          `"${submission.submittedBy || ''}"`,
          `"${submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('en-GB') : ''}"`,
          `"${submission.processedBy || ''}"`,
          `"${submission.processedAt ? new Date(submission.processedAt).toLocaleDateString('en-GB') : ''}"`
        ].join(',');
      })
    ];

    // Create and download CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `case-submissions-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: `Successfully exported ${submissionsToExport.length} case submission${submissionsToExport.length === 1 ? '' : 's'} to CSV.`,
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  // Pagination logic for submissions
  const totalPages = Math.ceil((submissions?.length || 0) / pageSize);
  const paginatedSubmissions = submissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) return <div>Loading case submissions...</div>;
  if (error) return <div>Error loading case submissions</div>;

  return (
    <div className="space-y-4">
      {/* Header with filters and export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Submissions</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
          <Badge variant="outline" className="text-sm">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </Badge>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300"
              />
              Select all
            </label>
            {selectedSubmissions.size > 0 && (
              <>
                <Badge variant="secondary" className="text-sm">
                  {selectedSubmissions.size} selected
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setSelectedSubmissions(new Set()); setSelectAll(false); }}
                  className="text-xs"
                >
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>
        <Button 
          onClick={exportSubmissionsToCSV} 
          variant="outline" 
          size="sm"
          title={selectedSubmissions.size > 0 
            ? `Export ${selectedSubmissions.size} selected submissions to CSV`
            : 'Export all submissions to CSV file'
          }
        >
          <Download className="h-4 w-4 mr-2" />
          {selectedSubmissions.size > 0 
            ? `Export Selected (${selectedSubmissions.size})`
            : 'Export All'
          }
        </Button>
      </div>

      {/* Scroll anchor for pagination */}
      <div ref={submissionsTableTopRef} className="scroll-mt-4" />

      {/* Submissions Card Grid */}
      {paginatedSubmissions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No case submissions found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filter</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedSubmissions.map((submission: CaseSubmission) => {
            const debtorName = submission.debtorType === 'organisation'
              ? (submission.organisationName || submission.organisationTradingName || 'Unnamed Organisation')
              : ([submission.principalSalutation, submission.principalFirstName, submission.principalLastName].filter(Boolean).join(' ') || submission.tradingName || 'Unnamed Individual');
            const isSelected = selectedSubmissions.has(submission.id);
            return (
              <div
                key={submission.id}
                data-testid={`card-submission-${submission.id}`}
                className={`relative rounded-xl border bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col overflow-hidden ${isSelected ? 'ring-2 ring-acclaim-teal border-acclaim-teal/40' : 'border-gray-200 dark:border-gray-700'}`}
              >
                {/* Checkbox — top-left corner */}
                <div className="absolute top-3.5 left-3.5 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => { e.stopPropagation(); handleRowSelect(submission.id, e.target.checked); }}
                    className="rounded border-gray-300 cursor-pointer"
                    title="Select for export"
                  />
                </div>

                {/* Main body — clickable to open details */}
                <button
                  className="flex-1 text-left px-4 pt-3 pb-3 pl-9 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-acclaim-teal/30"
                  onClick={() => { setSelectedSubmission(submission); setShowDetailsDialog(true); }}
                >
                  {/* Case name + status badge */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug truncate flex-1 min-w-0">{submission.caseName}</p>
                    <Badge className={`${getStatusBadgeColor(submission.status)} shrink-0 text-xs capitalize`}>{submission.status}</Badge>
                  </div>

                  {/* Debtor name */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate mb-0.5">{debtorName}</p>

                  {/* Org + date */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-3">
                    {submission.clientOrganisationName || 'Unknown organisation'} · {new Date(submission.submittedAt).toLocaleDateString('en-GB')}
                  </p>

                  {/* Chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {submission.totalDebtAmount != null && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                        <Banknote className="h-3 w-3 text-acclaim-teal" />
                        {new Intl.NumberFormat('en-GB', { style: 'currency', currency: submission.currency || 'GBP', maximumFractionDigits: 0 }).format(Number(submission.totalDebtAmount))}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded-full">
                      {submission.debtorType === 'organisation' ? <Building className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {submission.debtorType === 'organisation' ? 'Organisation' : 'Individual'}
                    </span>
                  </div>
                </button>

                {/* Footer strip — doc count + actions */}
                <div className="flex items-center justify-between gap-1 px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30">
                  <DocumentsCell submissionId={submission.id} />
                  <div className="flex items-center gap-0.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setSelectedSubmission(submission); setShowDetailsDialog(true); }}
                      className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="View full details"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                    {submission.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: submission.id, status: 'processed' }); }}
                          disabled={updateStatusMutation.isPending}
                          className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          title="Mark as processed"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: submission.id, status: 'rejected' }); }}
                          disabled={updateStatusMutation.isPending}
                          className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          title="Reject submission"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {isSuperAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this submission?')) {
                            deleteSubmissionMutation.mutate(submission.id);
                          }
                        }}
                        disabled={deleteSubmissionMutation.isPending}
                        className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete submission permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={(page) => {
          setCurrentPage(page);
          requestAnimationFrame(() => {
            submissionsTableTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }} 
      />

      {/* Comprehensive Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Case Submission Details
            </DialogTitle>
            <DialogDescription>
              Complete information from the comprehensive case submission form
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-5">

              {/* ── 1. Overview ── */}
              <Card className="overflow-hidden">
                <div className="h-1 w-full bg-acclaim-teal" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{selectedSubmission.caseName}</CardTitle>
                      <CardDescription className="mt-1">
                        {selectedSubmission.clientOrganisationName} · Submitted {new Date(selectedSubmission.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusBadgeColor(selectedSubmission.status)} shrink-0 text-xs py-1 px-2 capitalize`}>
                      {selectedSubmission.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted By</p>
                      <p className="text-sm text-gray-900">{selectedSubmission.submittedByName || selectedSubmission.submittedBy}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Client Name</p>
                      <p className="text-sm text-gray-900">{selectedSubmission.clientName}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Client Email</p>
                      <p className="text-sm text-gray-900 break-all">{selectedSubmission.clientEmail}</p>
                    </div>
                    {selectedSubmission.clientPhone && (
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Client Phone</p>
                        <p className="text-sm text-gray-900">{selectedSubmission.clientPhone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ── 2. Debtor Details ── */}
              <Card className="overflow-hidden">
                <div className="h-1 w-full bg-acclaim-teal" />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {selectedSubmission.debtorType === 'organisation'
                      ? <Building className="h-4 w-4 text-acclaim-teal" />
                      : <User className="h-4 w-4 text-acclaim-teal" />}
                    Debtor Details
                  </CardTitle>
                  <CardDescription>
                    {selectedSubmission.debtorType === 'organisation' ? 'Organisation / Limited company' : 'Individual / Sole Trader'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">

                  {/* Organisation-specific fields */}
                  {selectedSubmission.debtorType === 'organisation' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {selectedSubmission.organisationName && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Organisation Name</p>
                          <p className="text-sm text-gray-900">{selectedSubmission.organisationName}</p>
                        </div>
                      )}
                      {selectedSubmission.organisationTradingName && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trading Name</p>
                          <p className="text-sm text-gray-900">{selectedSubmission.organisationTradingName}</p>
                        </div>
                      )}
                      {selectedSubmission.companyNumber && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Company Number</p>
                          <p className="text-sm text-gray-900">{selectedSubmission.companyNumber}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Individual-specific fields */}
                  {selectedSubmission.debtorType === 'individual' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</p>
                        <p className="text-sm text-gray-900">
                          {selectedSubmission.individualType === 'business' ? 'Sole Trader / Business' : 'Individual'}
                        </p>
                      </div>
                      {(selectedSubmission.principalFirstName || selectedSubmission.principalLastName) && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</p>
                          <p className="text-sm text-gray-900">
                            {[selectedSubmission.principalSalutation, selectedSubmission.principalFirstName, selectedSubmission.principalLastName].filter(Boolean).join(' ')}
                          </p>
                        </div>
                      )}
                      {selectedSubmission.tradingName && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trading Name</p>
                          <p className="text-sm text-gray-900">{selectedSubmission.tradingName}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Address — always shown */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />Address
                    </p>
                    <div className="text-sm text-gray-900 space-y-0.5">
                      <p>{selectedSubmission.addressLine1 || <span className="text-gray-400 italic">No address provided</span>}</p>
                      {selectedSubmission.addressLine2 && <p>{selectedSubmission.addressLine2}</p>}
                      <p>{[selectedSubmission.city, selectedSubmission.county, selectedSubmission.postcode].filter(Boolean).join(', ') || <span className="text-gray-400 italic">—</span>}</p>
                    </div>
                  </div>

                  {/* Contact — always shown */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />Contact Details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Main Telephone</p>
                        <p className="text-sm text-gray-900">{selectedSubmission.mainPhone || <span className="text-gray-400 italic">Not provided</span>}</p>
                      </div>
                      {selectedSubmission.altPhone && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Alternative Telephone</p>
                          <p className="text-sm text-gray-900">{selectedSubmission.altPhone}</p>
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Main Email</p>
                        <p className="text-sm text-gray-900 break-all">{selectedSubmission.mainEmail || <span className="text-gray-400 italic">Not provided</span>}</p>
                      </div>
                      {selectedSubmission.altEmail && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Alternative Email</p>
                          <p className="text-sm text-gray-900 break-all">{selectedSubmission.altEmail}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── 3. Debt & Payment Details ── */}
              <Card className="overflow-hidden">
                <div className="h-1 w-full bg-acclaim-teal" />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Banknote className="h-4 w-4 text-acclaim-teal" />
                    Debt & Payment Details
                  </CardTitle>
                  <CardDescription>Outstanding debt information and payment terms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">

                  {/* Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-0.5 sm:col-span-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Debt Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedSubmission.totalDebtAmount != null
                          ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: selectedSubmission.currency || 'GBP' }).format(Number(selectedSubmission.totalDebtAmount))
                          : '—'}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Currency</p>
                      <p className="text-sm text-gray-900">{selectedSubmission.currency || 'GBP'}</p>
                    </div>
                  </div>

                  {/* Debt details */}
                  {selectedSubmission.debtDetails && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Debt Details</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-md p-3 border">{selectedSubmission.debtDetails}</p>
                    </div>
                  )}

                  {/* Payment terms */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5" />Payment Terms
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Terms Type</p>
                        <p className="text-sm text-gray-900">
                          {selectedSubmission.paymentTermsType === 'days_from_invoice' ? 'Days from invoice date'
                            : selectedSubmission.paymentTermsType === 'days_from_month_end' ? 'Days from end of month'
                            : selectedSubmission.paymentTermsType === 'other' ? 'Other'
                            : '—'}
                        </p>
                      </div>
                      {selectedSubmission.paymentTermsDays != null && selectedSubmission.paymentTermsType !== 'other' && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Number of Days</p>
                          <p className="text-sm text-gray-900">{selectedSubmission.paymentTermsDays}</p>
                        </div>
                      )}
                      {selectedSubmission.paymentTermsOther && (
                        <div className="space-y-0.5 sm:col-span-2">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Terms Description</p>
                          <p className="text-sm text-gray-900">{selectedSubmission.paymentTermsOther}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoice details */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />Invoice Details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Single Invoice?</p>
                        <p className="text-sm text-gray-900">
                          {selectedSubmission.singleInvoice === 'yes' ? 'Yes — single invoice'
                            : selectedSubmission.singleInvoice === 'no' ? 'No — multiple invoices'
                            : <span className="text-gray-400 italic">Not specified</span>}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {selectedSubmission.singleInvoice === 'no' ? 'First Overdue Date' : 'Overdue Date'}
                        </p>
                        <p className="text-sm text-gray-900">
                          {selectedSubmission.firstOverdueDate
                            ? selectedSubmission.firstOverdueDate.split('-').reverse().join('/')
                            : <span className="text-gray-400 italic">Not provided</span>}
                        </p>
                      </div>
                      {selectedSubmission.singleInvoice === 'no' && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Overdue Date</p>
                          <p className="text-sm text-gray-900">
                            {selectedSubmission.lastOverdueDate
                              ? selectedSubmission.lastOverdueDate.split('-').reverse().join('/')
                              : <span className="text-gray-400 italic">Not provided</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional info */}
                  {selectedSubmission.additionalInfo && (
                    <div className="border-t pt-4 space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Additional Information</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-md p-3 border">{selectedSubmission.additionalInfo}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── 4. Supporting Documents ── */}
              <Card className="overflow-hidden">
                <div className="h-1 w-full bg-acclaim-teal" />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-acclaim-teal" />
                    Supporting Documents
                  </CardTitle>
                  <CardDescription>Files uploaded with this case submission — click View to open in browser or Download to save</CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentsList submissionId={selectedSubmission.id} />
                </CardContent>
              </Card>

              {/* ── 5. Submission meta ── */}
              <div className="rounded-lg border bg-gray-50/60 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Submission ID</p>
                    <p className="font-medium text-gray-900">#{selectedSubmission.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Date Submitted</p>
                    <p className="font-medium text-gray-900">{new Date(selectedSubmission.submittedAt).toLocaleDateString('en-GB')}</p>
                  </div>
                  {selectedSubmission.processedBy && (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Processed By</p>
                        <p className="font-medium text-gray-900">{selectedSubmission.processedBy}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Date Processed</p>
                        <p className="font-medium text-gray-900">{selectedSubmission.processedAt ? new Date(selectedSubmission.processedAt).toLocaleDateString('en-GB') : '—'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── Actions ── */}
              <div className="flex justify-end gap-3 pt-2 border-t">
                {selectedSubmission.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateStatusMutation.mutate({ id: selectedSubmission.id, status: 'processed' });
                        setShowDetailsDialog(false);
                      }}
                      disabled={updateStatusMutation.isPending}
                      className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark as Processed
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateStatusMutation.mutate({ id: selectedSubmission.id, status: 'rejected' });
                        setShowDetailsDialog(false);
                      }}
                      disabled={updateStatusMutation.isPending}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Mark as Rejected
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserAuditRow({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery<{
    accountCreated: string | null;
    firstLogin: string | null;
    lastLogin: string | null;
    totalLogins: number;
  }>({
    queryKey: ['/api/admin/users', userId, 'login-history'],
  });

  const fmt = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <TableRow className="bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/40">
      <TableCell colSpan={10} className="py-4 px-6">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading audit log...</p>
        ) : (
          <div className="flex flex-wrap gap-8 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Account Created</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{fmt(data?.accountCreated) ?? '—'}</p>
              <p className="text-xs text-gray-400 mt-0.5">Added to system by admin</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">First Registered</p>
              <p className={`font-medium ${data?.firstLogin ? 'text-gray-800 dark:text-gray-200' : 'text-amber-600 dark:text-amber-400'}`}>
                {data?.firstLogin ? fmt(data.firstLogin) : 'Not yet logged in'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{data?.firstLogin ? 'First successful SSO login' : 'Awaiting first login'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Last Login</p>
              <p className={`font-medium ${data?.lastLogin ? 'text-gray-800 dark:text-gray-200' : 'text-amber-600 dark:text-amber-400'}`}>
                {data?.lastLogin ? fmt(data.lastLogin) : 'Never'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {(data?.totalLogins ?? 0) > 0 ? `${data!.totalLogins} total login${data!.totalLogins === 1 ? '' : 's'}` : 'No logins recorded'}
              </p>
            </div>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

function MobileUserAuditSection({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery<{
    accountCreated: string | null;
    firstLogin: string | null;
    lastLogin: string | null;
    totalLogins: number;
  }>({
    queryKey: ['/api/admin/users', userId, 'login-history'],
  });

  const fmt = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) return <p className="text-xs text-gray-500">Loading login history...</p>;

  return (
    <div className="grid grid-cols-3 gap-3 text-xs">
      <div>
        <p className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Created</p>
        <p className="font-medium text-gray-800 dark:text-gray-200">{fmt(data?.accountCreated) ?? '—'}</p>
      </div>
      <div>
        <p className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">First Login</p>
        <p className={`font-medium ${data?.firstLogin ? 'text-gray-800 dark:text-gray-200' : 'text-amber-600 dark:text-amber-400'}`}>
          {data?.firstLogin ? fmt(data.firstLogin) : 'Not yet'}
        </p>
      </div>
      <div>
        <p className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Last Login</p>
        <p className={`font-medium ${data?.lastLogin ? 'text-gray-800 dark:text-gray-200' : 'text-amber-600 dark:text-amber-400'}`}>
          {data?.lastLogin ? fmt(data.lastLogin) : 'Never'}
        </p>
        {(data?.totalLogins ?? 0) > 0 && (
          <p className="text-gray-400 mt-0.5">{data!.totalLogins} total</p>
        )}
      </div>
    </div>
  );
}

// Formats a whole-day count into a friendly label, adding an approximate month/year
// figure for longer durations so the headline numbers stay readable.
function formatRecoveryDays(days: number | null | undefined): string {
  if (days === null || days === undefined || isNaN(days)) return "—";
  const rounded = Math.round(days);
  if (rounded < 60) return `${rounded} day${rounded !== 1 ? 's' : ''}`;
  if (rounded < 365) {
    const months = days / 30.44;
    return `${rounded} days (~${months.toFixed(1)} months)`;
  }
  const years = days / 365.25;
  return `${rounded} days (~${years.toFixed(1)} years)`;
}

export default function AdminEnhanced() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  // Check if current user is super admin for destructive operations
  const isSuperAdmin = currentUser?.isSuperAdmin ?? false;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // State for organisation management
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgExternalRef, setNewOrgExternalRef] = useState("");
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showEditOrg, setShowEditOrg] = useState(false);
  const [showAssignUser, setShowAssignUser] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("none");
  const [orgAssignSearch, setOrgAssignSearch] = useState("");
  const [orgAssignPopoverOpen, setOrgAssignPopoverOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organisation | null>(null);
  const [orgFormData, setOrgFormData] = useState<CreateOrganisationForm>({
    name: "",
    externalRef: "",
  });
  
  // Org-level scheduled report state
  const [showOrgScheduleDialog, setShowOrgScheduleDialog] = useState(false);
  const [selectedOrgForSchedule, setSelectedOrgForSchedule] = useState<Organisation | null>(null);
  
  // User audit log expand state
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [expandedOrgId, setExpandedOrgId] = useState<number | null>(null);

  // Scheduled reports overview state
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [orgScheduleForm, setOrgScheduleForm] = useState({
    recipientEmail: '',
    recipientName: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    timeOfDay: 9,
    includeCaseSummary: true,
    includeActivityReport: true,
    caseStatusFilter: 'active' as 'active' | 'all' | 'closed',
    enabled: true,
  });
  
  // State for viewing/managing org scheduled reports
  const [showOrgReportsDialog, setShowOrgReportsDialog] = useState(false);
  const [selectedOrgForReports, setSelectedOrgForReports] = useState<Organisation | null>(null);
  const [editingOrgReport, setEditingOrgReport] = useState<any | null>(null);
  const [showEditOrgReportForm, setShowEditOrgReportForm] = useState(false);
  const [editingFromReportsTab, setEditingFromReportsTab] = useState(false);
  
  // State for viewing report audit logs
  const [showReportAuditDialog, setShowReportAuditDialog] = useState(false);
  const [selectedReportForAudit, setSelectedReportForAudit] = useState<any | null>(null);
  
  // State for closed case management
  const [showClosedCaseManagement, setShowClosedCaseManagement] = useState(false);
  const [showRecoveryPerformance, setShowRecoveryPerformance] = useState(false);

  // State for user management
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<CreateUserForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organisationIds: [],
    isAdmin: false,
    canSubmitCases: false,
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ tempPassword: string; email: string } | null>(null);
  const [sendingWelcomeEmail, setSendingWelcomeEmail] = useState(false);
  const [showConfirmCreateUser, setShowConfirmCreateUser] = useState(false);
  const [orgSearchTerm, setOrgSearchTerm] = useState("");

  // Pagination state
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(DEFAULT_PAGE_SIZE);
  const usersTableTopRef = useRef<HTMLDivElement>(null);
  const [orgsPage, setOrgsPage] = useState(1);
  const [orgsPageSize, setOrgsPageSize] = useState(DEFAULT_PAGE_SIZE);
  const orgsTableTopRef = useRef<HTMLDivElement>(null);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPageSize, setReportsPageSize] = useState(DEFAULT_PAGE_SIZE);
  const reportsTableTopRef = useRef<HTMLDivElement>(null);
  
  // Search filter state
  const [userSearchFilter, setUserSearchFilter] = useState("");
  const [orgSearchFilter, setOrgSearchFilter] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "admin" | "user" | "registered" | "not_registered">("all");

  // Per-user case access restrictions dialog state
  const [manageRestrictionsUser, setManageRestrictionsUser] = useState<User | null>(null);
  const [selectedLiftCaseIds, setSelectedLiftCaseIds] = useState<number[]>([]);
  const [selectedRestoreCaseIds, setSelectedRestoreCaseIds] = useState<number[]>([]);

  // Fetch per-user restrictions (current + previously lifted) for the manage dialog
  type UserRestrictionCase = {
    caseId: number;
    accountNumber: string;
    caseName: string;
    organisationName: string | null;
    liftedAt?: string;
  };
  const { data: userRestrictions, isLoading: userRestrictionsLoading } = useQuery<{
    current: UserRestrictionCase[];
    previouslyLifted: UserRestrictionCase[];
  }>({
    queryKey: ['/api/admin/users', manageRestrictionsUser?.id, 'restrictions'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/users/${manageRestrictionsUser!.id}/restrictions`);
      return await response.json();
    },
    enabled: !!manageRestrictionsUser?.id,
    retry: false,
  });

  const liftRestrictionsMutation = useMutation({
    mutationFn: async ({ userId, caseIds }: { userId: string; caseIds: number[] }) => {
      return await apiRequest('POST', `/api/admin/users/${userId}/restrictions/lift`, { caseIds });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', variables.userId, 'restrictions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases/restriction-counts'] });
      // Refresh the per-case access-restrictions view (Case Management) so it reflects the lift
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases'] });
      setSelectedLiftCaseIds([]);
      toast({
        title: "Restrictions Lifted",
        description: "The selected case restrictions have been lifted for this user.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to lift restrictions.",
        variant: "destructive",
      });
    },
  });

  const restoreRestrictionsMutation = useMutation({
    mutationFn: async ({ userId, caseIds }: { userId: string; caseIds: number[] }) => {
      return await apiRequest('POST', `/api/admin/users/${userId}/restrictions/restore`, { caseIds });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', variables.userId, 'restrictions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases/restriction-counts'] });
      // Refresh the per-case access-restrictions view (Case Management) so it reflects the restore
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases'] });
      setSelectedRestoreCaseIds([]);
      toast({
        title: "Restrictions Restored",
        description: "The selected case restrictions have been re-applied for this user.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore restrictions.",
        variant: "destructive",
      });
    },
  });

  // Scheduled reports configuration dialog state
  const [showScheduledReportDialog, setShowScheduledReportDialog] = useState(false);
  const [scheduledReportUser, setScheduledReportUser] = useState<User | null>(null);
  const [editingReportId, setEditingReportId] = useState<number | null>(null); // null = creating new
  const [scheduledReportOrgId, setScheduledReportOrgId] = useState<number | null>(null); // null = combined report
  const [scheduledReportEnabled, setScheduledReportEnabled] = useState(false);
  const [scheduledReportFrequency, setScheduledReportFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [scheduledReportDayOfWeek, setScheduledReportDayOfWeek] = useState(1);
  const [scheduledReportDayOfMonth, setScheduledReportDayOfMonth] = useState(1);
  const [scheduledReportTimeOfDay, setScheduledReportTimeOfDay] = useState(9);
  const [scheduledReportCaseSummary, setScheduledReportCaseSummary] = useState(true);
  const [scheduledReportActivity, setScheduledReportActivity] = useState(true);
  const [scheduledReportCaseFilter, setScheduledReportCaseFilter] = useState<"active" | "all" | "closed">("active");
  const [showReportEditForm, setShowReportEditForm] = useState(false); // Show add/edit form within dialog


  // Fetch users with their organisations
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["/api/admin/users-with-orgs"],
    retry: false,
  });

  // Fetch organisations
  const { data: organisations = [], isLoading: orgsLoading, error: orgsError } = useQuery<Organisation[]>({
    queryKey: ["/api/admin/organisations"],
    retry: false,
  });

  // Fetch scheduled reports settings for all users
  const { data: scheduledReports = [], isFetching: scheduledReportsFetching } = useQuery<any[]>({
    queryKey: ["/api/admin/scheduled-reports"],
    retry: false,
  });

  // Recovery Performance report filters and data
  const [recoveryOrg, setRecoveryOrg] = useState<string>("all");
  const [recoveryDebtorType, setRecoveryDebtorType] = useState<string>("all");
  const [recoveryOpenedFrom, setRecoveryOpenedFrom] = useState<string>("");
  const [recoveryOpenedTo, setRecoveryOpenedTo] = useState<string>("");

  const recoveryQueryString = (() => {
    const params = new URLSearchParams();
    if (recoveryOrg && recoveryOrg !== "all") params.set("organisationId", recoveryOrg);
    if (recoveryDebtorType && recoveryDebtorType !== "all") params.set("debtorType", recoveryDebtorType);
    if (recoveryOpenedFrom) params.set("openedFrom", recoveryOpenedFrom);
    if (recoveryOpenedTo) params.set("openedTo", recoveryOpenedTo);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  })();

  const {
    data: recoveryData,
    isFetching: recoveryFetching,
    refetch: refetchRecovery,
  } = useQuery<any>({
    queryKey: ["/api/admin/reports/recovery-performance", recoveryOrg, recoveryDebtorType, recoveryOpenedFrom, recoveryOpenedTo],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/reports/recovery-performance${recoveryQueryString}`);
      return response.json();
    },
    retry: false,
  });

  const recoveryOrgLabel = () => {
    if (!recoveryOrg || recoveryOrg === "all") return "All organisations";
    return (organisations as any[]).find((o: any) => String(o.id) === recoveryOrg)?.name || "Unknown";
  };

  const recoveryFaq: { q: string; a: string[] }[] = [
    {
      q: "Why is the average time to first payment sometimes higher than the average time to conclusion?",
      a: [
        "For any single case the last payment can never come before the first one. The reason the averages can differ is that they are worked out over different groups of cases:",
        "• Time to first payment is averaged across every case that has received a payment, including cases that are still open.",
        "• Time to last payment / conclusion is averaged across only the cases that are now closed.",
        "Cases that close quickly tend to be the straightforward ones, so they pull the conclusion average down. A case that takes a long time to make its first payment but is still open pushes the first-payment average up and is not counted in conclusion at all. So the two figures can move in opposite directions even though nothing is wrong.",
      ],
    },
    {
      q: "What does “time to first payment” mean?",
      a: ["The number of days from when the case was opened to the day the first payment was received. It is averaged across every case that has received at least one payment, whether or not the case is closed."],
    },
    {
      q: "What does “amount-weighted recovery” mean?",
      a: ["It measures how quickly the money comes in, not just the first payment. Each pound recovered is weighted by how long it took to arrive, so a case where most of the debt is paid early scores better than one where most is paid much later. It is the fairest single measure of recovery speed when payments arrive in instalments."],
    },
    {
      q: "What does “time to last payment / conclusion” mean?",
      a: [
        "For cases that are now closed, it is the number of days from when the case was opened to the last payment received. A debt settled for less than the full amount counts the same as one paid in full — what matters is when the money finished coming in.",
        "Only closed cases that received at least one payment are counted, so this figure is usually based on fewer cases than the others. Closed cases with no payment show “No recovery” and are not part of the average.",
      ],
    },
    {
      q: "What do “Open” and “No recovery” mean in the conclusion column?",
      a: [
        "• Open — the case has not been closed yet, so there is no conclusion time to measure. These cases are left out of the conclusion average.",
        "• No recovery — the case is closed but never received any payment, so there is no recovery time to show.",
      ],
    },
    {
      q: "What do the “Est.” and “No start date” labels mean?",
      a: [
        "• Est. — the case had no recorded opening entry, so the date it was added to the portal was used as the start date instead. The timing is an estimate but is still included in the averages.",
        "• No start date — the recorded opening date falls after the first payment (usually older cases brought across from the previous system). Recovery time can’t be measured reliably, so these cases are left out of the averages.",
      ],
    },
    {
      q: "When does a case count as concluded?",
      a: ["As soon as the case is marked closed in the system, whether it was paid in full, settled for less, or aborted. If a matter has finished but is still showing as live, it won’t appear in the conclusion figures until its status is set to closed."],
    },
  ];

  const handleExportRecoveryExcel = async () => {
    if (!recoveryData || recoveryData.summary?.totalCases === 0) {
      toast({ title: "No data", description: "No cases available to export.", variant: "destructive" });
      return;
    }
    try {
      const { summary, cases } = recoveryData;
      const workbook = new ExcelJS.Workbook();
      const styleHeader = (sheet: ExcelJS.Worksheet) => {
        sheet.getRow(1).eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.alignment = { horizontal: "center" };
        });
      };
      const fmt = (m: any) => `${formatRecoveryDays(m?.mean)} (median ${formatRecoveryDays(m?.median)}, ${m?.count ?? 0} measured)`;
      const safeCell = (v: any) => {
        const s = String(v ?? "");
        return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
      };

      const summarySheet = workbook.addWorksheet("Summary");
      summarySheet.columns = [
        { header: "Metric", key: "metric", width: 40 },
        { header: "Value", key: "value", width: 40 },
      ];
      styleHeader(summarySheet);
      [
        { metric: "Generated on", value: new Date().toLocaleDateString("en-GB") },
        { metric: "Organisation", value: safeCell(recoveryOrgLabel()) },
        { metric: "Cases in scope", value: summary.totalCases },
        { metric: "With payments", value: summary.casesWithPayments },
        { metric: "No payments yet", value: summary.casesNoPayments },
        { metric: "Concluded (closed) cases", value: summary.concludedCases },
        { metric: "Estimated start date", value: summary.fallbackStartUsed },
        { metric: "Excluded (no usable start date)", value: summary.unreliableStartCases },
        { metric: "Amount-weighted time to recovery", value: fmt(summary.weightedRecovery) },
        { metric: "Time to first payment", value: fmt(summary.timeToFirstPayment) },
        { metric: "Time to last payment / conclusion", value: fmt(summary.timeToConclusion) },
      ].forEach((r) => summarySheet.addRow(r));

      const sheet = workbook.addWorksheet("Case Details");
      sheet.columns = [
        { header: "Account Number", key: "accountNumber", width: 16 },
        { header: "Case Name", key: "caseName", width: 28 },
        { header: "Organisation", key: "organisationName", width: 24 },
        { header: "Opened", key: "openDate", width: 14 },
        { header: "Start date note", key: "startNote", width: 16 },
        { header: "To first payment", key: "ttf", width: 22 },
        { header: "Weighted recovery", key: "weighted", width: 22 },
        { header: "To last payment / conclusion", key: "ttc", width: 30 },
      ];
      styleHeader(sheet);
      (cases as any[]).forEach((row: any) => {
        const startNote = row.unreliableStart ? "No start date" : row.usedFallbackStart ? "Est." : "";
        const ttc = row.concluded
          ? (row.timeToConclusionDays != null ? formatRecoveryDays(row.timeToConclusionDays) : "No recovery")
          : "Open";
        sheet.addRow({
          accountNumber: safeCell(row.accountNumber),
          caseName: safeCell(row.caseName),
          organisationName: safeCell(row.organisationName || "—"),
          openDate: new Date(row.openDate).toLocaleDateString("en-GB"),
          startNote,
          ttf: formatRecoveryDays(row.timeToFirstPaymentDays),
          weighted: formatRecoveryDays(row.weightedRecoveryDays),
          ttc,
        });
      });
      sheet.autoFilter = { from: "A1", to: "H1" };

      // Guidance / FAQ sheet
      const faqSheet = workbook.addWorksheet("Guidance (FAQ)");
      faqSheet.columns = [{ header: "Frequently asked questions", key: "text", width: 120 }];
      styleHeader(faqSheet);
      recoveryFaq.forEach((item) => {
        const qRow = faqSheet.addRow({ text: safeCell(item.q) });
        qRow.font = { bold: true };
        qRow.alignment = { wrapText: true, vertical: "top" };
        item.a.forEach((line) => {
          const aRow = faqSheet.addRow({ text: safeCell(line) });
          aRow.alignment = { wrapText: true, vertical: "top" };
        });
        faqSheet.addRow({ text: "" });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recovery-performance-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Excel exported", description: "The recovery performance report has been downloaded." });
    } catch (error) {
      console.error("Error exporting recovery Excel:", error);
      toast({ title: "Export failed", description: "Could not generate the Excel file.", variant: "destructive" });
    }
  };

  const handleExportRecoveryHtml = () => {
    if (!recoveryData || recoveryData.summary?.totalCases === 0) {
      toast({ title: "No data", description: "No cases available to export.", variant: "destructive" });
      return;
    }
    try {
      const { summary, cases } = recoveryData;
      const win = window.open("", "_blank");
      if (!win) throw new Error("Could not open window");
      const esc = (s: any) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
      const generatedOn = new Date().toLocaleDateString("en-GB");
      const metricCard = (label: string, m: any) => `
        <div class="metric-card">
          <div class="metric-label">${label}</div>
          <div class="metric-value">${formatRecoveryDays(m?.mean)}</div>
          <div class="metric-sub">Median ${formatRecoveryDays(m?.median)} · ${m?.count ?? 0} measured</div>
        </div>`;
      const rowsHtml = (cases as any[]).map((row: any) => {
        const note = row.unreliableStart
          ? '<span class="badge badge-amber">No start date</span>'
          : row.usedFallbackStart ? '<span class="badge">Est.</span>' : "";
        const ttc = row.concluded
          ? (row.timeToConclusionDays != null ? formatRecoveryDays(row.timeToConclusionDays) : "No recovery")
          : "Open";
        return `<tr>
          <td>${esc(row.caseName)}<div class="muted">${esc(row.accountNumber)}</div></td>
          <td>${esc(row.organisationName || "—")}</td>
          <td>${new Date(row.openDate).toLocaleDateString("en-GB")} ${note}</td>
          <td class="right">${formatRecoveryDays(row.timeToFirstPaymentDays)}</td>
          <td class="right">${formatRecoveryDays(row.weightedRecoveryDays)}</td>
          <td class="right">${ttc}</td>
        </tr>`;
      }).join("");
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
        <title>Recovery Performance Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
          .header { text-align: center; margin-bottom: 24px; }
          .header h1 { margin: 0; font-size: 24px; color: #0f766e; }
          .header p { margin: 4px 0; color: #6b7280; font-size: 13px; }
          .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
          .metric-card { padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .metric-label { font-size: 13px; color: #6b7280; margin-bottom: 6px; }
          .metric-value { font-size: 22px; font-weight: bold; color: #0f766e; }
          .metric-sub { font-size: 11px; color: #6b7280; margin-top: 4px; }
          .stats { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
          .stat { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; min-width: 120px; }
          .stat .n { font-size: 18px; font-weight: 600; }
          .stat .l { font-size: 11px; color: #6b7280; }
          .note { font-size: 12px; color: #6b7280; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { padding: 8px; border: 1px solid #e5e7eb; font-size: 12px; text-align: left; vertical-align: top; }
          th { background: #f0fdfa; color: #0f766e; }
          td.right, th.right { text-align: right; white-space: nowrap; }
          .muted { font-size: 10px; color: #9ca3af; }
          .badge { display: inline-block; font-size: 10px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 0 4px; margin-left: 4px; }
          .badge-amber { border-color: #f59e0b; color: #b45309; }
          .faq-h { font-size: 16px; color: #0f766e; margin: 28px 0 12px; }
          .faq-item { margin-bottom: 14px; }
          .faq-q { font-size: 13px; font-weight: bold; color: #1f2937; margin-bottom: 4px; }
          .faq-a { font-size: 12px; color: #4b5563; margin: 2px 0; }
          @media print { body { margin: 0; } .no-print { display: none; } }
        </style></head><body>
        <div class="header">
          <h1>Recovery Performance Report</h1>
          <p>Generated on ${generatedOn} · ${esc(recoveryOrgLabel())}</p>
        </div>
        <div class="metrics-grid">
          ${metricCard("Amount-weighted time to recovery", summary.weightedRecovery)}
          ${metricCard("Time to first payment", summary.timeToFirstPayment)}
          ${metricCard("Time to last payment / conclusion", summary.timeToConclusion)}
        </div>
        <div class="stats">
          <div class="stat"><div class="n">${summary.totalCases}</div><div class="l">Cases in scope</div></div>
          <div class="stat"><div class="n">${summary.casesWithPayments}</div><div class="l">With payments</div></div>
          <div class="stat"><div class="n">${summary.casesNoPayments}</div><div class="l">No payments yet</div></div>
          <div class="stat"><div class="n">${summary.concludedCases}</div><div class="l">Concluded (closed)</div></div>
          <div class="stat"><div class="n">${summary.fallbackStartUsed}</div><div class="l">Estimated start date</div></div>
          <div class="stat"><div class="n">${summary.unreliableStartCases}</div><div class="l">Excluded (no start date)</div></div>
        </div>
        <p class="note">“Time to last payment / conclusion” is measured for closed cases only, from the case opening date to the last payment received — so a case settled for less than the full debt counts the same as one paid in full. Closed cases with no payments have no recovery time to show.</p>
        <table>
          <thead><tr>
            <th>Case</th><th>Organisation</th><th>Opened</th>
            <th class="right">To first payment</th><th class="right">Weighted recovery</th><th class="right">To last payment / conclusion</th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <h2 class="faq-h">Guidance — frequently asked questions</h2>
        ${recoveryFaq.map((item) => `
          <div class="faq-item">
            <div class="faq-q">${esc(item.q)}</div>
            ${item.a.map((line) => `<div class="faq-a">${esc(line)}</div>`).join("")}
          </div>`).join("")}
        </body></html>`;
      win.document.write(html);
      win.document.close();
      win.onload = () => win.focus();
      toast({ title: "Report opened", description: "The report opened in a new tab. You can print or save it from there." });
    } catch (error) {
      console.error("Error exporting recovery HTML:", error);
      toast({ title: "Export failed", description: "Could not open the report.", variant: "destructive" });
    }
  };

  // Create a map of userId -> array of scheduled report settings for quick lookup
  const scheduledReportsMap = scheduledReports.reduce((acc: Record<string, any[]>, report: any) => {
    if (!acc[report.userId]) {
      acc[report.userId] = [];
    }
    acc[report.userId].push(report);
    return acc;
  }, {} as Record<string, any[]>);

  // Create a map of orgId -> array of scheduled reports for quick lookup
  const orgScheduledReportsMap = scheduledReports.reduce((acc: Record<number, any[]>, report: any) => {
    if (report.organisationId) {
      if (!acc[report.organisationId]) {
        acc[report.organisationId] = [];
      }
      acc[report.organisationId].push(report);
    }
    return acc;
  }, {} as Record<number, any[]>);

  // Fetch scheduled reports for selected organisation
  const { data: selectedOrgReports = [], isLoading: orgReportsLoading, refetch: refetchOrgReports } = useQuery<any[]>({
    queryKey: ["/api/admin/organisations", selectedOrgForReports?.id, "scheduled-reports"],
    queryFn: async () => {
      if (!selectedOrgForReports?.id) return [];
      const response = await apiRequest("GET", `/api/admin/organisations/${selectedOrgForReports.id}/scheduled-reports`);
      return response.json();
    },
    enabled: !!selectedOrgForReports?.id,
  });

  // Fetch audit logs for selected report
  const { data: reportAuditLogs = [], isLoading: reportAuditLogsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/scheduled-reports", selectedReportForAudit?.id, "audit-logs"],
    queryFn: async () => {
      if (!selectedReportForAudit?.id) return [];
      const response = await apiRequest("GET", `/api/admin/scheduled-reports/${selectedReportForAudit.id}/audit-logs`);
      return response.json();
    },
    enabled: !!selectedReportForAudit?.id && showReportAuditDialog,
  });

  // Create organisation mutation
  const createOrganisationMutation = useMutation({
    mutationFn: async (data: CreateOrganisationForm) => {
      const response = await apiRequest("POST", `/api/admin/organisations`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Organisation created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organisations"] });
      setOrgFormData({ name: "", externalRef: "" });
      setNewOrgName("");
      setNewOrgExternalRef("");
      setShowCreateOrg(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create organisation",
        variant: "destructive",
      });
    },
  });

  // Update organisation mutation
  const updateOrganisationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateOrganisationForm }) => {
      const response = await apiRequest("PUT", `/api/admin/organisations/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Organisation updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organisations"] });
      setOrgFormData({ name: "", externalRef: "" });
      setEditingOrg(null);
      setShowEditOrg(false);
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: "Failed to update organisation",
        variant: "destructive",
      });
    },
  });

  // Delete organisation mutation
  const deleteOrganisationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/organisations/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Organisation deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organisations"] });
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
        description: error.message || "Failed to delete organisation",
        variant: "destructive",
      });
    },
  });

  // Create org-level scheduled report with custom email
  const createOrgScheduledReportMutation = useMutation({
    mutationFn: async (data: {
      organisationId: number;
      recipientEmail: string;
      recipientName: string;
      frequency: string;
      dayOfWeek?: number;
      dayOfMonth?: number;
      timeOfDay: number;
      includeCaseSummary: boolean;
      includeActivityReport: boolean;
      caseStatusFilter: string;
    }) => {
      const response = await apiRequest("POST", `/api/admin/organisations/${data.organisationId}/scheduled-reports`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scheduled report created successfully",
      });
      setShowOrgScheduleDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduled-reports"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create scheduled report",
        variant: "destructive",
      });
    },
  });

  // Create scheduled report mutation
  const createScheduledReportMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/scheduled-reports`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scheduled report created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduled-reports"] });
      setShowReportEditForm(false);
      setEditingReportId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create scheduled report",
        variant: "destructive",
      });
    },
  });

  // Update scheduled report mutation
  const updateScheduledReportMutation = useMutation({
    mutationFn: async ({ reportId, data }: { reportId: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/scheduled-reports/${reportId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scheduled report settings saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduled-reports"] });
      if (selectedOrgForReports?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/organisations", selectedOrgForReports.id, "scheduled-reports"] });
      }
      setShowReportEditForm(false);
      setShowEditOrgReportForm(false);
      setEditingReportId(null);
      setEditingOrgReport(null);
      if (editingFromReportsTab) {
        setShowOrgReportsDialog(false);
        setShowScheduledReportDialog(false);
        setSelectedOrgForReports(null);
        setScheduledReportUser(null);
        setEditingFromReportsTab(false);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save scheduled report settings",
        variant: "destructive",
      });
    },
  });

  // Delete scheduled report mutation
  const deleteScheduledReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/scheduled-reports/${reportId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scheduled report deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduled-reports"] });
      if (selectedOrgForReports?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/organisations", selectedOrgForReports.id, "scheduled-reports"] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete scheduled report",
        variant: "destructive",
      });
    },
  });

  // Send test report mutation
  const sendTestReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await apiRequest("POST", `/api/admin/scheduled-reports/${reportId}/test-send`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Test report sent",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send test report",
        variant: "destructive",
      });
    },
  });

  const { data: inactiveCasesCountData, refetch: refetchInactiveCasesCount } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/reports/inactive-cases/count"],
  });

  const sendInactiveCasesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/reports/inactive-cases");
      return await response.json();
    },
    onSuccess: (data) => {
      refetchInactiveCasesCount();
      toast({
        title: data.sent ? "Report Sent" : "Nothing to Send",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to run the inactive cases report",
        variant: "destructive",
      });
    },
  });

  // Open scheduled report dialog to show user's reports list
  const openScheduledReportDialog = (user: User) => {
    setScheduledReportUser(user);
    setShowReportEditForm(false);
    setEditingReportId(null);
    setShowScheduledReportDialog(true);
  };

  // Open form to create a new report
  const openNewReportForm = () => {
    setEditingReportId(null);
    setScheduledReportOrgId(null);
    setScheduledReportEnabled(true);
    setScheduledReportFrequency("weekly");
    setScheduledReportDayOfWeek(1);
    setScheduledReportDayOfMonth(1);
    setScheduledReportTimeOfDay(9);
    setScheduledReportCaseSummary(true);
    setScheduledReportActivity(true);
    setScheduledReportCaseFilter("active");
    setShowReportEditForm(true);
  };

  // Open form to edit an existing report
  const openEditReportForm = (report: any) => {
    setEditingReportId(report.id);
    setScheduledReportOrgId(report.organisationId || null);
    setScheduledReportEnabled(report.enabled ?? true);
    setScheduledReportFrequency(report.frequency || "weekly");
    setScheduledReportDayOfWeek(report.dayOfWeek ?? 1);
    setScheduledReportDayOfMonth(report.dayOfMonth ?? 1);
    setScheduledReportTimeOfDay(report.timeOfDay ?? 9);
    setScheduledReportCaseSummary(report.includeCaseSummary ?? true);
    setScheduledReportActivity(report.includeActivityReport ?? true);
    setScheduledReportCaseFilter(report.caseStatusFilter || "active");
    setShowReportEditForm(true);
  };

  // Get user's organisations for the report dropdown
  const getUserOrganisations = (user: User): { id: number; name: string }[] => {
    if (!user.organisations) return [];
    return user.organisations.map((uo: any) => ({
      id: uo.organisationId || uo.id,
      name: uo.organisationName || uo.name || `Org ${uo.organisationId || uo.id}`,
    }));
  };

  // Get organisation name from the organisations list
  const getOrgName = (orgId: number): string => {
    const org = organisations.find((o: any) => o.id === orgId);
    return org?.name || `Organisation ${orgId}`;
  };

  // Compact, clickable badge summarising a user's organisation assignments.
  // Clicking it opens the "Manage Organisation Assignments" dialog where
  // owners can be set, organisations removed, or new ones assigned.
  const renderOrgBadge = (user: User) => {
    const orgs = (user as any).organisations || [];
    const legacyCount = user.organisationName ? 1 : 0;
    const count = orgs.length + legacyCount;
    const hasOwner = orgs.some((o: any) => o.role === 'owner');
    return (
      <button
        type="button"
        onClick={() => {
          setSelectedUser(user);
          setSelectedOrgId("none");
          setOrgAssignPopoverOpen(false);
          setShowAssignUser(true);
        }}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-acclaim-teal/10 hover:border-acclaim-teal ${count === 0 ? 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-200'}`}
        title="Manage organisations"
        data-testid={`button-manage-orgs-${user.id}`}
      >
        <Building className="h-3 w-3" />
        {count === 0 ? 'Unassigned' : `${count} ${count === 1 ? 'organisation' : 'organisations'}`}
        {hasOwner && <Crown className="h-3 w-3 text-amber-500" />}
      </button>
    );
  };

  // Assign user to organisation mutation
  const assignUserMutation = useMutation({
    mutationFn: async ({ userId, organisationId }: { userId: string; organisationId: number }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/assign`, { organisationId });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User assigned to organisation successfully",
      });
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-orgs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organisations"] });
      
      // Invalidate user access queries - access may have changed for any user
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      setSelectedUser(null);
      setSelectedOrgId("");
      setShowAssignUser(false);
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
        description: "Failed to assign user to organisation",
        variant: "destructive",
      });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserForm) => {
      const response = await apiRequest("POST", `/api/admin/users`, userData);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Create user response:", data);
      toast({
        title: "Success",
        description: "User created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-orgs"] });
      setUserFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        organisationIds: [],
        isAdmin: false,
        canSubmitCases: false,
      });
      setOrgSearchTerm("");
      setShowCreateUser(false);
      // Handle nested user structure from API: data.user.user.id or data.user.id
      const userId = data.user?.user?.id || data.user?.id || null;
      setCreatedUserId(userId);
      setShowPasswordDialog(true);
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
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });


  // Multi-organisation management mutations
  const addUserToOrgMutation = useMutation({
    mutationFn: async ({ userId, organisationId }: { userId: string; organisationId: number }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/organisations`, { organisationId });
      return await response.json();
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "User added to organisation successfully",
      });
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-orgs"] });
      await queryClient.refetchQueries({ queryKey: ["/api/admin/users-with-orgs"] });
      
      // Update selectedUser with fresh data from the cache
      if (selectedUser) {
        const freshUsers = queryClient.getQueryData<User[]>(["/api/admin/users-with-orgs"]);
        const updatedUser = freshUsers?.find(u => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
      
      // Invalidate user access queries - access may have changed for any user
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add user to organisation",
        variant: "destructive",
      });
    },
  });

  const removeUserFromOrgMutation = useMutation({
    mutationFn: async ({ userId, organisationId }: { userId: string; organisationId: number }) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}/organisations/${organisationId}`);
      return await response.json();
    },
    onSuccess: async () => {
      toast({
        title: "Success", 
        description: "User removed from organisation successfully",
      });
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-orgs"] });
      await queryClient.refetchQueries({ queryKey: ["/api/admin/users-with-orgs"] });
      
      // Update selectedUser with fresh data from the cache
      if (selectedUser) {
        const freshUsers = queryClient.getQueryData<User[]>(["/api/admin/users-with-orgs"]);
        const updatedUser = freshUsers?.find(u => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
      
      // Invalidate user access queries - access may have changed for any user
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to remove user from organisation";
      if (errorMessage.includes("Cannot remove yourself from your last organisation")) {
        toast({
          title: "Cannot Remove Organisation",
          description: "You cannot remove yourself from your last organisation. Please assign yourself to another organisation first.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  // Set user org role mutation
  const setUserOrgRoleMutation = useMutation({
    mutationFn: async ({ userId, organisationId, role }: { userId: string; organisationId: number; role: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/organisations/${organisationId}/role`, { role });
      return await response.json();
    },
    onSuccess: async (_, variables) => {
      const roleLabel = variables.role === 'owner' ? 'Organisation Owner' : 'Member';
      toast({
        title: "Role Updated",
        description: `User is now a ${roleLabel}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-orgs"] });
      await queryClient.refetchQueries({ queryKey: ["/api/admin/users-with-orgs"] });
      if (selectedUser) {
        const freshUsers = queryClient.getQueryData<User[]>(["/api/admin/users-with-orgs"]);
        const updatedUser = freshUsers?.find(u => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  // Toggle admin status mutation
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      const endpoint = makeAdmin ? "make-admin" : "remove-admin";
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/${endpoint}`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-orgs"] });
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
        description: error.message || "Failed to update admin status",
        variant: "destructive",
      });
    },
  });

  // Update user details mutation (super admins only for admin users, email changes require super admin)
  const updateUserNameMutation = useMutation({
    mutationFn: async ({ userId, firstName, lastName, email }: { userId: string; firstName: string; lastName: string; email?: string }) => {
      const payload: any = { firstName, lastName };
      if (email) payload.email = email;
      const response = await apiRequest("PUT", `/api/admin/users/${userId}`, payload);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User name updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-orgs"] });
      setShowEditUser(false);
      setEditingUser(null);
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
        description: error.message || "Failed to update user name",
        variant: "destructive",
      });
    },
  });

  // Toggle super admin status mutation (super admins only)
  const notifySuperAdminMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string; userName?: string }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/super-admin/notify`, {});
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email sent",
        description: data.message || "Notification email sent",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email not sent",
        description: error?.message || "Failed to send notification email",
        variant: "destructive",
      });
    },
  });

  const toggleSuperAdminMutation = useMutation({
    mutationFn: async ({ userId, makeSuperAdmin }: { userId: string; makeSuperAdmin: boolean; userName?: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/super-admin`, { isSuperAdmin: makeSuperAdmin });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-orgs"] });

      // After granting super admin, offer to email the user about their new access
      if (variables.makeSuperAdmin) {
        const who = variables.userName || "this user";
        const sendEmail = confirm(
          `${who} now has super admin access.\n\nWould you like to email them to explain what they can now do — including which actions can't be undone?`
        );
        if (sendEmail) {
          notifySuperAdminMutation.mutate({ userId: variables.userId, userName: variables.userName });
        }
      }
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
        description: error.message || "Failed to update super admin status",
        variant: "destructive",
      });
    },
  });

  // Toggle case submission permission mutation
  const toggleCaseSubmissionMutation = useMutation({
    mutationFn: async ({ userId, canSubmitCases }: { userId: string; canSubmitCases: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/case-submission`, { canSubmitCases });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-orgs"] });
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
        description: error.message || "Failed to update case submission permission",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Deleted",
        description: data.message,
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-orgs"] });
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
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Send welcome email mutation
  const { data: emailTimestamps = {} } = useQuery<Record<string, { welcomeSentAt?: string; inviteSentAt?: string }>>({
    queryKey: ['/api/admin/users/email-timestamps'],
  });

  const sendWelcomeEmailMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/send-welcome-email`);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/email-timestamps'] });
      if (data.emailSent) {
        toast({
          title: "Welcome Email Sent",
          description: data.message,
        });
      } else {
        toast({
          title: "Email Not Delivered",
          description: `The welcome email could not be delivered to ${data.recipient?.email || 'the user'}. Please check the server logs or try again shortly.`,
          variant: "destructive",
        });
      }
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
        description: error.message || "Failed to send welcome email",
        variant: "destructive",
      });
    },
  });

  // Resend Microsoft (Azure SSO) invitation mutation — runs synchronously and
  // surfaces the actual Graph error so we can see why an invite didn't arrive.
  const resendInviteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/resend-invite`);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/email-timestamps'] });
      toast({
        title: "Invitation Sent",
        description: data.message,
      });
    },
    onError: (error: any) => {
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
        title: "Invitation Failed",
        description: error.message || "Could not send the Microsoft invitation.",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation — generates a new temp password for the user
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`);
      return await response.json();
    },
    onSuccess: (data) => {
      setResetPasswordResult({ tempPassword: data.tempPassword, email: data.email });
      setShowResetPasswordDialog(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Force logout mutation (invalidate all sessions for a user)
  const forceLogoutMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/force-logout`, { reason });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Logged Out",
        description: data.message,
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
        description: error.message || "Failed to force logout user",
        variant: "destructive",
      });
    },
  });

  const handleSendWelcomeEmail = async () => {
    if (!createdUserId) {
      toast({
        title: "Error",
        description: "Unable to send welcome email - missing user information",
        variant: "destructive",
      });
      return;
    }

    setSendingWelcomeEmail(true);
    try {
      const response = await apiRequest("POST", `/api/admin/users/${createdUserId}/send-welcome-email`, {});
      const result = await response.json();
      
      if (result.emailSent) {
        toast({
          title: "Welcome Email Sent",
          description: result.message || "Welcome email sent successfully",
        });
      } else {
        toast({
          title: "Email Not Delivered",
          description: `The welcome email could not be delivered to ${result.recipient?.email || 'the user'}. Please check the server logs or try again shortly.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send welcome email",
        variant: "destructive",
      });
    } finally {
      setSendingWelcomeEmail(false);
    }
  };


  // Check for admin access errors
  if (usersError || orgsError) {
    const errorMessage = (usersError as any)?.message || (orgsError as any)?.message;
    
    if (errorMessage?.includes("Admin access required") || errorMessage?.includes("403")) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have admin privileges to access this panel.</p>
            <p className="text-sm text-gray-500 mt-2">Contact your administrator to request admin access.</p>
          </div>
        </div>
      );
    }
  }

  if (usersLoading || orgsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Filter users by search term and user type
  const filteredUsers = users.filter((user: User) => {
    // Filter by user type
    if (userTypeFilter === "admin" && !user.isAdmin) return false;
    if (userTypeFilter === "user" && user.isAdmin) return false;
    if (userTypeFilter === "not_registered" && !(user as any).mustChangePassword) return false;
    if (userTypeFilter === "registered" && (user as any).mustChangePassword) return false;
    
    // Filter by search term
    if (userSearchFilter.trim()) {
      const search = userSearchFilter.toLowerCase();
      return (
        user.firstName?.toLowerCase().includes(search) ||
        user.lastName?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.id?.toLowerCase().includes(search) ||
        user.organisationName?.toLowerCase().includes(search) ||
        (user as any).organisations?.some((org: Organisation) => org.name.toLowerCase().includes(search))
      );
    }
    return true;
  });

  // Filter organisations by search term, sorted alphabetically by name
  const filteredOrgs = (orgSearchFilter.trim()
    ? organisations.filter((org: Organisation) => {
        const search = orgSearchFilter.toLowerCase();
        return (
          org.name?.toLowerCase().includes(search) ||
          org.externalRef?.toLowerCase().includes(search) ||
          String(org.id).includes(search)
        );
      })
    : [...(organisations || [])]).sort((a: Organisation, b: Organisation) =>
      (a.name || '').localeCompare(b.name || ''));

  // Pagination calculations
  const usersTotalPages = Math.ceil((filteredUsers?.length || 0) / usersPageSize);
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * usersPageSize, usersPage * usersPageSize);
  const orgsTotalPages = Math.ceil((filteredOrgs?.length || 0) / orgsPageSize);
  const paginatedOrgs = filteredOrgs.slice((orgsPage - 1) * orgsPageSize, orgsPage * orgsPageSize);

  // Reports pagination
  const sortedReports = [...(scheduledReports || [])].sort((a: any, b: any) => {
    const nameA = a.recipientEmail ? (a.recipientName || a.recipientEmail) : (a.userName || '');
    const nameB = b.recipientEmail ? (b.recipientName || b.recipientEmail) : (b.userName || '');
    return nameA.localeCompare(nameB);
  });
  const reportsTotalPages = Math.ceil(sortedReports.length / reportsPageSize);
  const paginatedReports = sortedReports.slice((reportsPage - 1) * reportsPageSize, reportsPage * reportsPageSize);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Admin Panel</h1>
          <p className="text-gray-600 text-sm sm:text-base">Comprehensive user and organisation management.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:items-center">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="/system-monitoring">
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">System Monitoring</span>
              <span className="sm:hidden">System</span>
            </Button>
          </Link>
          <Link href="/admin-payment-performance-report">
            <Button variant="outline" size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Payment Performance</span>
              <span className="sm:hidden">Payments</span>
            </Button>
          </Link>
          <Link href="/recovery-analysis-report">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Recovery Analysis</span>
              <span className="sm:hidden">Recovery</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRecoveryPerformance(true)}
            data-testid="button-recovery-performance"
          >
            <Clock className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Recovery Performance</span>
            <span className="sm:hidden">Performance</span>
          </Button>
          <Link href="/messages-report">
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Messages Report</span>
              <span className="sm:hidden">Messages</span>
            </Button>
          </Link>
          <Link href="/cl-analytics">
            <Button variant="outline" size="sm">
              <Scale className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">CL Page Analytics</span>
              <span className="sm:hidden">CL</span>
            </Button>
          </Link>
          {isSuperAdmin && (
            <Link href="/audit-management">
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Audit Management</span>
                <span className="sm:hidden">Audit</span>
              </Button>
            </Link>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowClosedCaseManagement(true)}
          >
            <Archive className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Closed Case Management</span>
            <span className="sm:hidden">Closed Cases</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="button-admin-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Closed Case Management View */}
      {showClosedCaseManagement ? (
        <ClosedCaseManagement onBack={() => setShowClosedCaseManagement(false)} isSuperAdmin={isSuperAdmin} />
      ) : showRecoveryPerformance ? (
        <div className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRecoveryPerformance(false)}
            data-testid="button-back-recovery"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Panel
          </Button>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle>Recovery Performance</CardTitle>
                    <CardDescription>
                      Amount-weighted average time to recover debts, measured from when each case was opened.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportRecoveryHtml}
                    disabled={!recoveryData || recoveryData.summary?.totalCases === 0}
                    data-testid="button-export-recovery-html"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    HTML
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportRecoveryExcel}
                    disabled={!recoveryData || recoveryData.summary?.totalCases === 0}
                    className="bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                    data-testid="button-export-recovery-excel"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchRecovery()}
                    disabled={recoveryFetching}
                    data-testid="button-refresh-recovery"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${recoveryFetching ? 'animate-spin' : ''}`} />
                    {recoveryFetching ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Organisation</label>
                  <Select value={recoveryOrg} onValueChange={setRecoveryOrg}>
                    <SelectTrigger data-testid="select-recovery-org">
                      <SelectValue placeholder="All organisations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All organisations</SelectItem>
                      {(organisations as any[]).map((org: any) => (
                        <SelectItem key={org.id} value={String(org.id)}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Debtor type</label>
                  <Select value={recoveryDebtorType} onValueChange={setRecoveryDebtorType}>
                    <SelectTrigger data-testid="select-recovery-debtor-type">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="sole_trader">Sole trader</SelectItem>
                      <SelectItem value="company_and_individual">Company &amp; individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Opened from</label>
                  <Input
                    type="date"
                    value={recoveryOpenedFrom}
                    onChange={(e) => setRecoveryOpenedFrom(e.target.value)}
                    data-testid="input-recovery-opened-from"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Opened to</label>
                  <Input
                    type="date"
                    value={recoveryOpenedTo}
                    onChange={(e) => setRecoveryOpenedTo(e.target.value)}
                    data-testid="input-recovery-opened-to"
                  />
                </div>
              </div>

              {recoveryFetching && !recoveryData ? (
                <div className="text-center py-12 text-muted-foreground">Loading recovery data…</div>
              ) : !recoveryData || recoveryData.summary?.totalCases === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-lg mb-1">No cases match these filters</h3>
                  <p className="text-sm text-muted-foreground">
                    Try widening the date range or clearing the organisation and debtor type filters.
                  </p>
                </div>
              ) : (
                <>
                  {/* Headline metric cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-emerald-200 dark:border-emerald-900/50">
                      <CardHeader className="pb-2">
                        <CardDescription>Amount-weighted average time to recovery</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="metric-weighted-mean">
                          {formatRecoveryDays(recoveryData.summary.weightedRecovery.mean)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Median {formatRecoveryDays(recoveryData.summary.weightedRecovery.median)} · {recoveryData.summary.weightedRecovery.count} case{recoveryData.summary.weightedRecovery.count !== 1 ? 's' : ''} measured
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Average time to first payment</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold" data-testid="metric-first-payment-mean">
                          {formatRecoveryDays(recoveryData.summary.timeToFirstPayment.mean)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Median {formatRecoveryDays(recoveryData.summary.timeToFirstPayment.median)} · {recoveryData.summary.timeToFirstPayment.count} case{recoveryData.summary.timeToFirstPayment.count !== 1 ? 's' : ''}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Average time to last payment / conclusion</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold" data-testid="metric-conclusion-mean">
                          {formatRecoveryDays(recoveryData.summary.timeToConclusion.mean)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Median {formatRecoveryDays(recoveryData.summary.timeToConclusion.median)} · {recoveryData.summary.timeToConclusion.count} closed case{recoveryData.summary.timeToConclusion.count !== 1 ? 's' : ''} measured
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Coverage summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <div className="text-2xl font-semibold" data-testid="stat-total-cases">{recoveryData.summary.totalCases}</div>
                      <div className="text-xs text-muted-foreground">Cases in scope</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-2xl font-semibold" data-testid="stat-cases-with-payments">{recoveryData.summary.casesWithPayments}</div>
                      <div className="text-xs text-muted-foreground">With payments</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-2xl font-semibold" data-testid="stat-cases-no-payments">{recoveryData.summary.casesNoPayments}</div>
                      <div className="text-xs text-muted-foreground">No payments yet</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-2xl font-semibold" data-testid="stat-fallback-start">{recoveryData.summary.fallbackStartUsed}</div>
                      <div className="text-xs text-muted-foreground">Estimated start date</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400" data-testid="stat-unreliable-start">{recoveryData.summary.unreliableStartCases}</div>
                      <div className="text-xs text-muted-foreground">Excluded (no usable start date)</div>
                    </div>
                  </div>

                  {recoveryData.summary.fallbackStartUsed > 0 && (
                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      {recoveryData.summary.fallbackStartUsed} case{recoveryData.summary.fallbackStartUsed !== 1 ? 's' : ''} had no recorded opening entry, so the date the case was added to the portal was used as the start date instead. These are marked “Est.” in the table.
                    </p>
                  )}

                  {recoveryData.summary.unreliableStartCases > 0 && (
                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      {recoveryData.summary.unreliableStartCases} case{recoveryData.summary.unreliableStartCases !== 1 ? 's' : ''} had a recorded opening date that falls after the first payment — usually older cases brought across from the previous system. These have been left out of the averages above, as recovery time can't be measured without a reliable start date, and are marked “No start date” in the table.
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    “Time to last payment / conclusion” only counts cases that are now closed. It measures from the day the case opened to the day the last payment came in, so a debt settled for less than the full amount counts the same as one paid in full. A closed case that never received a payment shows “No recovery”. See the FAQ below for more detail.
                  </p>

                  {/* Per-case breakdown */}
                  <div className="rounded-lg border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50 text-left">
                          <th className="p-3 font-medium">Case</th>
                          <th className="p-3 font-medium">Organisation</th>
                          <th className="p-3 font-medium">Opened</th>
                          <th className="p-3 font-medium text-right">To first payment</th>
                          <th className="p-3 font-medium text-right">Weighted recovery</th>
                          <th className="p-3 font-medium text-right">To last payment / conclusion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(recoveryData.cases as any[]).map((row: any) => (
                          <tr key={row.caseId} className="border-b last:border-0 hover:bg-muted/30" data-testid={`row-recovery-case-${row.caseId}`}>
                            <td className="p-3">
                              <div className="font-medium">{row.caseName}</div>
                              <div className="text-xs text-muted-foreground">{row.accountNumber}</div>
                            </td>
                            <td className="p-3 text-muted-foreground">{row.organisationName || '—'}</td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">
                              {new Date(row.openDate).toLocaleDateString('en-GB')}
                              {row.unreliableStart ? (
                                <Badge variant="outline" className="ml-2 text-[10px] border-amber-400 text-amber-600 dark:text-amber-400">No start date</Badge>
                              ) : row.usedFallbackStart ? (
                                <Badge variant="outline" className="ml-2 text-[10px]">Est.</Badge>
                              ) : null}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">{formatRecoveryDays(row.timeToFirstPaymentDays)}</td>
                            <td className="p-3 text-right whitespace-nowrap">{formatRecoveryDays(row.weightedRecoveryDays)}</td>
                            <td className="p-3 text-right whitespace-nowrap">
                              {row.concluded
                                ? (row.timeToConclusionDays != null
                                    ? formatRecoveryDays(row.timeToConclusionDays)
                                    : <span className="text-muted-foreground">No recovery</span>)
                                : <span className="text-muted-foreground">Open</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* FAQ */}
                  <div className="rounded-lg border p-4 space-y-3" data-testid="recovery-faq">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-semibold">Frequently asked questions</h3>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="faq-first-vs-conclusion" data-testid="faq-first-vs-conclusion">
                        <AccordionTrigger className="text-sm text-left">
                          Why is the average time to first payment sometimes higher than the average time to conclusion?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground space-y-2">
                          <p>
                            It looks odd, because for any single case the last payment can never come before the first one. The reason is that the two averages are worked out over <strong>different groups of cases</strong>:
                          </p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Time to first payment</strong> is averaged across every case that has received a payment — including cases that are still open.</li>
                            <li><strong>Time to last payment / conclusion</strong> is averaged across only the cases that are now closed.</li>
                          </ul>
                          <p>
                            Cases that close quickly tend to be the straightforward ones, so they pull the conclusion average down. Meanwhile a case that takes a long time to make its first payment but is still open pushes the first-payment average up and is not counted in conclusion at all. So the two figures can move in opposite directions even though nothing is wrong.
                          </p>
                          <p>
                            Tip: in the table above, the cases showing <strong>“Open”</strong> in the last column are the ones included in first-payment but excluded from conclusion.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="faq-first-payment" data-testid="faq-first-payment">
                        <AccordionTrigger className="text-sm text-left">
                          What does “time to first payment” mean?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground space-y-2">
                          <p>
                            The number of days from when the case was opened to the day the <strong>first</strong> payment was received. It is averaged across every case that has received at least one payment, whether or not the case is closed.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="faq-weighted" data-testid="faq-weighted">
                        <AccordionTrigger className="text-sm text-left">
                          What does “amount-weighted recovery” mean?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground space-y-2">
                          <p>
                            It measures how quickly the <strong>money</strong> comes in, not just the first payment. Each pound recovered is weighted by how long it took to arrive, so a case where most of the debt is paid early scores better than one where most is paid much later. It is the fairest single measure of recovery speed when payments arrive in instalments.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="faq-conclusion" data-testid="faq-conclusion">
                        <AccordionTrigger className="text-sm text-left">
                          What does “time to last payment / conclusion” mean?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground space-y-2">
                          <p>
                            For cases that are now <strong>closed</strong>, it is the number of days from when the case was opened to the <strong>last</strong> payment received. A debt settled for less than the full amount counts the same as one paid in full — what matters is when the money finished coming in.
                          </p>
                          <p>
                            Only closed cases that received at least one payment are counted, so this figure is usually based on fewer cases than the others (the count is shown next to the headline figure). Closed cases with no payment show “No recovery” and are not part of the average.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="faq-open-norecovery" data-testid="faq-open-norecovery">
                        <AccordionTrigger className="text-sm text-left">
                          What do “Open” and “No recovery” mean in the conclusion column?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground space-y-2">
                          <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Open</strong> — the case has not been closed yet, so there is no conclusion time to measure. These cases are left out of the conclusion average.</li>
                            <li><strong>No recovery</strong> — the case is closed but never received any payment, so there is no recovery time to show.</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="faq-est-nostart" data-testid="faq-est-nostart">
                        <AccordionTrigger className="text-sm text-left">
                          What do the “Est.” and “No start date” labels mean?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground space-y-2">
                          <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Est.</strong> — the case had no recorded opening entry, so the date it was added to the portal was used as the start date instead. The timing is an estimate but is still included in the averages.</li>
                            <li><strong>No start date</strong> — the recorded opening date falls after the first payment (usually older cases brought across from the previous system). Recovery time can’t be measured reliably, so these cases are left out of the averages.</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="faq-concluded" data-testid="faq-concluded">
                        <AccordionTrigger className="text-sm text-left">
                          When does a case count as concluded?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground space-y-2">
                          <p>
                            As soon as the case is marked <strong>closed</strong> in the system — whether it was paid in full, settled for less, or aborted. If a matter has finished but is still showing as live, it won’t appear in the conclusion figures until its status is set to closed.
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
      <>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {users?.filter((u: User) => !u.organisationId).length || 0} unassigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organisations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organisations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active organisations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.filter((u: User) => u.isAdmin).length || 0}</div>
            <p className="text-xs text-muted-foreground">With admin privileges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">@chadlaw Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter((u: User) => u.email?.endsWith('@chadlaw.co.uk')).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Internal users</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="flex w-full min-w-max sm:w-full sm:min-w-0">
            <TabsTrigger value="users" className="flex-1 text-xs sm:text-sm">
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="organisations" className="flex-1 text-xs sm:text-sm">
              <span className="hidden sm:inline">Organisations</span>
              <span className="sm:hidden">Orgs</span>
            </TabsTrigger>
            <TabsTrigger value="cases" className="flex-1 text-xs sm:text-sm">
              <span className="hidden sm:inline">Case Management</span>
              <span className="sm:hidden">Cases</span>
            </TabsTrigger>
            <TabsTrigger value="case-submissions" className="flex-1 text-xs sm:text-sm">
              <span className="hidden sm:inline">Case Submissions</span>
              <span className="sm:hidden">Submits</span>
            </TabsTrigger>

            {isSuperAdmin && (
              <TabsTrigger value="integration" className="flex-1 text-xs sm:text-sm">
                <span className="hidden sm:inline">Integration</span>
                <span className="sm:hidden">API</span>
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="broadcast" className="flex-1 text-xs sm:text-sm">
                <span className="hidden sm:inline">Email Broadcast</span>
                <span className="sm:hidden">Email</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="reports" className="flex-1 text-xs sm:text-sm">
              <span className="hidden sm:inline">Scheduled Reports</span>
              <span className="sm:hidden">Reports</span>
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="escalation" className="flex-1 text-xs sm:text-sm">
                <span className="hidden sm:inline">Escalation Reports</span>
                <span className="sm:hidden">Escalate</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Create and manage user accounts with comprehensive controls</CardDescription>
                </div>
                <Dialog open={showCreateUser} onOpenChange={(open) => { setShowCreateUser(open); if (!open) setOrgSearchTerm(""); }}>
                  <DialogTrigger asChild>
                    <Button className="bg-white hover:bg-acclaim-teal/10 text-[#008a8a] border border-[#008a8a]">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account with temporary password
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={userFormData.firstName}
                            onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                            placeholder="John"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={userFormData.lastName}
                            onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userFormData.email}
                          onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                          placeholder="john.doe@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone (Optional)</Label>
                        <Input
                          id="phone"
                          value={userFormData.phone}
                          onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                          placeholder="+44 20 7123 4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organisation">Organisations</Label>
                        <p className="text-xs text-gray-500">Select one or more organisations to assign this user to (optional).</p>
                        {(userFormData.organisationIds?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {userFormData.organisationIds?.map((orgId) => {
                              const org = organisations?.find((o: Organisation) => o.id === orgId);
                              return (
                                <Badge key={orgId} variant="secondary" className="flex items-center gap-1" data-testid={`badge-selected-org-${orgId}`}>
                                  {org?.name || `Org ${orgId}`}
                                  <button
                                    type="button"
                                    className="ml-0.5 text-gray-500 hover:text-red-600"
                                    onClick={() => setUserFormData({
                                      ...userFormData,
                                      organisationIds: userFormData.organisationIds?.filter((id) => id !== orgId) ?? [],
                                    })}
                                    aria-label={`Remove ${org?.name || 'organisation'}`}
                                    data-testid={`button-remove-selected-org-${orgId}`}
                                  >
                                    ×
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        <Input
                          placeholder="Search organisations..."
                          value={orgSearchTerm}
                          onChange={(e) => setOrgSearchTerm(e.target.value)}
                          className="h-8"
                          data-testid="input-search-create-user-orgs"
                        />
                        <div className="border rounded-md max-h-48 overflow-y-auto p-1 space-y-0.5">
                          {organisations
                            ?.filter((org: Organisation) => {
                              if (!orgSearchTerm.trim()) return true;
                              const search = orgSearchTerm.toLowerCase();
                              return org.name.toLowerCase().includes(search) || 
                                     (org.externalRef?.toLowerCase().includes(search) ?? false);
                            })
                            .sort((a: Organisation, b: Organisation) => a.name.localeCompare(b.name))
                            .map((org: Organisation) => {
                              const checked = userFormData.organisationIds?.includes(org.id) ?? false;
                              return (
                                <label
                                  key={org.id}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                  data-testid={`option-create-user-org-${org.id}`}
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(value) => {
                                      const current = userFormData.organisationIds ?? [];
                                      setUserFormData({
                                        ...userFormData,
                                        organisationIds: value
                                          ? [...current, org.id]
                                          : current.filter((id) => id !== org.id),
                                      });
                                    }}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{org.name}</span>
                                    {org.externalRef && (
                                      <span className="text-xs text-gray-500">Ref: {org.externalRef}</span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          {organisations?.filter((org: Organisation) => {
                            if (!orgSearchTerm.trim()) return true;
                            const search = orgSearchTerm.toLowerCase();
                            return org.name.toLowerCase().includes(search) || 
                                   (org.externalRef?.toLowerCase().includes(search) ?? false);
                          }).length === 0 && (
                            <p className="text-sm text-gray-500 px-2 py-2">No organisations found</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isAdmin"
                          checked={userFormData.isAdmin}
                          onCheckedChange={(checked) => setUserFormData({ ...userFormData, isAdmin: checked as boolean })}
                        />
                        <Label htmlFor="isAdmin">Admin privileges</Label>
                      </div>
                      {userFormData.isAdmin && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-3">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <p className="text-sm text-amber-700">
                              Admin privileges can only be assigned to @chadlaw.co.uk email addresses
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="border rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="canSubmitCases" className="text-sm font-medium cursor-pointer">
                              Allow Case Submissions
                            </Label>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Permit this user to submit new cases via the portal
                            </p>
                          </div>
                          <Checkbox
                            id="canSubmitCases"
                            checked={userFormData.canSubmitCases ?? false}
                            onCheckedChange={(checked) => setUserFormData({ ...userFormData, canSubmitCases: checked as boolean })}
                          />
                        </div>
                        {userFormData.canSubmitCases && (
                          <p className="text-xs text-teal-700 bg-teal-50 rounded px-2 py-1">
                            ✓ This user will be able to submit new cases
                          </p>
                        )}
                        {!userFormData.canSubmitCases && (
                          <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                            Case submissions will be disabled for this user
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateUser(false)} className="order-2 sm:order-1">
                        Cancel
                      </Button>
                      <Button
                        onClick={() => setShowConfirmCreateUser(true)}
                        disabled={!userFormData.firstName.trim() || !userFormData.lastName.trim() || !userFormData.email.trim()}
                        className="bg-acclaim-teal hover:bg-acclaim-teal/90 order-1 sm:order-2"
                      >
                        Create User
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Confirmation Dialog */}
                <Dialog open={showConfirmCreateUser} onOpenChange={setShowConfirmCreateUser}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Confirm User Creation</DialogTitle>
                      <DialogDescription>
                        Please review the details before creating this user account.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Name:</span>
                          <span className="text-sm font-medium">{userFormData.firstName} {userFormData.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Email:</span>
                          <span className="text-sm font-medium">{userFormData.email}</span>
                        </div>
                        {userFormData.phone && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Phone:</span>
                            <span className="text-sm font-medium">{userFormData.phone}</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-2">
                          <span className="text-sm text-gray-600">Organisations:</span>
                          <span className="text-sm font-medium text-right">
                            {(userFormData.organisationIds?.length ?? 0) > 0
                              ? userFormData.organisationIds
                                  ?.map((orgId) => organisations?.find((o: Organisation) => o.id === orgId)?.name || "Unknown")
                                  .join(", ")
                              : "No organisation"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Admin:</span>
                          <span className="text-sm font-medium">{userFormData.isAdmin ? "Yes" : "No"}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        A temporary password will be generated after confirmation.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
                      <Button variant="outline" onClick={() => setShowConfirmCreateUser(false)} className="order-2 sm:order-1">
                        Go Back
                      </Button>
                      <Button
                        onClick={() => {
                          setShowConfirmCreateUser(false);
                          createUserMutation.mutate(userFormData);
                        }}
                        disabled={createUserMutation.isPending}
                        className="bg-acclaim-teal hover:bg-acclaim-teal/90 order-1 sm:order-2"
                      >
                        {createUserMutation.isPending ? "Creating..." : "Confirm & Create"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit User Details Dialog (Super Admins only) */}
                <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit User Details</DialogTitle>
                      <DialogDescription>
                        Update details for {editingUser?.email}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="editFirstName">First Name</Label>
                        <Input
                          id="editFirstName"
                          value={editingUser?.firstName || ""}
                          onChange={(e) => setEditingUser(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editLastName">Last Name</Label>
                        <Input
                          id="editLastName"
                          value={editingUser?.lastName || ""}
                          onChange={(e) => setEditingUser(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                          placeholder="Last name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editEmail">Email Address</Label>
                        <Input
                          id="editEmail"
                          type="email"
                          value={editingUser?.email || ""}
                          onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                          placeholder="Email address"
                        />
                        <p className="text-xs text-amber-600">Warning: Changing email will affect the user's Microsoft sign-in. Ensure this matches their Microsoft account email.</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowEditUser(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (editingUser && editingUser.firstName && editingUser.lastName && editingUser.email) {
                            updateUserNameMutation.mutate({
                              userId: editingUser.id,
                              firstName: editingUser.firstName,
                              lastName: editingUser.lastName,
                              email: editingUser.email
                            });
                          }
                        }}
                        disabled={updateUserNameMutation.isPending || !editingUser?.firstName?.trim() || !editingUser?.lastName?.trim() || !editingUser?.email?.trim()}
                        className="bg-acclaim-teal hover:bg-acclaim-teal/90"
                      >
                        {updateUserNameMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or organisation..."
                    value={userSearchFilter}
                    onChange={(e) => {
                      setUserSearchFilter(e.target.value);
                      setUsersPage(1); // Reset to first page when searching
                    }}
                    className="pl-10"
                  />
                </div>
                <Select 
                  value={userTypeFilter} 
                  onValueChange={(value: "all" | "admin" | "user" | "registered" | "not_registered") => {
                    setUserTypeFilter(value);
                    setUsersPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admin">Admins Only</SelectItem>
                    <SelectItem value="user">Non-Admins Only</SelectItem>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="not_registered">Not Registered</SelectItem>
                  </SelectContent>
                </Select>
                <PageSizeSelector pageSize={usersPageSize} onPageSizeChange={(s) => { setUsersPageSize(s); setUsersPage(1); }} />
                <div className="text-sm text-gray-600">
                  Showing {paginatedUsers.length} of {filteredUsers?.length || 0} users
                  {(userSearchFilter || userTypeFilter !== "all") && ` (filtered from ${users?.length || 0})`}
                </div>
              </div>
              {/* Scroll anchor for pagination */}
              <div ref={usersTableTopRef} className="scroll-mt-4" />
              {/* Unified card grid + slide-in detail panel */}
              <div className="relative">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedUsers?.map((user: User) => {
                    const avatarColors = ['#0d9488','#0284c7','#7c3aed','#db2777','#d97706','#16a34a','#dc2626','#475569'];
                    const code = user.id.charCodeAt(0) + (user.id.charCodeAt(1) || 0);
                    const bgColor = avatarColors[Math.abs(code) % avatarColors.length];
                    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
                    const isSelected = expandedUserId === user.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => setExpandedUserId(isSelected ? null : user.id)}
                        className={`group text-left bg-white dark:bg-gray-900 border rounded-xl p-5 hover:border-teal-400 hover:shadow-md transition-all duration-150 relative flex flex-col gap-3 ${isSelected ? 'border-teal-400 shadow-md ring-2 ring-teal-200 dark:ring-teal-800' : 'border-gray-200 dark:border-gray-700'}`}
                        data-testid={`card-user-${user.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: bgColor }}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                                {user.firstName} {user.lastName}
                              </span>
                              {(user as any).isSuperAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                  <ShieldAlert className="h-3 w-3" /> Super Admin
                                </span>
                              ) : user.isAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                  <Shield className="h-3 w-3" /> Admin
                                </span>
                              ) : (user as any).isOwner ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                  <Crown className="h-3 w-3" /> Owner
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                  User
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
                          </div>
                          <ChevronRight className={`h-4 w-4 flex-shrink-0 mt-1 transition-colors ${isSelected ? 'text-teal-500' : 'text-gray-300 group-hover:text-teal-500'}`} />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Building className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {(user as any).organisations?.length > 0
                              ? (user as any).organisations.map((o: any) => o.name).join(', ')
                              : (user as any).organisationName ?? 'No organisation'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-2">
                            {(user as any).emailNotifications === false ? (
                              <BellOff className="h-3 w-3 text-gray-300" title="Message notifications off" />
                            ) : (
                              <Bell className="h-3 w-3 text-green-500" title="Message notifications on" />
                            )}
                            {(user as any).documentNotifications === false ? (
                              <FileX className="h-3 w-3 text-gray-300" title="Document notifications off" />
                            ) : (
                              <FilePlus className="h-3 w-3 text-green-500" title="Document notifications on" />
                            )}
                            {(user as any).canSubmitCases === false && (
                              <ClipboardX className="h-3 w-3 text-amber-400" title="Case submission disabled" />
                            )}
                            {(user as any).mustChangePassword && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                <KeyRound className="h-2.5 w-2.5" /> Not registered
                              </span>
                            )}
                          </div>
                          {isSuperAdmin && scheduledReportsMap[user.id]?.length > 0 && (() => {
                            const enabledCount = scheduledReportsMap[user.id].filter((r: any) => r.enabled).length;
                            return enabledCount > 0 ? (
                              <span className="flex items-center gap-1 text-xs text-green-600"><Calendar className="h-3 w-3" />{enabledCount}</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-gray-400"><CalendarOff className="h-3 w-3" />{scheduledReportsMap[user.id].length}</span>
                            );
                          })()}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Detail panel — fixed full-screen on mobile, absolute side panel on sm+ */}
                {expandedUserId && <div className="hidden sm:block fixed inset-0 z-40" onClick={() => setExpandedUserId(null)} aria-hidden="true" />}
                {expandedUserId && (() => {
                  const user = paginatedUsers?.find((u: User) => u.id === expandedUserId);
                  if (!user) return null;
                  const avatarColors = ['#0d9488','#0284c7','#7c3aed','#db2777','#d97706','#16a34a','#dc2626','#475569'];
                  const code = user.id.charCodeAt(0) + (user.id.charCodeAt(1) || 0);
                  const bgColor = avatarColors[Math.abs(code) % avatarColors.length];
                  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
                  return (
                    <div className="fixed inset-0 z-50 sm:inset-y-0 sm:right-0 sm:left-auto sm:top-0 sm:bottom-0 w-full sm:w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-y-auto">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">User Details</h2>
                        <button onClick={() => setExpandedUserId(null)} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors" data-testid="button-close-user-panel">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: bgColor }}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{user.firstName} {user.lastName}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 break-all">{user.email}</p>
                            {user.phone && <p className="text-xs text-gray-400 mt-0.5">{user.phone}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                          <Building className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>
                            {(user as any).organisations?.length > 0
                              ? (user as any).organisations.map((o: any) => o.name).join(', ')
                              : (user as any).organisationName ?? 'No organisation'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 font-mono">ID: {user.id}</div>
                      </div>
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-1.5">
                        {(user as any).isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700"><ShieldAlert className="h-3 w-3" /> Super Admin</span>
                        ) : user.isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"><Shield className="h-3 w-3" /> Admin</span>
                        ) : (user as any).isOwner ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Crown className="h-3 w-3" /> Owner</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">User</span>
                        )}
                        {(user as any).mustChangePassword ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700"><KeyRound className="h-3 w-3" /> Not registered</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700"><Check className="h-3 w-3" /> Registered</span>
                        )}
                        {(user as any).emailNotifications !== false && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700"><Bell className="h-3 w-3" /> Msgs on</span>
                        )}
                        {(user as any).documentNotifications !== false && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700"><FilePlus className="h-3 w-3" /> Docs on</span>
                        )}
                        {(user as any).canSubmitCases !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700"><ClipboardList className="h-3 w-3" /> Cases on</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700"><ClipboardX className="h-3 w-3" /> No case submit</span>
                        )}
                      </div>
                      {(emailTimestamps[user.id]?.welcomeSentAt || emailTimestamps[user.id]?.inviteSentAt) && (
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Email History</p>
                          <div className="space-y-2">
                            {emailTimestamps[user.id]?.welcomeSentAt && (
                              <div className="flex items-start gap-2 text-xs">
                                <Mail className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-gray-500">Welcome email last sent</p>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">
                                    {new Date(emailTimestamps[user.id].welcomeSentAt!).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            )}
                            {emailTimestamps[user.id]?.inviteSentAt && (
                              <div className="flex items-start gap-2 text-xs">
                                <Send className="h-3.5 w-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-gray-500">Microsoft invitation last sent</p>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">
                                    {new Date(emailTimestamps[user.id].inviteSentAt!).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Login History</p>
                        <MobileUserAuditSection userId={user.id} />
                      </div>
                      <div className="px-4 py-3 flex-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Actions</p>
                        <div className="space-y-0.5">
                          <button
                            onClick={() => {
                              const msg = (user as any).temporaryPassword
                                ? `Send welcome email to ${user.firstName} ${user.lastName}?\n\nThis will send their username and temporary password to ${user.email}.`
                                : `Send welcome email to ${user.firstName} ${user.lastName}?\n\nNote: This user has already logged in, so the email will include instructions to reset their password if needed.`;
                              if (confirm(msg)) sendWelcomeEmailMutation.mutate(user.id);
                            }}
                            disabled={sendWelcomeEmailMutation.isPending}
                            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left disabled:opacity-50"
                          >
                            <Mail className="h-4 w-4 text-gray-400" /> Send welcome email
                          </button>
                          {!user.isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`Send a Microsoft sign-in invitation to ${user.firstName} ${user.lastName} (${user.email})?\n\nThey will receive an email from Microsoft to accept the invitation, after which they can use "Sign in with SSO".`)) {
                                  resendInviteMutation.mutate(user.id);
                                }
                              }}
                              disabled={resendInviteMutation.isPending}
                              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left disabled:opacity-50"
                              data-testid={`button-resend-invite-panel-${user.id}`}
                            >
                              <Send className="h-4 w-4 text-gray-400" /> Send Microsoft invitation
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Reset password for ${user.firstName} ${user.lastName}?\n\nThis will generate a new temporary password. The user will need to change it on next sign in.`)) {
                                setResetPasswordUser(user);
                                resetPasswordMutation.mutate(user.id);
                              }
                            }}
                            disabled={resetPasswordMutation.isPending}
                            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left disabled:opacity-50"
                          >
                            <KeyRound className="h-4 w-4 text-gray-400" /> Reset password
                          </button>
                          <button
                            onClick={() => { setSelectedUser(user); setShowAssignUser(true); }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                          >
                            <UserPlus className="h-4 w-4 text-gray-400" /> Assign to organisation
                          </button>
                          {!user.isAdmin && (
                            <button
                              onClick={() => { setManageRestrictionsUser(user); setSelectedLiftCaseIds([]); setSelectedRestoreCaseIds([]); }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                              data-testid={`button-manage-restrictions-panel-${user.id}`}
                            >
                              <EyeOff className="h-4 w-4 text-gray-400" /> Manage case restrictions
                            </button>
                          )}
                          {isSuperAdmin && (
                            <button
                              onClick={() => openScheduledReportDialog(user)}
                              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                            >
                              <Calendar className="h-4 w-4 text-gray-400" /> Scheduled reports
                              {scheduledReportsMap[user.id]?.filter((r: any) => r.enabled).length > 0 && (
                                <span className="ml-auto text-xs text-green-600">{scheduledReportsMap[user.id].filter((r: any) => r.enabled).length} active</span>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (!user.isAdmin && !user.email?.endsWith('@chadlaw.co.uk')) { alert('Admin privileges can only be granted to @chadlaw.co.uk email addresses.'); return; }
                              const action = user.isAdmin ? 'remove admin privileges from' : 'grant admin privileges to';
                              if (confirm(`Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`)) {
                                toggleAdminMutation.mutate({ userId: user.id, makeAdmin: !user.isAdmin });
                              }
                            }}
                            disabled={toggleAdminMutation.isPending || (!user.isAdmin && !user.email?.endsWith('@chadlaw.co.uk'))}
                            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left disabled:opacity-50"
                          >
                            {user.isAdmin ? <ShieldCheck className="h-4 w-4 text-blue-500" /> : <Shield className="h-4 w-4 text-gray-400" />}
                            {user.isAdmin ? 'Remove admin' : 'Grant admin'}
                          </button>
                          {isSuperAdmin && user.isAdmin && user.email?.endsWith('@chadlaw.co.uk') && (
                            <button
                              onClick={() => {
                                if (user.id === currentUser?.id) { alert('You cannot change your own super admin status.'); return; }
                                const action = (user as any).isSuperAdmin ? 'remove super admin privileges from' : 'grant super admin privileges to';
                                if (confirm(`Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`)) {
                                  toggleSuperAdminMutation.mutate({ userId: user.id, makeSuperAdmin: !(user as any).isSuperAdmin, userName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email });
                                }
                              }}
                              disabled={toggleSuperAdminMutation.isPending || user.id === currentUser?.id}
                              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left disabled:opacity-50"
                            >
                              {(user as any).isSuperAdmin ? <ShieldAlert className="h-4 w-4 text-purple-500" /> : <ShieldAlert className="h-4 w-4 text-gray-400" />}
                              {(user as any).isSuperAdmin ? 'Remove super admin' : 'Grant super admin'}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const currentValue = (user as any).canSubmitCases !== false;
                              const action = currentValue ? 'disable' : 'enable';
                              if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} case submission for ${user.firstName} ${user.lastName}?`)) {
                                toggleCaseSubmissionMutation.mutate({ userId: user.id, canSubmitCases: !currentValue });
                              }
                            }}
                            disabled={toggleCaseSubmissionMutation.isPending}
                            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left disabled:opacity-50"
                          >
                            {(user as any).canSubmitCases !== false ? <FilePlus className="h-4 w-4 text-green-500" /> : <FileX className="h-4 w-4 text-gray-400" />}
                            {(user as any).canSubmitCases !== false ? 'Disable case submission' : 'Enable case submission'}
                          </button>
                          <button
                            onClick={() => { setEditingUser(user); setShowEditUser(true); }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                            data-testid={`button-edit-user-panel-${user.id}`}
                          >
                            <Pencil className="h-4 w-4 text-gray-400" /> Edit details
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Force logout ${user.firstName} ${user.lastName}? This will end all their active sessions.`)) {
                                forceLogoutMutation.mutate({ userId: user.id, reason: 'Admin initiated force logout' });
                              }
                            }}
                            disabled={forceLogoutMutation.isPending}
                            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-left disabled:opacity-50"
                          >
                            <LogOut className="h-4 w-4" /> Force logout
                          </button>
                          {isSuperAdmin && (
                            <>
                              <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to permanently delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
                                    deleteUserMutation.mutate(user.id);
                                  }
                                }}
                                disabled={deleteUserMutation.isPending}
                                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" /> Delete user
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Pagination */}
              <Pagination 
                currentPage={usersPage} 
                totalPages={usersTotalPages} 
                onPageChange={(page) => {
                  setUsersPage(page);
                  requestAnimationFrame(() => {
                    usersTableTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  });
                }} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organisations Tab */}
        <TabsContent value="organisations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Organisations</CardTitle>
                  <CardDescription>Manage client organisations</CardDescription>
                </div>
                <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
                  <DialogTrigger asChild>
                    <Button className="bg-white hover:bg-acclaim-teal/10 text-[#008a8a] border border-[#008a8a]">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Organisation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Organisation</DialogTitle>
                      <DialogDescription>
                        Add a new client organisation to the system
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Organisation Name</Label>
                        <Input
                          id="name"
                          value={newOrgName}
                          onChange={(e) => setNewOrgName(e.target.value)}
                          placeholder="Enter organisation name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="externalRef">Client Code (Optional)</Label>
                        <Input
                          id="externalRef"
                          value={newOrgExternalRef}
                          onChange={(e) => setNewOrgExternalRef(e.target.value)}
                          placeholder="e.g., ABC123 or ABC123,DEF456,GHI789"
                        />
                        <p className="text-sm text-muted-foreground">
                          Client code from case management system. For multiple codes, separate with commas (e.g., ABC123,DEF456).
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        setShowCreateOrg(false);
                        setNewOrgName("");
                        setNewOrgExternalRef("");
                      }}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          console.log('Frontend sending data:', { 
                            name: newOrgName, 
                            externalRef: newOrgExternalRef || undefined 
                          });
                          createOrganisationMutation.mutate({ 
                            name: newOrgName, 
                            externalRef: newOrgExternalRef || undefined 
                          });
                        }}
                        disabled={createOrganisationMutation.isPending}
                        className="bg-acclaim-teal hover:bg-acclaim-teal/90"
                      >
                        {createOrganisationMutation.isPending ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or client code..."
                    value={orgSearchFilter}
                    onChange={(e) => {
                      setOrgSearchFilter(e.target.value);
                      setOrgsPage(1); // Reset to first page when searching
                    }}
                    className="pl-10"
                  />
                </div>
                <PageSizeSelector pageSize={orgsPageSize} onPageSizeChange={(s) => { setOrgsPageSize(s); setOrgsPage(1); }} />
                <div className="text-sm text-gray-600">
                  Showing {paginatedOrgs.length} of {filteredOrgs?.length || 0} organisations
                  {orgSearchFilter && ` (filtered from ${organisations?.length || 0})`}
                </div>
              </div>
              {/* Scroll anchor for pagination */}
              <div ref={orgsTableTopRef} className="scroll-mt-4" />
              {/* Unified Card Grid + Detail Panel */}
              <div className="relative">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedOrgs?.map((org: Organisation) => {
                    const orgReportCount = orgScheduledReportsMap[org.id]?.length || 0;
                    const isSelected = expandedOrgId === org.id;
                    const orgColors = ['#0d9488','#0284c7','#7c3aed','#db2777','#d97706','#16a34a','#dc2626','#475569'];
                    const bgColor = orgColors[Math.abs(org.id) % orgColors.length];
                    const initial = org.name?.[0]?.toUpperCase() ?? '?';
                    return (
                      <button
                        key={org.id}
                        onClick={() => setExpandedOrgId(isSelected ? null : org.id)}
                        data-testid={`card-org-${org.id}`}
                        className={`w-full text-left rounded-xl border bg-white dark:bg-gray-900 p-4 shadow-sm hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-acclaim-teal/40 ${isSelected ? 'ring-2 ring-acclaim-teal border-acclaim-teal/40' : 'border-gray-200 dark:border-gray-700'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0" style={{ background: bgColor }}>
                            {initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{org.name}</p>
                              <ChevronRight className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${isSelected ? 'rotate-90 text-acclaim-teal' : ''}`} />
                            </div>
                            {org.externalRef && <p className="text-xs text-gray-500 mt-0.5 truncate">Code: {org.externalRef}</p>}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Users className="h-3 w-3" />{org.userCount} user{org.userCount !== 1 ? 's' : ''}
                              </span>
                              {isSuperAdmin && orgReportCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                  <Calendar className="h-3 w-3" />{orgReportCount} report{orgReportCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{new Date(org.createdAt).toLocaleDateString('en-GB')}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Backdrop */}
                {expandedOrgId && <div className="hidden sm:block fixed inset-0 z-40" onClick={() => setExpandedOrgId(null)} aria-hidden="true" />}

                {/* Detail panel */}
                {expandedOrgId && (() => {
                  const org = paginatedOrgs?.find((o: Organisation) => o.id === expandedOrgId);
                  if (!org) return null;
                  const orgReportCount = orgScheduledReportsMap[org.id]?.length || 0;
                  const orgColors = ['#0d9488','#0284c7','#7c3aed','#db2777','#d97706','#16a34a','#dc2626','#475569'];
                  const bgColor = orgColors[Math.abs(org.id) % orgColors.length];
                  const initial = org.name?.[0]?.toUpperCase() ?? '?';
                  return (
                    <div className="fixed inset-0 z-50 sm:inset-y-0 sm:right-0 sm:left-auto sm:top-0 sm:bottom-0 w-full sm:w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-y-auto">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Organisation Details</h2>
                        <button onClick={() => setExpandedOrgId(null)} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors" data-testid="button-close-org-panel">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: bgColor }}>
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{org.name}</h3>
                            {org.externalRef && <p className="text-xs text-gray-500 mt-0.5">Code: {org.externalRef}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">ID: {org.id}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-400 mb-0.5">Users</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{org.userCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-0.5">Created</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{new Date(org.createdAt).toLocaleDateString('en-GB')}</p>
                          </div>
                          {isSuperAdmin && (
                            <div>
                              <p className="text-gray-400 mb-0.5">Scheduled Reports</p>
                              <p className="font-medium text-gray-800 dark:text-gray-200">{orgReportCount > 0 ? orgReportCount + ' active' : 'None'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="px-4 py-3 flex flex-col gap-1">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Actions</p>
                        <button
                          onClick={() => { setEditingOrg(org); setOrgFormData({ name: org.name, externalRef: org.externalRef || undefined }); setShowEditOrg(true); }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                          data-testid="button-edit-org"
                        >
                          <Edit className="h-4 w-4" /> Edit details
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => { setSelectedOrgForSchedule(org); setOrgScheduleForm({ recipientEmail: '', recipientName: '', frequency: 'weekly', dayOfWeek: 1, dayOfMonth: 1, timeOfDay: 9, includeCaseSummary: true, includeActivityReport: true, caseStatusFilter: 'active' }); setShowOrgScheduleDialog(true); }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                            data-testid="button-schedule-org-report"
                          >
                            <Plus className="h-4 w-4" /> Schedule report
                          </button>
                        )}
                        {isSuperAdmin && orgReportCount > 0 && (
                          <button
                            onClick={() => { setSelectedOrgForReports(org); setShowOrgReportsDialog(true); }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                            data-testid="button-view-org-reports"
                          >
                            <Calendar className="h-4 w-4" /> View reports ({orgReportCount})
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => { if (confirm('Are you sure you want to delete "' + org.name + '"? This action cannot be undone.')) { deleteOrganisationMutation.mutate(org.id); setExpandedOrgId(null); } }}
                            disabled={deleteOrganisationMutation.isPending}
                            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left disabled:opacity-50"
                            data-testid="button-delete-org"
                          >
                            <Trash2 className="h-4 w-4" /> Delete organisation
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
                            {/* Pagination */}
              <Pagination 
                currentPage={orgsPage} 
                totalPages={orgsTotalPages} 
                onPageChange={(page) => {
                  setOrgsPage(page);
                  requestAnimationFrame(() => {
                    orgsTableTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  });
                }} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cases Tab */}
        <TabsContent value="cases">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Case Management</CardTitle>
                  <CardDescription>Archive or permanently delete cases across all organisations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CaseManagementTab isSuperAdmin={isSuperAdmin} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Case Submissions Tab */}
        <TabsContent value="case-submissions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Case Submissions</CardTitle>
                  <CardDescription>Review and manage case submissions from users</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CaseSubmissionsTab isSuperAdmin={isSuperAdmin} />
            </CardContent>
          </Card>
        </TabsContent>



        {/* Integration Tab - Super Admin Only */}
        {isSuperAdmin && (
          <TabsContent value="integration">
            <CaseManagementGuideDownload />
          </TabsContent>
        )}

        {/* Email Broadcast Tab - Super Admin Only */}
        {isSuperAdmin && (
          <TabsContent value="broadcast">
            <EmailBroadcast />
          </TabsContent>
        )}

        {/* Scheduled Reports Overview Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Send className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle>On-Demand Reports</CardTitle>
                  <CardDescription>
                    Trigger reports immediately without waiting for the scheduled run
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-sm">Inactive Cases Report</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sends the inactive cases report email now, bypassing the Thursday 8 am schedule. Cases inactive for 30+ days are included.
                  </p>
                  {inactiveCasesCountData !== undefined && (
                    <p
                      data-testid="text-inactive-cases-count"
                      className="text-xs font-medium mt-1.5 text-amber-700 dark:text-amber-400"
                    >
                      {inactiveCasesCountData.count} inactive {inactiveCasesCountData.count === 1 ? "case" : "cases"} currently
                    </p>
                  )}
                </div>
                <Button
                  data-testid="button-send-inactive-cases-report"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={sendInactiveCasesMutation.isPending}
                  onClick={() => sendInactiveCasesMutation.mutate()}
                >
                  {sendInactiveCasesMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1.5" />
                  )}
                  {sendInactiveCasesMutation.isPending ? "Sending…" : "Send Now"}
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>All Scheduled Reports</CardTitle>
                    <CardDescription>
                      View and manage all scheduled reports across all users and organisations
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <PageSizeSelector pageSize={reportsPageSize} onPageSizeChange={(s) => { setReportsPageSize(s); setReportsPage(1); }} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduled-reports"] })}
                    disabled={scheduledReportsFetching}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${scheduledReportsFetching ? 'animate-spin' : ''}`} />
                    {scheduledReportsFetching ? 'Loading...' : 'Refresh'}
                  </Button>
                  <Badge variant="secondary">
                    {scheduledReports.length} report{scheduledReports.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {scheduledReports.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarOff className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-lg mb-1">No Scheduled Reports</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure scheduled reports for users via the Users tab, or for organisations via the Organisations tab.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div ref={reportsTableTopRef} className="scroll-mt-4" />
                  {paginatedReports.map((report: any) => {
                    const org = organisations?.find((o: any) => o.id === report.organisationId);
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const formatTime = (hour: number) => {
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const h = hour % 12 || 12;
                      return `${h}:00 ${ampm}`;
                    };
                    const frequencyLabel = report.frequency === 'daily' 
                      ? 'Daily' 
                      : report.frequency === 'weekly' 
                        ? `Weekly on ${dayNames[report.dayOfWeek || 0]}`
                        : `Monthly on day ${report.dayOfMonth || 1}`;
                    const isExpanded = expandedReportId === report.id;
                    const isOrgLevelReport = !!report.recipientEmail;
                    
                    return (
                      <div 
                        key={report.id} 
                        className={`border rounded-lg transition-all ${isExpanded ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
                      >
                        <div 
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${
                              isOrgLevelReport 
                                ? 'bg-purple-100 dark:bg-purple-900/30' 
                                : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                              {isOrgLevelReport ? (
                                <Building className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              ) : (
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium truncate">
                                  {isOrgLevelReport 
                                    ? `${org?.name || 'Unknown Org'} → ${report.recipientName || report.recipientEmail}`
                                    : report.userName || 'Unknown User'
                                  }
                                </span>
                                {report.enabled ? (
                                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Disabled</Badge>
                                )}
                                {isOrgLevelReport && (
                                  <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                                    Org Report
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {frequencyLabel} at {formatTime(report.timeOfDay || 9)}
                                {org && !isOrgLevelReport && ` • ${org.name}`}
                                {!report.organisationId && !isOrgLevelReport && ' • Combined (all orgs)'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {report.lastSentAt && (
                              <span className="text-xs text-muted-foreground hidden sm:block">
                                Last: {new Date(report.lastSentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t px-4 py-3 bg-muted/30 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" /> Created By
                                </Label>
                                <p className="text-sm font-medium">{report.userName}</p>
                                <p className="text-xs text-muted-foreground">{report.userEmail}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Building className="h-3 w-3" /> Organisation
                                </Label>
                                <p className="text-sm font-medium">
                                  {report.organisationId 
                                    ? org?.name || `Org #${report.organisationId}` 
                                    : 'Combined (all user orgs)'
                                  }
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Send className="h-3 w-3" /> Sends To
                                </Label>
                                <p className="text-sm font-medium">
                                  {report.recipientEmail || report.userEmail}
                                </p>
                                {report.recipientName && (
                                  <p className="text-xs text-muted-foreground">({report.recipientName})</p>
                                )}
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> Schedule
                                </Label>
                                <p className="text-sm font-medium">{frequencyLabel}</p>
                                <p className="text-xs text-muted-foreground">at {formatTime(report.timeOfDay || 9)}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                  <FileText className="h-3 w-3" /> Content
                                </Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {report.includeCaseSummary && (
                                    <Badge variant="secondary" className="text-xs">Case Summary</Badge>
                                  )}
                                  {report.includeActivityReport && (
                                    <Badge variant="secondary" className="text-xs">Messages</Badge>
                                  )}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Activity className="h-3 w-3" /> Case Filter
                                </Label>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {report.caseStatusFilter === 'active' ? 'Active Cases' : 
                                   report.caseStatusFilter === 'closed' ? 'Closed Cases' : 'All Cases'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t">
                              <div className="text-xs text-muted-foreground">
                                {report.lastSentAt ? (
                                  <>Last sent: {new Date(report.lastSentAt).toLocaleDateString('en-GB', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                  })}</>
                                ) : (
                                  <span className="italic">Never sent</span>
                                )}
                                {' • '}Created: {new Date(report.createdAt).toLocaleDateString('en-GB', {
                                  day: 'numeric', month: 'short', year: 'numeric'
                                })}
                                {' • '}ID: {report.id}
                              </div>
                              {isSuperAdmin && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs sm:text-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedReportForAudit(report);
                                      setShowReportAuditDialog(true);
                                    }}
                                  >
                                    <History className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Audit </span>Logs
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs sm:text-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sendTestReportMutation.mutate(report.id);
                                    }}
                                    disabled={sendTestReportMutation.isPending}
                                  >
                                    {sendTestReportMutation.isPending ? (
                                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Send className="h-3 w-3 mr-1" />
                                    )}
                                    <span className="hidden sm:inline">Send </span>Test
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs sm:text-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingFromReportsTab(true);
                                      if (isOrgLevelReport) {
                                        const reportOrg = organisations?.find((o: any) => o.id === report.organisationId);
                                        if (reportOrg) {
                                          setSelectedOrgForReports(reportOrg);
                                          setEditingOrgReport(report);
                                          setOrgScheduleForm({
                                            recipientEmail: report.recipientEmail || '',
                                            recipientName: report.recipientName || '',
                                            frequency: report.frequency || 'weekly',
                                            dayOfWeek: report.dayOfWeek ?? 1,
                                            dayOfMonth: report.dayOfMonth ?? 1,
                                            timeOfDay: report.timeOfDay ?? 9,
                                            includeCaseSummary: report.includeCaseSummary ?? true,
                                            includeActivityReport: report.includeActivityReport ?? true,
                                            caseStatusFilter: report.caseStatusFilter || 'active',
                                            enabled: report.enabled ?? true,
                                          });
                                          setShowEditOrgReportForm(true);
                                          setShowOrgReportsDialog(true);
                                        }
                                      } else {
                                        const user = users?.find((u: any) => u.id === report.userId);
                                        if (user) {
                                          setScheduledReportUser(user);
                                          setEditingReportId(report.id);
                                          setScheduledReportOrgId(report.organisationId || null);
                                          setScheduledReportEnabled(report.enabled ?? false);
                                          setScheduledReportFrequency(report.frequency || 'weekly');
                                          setScheduledReportDayOfWeek(report.dayOfWeek ?? 1);
                                          setScheduledReportDayOfMonth(report.dayOfMonth ?? 1);
                                          setScheduledReportTimeOfDay(report.timeOfDay ?? 9);
                                          setScheduledReportCaseSummary(report.includeCaseSummary ?? true);
                                          setScheduledReportActivity(report.includeActivityReport ?? true);
                                          setScheduledReportCaseFilter(report.caseStatusFilter || 'active');
                                          setShowReportEditForm(true);
                                          setShowScheduledReportDialog(true);
                                        }
                                      }
                                    }}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg flex items-start gap-2">
                    <Activity className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p><strong>User reports:</strong> Configure via the Calendar icon in the Users tab.</p>
                      <p><strong>Organisation reports:</strong> Configure via the Calendar icon in the Organisations tab (sends to external recipients).</p>
                    </div>
                  </div>
                  <Pagination currentPage={reportsPage} totalPages={reportsTotalPages} onPageChange={(page) => {
                    setReportsPage(page);
                    requestAnimationFrame(() => {
                      reportsTableTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                  }} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escalation Reports Tab */}
        {isSuperAdmin && (
        <TabsContent value="escalation" className="space-y-6">
          <EscalationReportsTrigger />
        </TabsContent>
        )}

      </Tabs>

      {/* Edit Organization Dialog */}
      <Dialog open={showEditOrg} onOpenChange={setShowEditOrg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organisation</DialogTitle>
            <DialogDescription>
              Update the organisation details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editOrgName">Organisation Name</Label>
              <Input
                id="editOrgName"
                value={orgFormData.name}
                onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                placeholder="Enter organisation name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editOrgExternalRef">Client Code (Optional)</Label>
              <Input
                id="editOrgExternalRef"
                value={orgFormData.externalRef || ""}
                onChange={(e) => setOrgFormData({ ...orgFormData, externalRef: e.target.value || undefined })}
                placeholder="e.g., ABC123 or ABC123,DEF456,GHI789"
              />
              <p className="text-sm text-muted-foreground">
                Client code from case management system. For multiple codes, separate with commas (e.g., ABC123,DEF456).
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setShowEditOrg(false);
              setEditingOrg(null);
              setOrgFormData({ name: "", externalRef: "" });
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingOrg) {
                  updateOrganisationMutation.mutate({ 
                    id: editingOrg.id, 
                    data: orgFormData 
                  });
                }
              }}
              disabled={updateOrganisationMutation.isPending}
              className="bg-acclaim-teal hover:bg-acclaim-teal/90"
            >
              {updateOrganisationMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Org-level Scheduled Report Dialog */}
      <Dialog open={showOrgScheduleDialog} onOpenChange={setShowOrgScheduleDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Report for {selectedOrgForSchedule?.name}</DialogTitle>
            <DialogDescription>
              Create a scheduled report for this organisation. The report will be sent to the email address you specify.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Recipient Email *</Label>
              <Input
                id="recipientEmail"
                type="text"
                value={orgScheduleForm.recipientEmail}
                onChange={(e) => setOrgScheduleForm({ ...orgScheduleForm, recipientEmail: e.target.value })}
                placeholder="email@example.com; another@example.com"
              />
              <p className="text-xs text-gray-500">
                To send to more than one address, separate them with a semicolon (;).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                value={orgScheduleForm.recipientName}
                onChange={(e) => setOrgScheduleForm({ ...orgScheduleForm, recipientName: e.target.value })}
                placeholder="Contact Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select 
                value={orgScheduleForm.frequency} 
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setOrgScheduleForm({ ...orgScheduleForm, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {orgScheduleForm.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select 
                  value={String(orgScheduleForm.dayOfWeek)} 
                  onValueChange={(value) => setOrgScheduleForm({ ...orgScheduleForm, dayOfWeek: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {orgScheduleForm.frequency === 'monthly' && (
              <div className="space-y-2">
                <Label>Day of Month</Label>
                <Select 
                  value={String(orgScheduleForm.dayOfMonth)} 
                  onValueChange={(value) => setOrgScheduleForm({ ...orgScheduleForm, dayOfMonth: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Time of Day (Hour)</Label>
              <Select 
                value={String(orgScheduleForm.timeOfDay)} 
                onValueChange={(value) => setOrgScheduleForm({ ...orgScheduleForm, timeOfDay: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                    <SelectItem key={hour} value={String(hour)}>
                      {hour.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Case Status Filter</Label>
              <Select 
                value={orgScheduleForm.caseStatusFilter} 
                onValueChange={(value: 'active' | 'all' | 'closed') => setOrgScheduleForm({ ...orgScheduleForm, caseStatusFilter: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Cases Only</SelectItem>
                  <SelectItem value="all">All Cases</SelectItem>
                  <SelectItem value="closed">Closed Cases Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="includeCaseSummary"
                checked={orgScheduleForm.includeCaseSummary}
                onCheckedChange={(checked) => setOrgScheduleForm({ ...orgScheduleForm, includeCaseSummary: checked })}
              />
              <Label htmlFor="includeCaseSummary">Include Case Summary</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="includeActivityReport"
                checked={orgScheduleForm.includeActivityReport}
                onCheckedChange={(checked) => setOrgScheduleForm({ ...orgScheduleForm, includeActivityReport: checked })}
              />
              <Label htmlFor="includeActivityReport">Include Activity Report (Messages)</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowOrgScheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!orgScheduleForm.recipientEmail || !selectedOrgForSchedule) {
                  toast({
                    title: "Error",
                    description: "Please enter a recipient email address",
                    variant: "destructive",
                  });
                  return;
                }
                createOrgScheduledReportMutation.mutate({
                  organisationId: selectedOrgForSchedule.id,
                  recipientEmail: orgScheduleForm.recipientEmail,
                  recipientName: orgScheduleForm.recipientName,
                  frequency: orgScheduleForm.frequency,
                  dayOfWeek: orgScheduleForm.frequency === 'weekly' ? orgScheduleForm.dayOfWeek : undefined,
                  dayOfMonth: orgScheduleForm.frequency === 'monthly' ? orgScheduleForm.dayOfMonth : undefined,
                  timeOfDay: orgScheduleForm.timeOfDay,
                  includeCaseSummary: orgScheduleForm.includeCaseSummary,
                  includeActivityReport: orgScheduleForm.includeActivityReport,
                  caseStatusFilter: orgScheduleForm.caseStatusFilter,
                });
              }}
              disabled={createOrgScheduledReportMutation.isPending}
              className="bg-acclaim-teal hover:bg-acclaim-teal/90"
            >
              {createOrgScheduledReportMutation.isPending ? "Creating..." : "Create Schedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Manage Organisation Scheduled Reports Dialog */}
      <Dialog open={showOrgReportsDialog} onOpenChange={(open) => {
        setShowOrgReportsDialog(open);
        if (!open) {
          setSelectedOrgForReports(null);
          setEditingOrgReport(null);
          setShowEditOrgReportForm(false);
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Scheduled Reports for {selectedOrgForReports?.name}
            </DialogTitle>
            <DialogDescription>
              View, edit, or delete scheduled reports for this organisation
            </DialogDescription>
          </DialogHeader>
          
          {!showEditOrgReportForm ? (
            <div className="space-y-4">
              {orgReportsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin h-8 w-8 border-2 border-acclaim-teal border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Loading scheduled reports...</p>
                </div>
              ) : selectedOrgReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled reports for this organisation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedOrgReports.map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            {report.recipientEmail || report.userEmail}
                            {report.recipientName && (
                              <span className="text-gray-500 text-sm">({report.recipientName})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                            <Badge variant={report.recipientEmail ? "outline" : "secondary"} className={report.recipientEmail ? "border-acclaim-teal text-acclaim-teal" : "border-purple-500 text-purple-600"}>
                              {report.recipientEmail ? "Organisation" : "User"}
                            </Badge>
                            <Badge variant={report.enabled ? "default" : "secondary"}>
                              {report.enabled ? "Active" : "Disabled"}
                            </Badge>
                            <span className="capitalize">{report.frequency}</span>
                            <span>at {report.timeOfDay}:00</span>
                            {report.frequency === 'weekly' && (
                              <span>
                                ({['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][report.dayOfWeek || 0]})
                              </span>
                            )}
                            {report.frequency === 'monthly' && (
                              <span>(Day {report.dayOfMonth || 1})</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-3">
                            {report.includeCaseSummary && <span>Case Summary</span>}
                            {report.includeActivityReport && <span>Messages</span>}
                            <span className="capitalize">({report.caseStatusFilter || 'active'} cases)</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Created by: {report.userName || 'Unknown'}
                            {report.lastSentAt && (
                              <span> • Last sent: {new Date(report.lastSentAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReportForAudit(report);
                              setShowReportAuditDialog(true);
                            }}
                            title="View audit logs"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const recipient = report.recipientEmail || report.userEmail;
                              if (confirm(`Send a test report now to ${recipient}?`)) {
                                sendTestReportMutation.mutate(report.id);
                              }
                            }}
                            disabled={sendTestReportMutation.isPending}
                            title="Send test report"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingOrgReport(report);
                              setOrgScheduleForm({
                                recipientEmail: report.recipientEmail || '',
                                recipientName: report.recipientName || '',
                                frequency: report.frequency || 'weekly',
                                dayOfWeek: report.dayOfWeek || 1,
                                dayOfMonth: report.dayOfMonth || 1,
                                timeOfDay: report.timeOfDay || 9,
                                includeCaseSummary: report.includeCaseSummary ?? true,
                                includeActivityReport: report.includeActivityReport ?? true,
                                caseStatusFilter: report.caseStatusFilter || 'active',
                                enabled: report.enabled ?? true,
                              });
                              setShowEditOrgReportForm(true);
                            }}
                            title="Edit report"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this scheduled report?")) {
                                deleteScheduledReportMutation.mutate(report.id);
                              }
                            }}
                            disabled={deleteScheduledReportMutation.isPending}
                            title="Delete report"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedOrgForReports) {
                      setSelectedOrgForSchedule(selectedOrgForReports);
                      setOrgScheduleForm({
                        recipientEmail: '',
                        recipientName: '',
                        frequency: 'weekly',
                        dayOfWeek: 1,
                        dayOfMonth: 1,
                        timeOfDay: 9,
                        includeCaseSummary: true,
                        includeActivityReport: true,
                        caseStatusFilter: 'active',
                      });
                      setShowOrgReportsDialog(false);
                      setShowOrgScheduleDialog(true);
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Report
                </Button>
                <Button variant="outline" onClick={() => setShowOrgReportsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Show read-only user info for user-level reports, editable fields for org-level reports */}
              {editingOrgReport && !editingOrgReport.recipientEmail ? (
                <>
                  <div className="space-y-2">
                    <Label>User Email</Label>
                    <Input
                      value={editingOrgReport.userEmail || ''}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>User Name</Label>
                    <Input
                      value={editingOrgReport.userName || ''}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500">This is a user-level report. The recipient cannot be changed.</p>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="editRecipientEmail">Recipient Email</Label>
                    <Input
                      id="editRecipientEmail"
                      type="text"
                      value={orgScheduleForm.recipientEmail}
                      onChange={(e) => setOrgScheduleForm({ ...orgScheduleForm, recipientEmail: e.target.value })}
                      placeholder="email@example.com; another@example.com"
                    />
                    <p className="text-xs text-gray-500">
                      To send to more than one address, separate them with a semicolon (;).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editRecipientName">Recipient Name (optional)</Label>
                    <Input
                      id="editRecipientName"
                      value={orgScheduleForm.recipientName}
                      onChange={(e) => setOrgScheduleForm({ ...orgScheduleForm, recipientName: e.target.value })}
                      placeholder="Enter recipient name"
                    />
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={orgScheduleForm.frequency}
                    onValueChange={(v: 'daily' | 'weekly' | 'monthly') => setOrgScheduleForm({ ...orgScheduleForm, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select
                    value={String(orgScheduleForm.timeOfDay)}
                    onValueChange={(v) => setOrgScheduleForm({ ...orgScheduleForm, timeOfDay: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i-12}:00 PM`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {orgScheduleForm.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select
                    value={String(orgScheduleForm.dayOfWeek)}
                    onValueChange={(v) => setOrgScheduleForm({ ...orgScheduleForm, dayOfWeek: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                        <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {orgScheduleForm.frequency === 'monthly' && (
                <div className="space-y-2">
                  <Label>Day of Month</Label>
                  <Select
                    value={String(orgScheduleForm.dayOfMonth)}
                    onValueChange={(v) => setOrgScheduleForm({ ...orgScheduleForm, dayOfMonth: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => (
                        <SelectItem key={i+1} value={String(i+1)}>{i+1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Case Status</Label>
                <Select
                  value={orgScheduleForm.caseStatusFilter}
                  onValueChange={(v: 'active' | 'all' | 'closed') => setOrgScheduleForm({ ...orgScheduleForm, caseStatusFilter: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active Cases Only</SelectItem>
                    <SelectItem value="all">All Cases</SelectItem>
                    <SelectItem value="closed">Closed Cases Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIncludeCaseSummary"
                  checked={orgScheduleForm.includeCaseSummary}
                  onCheckedChange={(checked) => setOrgScheduleForm({ ...orgScheduleForm, includeCaseSummary: checked })}
                />
                <Label htmlFor="editIncludeCaseSummary">Include Case Summary</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIncludeActivityReport"
                  checked={orgScheduleForm.includeActivityReport}
                  onCheckedChange={(checked) => setOrgScheduleForm({ ...orgScheduleForm, includeActivityReport: checked })}
                />
                <Label htmlFor="editIncludeActivityReport">Include Activity Report (Messages)</Label>
              </div>
              
              <div className="flex items-center space-x-2 pt-4 border-t">
                <Switch
                  id="editReportEnabled"
                  checked={orgScheduleForm.enabled}
                  onCheckedChange={(checked) => setOrgScheduleForm({ ...orgScheduleForm, enabled: checked })}
                />
                <Label htmlFor="editReportEnabled" className="font-medium">
                  Report Enabled
                </Label>
                <span className="text-xs text-muted-foreground ml-2">
                  {orgScheduleForm.enabled ? '(Report will be sent on schedule)' : '(Report is paused)'}
                </span>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setShowEditOrgReportForm(false);
                  setEditingOrgReport(null);
                  if (editingFromReportsTab) {
                    setShowOrgReportsDialog(false);
                    setSelectedOrgForReports(null);
                    setEditingFromReportsTab(false);
                  }
                }}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!editingOrgReport) return;
                    updateScheduledReportMutation.mutate({
                      reportId: editingOrgReport.id,
                      data: {
                        recipientEmail: orgScheduleForm.recipientEmail || null,
                        recipientName: orgScheduleForm.recipientName || null,
                        frequency: orgScheduleForm.frequency,
                        dayOfWeek: orgScheduleForm.frequency === 'weekly' ? orgScheduleForm.dayOfWeek : null,
                        dayOfMonth: orgScheduleForm.frequency === 'monthly' ? orgScheduleForm.dayOfMonth : null,
                        timeOfDay: orgScheduleForm.timeOfDay,
                        includeCaseSummary: orgScheduleForm.includeCaseSummary,
                        includeActivityReport: orgScheduleForm.includeActivityReport,
                        caseStatusFilter: orgScheduleForm.caseStatusFilter,
                        enabled: orgScheduleForm.enabled,
                      }
                    });
                  }}
                  disabled={updateScheduledReportMutation.isPending}
                  className="bg-acclaim-teal hover:bg-acclaim-teal/90"
                >
                  {updateScheduledReportMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Assignment Dialog - Multi-Organisation Management */}
      <Dialog open={showAssignUser} onOpenChange={setShowAssignUser}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Organisation Assignments</DialogTitle>
            <DialogDescription>
              Manage {selectedUser?.firstName} {selectedUser?.lastName}'s organisation assignments
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Show current assignments */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Assignments:</Label>
              <div className="space-y-2">
                {/* Legacy organisation (from organisationId field) */}
                {selectedUser?.organisationName && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Badge variant="outline" className="mr-2">
                      {selectedUser.organisationName} (legacy)
                    </Badge>
                    <span className="text-xs text-gray-500">Primary organisation</span>
                  </div>
                )}
                {/* Additional organisations (from junction table) */}
                {(selectedUser as any)?.organisations?.map((org: Organisation & { role?: string }) => (
                  <div key={org.id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{org.name}</Badge>
                      {org.role === 'owner' && (
                        <Badge variant="default" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          <Crown className="h-2.5 w-2.5 mr-0.5" />
                          Owner
                        </Badge>
                      )}
                      {org.externalRef && (
                        <span className="text-xs text-gray-500">Ref: {org.externalRef}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!selectedUser?.isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 text-xs ${org.role === 'owner' ? 'text-amber-600 border-amber-300 hover:text-amber-800' : 'text-gray-600 hover:text-gray-800'}`}
                          onClick={() => {
                            const newRole = org.role === 'owner' ? 'member' : 'owner';
                            const action = newRole === 'owner' ? 'make an Owner of' : 'remove as Owner from';
                            const confirmation = confirm(`${action} ${org.name} for ${selectedUser?.firstName} ${selectedUser?.lastName}?`);
                            if (confirmation) {
                              setUserOrgRoleMutation.mutate({
                                userId: selectedUser!.id,
                                organisationId: org.id,
                                role: newRole
                              });
                            }
                          }}
                          disabled={setUserOrgRoleMutation.isPending}
                          title={org.role === 'owner' ? 'Remove Owner role' : 'Make Owner'}
                          data-testid={`button-toggle-owner-${org.id}`}
                        >
                          <Crown className="h-3 w-3 mr-1" />
                          {org.role === 'owner' ? 'Remove Owner' : 'Make Owner'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-red-500 hover:text-red-700"
                        onClick={() => {
                          const confirmation = confirm(`Remove ${selectedUser?.firstName} ${selectedUser?.lastName} from ${org.name}?`);
                          if (confirmation) {
                            removeUserFromOrgMutation.mutate({
                              userId: selectedUser!.id,
                              organisationId: org.id
                            });
                          }
                        }}
                        disabled={removeUserFromOrgMutation.isPending}
                        title={`Remove from ${org.name}`}
                        data-testid={`button-remove-org-${org.id}`}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                {!selectedUser?.organisationName && !(selectedUser as any)?.organisations?.length && (
                  <div className="p-2 bg-gray-50 rounded text-center text-gray-500">
                    No organisation assignments
                  </div>
                )}
              </div>
            </div>

            {/* Add to new organisation */}
            <div className="space-y-2">
              <Label htmlFor="newOrganisation" className="text-sm font-medium">Add to Organisation:</Label>
              <Popover open={orgAssignPopoverOpen} onOpenChange={setOrgAssignPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={orgAssignPopoverOpen}
                    className="w-full justify-between"
                  >
                    {selectedOrgId && selectedOrgId !== "none"
                      ? organisations?.find((org: Organisation) => org.id.toString() === selectedOrgId)?.name
                      : "Search and select organisation..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search organisations..." />
                    <CommandList>
                      <CommandEmpty>No organisation found.</CommandEmpty>
                      <CommandGroup>
                        {organisations?.filter((org: Organisation) => {
                          // Filter out already assigned organisations
                          const currentOrgIds = (selectedUser as any)?.organisations?.map((o: Organisation) => o.id) || [];
                          return !currentOrgIds.includes(org.id) && org.id !== selectedUser?.organisationId;
                        }).sort((a: Organisation, b: Organisation) => a.name.localeCompare(b.name)).map((org: Organisation) => (
                          <CommandItem
                            key={org.id}
                            value={`${org.name} ${org.externalRef || ''}`}
                            onSelect={() => {
                              setSelectedOrgId(org.id.toString());
                              setOrgAssignPopoverOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{org.name}</span>
                              {org.externalRef && (
                                <span className="text-xs text-muted-foreground">Ref: {org.externalRef}</span>
                              )}
                            </div>
                            {selectedOrgId === org.id.toString() && (
                              <Check className="ml-auto h-4 w-4" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignUser(false);
                setSelectedOrgId("none");
                setOrgAssignPopoverOpen(false);
              }}
              disabled={addUserToOrgMutation.isPending || removeUserFromOrgMutation.isPending}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedUser && selectedOrgId) {
                  const selectedOrg = organisations?.find(org => org.id.toString() === selectedOrgId);
                  const confirmMessage = `Add ${selectedUser.firstName} ${selectedUser.lastName} to ${selectedOrg?.name}${selectedOrg?.externalRef ? ` (Ref: ${selectedOrg.externalRef})` : ''}?`;
                  
                  if (confirm(confirmMessage)) {
                    addUserToOrgMutation.mutate({
                      userId: selectedUser.id,
                      organisationId: parseInt(selectedOrgId),
                    });
                    setSelectedOrgId("");
                  }
                }
              }}
              disabled={addUserToOrgMutation.isPending || !selectedOrgId}
              className="bg-acclaim-teal hover:bg-acclaim-teal/90"
            >
              {addUserToOrgMutation.isPending ? "Adding..." : "Add to Organisation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={(open) => { setShowResetPasswordDialog(open); if (!open) setResetPasswordResult(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary Password Generated</DialogTitle>
            <DialogDescription>
              A new temporary password has been set for {resetPasswordUser?.firstName} {resetPasswordUser?.lastName}. Please share it with them securely — they will be required to set a new password on first sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs text-amber-700 font-medium mb-2 uppercase tracking-wide">Temporary Password</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono font-bold text-amber-900 bg-amber-100 rounded px-3 py-2 select-all">
                  {resetPasswordResult?.tempPassword}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (resetPasswordResult?.tempPassword) {
                      navigator.clipboard.writeText(resetPasswordResult.tempPassword);
                      toast({ title: "Copied", description: "Temporary password copied to clipboard." });
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-amber-700 mt-2">Account: {resetPasswordResult?.email}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Next step:</strong> Use the Email button to send this user a password reset email, or share the temporary password with them directly.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (resetPasswordUser) sendWelcomeEmailMutation.mutate(resetPasswordUser.id);
                setShowResetPasswordDialog(false);
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button onClick={() => { setShowResetPasswordDialog(false); setResetPasswordResult(null); }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New User Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Created</DialogTitle>
            <DialogDescription>
              The user has been added to the system. Send them a welcome email to invite them to the portal.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {createdUserId && (
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-700 mb-3">
                  <strong>Send Welcome Email</strong><br />
                  Click below to send a welcome email to the user with a link to the portal.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                  <p className="text-xs text-amber-700">
                    <strong>Note:</strong> The user must be assigned to an organisation before sending a welcome email. Close this dialog and assign them first if needed.
                  </p>
                </div>
                <Button
                  onClick={handleSendWelcomeEmail}
                  disabled={sendingWelcomeEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {sendingWelcomeEmail ? (
                    <>
                      <Mail className="h-4 w-4 mr-2 animate-pulse" />
                      Sending Email...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Welcome Email
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => {
              setShowPasswordDialog(false);
              setCreatedUserId(null);
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Case Restrictions Dialog */}
      <Dialog open={!!manageRestrictionsUser} onOpenChange={(open) => {
        if (!open) {
          setManageRestrictionsUser(null);
          setSelectedLiftCaseIds([]);
          setSelectedRestoreCaseIds([]);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EyeOff className="h-5 w-5" />
              Manage Case Restrictions
            </DialogTitle>
            <DialogDescription>
              Temporarily lift case access restrictions for {manageRestrictionsUser?.firstName} {manageRestrictionsUser?.lastName}, then restore them later. Lifted cases are remembered so you can re-apply the same restrictions without missing any.
            </DialogDescription>
          </DialogHeader>

          {userRestrictionsLoading ? (
            <p className="text-sm text-gray-500 py-4">Loading restrictions…</p>
          ) : (
            <div className="space-y-6 py-2">
              {/* Currently restricted */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Currently restricted ({userRestrictions?.current.length ?? 0})</h3>
                  {(userRestrictions?.current.length ?? 0) > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedLiftCaseIds.length === 0 || liftRestrictionsMutation.isPending}
                        onClick={() => manageRestrictionsUser && liftRestrictionsMutation.mutate({ userId: manageRestrictionsUser.id, caseIds: selectedLiftCaseIds })}
                        data-testid="button-lift-selected"
                      >
                        Lift selected
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={liftRestrictionsMutation.isPending}
                        onClick={() => manageRestrictionsUser && liftRestrictionsMutation.mutate({ userId: manageRestrictionsUser.id, caseIds: (userRestrictions?.current ?? []).map(c => c.caseId) })}
                        data-testid="button-lift-all"
                      >
                        Lift all
                      </Button>
                    </div>
                  )}
                </div>
                {(userRestrictions?.current.length ?? 0) === 0 ? (
                  <p className="text-sm text-gray-500">This user has no active case restrictions.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userRestrictions?.current.map((c) => (
                      <div key={c.caseId} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50">
                        <Checkbox
                          id={`lift-${c.caseId}`}
                          checked={selectedLiftCaseIds.includes(c.caseId)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLiftCaseIds([...selectedLiftCaseIds, c.caseId]);
                            } else {
                              setSelectedLiftCaseIds(selectedLiftCaseIds.filter(id => id !== c.caseId));
                            }
                          }}
                          data-testid={`checkbox-lift-${c.caseId}`}
                        />
                        <label htmlFor={`lift-${c.caseId}`} className="flex-1 cursor-pointer">
                          <p className="text-sm font-medium">{c.caseName}</p>
                          <p className="text-xs text-gray-500">{c.accountNumber}{c.organisationName ? ` · ${c.organisationName}` : ''}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Previously lifted */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Previously lifted ({userRestrictions?.previouslyLifted.length ?? 0})</h3>
                  {(userRestrictions?.previouslyLifted.length ?? 0) > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedRestoreCaseIds.length === 0 || restoreRestrictionsMutation.isPending}
                        onClick={() => manageRestrictionsUser && restoreRestrictionsMutation.mutate({ userId: manageRestrictionsUser.id, caseIds: selectedRestoreCaseIds })}
                        data-testid="button-restore-selected"
                      >
                        Restore selected
                      </Button>
                      <Button
                        size="sm"
                        disabled={restoreRestrictionsMutation.isPending}
                        onClick={() => manageRestrictionsUser && restoreRestrictionsMutation.mutate({ userId: manageRestrictionsUser.id, caseIds: (userRestrictions?.previouslyLifted ?? []).map(c => c.caseId) })}
                        data-testid="button-restore-all"
                      >
                        Restore all
                      </Button>
                    </div>
                  )}
                </div>
                {(userRestrictions?.previouslyLifted.length ?? 0) === 0 ? (
                  <p className="text-sm text-gray-500">No previously lifted restrictions to restore.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userRestrictions?.previouslyLifted.map((c) => (
                      <div key={c.caseId} className="flex items-center space-x-3 p-2 border rounded bg-amber-50/50 hover:bg-amber-50">
                        <Checkbox
                          id={`restore-${c.caseId}`}
                          checked={selectedRestoreCaseIds.includes(c.caseId)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRestoreCaseIds([...selectedRestoreCaseIds, c.caseId]);
                            } else {
                              setSelectedRestoreCaseIds(selectedRestoreCaseIds.filter(id => id !== c.caseId));
                            }
                          }}
                          data-testid={`checkbox-restore-${c.caseId}`}
                        />
                        <label htmlFor={`restore-${c.caseId}`} className="flex-1 cursor-pointer">
                          <p className="text-sm font-medium">{c.caseName}</p>
                          <p className="text-xs text-gray-500">
                            {c.accountNumber}{c.organisationName ? ` · ${c.organisationName}` : ''}
                            {c.liftedAt ? ` · lifted ${new Date(c.liftedAt).toLocaleDateString('en-GB')}` : ''}
                          </p>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageRestrictionsUser(null)} data-testid="button-close-restrictions">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showScheduledReportDialog} onOpenChange={(open) => {
        setShowScheduledReportDialog(open);
        if (!open) {
          setShowReportEditForm(false);
          setEditingReportId(null);
        }
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Scheduled Reports</DialogTitle>
            <DialogDescription>
              Manage scheduled email reports for {scheduledReportUser?.firstName} {scheduledReportUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {!showReportEditForm ? (
            <div className="py-4">
              {/* List of existing reports */}
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {scheduledReportUser && scheduledReportsMap[scheduledReportUser.id]?.length > 0 ? (
                  scheduledReportsMap[scheduledReportUser.id].map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {report.organisationId ? getOrgName(report.organisationId) : "Combined Report"}
                          </span>
                          {report.enabled ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              {report.frequency}
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {report.enabled ? (
                            <>
                              {report.frequency === "daily" ? "Every day" : 
                               report.frequency === "weekly" ? `Every ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][report.dayOfWeek || 0]}` :
                               `Day ${report.dayOfMonth || 1} of each month`}
                              {" at "}
                              {report.timeOfDay === 0 ? "12:00 AM" : 
                               report.timeOfDay > 12 ? `${report.timeOfDay - 12}:00 PM` : 
                               report.timeOfDay === 12 ? "12:00 PM" : `${report.timeOfDay}:00 AM`}
                            </>
                          ) : "Report is disabled"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedReportForAudit(report);
                            setShowReportAuditDialog(true);
                          }}
                          title="View audit logs"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => sendTestReportMutation.mutate(report.id)}
                          disabled={sendTestReportMutation.isPending}
                          title="Send test report"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditReportForm(report)}
                          title="Edit report"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteScheduledReportMutation.mutate(report.id)}
                          disabled={deleteScheduledReportMutation.isPending}
                          className="text-red-500 hover:text-red-700"
                          title="Delete report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No scheduled reports configured</p>
                    <p className="text-xs mt-1">Add a report to send periodic email summaries</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowScheduledReportDialog(false)}>
                  Close
                </Button>
                <Button onClick={openNewReportForm} className="bg-acclaim-teal hover:bg-acclaim-teal/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Report
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {/* Organisation selection for new reports */}
              {editingReportId === null && (
                <div className="space-y-2">
                  <Label className="font-medium">Report Scope</Label>
                  <Select 
                    value={scheduledReportOrgId === null ? "combined" : String(scheduledReportOrgId)} 
                    onValueChange={(v) => setScheduledReportOrgId(v === "combined" ? null : parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organisation or combined" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="combined">All Organisations (Combined Report)</SelectItem>
                      {scheduledReportUser && getUserOrganisations(scheduledReportUser as any).map((org) => (
                        <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Choose a specific organisation or create a combined report for all
                  </p>
                </div>
              )}

              {/* Enable/Disable toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sr-enabled" className="font-medium">
                    Enable Report
                  </Label>
                  <p className="text-sm text-gray-500">Send reports on schedule</p>
                </div>
                <Checkbox
                  id="sr-enabled"
                  checked={scheduledReportEnabled}
                  onCheckedChange={(checked) => setScheduledReportEnabled(checked === true)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Frequency</Label>
                <Select value={scheduledReportFrequency} onValueChange={(v: "daily" | "weekly" | "monthly") => setScheduledReportFrequency(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Time of Day</Label>
                <Select value={String(scheduledReportTimeOfDay)} onValueChange={(v) => setScheduledReportTimeOfDay(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i;
                      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                      const period = hour < 12 ? 'AM' : 'PM';
                      return (
                        <SelectItem key={hour} value={String(hour)}>
                          {displayHour}:00 {period}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {scheduledReportFrequency === "weekly" && (
                <div className="space-y-2">
                  <Label className="font-medium">Day of Week</Label>
                  <Select value={String(scheduledReportDayOfWeek)} onValueChange={(v) => setScheduledReportDayOfWeek(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {scheduledReportFrequency === "monthly" && (
                <div className="space-y-2">
                  <Label className="font-medium">Day of Month</Label>
                  <Select value={String(scheduledReportDayOfMonth)} onValueChange={(v) => setScheduledReportDayOfMonth(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-3">
                <Label className="font-medium">Report Contents</Label>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm font-medium">Case Summary</span>
                    <p className="text-xs text-gray-500">Case name, account number, debtor, status, amounts</p>
                  </div>
                  <Checkbox
                    checked={scheduledReportCaseSummary}
                    onCheckedChange={(checked) => setScheduledReportCaseSummary(checked === true)}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm font-medium">Messages Report</span>
                    <p className="text-xs text-gray-500">All messages received during the period</p>
                  </div>
                  <Checkbox
                    checked={scheduledReportActivity}
                    onCheckedChange={(checked) => setScheduledReportActivity(checked === true)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Include Cases</Label>
                <Select value={scheduledReportCaseFilter} onValueChange={(v: "active" | "all" | "closed") => setScheduledReportCaseFilter(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active cases only</SelectItem>
                    <SelectItem value="all">All cases</SelectItem>
                    <SelectItem value="closed">Closed cases only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setShowReportEditForm(false);
                  if (editingFromReportsTab) {
                    setShowScheduledReportDialog(false);
                    setScheduledReportUser(null);
                    setEditingFromReportsTab(false);
                  }
                }}>
                  {editingFromReportsTab ? 'Cancel' : 'Back'}
                </Button>
                <Button
                  onClick={() => {
                    if (scheduledReportUser) {
                      const reportData = {
                        organisationId: scheduledReportOrgId,
                        enabled: scheduledReportEnabled,
                        frequency: scheduledReportFrequency,
                        dayOfWeek: scheduledReportDayOfWeek,
                        dayOfMonth: scheduledReportDayOfMonth,
                        timeOfDay: scheduledReportTimeOfDay,
                        includeCaseSummary: scheduledReportCaseSummary,
                        includeActivityReport: scheduledReportActivity,
                        caseStatusFilter: scheduledReportCaseFilter,
                      };
                      
                      if (editingReportId !== null) {
                        updateScheduledReportMutation.mutate({ reportId: editingReportId, data: reportData });
                      } else {
                        createScheduledReportMutation.mutate({ userId: scheduledReportUser.id, data: reportData });
                      }
                    }
                  }}
                  disabled={createScheduledReportMutation.isPending || updateScheduledReportMutation.isPending}
                  className="bg-acclaim-teal hover:bg-acclaim-teal/90"
                >
                  {(createScheduledReportMutation.isPending || updateScheduledReportMutation.isPending) 
                    ? "Saving..." 
                    : editingReportId !== null ? "Update Report" : "Create Report"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Audit Logs Dialog */}
      <Dialog open={showReportAuditDialog} onOpenChange={(open) => {
        setShowReportAuditDialog(open);
        if (!open) setSelectedReportForAudit(null);
      }}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <History className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Report #{selectedReportForAudit?.id} Audit Logs</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm truncate">
              {selectedReportForAudit?.recipientEmail || selectedReportForAudit?.userEmail}
              {selectedReportForAudit?.recipientName && ` (${selectedReportForAudit.recipientName})`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 sm:space-y-3">
            {reportAuditLogsLoading ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">Loading audit logs...</div>
            ) : reportAuditLogs.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <History className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm">No audit logs found for this report</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reportAuditLogs.map((log: any) => (
                  <div key={log.id} className={`border rounded-lg p-2 sm:p-3 text-xs sm:text-sm ${
                    log.operation === 'SEND' ? 'border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800' :
                    log.operation === 'SKIP' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800' :
                    log.operation === 'ERROR' ? 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800' :
                    'border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <Badge variant={
                          log.operation === 'SEND' ? 'default' :
                          log.operation === 'SKIP' ? 'secondary' :
                          log.operation === 'ERROR' ? 'destructive' :
                          'outline'
                        } className={`text-xs ${
                          log.operation === 'SEND' ? 'bg-green-600' :
                          log.operation === 'SKIP' ? 'bg-amber-500 text-white' :
                          ''
                        }`}>
                          {log.operation}
                        </Badge>
                        <span className="text-gray-500 text-xs">
                          {new Date(log.timestamp).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 break-words">{log.description}</p>
                      {log.newValue && (
                        <div className="text-xs text-gray-500">
                          {(() => {
                            try {
                              const data = JSON.parse(log.newValue);
                              if (data.reason) {
                                return (
                                  <span className="inline-flex flex-wrap items-center gap-1">
                                    <span className="font-medium">Reason:</span>
                                    <span className="break-words">
                                      {data.reason === 'no_messages' ? 'No new messages to include' :
                                       data.reason === 'user_not_activated' ? 'User has not completed first login' :
                                       data.reason === 'organisations_disabled' ? 'Scheduled reports disabled for organisations' :
                                       data.reason}
                                    </span>
                                  </span>
                                );
                              }
                              return null;
                            } catch {
                              return null;
                            }
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowReportAuditDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      </>
      )}
    </div>
  );
}