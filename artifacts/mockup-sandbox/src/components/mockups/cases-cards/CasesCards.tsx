import { Search, User, Building, Factory, Store, UserCheck, Bell, BellOff, Filter, Eye, ChevronRight } from "lucide-react";

const CASES = [
  { id: 1, caseName: "Pryce Information Management Ltd", accountNumber: "SOS-2024-001", debtorType: "company", orgName: "Chadwick Lawrence LLP", outstandingAmount: 14850.00, status: "active", stage: "claim", muted: false },
  { id: 2, caseName: "Hartley & Sons Building Contractors", accountNumber: "SOS-2024-002", debtorType: "sole_trader", orgName: "Chadwick Lawrence LLP", outstandingAmount: 3200.50, status: "active", stage: "pre-legal", muted: true },
  { id: 3, caseName: "Eleanor Whitfield", accountNumber: "SOS-2024-003", debtorType: "individual", orgName: "Renaissance Arts Conservatoire LLP", outstandingAmount: 7640.00, status: "active", stage: "judgment", muted: false },
  { id: 4, caseName: "Vanguard Logistics Group", accountNumber: "SOS-2024-004", debtorType: "company", orgName: "Chadwick Lawrence LLP", outstandingAmount: 52300.00, status: "active", stage: "enforcement", muted: false },
  { id: 5, caseName: "Marcus & Jennifer Delaney", accountNumber: "SOS-2024-005", debtorType: "company_and_individual", orgName: "The Boutique Workplace Company", outstandingAmount: 1890.75, status: "active", stage: "pre-legal", muted: false },
  { id: 6, caseName: "Sunrise Catering Services", accountNumber: "SOS-2024-006", debtorType: "sole_trader", orgName: "Renaissance Arts Conservatoire LLP", outstandingAmount: 9120.00, status: "closed", stage: "closed", muted: true },
];

const stageConfig: Record<string, { label: string; bg: string; text: string }> = {
  "pre-legal":   { label: "Pre-Legal",   bg: "bg-blue-100",   text: "text-blue-800" },
  "claim":       { label: "Claim",       bg: "bg-yellow-100", text: "text-yellow-800" },
  "judgment":    { label: "Judgment",    bg: "bg-purple-100", text: "text-purple-800" },
  "enforcement": { label: "Enforcement", bg: "bg-orange-100", text: "text-orange-800" },
  "closed":      { label: "Closed",      bg: "bg-gray-100",   text: "text-gray-600" },
  "legalaction": { label: "Legal Action",bg: "bg-orange-100", text: "text-orange-800" },
};

function StageBadge({ stage }: { stage: string }) {
  const cfg = stageConfig[stage] ?? { label: stage, bg: "bg-gray-100", text: "text-gray-700" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function DebtorIcon({ type }: { type: string }) {
  const t = type?.toLowerCase().replace(/[\s-]/g, "_") || "";
  const cls = "h-5 w-5 text-teal-600";
  if (t === "company") return <Building className={cls} />;
  if (t === "sole_trader" || t === "soletrader") return <Store className={cls} />;
  if (t === "company_and_individual" || t === "companyandindividual") return <UserCheck className={cls} />;
  return <User className={cls} />;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

export function CasesCards() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Cases</h1>
        <p className="text-sm text-gray-500 mt-0.5">View and manage all your cases</p>
      </div>

      {/* Search + Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              placeholder="Search by name, account, email or organisation..."
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option>Active</option>
                <option>Closed</option>
                <option>All</option>
              </select>
            </div>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option>All Stages</option>
              <option>Pre-Legal</option>
              <option>Claim</option>
              <option>Judgment</option>
              <option>Enforcement</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Showing {CASES.length} of {CASES.length} cases</p>
      </div>

      {/* Card Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {CASES.map((c) => (
          <button
            key={c.id}
            className="group text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-teal-400 hover:shadow-md transition-all duration-150 relative flex flex-col gap-3"
          >
            {/* Top row: icon + name + chevron */}
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <DebtorIcon type={c.debtorType} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                    {c.caseName}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    {c.muted
                      ? <BellOff className="h-3.5 w-3.5 text-gray-300" title="Notifications muted" />
                      : <Bell className="h-3.5 w-3.5 text-teal-500" title="Notifications on" />
                    }
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Acc: {c.accountNumber}</p>
              </div>
            </div>

            {/* Org */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Building className="h-3 w-3 flex-shrink-0 text-gray-400" />
              <span className="truncate">{c.orgName}</span>
            </div>

            {/* Amount + Stage */}
            <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Outstanding</p>
                <p className="font-bold text-gray-900 text-sm">{fmt(c.outstandingAmount)}</p>
              </div>
              <StageBadge stage={c.stage} />
            </div>
          </button>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 mt-4 text-center">* Outstanding amounts may include interest and costs</p>
    </div>
  );
}
