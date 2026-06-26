import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FolderOpen, CheckCircle, PoundSterling, TrendingUp, User, Building, Clock, FileText, Check, AlertTriangle, Store, UserCheck, Plus, Info, Send, Paperclip, X, History } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { validateFile, ACCEPTED_FILE_TYPES_STRING, MAX_FILE_SIZE_MB, ACCEPTED_FILE_TYPES_DISPLAY } from "@/lib/fileValidation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import CaseDetail from "./CaseDetail";
import RefreshIndicator from "./RefreshIndicator";
import acclaimRoseLogo from "@assets/acclaim_rose_transparent_1768474381340.png";
import { trackRecentlyViewed, getRecentlyViewedEntries } from "@/lib/recentlyViewed";


interface DashboardProps {
  setActiveSection?: (section: string) => void;
}

export default function Dashboard({ setActiveSection }: DashboardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [dialogReplyMessage, setDialogReplyMessage] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [replyCustomFileName, setReplyCustomFileName] = useState<string>("");
  const [replyFileValidationError, setReplyFileValidationError] = useState<string | null>(null);
  const [isDragOverAttachment, setIsDragOverAttachment] = useState(false);
  const [showAccessibleOnly, setShowAccessibleOnly] = useState(false);

  // Check if user has any case restrictions
  const { data: restrictionStatus } = useQuery({
    queryKey: ["/api/user/has-case-restrictions"],
    enabled: !user?.isAdmin, // Only check for non-admin users
    staleTime: 30000,
  });

  const hasRestrictions = restrictionStatus?.hasRestrictions ?? false;

  const { data: stats, isLoading: statsLoading, isFetching: statsIsFetching, dataUpdatedAt: statsDataUpdatedAt } = useQuery({
    queryKey: ["/api/dashboard/stats", showAccessibleOnly ? "accessible" : "all"],
    queryFn: async () => {
      const url = showAccessibleOnly 
        ? "/api/dashboard/stats?accessibleOnly=true" 
        : "/api/dashboard/stats";
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 15000, // Refresh every 15 seconds for stats
    staleTime: 0, // Always consider stats data stale to ensure fresh data
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
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    },
  });

  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ["/api/cases"],
    refetchInterval: 10000, // Refresh every 10 seconds for cases
    staleTime: 0, // Always consider cases data stale to ensure fresh data
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
        description: "Failed to load cases",
        variant: "destructive",
      });
    },
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages"],
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 0,
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

  // Mutation to track message views (read receipts)
  const trackViewMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("POST", "/api/track/view", { type: "message", id: messageId });
    },
  });

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Mutation to send message reply
  const sendReplyMutation = useMutation({
    mutationFn: async (data: { caseId: number; subject: string; content: string }) => {
      const formData = new FormData();
      formData.append("recipientType", "admin");
      formData.append("recipientId", "");
      formData.append("subject", data.subject);
      formData.append("content", data.content);
      formData.append("caseId", String(data.caseId));
      if (replyFile) {
        formData.append("attachment", replyFile);
        if (replyCustomFileName.trim()) {
          formData.append("customFileName", replyCustomFileName.trim());
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
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setDialogReplyMessage("");
      setReplyFile(null);
      setReplyCustomFileName("");
      setReplyFileValidationError(null);
      setMessageDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStageBadge = (status: string, stage: string) => {
    if (status === "resolved" || status?.toLowerCase() === "closed") {
      return <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300"><Check className="w-3 h-3 mr-1" />Closed</Badge>;
    }
    
    // Normalize stage for consistent comparison
    const normalizedStage = stage?.toLowerCase().replace(/[_-\s]/g, '');
    
    switch (normalizedStage) {
      case "initialcontact":
      case "prelegal":
        return <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">Pre-Legal</Badge>;
      case "claim":
        return <Badge className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300">Claim</Badge>;
      case "judgment":
      case "judgement":
        return <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300">Judgment</Badge>;
      case "enforcement":
        return <Badge className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">Enforcement</Badge>;
      case "paymentplan":
        return <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">Payment Plan</Badge>;
      case "paid":
        return <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">Paid</Badge>;
      case "legalaction":
        return <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300">Legal Action</Badge>;
      default:
        // Display the actual stage name, formatted nicely
        const formattedStage = stage?.replace(/[_-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') || 'Active';
        return <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">{formattedStage}</Badge>;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "secondary";
      case "active":
        return "default";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getDebtorIcon = (debtorType: string) => {
    const normalizedType = debtorType?.toLowerCase().replace(/[\s-]/g, '_') || '';
    switch (normalizedType) {
      case 'individual':
        return <User className="text-acclaim-teal h-4 w-4" />;
      case 'company':
        return <Building className="text-acclaim-teal h-4 w-4" />;
      case 'sole_trader':
      case 'soletrader':
        return <Store className="text-acclaim-teal h-4 w-4" />;
      case 'company_and_individual':
      case 'companyandindividual':
        return <UserCheck className="text-acclaim-teal h-4 w-4" />;
      default:
        return <User className="text-acclaim-teal h-4 w-4" />;
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
    const date = new Date(dateString);
    const now = new Date();
    
    // Compare calendar dates, not time differences
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((todayOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const caseMessageDates = new Map<number, Date>();
  messages?.forEach((msg: any) => {
    if (msg.caseId) {
      const existing = caseMessageDates.get(msg.caseId);
      const msgDate = new Date(msg.createdAt);
      if (!existing || msgDate > existing) {
        caseMessageDates.set(msg.caseId, msgDate);
      }
    }
  });
  const recentCases = cases
    ?.filter((c: any) => caseMessageDates.has(c.id))
    .sort((a: any, b: any) => (caseMessageDates.get(b.id)?.getTime() ?? 0) - (caseMessageDates.get(a.id)?.getTime() ?? 0))
    .slice(0, 8) ?? [];
  const recentMessages = messages?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5) || [];

  const [recentlyViewedEntries, setRecentlyViewedEntries] = useState(getRecentlyViewedEntries);

  const handleCaseClick = (caseData: any) => {
    setSelectedCase(caseData);
    setDialogOpen(true);
    trackRecentlyViewed(caseData.id);
    setRecentlyViewedEntries(getRecentlyViewedEntries());
  };

  const recentlyViewedCases = recentlyViewedEntries
    .map((entry) => {
      const found = cases?.find((c: any) => c.id === entry.id);
      return found ? { ...found, viewedAt: entry.viewedAt } : null;
    })
    .filter(Boolean) as any[];

  const handleMessageClick = (messageData: any) => {
    setSelectedMessage(messageData);
    setMessageDialogOpen(true);
    setDialogReplyMessage("");
    // Track view for read receipts
    trackViewMutation.mutate(messageData.id);
  };

  // Format date for display
  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle reply from message dialog
  const handleDialogReply = () => {
    if (!dialogReplyMessage.trim() || !selectedMessage) return;
    
    const fromName = selectedMessage.senderName || selectedMessage.senderEmail || 'Unknown';
    const replyContent = `${dialogReplyMessage}\n\n--- Original Message ---\nFrom: ${fromName}\nDate: ${formatFullDate(selectedMessage.createdAt)}\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.content}`;
    
    sendReplyMutation.mutate({
      caseId: selectedMessage.caseId,
      subject: `Re: ${selectedMessage.subject || 'Message'}`,
      content: replyContent,
    });
  };

  const getCaseAccountNumber = (caseId: number) => {
    const caseData = cases?.find((c: any) => c.id === caseId);
    return caseData?.accountNumber || `Case #${caseId}`;
  };

  const handleCaseClickFromMessage = (caseId: number) => {
    const caseData = cases?.find((c: any) => c.id === caseId);
    if (caseData) {
      setMessageDialogOpen(false);
      setSelectedCase(caseData);
      setDialogOpen(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome to your debt recovery portal</p>
        </div>
        {user?.canSubmitCases !== false && (
          <Button 
            className="bg-white hover:bg-acclaim-teal/10 text-[#008a8a] border border-[#008a8a]"
            onClick={() => setLocation("/submit-case")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit New Case
          </Button>
        )}
      </div>

      {/* Live Cases Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <TrendingUp className="text-green-600 dark:text-green-400 h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Live Cases Stats</h2>
          </div>

        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                  <FolderOpen className="text-amber-600 dark:text-amber-400 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Active Cases</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {statsLoading ? "..." : stats?.activeCases || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex-shrink-0">
                  <PoundSterling className="text-blue-600 dark:text-blue-400 h-6 w-6" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Outstanding</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 break-all">
                    {statsLoading ? "..." : formatCurrency(stats?.totalOutstanding || 0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">*Active cases only</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex-shrink-0">
                  <PoundSterling className="text-purple-600 dark:text-purple-400 h-6 w-6" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Recovery</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 break-all">
                    {statsLoading ? "..." : `£${parseFloat(stats?.totalRecovery || '0').toLocaleString()}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">*Active cases only</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
                  <CheckCircle className="text-green-600 dark:text-green-400 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Closed Cases</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {statsLoading ? "..." : stats?.closedCases || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">*For reference</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-2 text-center space-y-2">
          {hasRestrictions && !user?.isAdmin ? (
            <>
              <div className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <Info className="h-3 w-3" />
                <span>
                  {showAccessibleOnly 
                    ? "Statistics are based on cases you have access to"
                    : "Statistics are based on all cases across your organisation(s) — may include cases which have not been made visible to you"}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Switch
                  id="accessible-only"
                  checked={showAccessibleOnly}
                  onCheckedChange={setShowAccessibleOnly}
                />
                <Label htmlFor="accessible-only" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                  Show only cases I have access to
                </Label>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Statistics are based on all cases across your organisation(s)
            </p>
          )}
        </div>
      </div>
      {/* Recent Cases and Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Cases */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Cases with Updates</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {casesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                    </div>
                    <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            ) : recentCases.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentCases.map((case_: any) => (
                  <div
                    key={case_.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer group"
                    onClick={() => handleCaseClick(case_)}
                  >
                    {/* left accent + icon */}
                    <div className={`w-1 self-stretch rounded-full shrink-0 ${case_.status === 'closed' ? 'bg-gray-300 dark:bg-gray-600' : 'bg-teal-500'}`} />
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-teal-50 dark:bg-teal-900/30 ring-1 ring-teal-200 dark:ring-teal-800">
                      {getDebtorIcon(case_.debtorType)}
                    </div>
                    {/* text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {case_.caseName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {case_.accountNumber}
                        {case_.organisationName && <span className="text-gray-400 dark:text-gray-500"> · {case_.organisationName}</span>}
                      </p>
                    </div>
                    {/* right */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(case_.outstandingAmount)}
                      </p>
                      <div className="mt-0.5">{getStageBadge(case_.status, case_.stage)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderOpen className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No cases found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Messages</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { if (setActiveSection) setActiveSection("messages"); }}
                className="text-xs h-7 px-2 text-acclaim-teal border-acclaim-teal hover:bg-acclaim-teal hover:text-white"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {messagesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-start gap-3 p-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentMessages.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentMessages.map((message: any) => {
                  const senderLabel = message.senderName || message.senderEmail || 'Unknown';
                  const initials = senderLabel.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                  const caseData = message.caseId ? cases?.find((c: any) => c.id === message.caseId) : null;
                  return (
                    <div
                      key={message.id}
                      className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer group"
                      onClick={() => handleMessageClick(message)}
                    >
                      {/* avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${message.senderIsAdmin ? 'bg-white border-2 border-acclaim-teal' : 'bg-white border-2 border-blue-300'}`}>
                        {message.senderIsAdmin ? (
                          <img src={acclaimRoseLogo} alt="Acclaim" className="w-6 h-6 object-contain" />
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
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {message.content}
                        </p>
                        {caseData && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">
                            <FileText className="h-2.5 w-2.5" />
                            {caseData.caseName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No messages found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently Viewed */}
      {recentlyViewedCases.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-gray-400" />
              <CardTitle className="text-base font-semibold">Recently Viewed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {recentlyViewedCases.map((case_: any) => (
                <button
                  key={case_.id}
                  onClick={() => handleCaseClick(case_)}
                  className="group flex-shrink-0 w-52 text-left bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 hover:border-acclaim-teal hover:shadow-sm dark:hover:border-acclaim-teal transition-all duration-150"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-snug mb-1.5">
                    {case_.caseName}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2.5 truncate">
                    Acc: {case_.accountNumber}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs">{getStageBadge(case_.status, case_.stage)}</div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{formatDate(case_.viewedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Case Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[92vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle>Case Details</DialogTitle>
            <DialogDescription>
              View comprehensive case information including timeline, documents, and messages.
            </DialogDescription>
          </DialogHeader>
          {selectedCase && (
            <CaseDetail case={selectedCase} />
          )}
        </DialogContent>
      </Dialog>

      {/* Message Detail Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={(open) => {
        setMessageDialogOpen(open);
        if (!open) {
          setDialogReplyMessage("");
          setReplyFile(null);
          setReplyCustomFileName("");
          setReplyFileValidationError(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              {/* Sender info at the top */}
              <div className="flex items-center space-x-3 pb-3 border-b">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${selectedMessage.senderIsAdmin ? 'bg-white border-2 border-acclaim-teal' : 'bg-acclaim-teal bg-opacity-10'}`}>
                  {selectedMessage.senderIsAdmin ? (
                    <img src={acclaimRoseLogo} alt="Acclaim" className="w-7 h-7 object-contain" />
                  ) : (
                    <User className="text-acclaim-teal h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedMessage.senderIsAdmin ? 'Acclaim Team' : (selectedMessage.senderName || 'Unknown')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedMessage.senderEmail || 'System Message'} • {formatDate(selectedMessage.createdAt)}
                  </p>
                </div>
              </div>

              {/* Case info if linked */}
              {selectedMessage.caseId && (
                <div className="bg-acclaim-teal/5 border border-acclaim-teal/20 p-3 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Case:</span>{" "}
                    <button
                      onClick={() => handleCaseClickFromMessage(selectedMessage.caseId)}
                      className="text-acclaim-teal hover:text-acclaim-teal/80 font-medium underline cursor-pointer"
                    >
                      {getCaseAccountNumber(selectedMessage.caseId)}
                    </button>
                    {(() => {
                      const caseData = cases?.find((c: any) => c.id === selectedMessage.caseId);
                      return caseData?.caseName ? (
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          — {caseData.caseName}
                        </span>
                      ) : null;
                    })()}
                  </p>
                </div>
              )}

              {/* Subject and content */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedMessage.subject || "System Message"}
                </h3>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {selectedMessage.content}
                </p>
              </div>
              
              {/* Reply Section - only show if message has a case */}
              {selectedMessage.caseId && (
                <div className="mt-4 pt-4 border-t">
                  <Label className="text-sm font-medium">Reply</Label>
                  <Textarea
                    placeholder="Type your reply..."
                    value={dialogReplyMessage}
                    onChange={(e) => setDialogReplyMessage(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />

                  <div className="mt-3 space-y-2">
                    <Label className="text-sm font-medium">Attachment <span className="text-gray-400 font-normal">(optional)</span></Label>
                    <input
                      id="reply-attachment"
                      type="file"
                      accept={ACCEPTED_FILE_TYPES_STRING}
                      className="sr-only"
                      data-testid="input-reply-attachment"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setReplyCustomFileName("");
                        if (file) {
                          const validation = validateFile(file);
                          if (!validation.isValid) { setReplyFileValidationError(validation.error); setReplyFile(null); e.target.value = ''; return; }
                        }
                        setReplyFileValidationError(null);
                        setReplyFile(file);
                        e.target.value = '';
                      }}
                    />
                    {!replyFile ? (
                      <label
                        htmlFor="reply-attachment"
                        onDragOver={(e) => { e.preventDefault(); setIsDragOverAttachment(true); }}
                        onDragLeave={() => setIsDragOverAttachment(false)}
                        onDrop={(e) => {
                          e.preventDefault(); setIsDragOverAttachment(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) { const v = validateFile(file); if (!v.isValid) { setReplyFileValidationError(v.error); } else { setReplyFileValidationError(null); setReplyFile(file); } }
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
                          const ext = replyFile.name.split('.').pop()?.toUpperCase() || '?';
                          const extColor = ext === 'PDF' ? 'bg-red-50 text-red-500 border-red-100' : ['DOC','DOCX'].includes(ext) ? 'bg-blue-50 text-blue-500 border-blue-100' : ['XLS','XLSX'].includes(ext) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ['PNG','JPG','JPEG','GIF','WEBP'].includes(ext) ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100';
                          return <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border ${extColor}`}>{ext.slice(0,4)}</div>;
                        })()}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{replyFile.name}</p>
                          <p className="text-xs text-gray-400">{(replyFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={() => { setReplyFile(null); setReplyFileValidationError(null); }} className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-1">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {replyFileValidationError && (
                      <p className="text-xs text-red-600">{replyFileValidationError}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleDialogReply}
                    disabled={!dialogReplyMessage.trim() || sendReplyMutation.isPending}
                    className="mt-3 bg-acclaim-teal hover:bg-acclaim-teal/90 w-full"
                    data-testid="button-send-reply"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendReplyMutation.isPending ? "Sending..." : "Send Reply"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
