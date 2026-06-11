import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrganisationFilterCombobox } from "@/components/OrganisationFilterCombobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileSpreadsheet, FileText, MessageSquare, Calendar, Building2, Filter, RefreshCw, Paperclip, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import ExcelJS from "exceljs";

type DatePreset = "24h" | "3d" | "7d" | "2w" | "1m" | "custom";

interface ReportMessage {
  id: number;
  caseId: number | null;
  caseName: string | null;
  accountNumber: string | null;
  organisationName: string | null;
  caseOrganisationId: number | null;
  subject: string;
  content: string;
  createdAt: string;
  senderName: string;
  senderIsAdmin: boolean;
  hasAttachment: boolean;
  attachmentFileName: string | null;
}

interface CaseGroup {
  caseId: number | null;
  caseName: string;
  accountNumber: string;
  organisationName: string;
  messages: ReportMessage[];
}

function getDateRangeForPreset(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  const from = new Date(now);

  if (preset === "24h") {
    from.setDate(now.getDate() - 1);
  } else if (preset === "3d") {
    from.setDate(now.getDate() - 3);
  } else if (preset === "7d") {
    from.setDate(now.getDate() - 7);
  } else if (preset === "2w") {
    from.setDate(now.getDate() - 14);
  } else if (preset === "1m") {
    from.setMonth(now.getMonth() - 1);
  }

  return { from: from.toISOString().split("T")[0], to };
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(preset: DatePreset): string {
  const labels: Record<DatePreset, string> = {
    "24h": "Last 24 Hours",
    "3d": "Last 3 Days",
    "7d": "Last 7 Days",
    "2w": "Last 2 Weeks",
    "1m": "Last Month",
    "custom": "Custom Range",
  };
  return labels[preset];
}

export default function MessagesReport() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [preset, setPreset] = useState<DatePreset>("7d");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [collapsedCases, setCollapsedCases] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<"excel" | null>(null);

  const dateRange = useMemo(() => {
    if (preset === "custom") {
      return { from: customFrom, to: customTo };
    }
    return getDateRangeForPreset(preset);
  }, [preset, customFrom, customTo]);

  const queryParams = new URLSearchParams();
  if (dateRange.from) queryParams.set("from", dateRange.from);
  if (dateRange.to) queryParams.set("to", dateRange.to + "T23:59:59");
  if (orgFilter !== "all") queryParams.set("organisationId", orgFilter);

  const { data: messages, isLoading, refetch, isFetching } = useQuery<ReportMessage[]>({
    queryKey: ["/api/messages/report", dateRange.from, dateRange.to, orgFilter],
    queryFn: async () => {
      const res = await fetch(`/api/messages/report?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    enabled: !!(dateRange.from && dateRange.to),
  });

  const { data: adminOrgs } = useQuery<any[]>({
    queryKey: ["/api/admin/organisations"],
    enabled: user?.isAdmin === true,
  });

  const { data: userOrgs } = useQuery<any[]>({
    queryKey: ["/api/user/organisations"],
    enabled: user?.isAdmin !== true,
  });

  const organisations = user?.isAdmin ? adminOrgs : userOrgs;

  const caseGroups = useMemo<CaseGroup[]>(() => {
    if (!messages) return [];
    const map = new Map<string, CaseGroup>();

    messages.forEach((m) => {
      const key = m.caseId != null ? `case-${m.caseId}` : "general";
      if (!map.has(key)) {
        map.set(key, {
          caseId: m.caseId,
          caseName: m.caseName || (m.caseId ? "Unknown Matter" : "General Messages"),
          accountNumber: m.accountNumber || "",
          organisationName: m.organisationName || "",
          messages: [],
        });
      }
      map.get(key)!.messages.push(m);
    });

    return Array.from(map.values()).sort((a, b) => {
      const aLatest = a.messages[0]?.createdAt || "";
      const bLatest = b.messages[0]?.createdAt || "";
      return bLatest.localeCompare(aLatest);
    });
  }, [messages]);

  const toggleCase = (key: string) => {
    setCollapsedCases((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalMessages = messages?.length ?? 0;
  const totalMatters = caseGroups.filter((g) => g.caseId != null).length;

  // Direction is viewer-relative: outgoing means "sent by the viewer's side"
  const isOutgoing = (msg: ReportMessage) =>
    user?.isAdmin ? msg.senderIsAdmin : !msg.senderIsAdmin;

  async function downloadExcel() {
    if (!messages || messages.length === 0) return;
    setExporting("excel");
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "Acclaim Credit Management";
      wb.created = new Date();

      const ws = wb.addWorksheet("Messages Report");

      ws.columns = [
        { header: "Date & Time", key: "date", width: 20 },
        { header: "Case Name", key: "caseName", width: 28 },
        { header: "Account Number", key: "accountNumber", width: 18 },
        { header: "Subject", key: "subject", width: 35 },
        { header: "From", key: "senderName", width: 18 },
        { header: "Message", key: "content", width: 50 },
      ];

      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF008B8B" } };
      headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      headerRow.height = 22;

      caseGroups.forEach((group) => {
        const groupHeaderRow = ws.addRow([
          "",
          group.caseId ? `Matter: ${group.caseName}` : "General Messages",
          group.accountNumber,
          "", "", "",
        ]);
        groupHeaderRow.font = { bold: true, italic: true, color: { argb: "FF006666" } };
        groupHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2F1" } };
        groupHeaderRow.height = 18;

        group.messages.forEach((m) => {
          const row = ws.addRow({
            date: formatDateTime(m.createdAt),
            caseName: group.caseName,
            accountNumber: group.accountNumber,
            subject: m.subject,
            senderName: m.senderName,
            content: m.content,
          });
          row.alignment = { wrapText: true, vertical: "top" };
          row.fill = {
            type: "pattern", pattern: "solid",
            fgColor: { argb: m.senderIsAdmin ? "FFFAFFFE" : "FFFFF9F0" },
          };
        });
      });

      ws.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin", color: { argb: "FFE2E8F0" } },
              left: { style: "thin", color: { argb: "FFE2E8F0" } },
              bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
              right: { style: "thin", color: { argb: "FFE2E8F0" } },
            };
          });
        }
      });

      ws.views = [{ state: "frozen", ySplit: 1 }];

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Messages_Report_${dateRange.from}_to_${dateRange.to}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Excel downloaded", description: `${totalMessages} messages exported.` });
    } catch (err) {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  }

  function openHtml() {
    if (!messages || messages.length === 0) return;
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast({ title: "Popup blocked", description: "Please allow popups for this site.", variant: "destructive" });
        return;
      }

      const rangeLabel = preset === "custom"
        ? `${dateRange.from} to ${dateRange.to}`
        : formatDateLabel(preset);

      const groupsHtml = caseGroups.map((group) => {
        const rowsHtml = group.messages.map((m) => `
          <tr>
            <td>${formatDateTime(m.createdAt)}</td>
            <td>${m.subject || ""}</td>
            <td>${m.senderName}</td>
            <td class="msg-content">${m.content.replace(/\n/g, "<br>")}</td>
          </tr>`).join("");

        const caseHeader = group.caseId
          ? `${group.caseName}${group.accountNumber ? ` (${group.accountNumber})` : ""}${group.organisationName ? ` &nbsp;·&nbsp; ${group.organisationName}` : ""}`
          : "General Messages";

        return `
          <div class="case-block">
            <div class="case-header">${caseHeader} <span class="msg-count">${group.messages.length} message${group.messages.length !== 1 ? "s" : ""}</span></div>
            <table>
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Subject</th>
                  <th>From</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>`;
      }).join("");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Messages Report — ${rangeLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #1a1a1a; }
            .header { margin-bottom: 24px; border-bottom: 2px solid #008b8b; padding-bottom: 12px; }
            .header h1 { margin: 0 0 4px; font-size: 22px; color: #006666; }
            .header p { margin: 2px 0; font-size: 12px; color: #666; }
            .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
            .summary-card { padding: 10px 16px; border: 1px solid #ddd; border-radius: 6px; min-width: 120px; }
            .summary-card .val { font-size: 20px; font-weight: bold; color: #006666; }
            .summary-card .lbl { font-size: 11px; color: #666; margin-top: 2px; }
            .case-block { margin-bottom: 28px; }
            .case-header { background: #e0f2f1; padding: 8px 12px; font-weight: bold; font-size: 13px; color: #006666; border-radius: 4px 4px 0 0; border: 1px solid #b2dfdb; border-bottom: none; }
            .msg-count { font-weight: normal; font-size: 11px; color: #555; margin-left: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #b2dfdb; }
            th { background: #008b8b; color: #fff; padding: 7px 8px; text-align: left; font-size: 11px; }
            td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
            tr.outgoing td { background: #fafffe; }
            tr.incoming td { background: #fffdf0; }
            .msg-content { white-space: pre-wrap; max-width: 420px; }
            .dir-badge { padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: bold; }
            .dir-out { background: #e0f2f1; color: #006666; }
            .dir-in { background: #fef3c7; color: #92400e; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
            @media print {
              body { margin: 10px; }
              .no-print { display: none; }
              .case-block { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Messages Report</h1>
            <p>Period: ${rangeLabel}</p>
            <p>Generated: ${new Date().toLocaleString("en-GB")} &nbsp;·&nbsp; Acclaim Credit Management &amp; Recovery</p>
          </div>
          <div class="summary">
            <div class="summary-card"><div class="val">${totalMessages}</div><div class="lbl">Total Messages</div></div>
            <div class="summary-card"><div class="val">${totalMatters}</div><div class="lbl">Matters</div></div>
            <div class="summary-card"><div class="val">${messages.filter(m => isOutgoing(m)).length}</div><div class="lbl">${user?.isAdmin ? "Outgoing (Acclaim)" : "Sent by You"}</div></div>
            <div class="summary-card"><div class="val">${messages.filter(m => !isOutgoing(m)).length}</div><div class="lbl">${user?.isAdmin ? "Incoming (Client)" : "From Acclaim"}</div></div>
          </div>
          ${groupsHtml}
          <div class="footer">Acclaim Credit Management &amp; Recovery &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; ${rangeLabel}</div>
        </body>
        </html>`;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.focus();

      toast({ title: "Report opened", description: "Opened in a new tab. Use your browser's print function to save as PDF if needed." });
    } catch (err) {
      toast({ title: "Failed to open report", variant: "destructive" });
    }
  }

  const presets: { value: DatePreset; label: string }[] = [
    { value: "24h", label: "Last 24 Hours" },
    { value: "3d", label: "Last 3 Days" },
    { value: "7d", label: "Last 7 Days" },
    { value: "2w", label: "Last 2 Weeks" },
    { value: "1m", label: "Last Month" },
    { value: "custom", label: "Custom Range" },
  ];

  const canExport = totalMessages > 0 && !isLoading && !isFetching;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-teal-600" />
                Messages Report
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                All case messages grouped by matter for the selected period
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadExcel}
              disabled={!canExport || exporting !== null}
            >
              {exporting === "excel" ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-1" />
              )}
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openHtml}
              disabled={!canExport || exporting !== null}
            >
              <FileText className="h-4 w-4 mr-1" />
              HTML
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4 text-teal-600" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preset Buttons */}
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Date Range</Label>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <Button
                    key={p.value}
                    variant={preset === p.value ? "default" : "outline"}
                    size="sm"
                    className={preset === p.value ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
                    onClick={() => setPreset(p.value)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            {preset === "custom" && (
              <div className="flex flex-wrap gap-4 items-end pt-1">
                <div className="space-y-1">
                  <Label htmlFor="from" className="text-xs text-gray-500">From</Label>
                  <Input
                    id="from"
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-44"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="to" className="text-xs text-gray-500">To</Label>
                  <Input
                    id="to"
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-44"
                  />
                </div>
              </div>
            )}

            {/* Organisation Filter */}
            {organisations && (user?.isAdmin ? organisations.length > 0 : organisations.length > 1) && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Organisation</Label>
                <OrganisationFilterCombobox
                  organisations={organisations}
                  value={orgFilter}
                  onValueChange={setOrgFilter}
                  className="w-64"
                  triggerIcon={<Building2 className="h-4 w-4 mr-2 text-gray-400" />}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {!isLoading && messages && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5">
                <div className="text-2xl font-bold text-teal-700">{totalMessages}</div>
                <p className="text-xs text-gray-500 mt-1">Total Messages</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="text-2xl font-bold text-teal-700">{totalMatters}</div>
                <p className="text-xs text-gray-500 mt-1">Matters with Messages</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="text-2xl font-bold text-teal-700">
                  {messages.filter((m) => isOutgoing(m)).length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {user?.isAdmin ? "Outgoing (Acclaim)" : "Sent by You"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="text-2xl font-bold text-teal-700">
                  {messages.filter((m) => !isOutgoing(m)).length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {user?.isAdmin ? "Incoming (Client)" : "From Acclaim"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading */}
        {(isLoading || isFetching) && (
          <Card>
            <CardContent className="py-16 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-3" />
              <p className="text-gray-500">Loading messages…</p>
            </CardContent>
          </Card>
        )}

        {/* No results */}
        {!isLoading && !isFetching && messages && messages.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">No messages found</h3>
              <p className="text-sm text-gray-400 mt-1">
                No messages exist in the selected date range
                {orgFilter !== "all" ? " for the selected organisation" : ""}.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Message Groups */}
        {!isLoading && !isFetching && caseGroups.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                {formatDateLabel(preset)}
                {orgFilter !== "all" && organisations
                  ? ` · ${organisations.find((o: any) => o.id.toString() === orgFilter)?.name ?? ""}`
                  : ""}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500"
                  onClick={() => {
                    const allKeys = caseGroups.map((g) =>
                      g.caseId != null ? `case-${g.caseId}` : "general"
                    );
                    setCollapsedCases(new Set(allKeys));
                  }}
                >
                  Collapse All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500"
                  onClick={() => setCollapsedCases(new Set())}
                >
                  Expand All
                </Button>
              </div>
            </div>

            {caseGroups.map((group) => {
              const key = group.caseId != null ? `case-${group.caseId}` : "general";
              const collapsed = collapsedCases.has(key);

              return (
                <Card key={key} className="overflow-hidden border border-gray-200 dark:border-gray-700">
                  {/* Case Header */}
                  <button
                    className="w-full text-left"
                    onClick={() => toggleCase(key)}
                  >
                    <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-teal-50 to-white dark:from-teal-950 dark:to-gray-900 hover:from-teal-100 dark:hover:from-teal-900 transition-colors border-b border-teal-100 dark:border-teal-900">
                      <div className="flex items-center gap-3 min-w-0">
                        {collapsed ? (
                          <ChevronRight className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                            {group.caseName}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {group.accountNumber && (
                              <span className="text-xs text-gray-500">
                                Ref: {group.accountNumber}
                              </span>
                            )}
                            {group.organisationName && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {group.organisationName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <Badge variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                          {group.messages.length} message{group.messages.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                  </button>

                  {/* Messages */}
                  {!collapsed && (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {group.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`px-5 py-4 ${
                            isOutgoing(msg)
                              ? "bg-white dark:bg-gray-900"
                              : "bg-amber-50 dark:bg-amber-950/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                className={
                                  isOutgoing(msg)
                                    ? "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 text-xs"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs"
                                }
                              >
                                {isOutgoing(msg) ? "Outgoing" : "Incoming"}
                              </Badge>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {msg.senderName}
                              </span>
                              {msg.subject && (
                                <>
                                  <span className="text-gray-400">·</span>
                                  <span className="text-sm text-gray-600 dark:text-gray-400 italic">
                                    {msg.subject}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {msg.hasAttachment && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Paperclip className="h-3 w-3" />
                                  {msg.attachmentFileName}
                                </span>
                              )}
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDateTime(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
