import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
} from "lucide-react";

type ReportType = "escalation" | "inactive-cases";

interface ReportConfig {
  type: ReportType;
  days: string;
  recipientEmail: string;
}

interface TriggerResult {
  sent: boolean;
  count: number;
  cases?: number;
  message: string;
}

const REPORT_DEFINITIONS = [
  {
    type: "escalation" as ReportType,
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
  },
  {
    type: "inactive-cases" as ReportType,
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
  },
];

function ReportCard({
  def,
}: {
  def: (typeof REPORT_DEFINITIONS)[number];
}) {
  const { toast } = useToast();
  const Icon = def.icon;

  const [days, setDays] = useState(def.defaultDays);
  const [email, setEmail] = useState("");
  const [lastResult, setLastResult] = useState<TriggerResult | null>(null);

  const endpoint =
    def.type === "escalation"
      ? "/api/admin/reports/escalation/trigger"
      : "/api/admin/reports/inactive-cases/trigger";

  const triggerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", endpoint, {
        days: Number(days),
        recipientEmail: email.trim(),
      });
      return res.json() as Promise<TriggerResult>;
    },
    onSuccess: (data) => {
      setLastResult(data);
      if (data.sent) {
        toast({
          title: "Report sent",
          description: data.message,
        });
      } else {
        toast({
          title: "Nothing to report",
          description: data.message,
          variant: "default",
        });
      }
    },
    onError: (err: any) => {
      const msg = err?.message || "Something went wrong — please try again.";
      toast({
        title: "Failed to send report",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const daysNum = Number(days);
  const emailValid = email.includes("@") && email.includes(".");
  const canSubmit =
    !triggerMutation.isPending &&
    daysNum >= 1 &&
    !isNaN(daysNum) &&
    emailValid;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${def.iconBg}`}>
            <Icon className={`h-5 w-5 ${def.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{def.label}</CardTitle>
            <CardDescription className="mt-1 leading-snug">
              {def.description}
            </CardDescription>
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
              onChange={(e) => {
                setLastResult(null);
                setDays(e.target.value);
              }}
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
                onChange={(e) => {
                  setLastResult(null);
                  setEmail(e.target.value);
                }}
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
          {lastResult ? (
            <div
              className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 flex-1 ${
                lastResult.sent
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                  : "bg-muted text-muted-foreground border"
              }`}
            >
              {lastResult.sent ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{lastResult.message}</span>
            </div>
          ) : (
            <div />
          )}

          <Button
            data-testid={`button-trigger-${def.type}`}
            size="sm"
            disabled={!canSubmit}
            onClick={() => triggerMutation.mutate()}
            className="shrink-0"
          >
            {triggerMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1.5" />
                Send Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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
            Trigger a report on demand with your own criteria. Choose your days
            threshold and where to send it — the automatic daily and weekly
            schedules are not affected.
          </p>
        </div>
      </div>

      <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          These are one-off manual triggers only. They do not change the
          existing automatic schedules.
        </span>
      </div>

      {REPORT_DEFINITIONS.map((def) => (
        <ReportCard key={def.type} def={def} />
      ))}
    </div>
  );
}
