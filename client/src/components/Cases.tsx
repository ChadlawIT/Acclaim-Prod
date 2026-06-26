import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, Building, Store, UserCheck, Filter, Bell, BellOff, ChevronRight, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/use-auth";
import CaseDetail from "./CaseDetail";
import { trackRecentlyViewed } from "@/lib/recentlyViewed";

const SORT_STORAGE_KEY = "cases-sort-preference";

type SortOption =
  | "accountNumber-desc"
  | "accountNumber-asc"
  | "caseName-asc"
  | "stage-asc"
  | "status-asc"
  | "balance-desc"
  | "balance-asc";

function getSavedSort(): SortOption {
  try {
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    if (saved) return saved as SortOption;
  } catch {}
  return "accountNumber-desc";
}

function normaliseStage(stage: string): string {
  return stage?.toLowerCase().replace(/[_\-\s]/g, "") || "";
}

function stageDisplayLabel(status: string, stage: string): string {
  if (status === "resolved" || status?.toLowerCase() === "closed") return "Closed";
  const n = normaliseStage(stage);
  switch (n) {
    case "initialcontact":
    case "prelegal":    return "Pre-Legal";
    case "claim":       return "Claim";
    case "judgment":
    case "judgement":   return "Judgment";
    case "enforcement": return "Enforcement";
    case "paymentplan": return "Payment Plan";
    case "paid":        return "Paid";
    case "legalaction": return "Legal Action";
    default:            return stage?.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Active";
  }
}

function stageMatchesFilter(stage: string, stageFilter: string): boolean {
  if (stageFilter === "all") return true;
  const n = normaliseStage(stage);
  switch (stageFilter) {
    case "pre-legal":   return n === "prelegal" || n === "initialcontact";
    case "claim":       return n === "claim";
    case "judgment":    return n === "judgment" || n === "judgement";
    case "enforcement": return n === "enforcement";
    default:            return n === normaliseStage(stageFilter);
  }
}

function sortCases(cases: any[], sortBy: SortOption): any[] {
  return [...cases].sort((a, b) => {
    switch (sortBy) {
      case "accountNumber-desc": {
        const aNum = parseFloat(a.accountNumber) || 0;
        const bNum = parseFloat(b.accountNumber) || 0;
        if (bNum !== aNum) return bNum - aNum;
        return b.accountNumber.localeCompare(a.accountNumber);
      }
      case "accountNumber-asc": {
        const aNum = parseFloat(a.accountNumber) || 0;
        const bNum = parseFloat(b.accountNumber) || 0;
        if (aNum !== bNum) return aNum - bNum;
        return a.accountNumber.localeCompare(b.accountNumber);
      }
      case "caseName-asc":
        return (a.caseName || "").localeCompare(b.caseName || "");
      case "stage-asc":
        return stageDisplayLabel(a.status, a.stage).localeCompare(stageDisplayLabel(b.status, b.stage));
      case "status-asc": {
        const aActive = a.status !== "resolved" && a.status?.toLowerCase() !== "closed" ? 0 : 1;
        const bActive = b.status !== "resolved" && b.status?.toLowerCase() !== "closed" ? 0 : 1;
        return aActive - bActive;
      }
      case "balance-desc": {
        const aAmt = parseFloat(a.outstandingAmount) || 0;
        const bAmt = parseFloat(b.outstandingAmount) || 0;
        return bAmt - aAmt;
      }
      case "balance-asc": {
        const aAmt = parseFloat(a.outstandingAmount) || 0;
        const bAmt = parseFloat(b.outstandingAmount) || 0;
        return aAmt - bAmt;
      }
      default:
        return 0;
    }
  });
}

export default function Cases() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [stageFilter, setStageFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>(getSavedSort);
  const [currentPage, setCurrentPage] = useState(1);
  const casesPerPage = 21;
  const { toast } = useToast();
  const { user } = useAuth();

  // Persist sort preference
  useEffect(() => {
    try {
      localStorage.setItem(SORT_STORAGE_KEY, sortBy);
    } catch {}
  }, [sortBy]);

  const { data: cases, isLoading } = useQuery({
    queryKey: ["/api/cases"],
    refetchInterval: 10000,
    staleTime: 0,
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorised", description: "You are logged out. Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to load cases", variant: "destructive" });
    },
  });

  const { data: mutedCasesData } = useQuery<{ mutedCaseIds: number[] }>({
    queryKey: ["/api/user/muted-cases"],
    staleTime: 30000,
  });
  const mutedCaseIds = mutedCasesData?.mutedCaseIds || [];

  // Scroll-to-case from Messages navigation
  useEffect(() => {
    const scrollToCaseId = localStorage.getItem("scrollToCaseId");
    if (scrollToCaseId && cases && cases.length > 0) {
      localStorage.removeItem("scrollToCaseId");
      setTimeout(() => {
        const el = document.getElementById(`case-${scrollToCaseId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-acclaim-teal", "ring-opacity-50");
          setTimeout(() => el.classList.remove("ring-2", "ring-acclaim-teal", "ring-opacity-50"), 3000);
        }
      }, 100);
    }
  }, [cases]);

  const filteredCases = cases?.filter((case_: any) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      case_.caseName.toLowerCase().includes(searchLower) ||
      case_.accountNumber.toLowerCase().includes(searchLower) ||
      case_.debtorEmail?.toLowerCase().includes(searchLower) ||
      case_.organisationName?.toLowerCase().includes(searchLower);

    if (searchTerm.trim()) return matchesSearch;

    const isActive = case_.status !== "resolved" && case_.status?.toLowerCase() !== "closed";
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isActive) ||
      (statusFilter === "closed" && !isActive);

    const matchesStage = stageMatchesFilter(case_.stage, stageFilter);

    return matchesStatus && matchesStage;
  }) || [];

  const sortedCases = sortCases(filteredCases, sortBy);

  const totalPages = Math.ceil(sortedCases.length / casesPerPage);
  const startIndex = (currentPage - 1) * casesPerPage;
  const paginatedCases = sortedCases.slice(startIndex, startIndex + casesPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, stageFilter, sortBy]);

  const getStageBadge = (status: string, stage: string) => {
    if (status === "resolved" || status?.toLowerCase() === "closed") {
      return { label: "Closed", cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400" };
    }
    const n = stage?.toLowerCase().replace(/[_\-\s]/g, "") || "";
    switch (n) {
      case "initialcontact":
      case "prelegal":   return { label: "Pre-Legal",   cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" };
      case "claim":      return { label: "Claim",       cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" };
      case "judgment":
      case "judgement":  return { label: "Judgment",    cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" };
      case "enforcement":return { label: "Enforcement", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" };
      case "paymentplan":return { label: "Payment Plan",cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" };
      case "paid":       return { label: "Paid",        cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" };
      case "legalaction":return { label: "Legal Action",cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" };
      default: {
        const label = stage?.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Active";
        return { label, cls: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" };
      }
    }
  };

  const getDebtorIcon = (debtorType: string) => {
    const n = debtorType?.toLowerCase().replace(/[\s-]/g, "_") || "";
    const cls = "h-5 w-5 text-acclaim-teal";
    if (n === "company") return <Building className={cls} />;
    if (n === "sole_trader" || n === "soletrader") return <Store className={cls} />;
    if (n === "company_and_individual" || n === "companyandindividual") return <UserCheck className={cls} />;
    return <User className={cls} />;
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(num);
  };

  return (
    <div className="space-y-5">
      {/* Search + Filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, account, email or organisation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-case-search"
            />
          </div>

          {/* Filters + Sort */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled={!!searchTerm.trim()}>
                <SelectTrigger className={`w-[130px] ${searchTerm.trim() ? "opacity-50" : ""}`} data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={stageFilter} onValueChange={setStageFilter} disabled={!!searchTerm.trim()}>
              <SelectTrigger className={`w-[150px] ${searchTerm.trim() ? "opacity-50" : ""}`} data-testid="select-stage-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="pre-legal">Pre-Legal</SelectItem>
                <SelectItem value="claim">Claim</SelectItem>
                <SelectItem value="judgment">Judgment</SelectItem>
                <SelectItem value="enforcement">Enforcement</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[175px]" data-testid="select-sort-cases">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accountNumber-desc">Acclaim Account No. (newest first)</SelectItem>
                  <SelectItem value="accountNumber-asc">Acclaim Account No. (oldest first)</SelectItem>
                  <SelectItem value="caseName-asc">Case Name (A–Z)</SelectItem>
                  <SelectItem value="stage-asc">Stage (A–Z)</SelectItem>
                  <SelectItem value="status-asc">Status (active first)</SelectItem>
                  <SelectItem value="balance-desc">Balance (highest first)</SelectItem>
                  <SelectItem value="balance-asc">Balance (lowest first)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {searchTerm.trim() && (
              <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded">
                Searching all cases
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          {isLoading
            ? "Loading cases…"
            : `Showing ${sortedCases.length === 0 ? 0 : startIndex + 1}–${Math.min(startIndex + casesPerPage, sortedCases.length)} of ${sortedCases.length} case${sortedCases.length !== 1 ? "s" : ""}${sortedCases.length !== (cases?.length || 0) ? ` (filtered from ${cases?.length || 0})` : ""}${user?.isAdmin ? " — Global View" : ""}`
          }
        </p>
      </div>

      {/* Card grid */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 h-44" />
          ))}
        </div>
      ) : paginatedCases.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedCases.map((case_: any) => {
            const stageBadge = getStageBadge(case_.status, case_.stage);
            const isMuted = mutedCaseIds.includes(case_.id);

            return (
              <Dialog
                key={case_.id}
                open={dialogOpen && selectedCase?.id === case_.id}
                onOpenChange={setDialogOpen}
              >
                <DialogTrigger asChild>
                  <button
                    id={`case-${case_.id}`}
                    data-testid={`card-case-${case_.id}`}
                    onClick={() => { setSelectedCase(case_); setDialogOpen(true); trackRecentlyViewed(case_.id); }}
                    className="group text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-acclaim-teal hover:shadow-md dark:hover:border-acclaim-teal transition-all duration-150 flex flex-col gap-3 w-full"
                  >
                    {/* Top row: icon + name + bells + chevron */}
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                        {getDebtorIcon(case_.debtorType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-2">
                            {case_.caseName}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                            {isMuted
                              ? <BellOff className="h-3.5 w-3.5 text-gray-300 dark:text-gray-500" title="Notifications muted" />
                              : <Bell className="h-3.5 w-3.5 text-green-500" title="Notifications on" />
                            }
                            <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-500 group-hover:text-acclaim-teal transition-colors" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Acc: {case_.accountNumber}</p>
                      </div>
                    </div>

                    {/* Organisation */}
                    {case_.organisationName && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Building className="h-3 w-3 flex-shrink-0 text-gray-400" />
                        <span className="truncate">{case_.organisationName}</span>
                      </div>
                    )}

                    {/* Amount + Stage */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-700 mt-auto">
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Outstanding</p>
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                          {formatCurrency(case_.outstandingAmount)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stageBadge.cls}`}>
                        {stageBadge.label}
                      </span>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] max-h-[92vh] overflow-y-auto w-[95vw]">
                  <DialogHeader>
                    <DialogTitle>Case Details — {case_.caseName}</DialogTitle>
                    <DialogDescription>
                      View comprehensive case information including timeline, documents, and messages.
                    </DialogDescription>
                  </DialogHeader>
                  <CaseDetail case={case_} />
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-center py-16">
          <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm.trim()
              ? `No cases found matching "${searchTerm}"`
              : stageFilter !== "all"
                ? `No ${statusFilter !== "all" ? statusFilter + " " : ""}cases found in ${stageFilter} stage`
                : statusFilter !== "all"
                  ? `No ${statusFilter} cases found`
                  : "No cases found"}
          </p>
          {(searchTerm.trim() || statusFilter !== "active" || stageFilter !== "all") && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => { setSearchTerm(""); setStatusFilter("active"); setStageFilter("all"); }}
            >
              {searchTerm.trim() ? "Clear Search" : "Reset Filters"}
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="text-acclaim-teal border-acclaim-teal hover:bg-acclaim-teal hover:text-white"
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (currentPage <= 3) p = i + 1;
                else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                else p = currentPage - 2 + i;
                return (
                  <Button
                    key={p}
                    variant={currentPage === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(p)}
                    className={currentPage === p
                      ? "bg-acclaim-teal hover:bg-acclaim-teal/90 text-white"
                      : "text-acclaim-teal border-acclaim-teal hover:bg-acclaim-teal hover:text-white"}
                  >
                    {p}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="text-acclaim-teal border-acclaim-teal hover:bg-acclaim-teal hover:text-white"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">* Outstanding amounts may include interest and costs</p>
    </div>
  );
}
