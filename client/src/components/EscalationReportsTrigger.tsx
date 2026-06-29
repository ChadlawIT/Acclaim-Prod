import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  Mail,
  MessageSquareWarning,
  TimerOff,
  RefreshCw,
  Hourglass,
  Search,
  X,
  ChevronDown,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// ── Shared result banner ──────────────────────────────────────────────────────

interface TriggerResult {
  sent: boolean;
  count: number;
  cases?: number;
  message: string;
}

function ResultBanner({ result }: { result: TriggerResult }) {
  return (
    <div
      className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 flex-1 ${
        result.sent
          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
          : "bg-muted text-muted-foreground border"
      }`}
    >
      {result.sent ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0" />
      )}
      <span>{result.message}</span>
    </div>
  );
}

// ── Simple report cards (Unanswered Messages & Inactive Cases) ────────────────

const SIMPLE_REPORT_DEFS = [
  {
    type: "escalation" as const,
    label: "Unanswered Messages",
    description:
      "Finds client messages sent from within a case that have had no response from the team. Sorted by age, colour-coded by urgency, grouped by case. Includes a summary by case handler.",
    icon: MessageSquareWarning,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    defaultDays: "7",
    daysLabel: "Minimum days without a reply",
    daysHelp: "Only messages older than this with no team response will appear in the report.",
    scheduleLine: "Runs automatically Monday–Friday at 8 am (default: 7 days)",
    endpoint: "/api/admin/reports/escalation/trigger",
  },
  {
    type: "inactive-cases" as const,
    label: "Inactive Cases",
    description:
      "Finds active cases with no activity logged for at least the specified number of days. Shows the latest activity entry and last 3 messages per case. Includes a summary by case handler and inactivity band.",
    icon: TimerOff,
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    defaultDays: "30",
    daysLabel: "Minimum days without activity",
    daysHelp: "Only cases with no activity logged for at least this many days will be included.",
    scheduleLine: "Runs automatically every Thursday at 8 am (default: 30 days)",
    endpoint: "/api/admin/reports/inactive-cases/trigger",
  },
];

function SimpleReportCard({ def }: { def: (typeof SIMPLE_REPORT_DEFS)[number] }) {
  const { toast } = useToast();
  const Icon = def.icon;
  const [days, setDays] = useState(def.defaultDays);
  const [email, setEmail] = useState("");
  const [lastResult, setLastResult] = useState<TriggerResult | null>(null);

  const triggerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", def.endpoint, {
        days: Number(days),
        recipientEmail: email.trim(),
      });
      return res.json() as Promise<TriggerResult>;
    },
    onSuccess: (data) => {
      setLastResult(data);
      toast({
        title: data.sent ? "Report sent" : "Nothing to report",
        description: data.message,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to send report",
        description: err?.message || "Something went wrong — please try again.",
        variant: "destructive",
      });
    },
  });

  const canSubmit =
    !triggerMutation.isPending &&
    Number(days) >= 1 &&
    !isNaN(Number(days)) &&
    email.includes("@") &&
    email.includes(".");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${def.iconBg}`}>
            <Icon className={`h-5 w-5 ${def.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{def.label}</CardTitle>
            <CardDescription className="mt-1 leading-snug">{def.description}</CardDescription>
            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0" />
              {def.scheduleLine}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor={`days-${def.type}`}>{def.daysLabel}</Label>
            <Input
              id={`days-${def.type}`}
              data-testid={`input-days-${def.type}`}
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => { setLastResult(null); setDays(e.target.value); }}
              placeholder="e.g. 7"
            />
            <p className="text-xs text-muted-foreground">{def.daysHelp}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`email-${def.type}`}>Send report to</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id={`email-${def.type}`}
                data-testid={`input-email-${def.type}`}
                type="email"
                value={email}
                onChange={(e) => { setLastResult(null); setEmail(e.target.value); }}
                placeholder="e.g. abc@email.com"
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter any email address — the report will be sent there directly.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          {lastResult ? <ResultBanner result={lastResult} /> : <div />}
          <Button
            data-testid={`button-trigger-${def.type}`}
            size="sm"
            disabled={!canSubmit}
            onClick={() => triggerMutation.mutate()}
            className="shrink-0"
          >
            {triggerMutation.isPending ? (
              <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />Sending…</>
            ) : (
              <><Send className="h-4 w-4 mr-1.5" />Send Report</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Stuck-at-Activity multi-select card ───────────────────────────────────────

function StuckActivityCard() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [days, setDays] = useState("21");
  const [email, setEmail] = useState("");
  const [lastResult, setLastResult] = useState<TriggerResult | null>(null);

  const { data: descriptionsData, isLoading: loadingDescs } = useQuery<{ descriptions: string[] }>({
    queryKey: ["/api/admin/reports/activity-descriptions"],
  });

  const allDescriptions = descriptionsData?.descriptions ?? [];
  const filtered = allDescriptions.filter(d =>
    d.toLowerCase().includes(search.toLowerCase())
  );

  function toggleDescription(desc: string) {
    setLastResult(null);
    setSelected(prev =>
      prev.includes(desc) ? prev.filter(d => d !== desc) : [...prev, desc]
    );
  }

  function removeSelected(desc: string) {
    setLastResult(null);
    setSelected(prev => prev.filter(d => d !== desc));
  }

  const triggerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/reports/stuck-activity/trigger", {
        descriptions: selected,
        days: Number(days),
        recipientEmail: email.trim(),
      });
      return res.json() as Promise<TriggerResult>;
    },
    onSuccess: (data) => {
      setLastResult(data);
      toast({
        title: data.sent ? "Report sent" : "Nothing to report",
        description: data.message,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to send report",
        description: err?.message || "Something went wrong — please try again.",
        variant: "destructive",
      });
    },
  });

  const canSubmit =
    !triggerMutation.isPending &&
    selected.length > 0 &&
    Number(days) >= 1 &&
    !isNaN(Number(days)) &&
    email.includes("@") &&
    email.includes(".");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg shrink-0 bg-violet-100 dark:bg-violet-900/30">
            <Hourglass className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">Stuck at Activity</CardTitle>
            <CardDescription className="mt-1 leading-snug">
              Find cases where a specific activity is the most recent one recorded, with no follow-up logged
              since. Useful for chasing cases that have stalled after a particular milestone — for example,
              "Claim Issued" with no activity for 21 days.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Activity descriptions multi-select */}
        <div className="space-y-2">
          <Label>Activities to look for</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                data-testid="button-open-activity-picker"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between font-normal"
                disabled={loadingDescs}
              >
                {loadingDescs ? (
                  <span className="text-muted-foreground">Loading activities…</span>
                ) : selected.length === 0 ? (
                  <span className="text-muted-foreground">Select one or more activities…</span>
                ) : (
                  <span>{selected.length} activity{selected.length !== 1 ? " types" : " type"} selected</span>
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command shouldFilter={false}>
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <CommandInput
                    placeholder="Search activities…"
                    value={search}
                    onValueChange={setSearch}
                    className="border-0 focus:ring-0"
                  />
                </div>
                <CommandList className="max-h-60">
                  {filtered.length === 0 ? (
                    <CommandEmpty>
                      {allDescriptions.length === 0
                        ? "No case activities found in the system yet."
                        : "No activities match your search."}
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {filtered.map(desc => {
                        const isSelected = selected.includes(desc);
                        return (
                          <CommandItem
                            key={desc}
                            value={desc}
                            onSelect={() => toggleDescription(desc)}
                            className="flex items-center gap-2 cursor-pointer"
                            data-testid={`activity-option-${desc}`}
                          >
                            <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-violet-600 border-violet-600"
                                : "border-muted-foreground/40"
                            }`}>
                              {isSelected && (
                                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm leading-snug">{desc}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                </CommandList>
                {selected.length > 0 && (
                  <div className="border-t p-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-muted-foreground"
                      onClick={() => { setSelected([]); setLastResult(null); }}
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </Command>
            </PopoverContent>
          </Popover>

          {/* Selected badges */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selected.map(desc => (
                <Badge
                  key={desc}
                  variant="secondary"
                  className="text-xs pl-2 pr-1 py-1 gap-1 bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 hover:bg-violet-100"
                >
                  <span className="max-w-[200px] truncate">{desc}</span>
                  <button
                    onClick={() => removeSelected(desc)}
                    className="ml-0.5 rounded hover:bg-violet-200 dark:hover:bg-violet-800 p-0.5"
                    aria-label={`Remove ${desc}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Only cases where one of these is the <strong>most recent</strong> activity recorded — with no
            activity logged after it — will be included.
          </p>
        </div>

        {/* Days + email */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="days-stuck">Days since that activity</Label>
            <Input
              id="days-stuck"
              data-testid="input-days-stuck-activity"
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => { setLastResult(null); setDays(e.target.value); }}
              placeholder="e.g. 21"
            />
            <p className="text-xs text-muted-foreground">
              Only include cases where the activity date was at least this many days ago.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-stuck">Send report to</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email-stuck"
                data-testid="input-email-stuck-activity"
                type="email"
                value={email}
                onChange={(e) => { setLastResult(null); setEmail(e.target.value); }}
                placeholder="e.g. abc@email.com"
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter any email address — the report will be sent there directly.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          {lastResult ? <ResultBanner result={lastResult} /> : <div />}
          <Button
            data-testid="button-trigger-stuck-activity"
            size="sm"
            disabled={!canSubmit}
            onClick={() => triggerMutation.mutate()}
            className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {triggerMutation.isPending ? (
              <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />Sending…</>
            ) : (
              <><Send className="h-4 w-4 mr-1.5" />Send Report</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function EscalationReportsTrigger() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Escalation Reports</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Trigger a report on demand with your own criteria. Choose your days threshold and where to
            send it — the automatic daily and weekly schedules are not affected.
          </p>
        </div>
      </div>

      <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          These are one-off manual triggers only. They do not change the existing automatic schedules.
        </span>
      </div>

      {SIMPLE_REPORT_DEFS.map(def => (
        <SimpleReportCard key={def.type} def={def} />
      ))}

      <StuckActivityCard />
    </div>
  );
}
