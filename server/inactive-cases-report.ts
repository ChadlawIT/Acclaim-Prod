import ExcelJS from "exceljs";
import { storage } from "./storage";
import { sendInactiveCasesReportEmail } from "./email-service-sendgrid";

export const INACTIVE_DAYS_THRESHOLD = 30;
export const INACTIVE_CASES_ACTIVE_FROM = new Date("2026-05-20T00:00:00.000Z");

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatStage(stage: string): string {
  const map: Record<string, string> = {
    initial_contact: "Initial Contact",
    pre_legal: "Pre-Legal",
    legal_action: "Legal Action",
  };
  return map[stage] ?? stage.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatCurrency(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return "£" + amount;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(num);
}

function formatDateGB(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type AgeBand = { bg: string; border: string; text: string; badgeBg: string; label: string };

function ageBand(days: number): AgeBand {
  if (days >= 90) return { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", badgeBg: "#EF4444", label: "90+ days" };
  if (days >= 60) return { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412", badgeBg: "#F97316", label: "60–90 days" };
  return { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", badgeBg: "#FBBF24", label: "30–60 days" };
}

function stageColor(stage: string): { bg: string; text: string; border: string } {
  if (stage === "legal_action")  return { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" };
  if (stage === "pre_legal")     return { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA" };
  return                                { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type InactiveCase = Awaited<ReturnType<typeof storage.getInactiveCases>>[number];

// ── Excel report ──────────────────────────────────────────────────────────────

export async function generateInactiveCasesExcel(cases: InactiveCase[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Acclaim Credit Management";
  workbook.created = new Date();

  // ── Sheet 1: Case list ─────────────────────────────────────────────────────
  const sheet = workbook.addWorksheet("Inactive Cases");
  sheet.columns = [
    { header: "Case Name",         key: "caseName",          width: 30 },
    { header: "Account Number",    key: "accountNumber",     width: 16 },
    { header: "Handler",           key: "handler",           width: 22 },
    { header: "Outstanding",       key: "outstanding",       width: 16 },
    { header: "Stage",             key: "stage",             width: 18 },
    { header: "Status",            key: "status",            width: 12 },
    { header: "Last Activity",     key: "lastActivity",      width: 16 },
    { header: "Days Inactive",     key: "daysInactive",      width: 14 },
  ];

  const hdr = sheet.getRow(1);
  hdr.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  hdr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB45309" } };
  hdr.alignment = { vertical: "middle", horizontal: "center" };
  hdr.height = 22;
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const sortedCases = [...cases].sort((a, b) => b.daysInactive - a.daysInactive);

  for (const c of sortedCases) {
    const band = ageBand(c.daysInactive);
    const argbMap: Record<string, string> = {
      "#FEF2F2": "FFFEF2F2",
      "#FFF7ED": "FFFFF7ED",
      "#FFFBEB": "FFFFFBEB",
    };
    const fillArgb = argbMap[band.bg] ?? "FFFFFFFF";

    const row = sheet.addRow({
      caseName:     c.caseName,
      accountNumber: c.accountNumber,
      handler:      c.assignedTo || "Unassigned",
      outstanding:  formatCurrency(c.outstandingAmount),
      stage:        formatStage(c.stage),
      status:       c.status.charAt(0).toUpperCase() + c.status.slice(1),
      lastActivity: formatDateGB(c.lastActivityDate),
      daysInactive: c.daysInactive,
    });
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillArgb } };
    row.alignment = { vertical: "middle" };
    row.height = 18;
  }

  // ── Sheet 2: Summary ───────────────────────────────────────────────────────
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { key: "label", width: 32 },
    { key: "value", width: 18 },
  ];

  const addRow = (label: string, value: string | number, bold = false, bgArgb?: string) => {
    const r = summary.addRow({ label, value });
    if (bold) r.font = { bold: true };
    if (bgArgb) r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    return r;
  };

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  addRow("Inactive Cases Report", today, true, "FFB45309");
  summary.getRow(summary.rowCount).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 13 };
  summary.addRow({});
  addRow("Total inactive cases", sortedCases.length, true);
  addRow("Threshold", `${INACTIVE_DAYS_THRESHOLD}+ days without activity`);
  summary.addRow({});

  addRow("── By Inactivity Period ──", "", true, "FFE5E7EB");
  const bandDefs = [
    { label: "30–60 days", min: 30, max: 60 },
    { label: "60–90 days", min: 60, max: 90 },
    { label: "90+ days",   min: 90, max: Infinity },
  ];
  for (const b of bandDefs) {
    const count = sortedCases.filter(c => c.daysInactive >= b.min && c.daysInactive < b.max).length;
    addRow(b.label, count);
  }
  summary.addRow({});

  addRow("── By Case Handler ──", "", true, "FFE5E7EB");
  const handlerMap = new Map<string, number>();
  for (const c of sortedCases) {
    const key = c.assignedTo || "Unassigned";
    handlerMap.set(key, (handlerMap.get(key) ?? 0) + 1);
  }
  for (const [handler, count] of [...handlerMap.entries()].sort((a, b) => b[1] - a[1])) {
    addRow(handler, count);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// ── HTML report ───────────────────────────────────────────────────────────────

export function generateInactiveCasesHtml(
  cases: InactiveCase[],
  activityMap: Map<number, { description: string; code: string; createdAt: Date }>,
  messageMap: Map<number, Array<{ sender: string; isAdmin: boolean; content: string; createdAt: Date }>>,
): string {
  const now = new Date();
  const reportDate = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const generatedAt = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const sortedCases = [...cases].sort((a, b) => b.daysInactive - a.daysInactive);
  const totalCases = sortedCases.length;

  const longestCase = sortedCases[0];
  const avgDays = totalCases > 0
    ? Math.round(sortedCases.reduce((s, c) => s + c.daysInactive, 0) / totalCases)
    : 0;

  const handlerMap = new Map<string, number>();
  for (const c of sortedCases) {
    const key = c.assignedTo || "Unassigned";
    handlerMap.set(key, (handlerMap.get(key) ?? 0) + 1);
  }
  const handlerRows = [...handlerMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => {
      const initial = name[0]?.toUpperCase() ?? "?";
      const isUnassigned = name === "Unassigned";
      return `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:26px;height:26px;border-radius:50%;background:${isUnassigned ? "#F1F5F9" : "#FEF3C7"};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${isUnassigned ? "#94a3b8" : "#92400E"};flex-shrink:0;">${initial}</div>
          <div style="flex:1;font-size:13px;color:#334155;">${esc(name)}</div>
          <div style="font-size:13px;font-weight:700;color:#0f172a;background:#F8FAFC;padding:2px 12px;border-radius:6px;border:1px solid #E2E8F0;">${count}</div>
        </div>`;
    }).join("");

  const ageBandDefs = [
    { label: "30–60 days", min: 30, max: 60,       dot: "#FBBF24" },
    { label: "60–90 days", min: 60, max: 90,       dot: "#F97316" },
    { label: "90+ days",   min: 90, max: Infinity, dot: "#EF4444" },
  ];
  const ageBandRows = ageBandDefs.map(b => {
    const count = sortedCases.filter(c => c.daysInactive >= b.min && c.daysInactive < b.max).length;
    return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <div style="width:10px;height:10px;border-radius:2px;background:${b.dot};flex-shrink:0;"></div>
        <div style="flex:1;font-size:13px;color:#334155;">${b.label}</div>
        <div style="font-size:13px;font-weight:700;color:#0f172a;background:#F8FAFC;padding:2px 12px;border-radius:6px;border:1px solid #E2E8F0;">${count} cases</div>
      </div>`;
  }).join("");

  const caseCardsHtml = sortedCases.map(c => {
    const band = ageBand(c.daysInactive);
    const sc = stageColor(c.stage);
    const stageName = formatStage(c.stage);
    const amount = formatCurrency(c.outstandingAmount);
    const activity = activityMap.get(c.caseId);
    const msgs = messageMap.get(c.caseId) ?? [];

    const activityHtml = activity ? `
      <div style="background:#fff;border:1px solid #E2E8F0;border-left:3px solid #B45309;border-radius:0 8px 8px 0;padding:12px 14px;">
        <span style="display:inline-block;font-size:10px;font-weight:700;color:#B45309;background:#FEF3C7;border:1px solid #FDE68A;border-radius:4px;padding:1px 6px;font-family:monospace;letter-spacing:0.5px;margin-bottom:8px;">${esc(activity.code || "—")}</span>
        <div style="font-size:13px;color:#1e293b;line-height:1.6;margin-bottom:8px;">${esc(activity.description)}</div>
        <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#94a3b8;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${esc(formatDateGB(activity.createdAt))}
        </div>
      </div>` : `<div style="font-size:12px;color:#94a3b8;font-style:italic;">No timeline entries on record</div>`;

    const messagesHtml = msgs.length === 0
      ? `<div style="font-size:12px;color:#94a3b8;font-style:italic;">No messages on record</div>`
      : msgs.map(m => {
          const isOut = m.isAdmin;
          return `
            <div style="display:flex;flex-direction:column;align-items:${isOut ? "flex-end" : "flex-start"};margin-bottom:8px;">
              <div style="max-width:88%;background:${isOut ? "#EFF6FF" : "#F8FAFC"};border:${isOut ? "1px solid #BFDBFE" : "1px solid #E2E8F0"};border-radius:${isOut ? "12px 12px 4px 12px" : "12px 12px 12px 4px"};padding:8px 12px;">
                <div style="font-size:11px;font-weight:600;color:${isOut ? "#1E40AF" : "#475569"};margin-bottom:3px;">${esc(m.sender)}</div>
                <div style="font-size:12px;color:#334155;line-height:1.55;">${esc(m.content)}</div>
                <div style="font-size:10px;color:#94a3b8;margin-top:4px;text-align:${isOut ? "right" : "left"};">${esc(formatDateGB(m.createdAt))}</div>
              </div>
            </div>`;
        }).join("");

    return `
      <div style="background:#fff;border-radius:14px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid #E2E8F0;overflow:hidden;">
        <!-- Case header bar -->
        <div style="padding:14px 20px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;">
          <!-- Row 1: name + inactive badge -->
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex:1;min-width:0;">
              <span style="font-size:16px;font-weight:700;color:#0f172a;">${esc(c.caseName)}</span>
              <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;background:${band.bg};color:${band.text};border:1px solid ${band.border};white-space:nowrap;">
                &#x23F0; ${c.daysInactive} days inactive
              </span>
            </div>
          </div>
          <!-- Row 2: meta + key figures -->
          <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div style="display:flex;gap:16px;flex-wrap:wrap;">
              <span style="font-size:12px;color:#64748b;">#&nbsp;${esc(c.accountNumber)}</span>
              <span style="font-size:12px;color:#64748b;">${esc(c.assignedTo || "Unassigned")}</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
              <!-- Outstanding -->
              <div style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:8px 14px;text-align:right;">
                <div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Outstanding</div>
                <div style="font-size:20px;font-weight:800;color:#0f172a;">${esc(amount)}</div>
              </div>
              <!-- Stage -->
              <div style="background:${sc.bg};border:1px solid ${sc.border};border-radius:10px;padding:8px 14px;text-align:center;">
                <div style="font-size:10px;color:${sc.text};font-weight:600;text-transform:uppercase;letter-spacing:0.4px;opacity:0.75;margin-bottom:2px;">Stage</div>
                <div style="font-size:13px;font-weight:700;color:${sc.text};">${esc(stageName)}</div>
              </div>
              <!-- Status pill -->
              <span style="font-size:12px;padding:6px 14px;border-radius:999px;font-weight:600;background:#DCFCE7;color:#166534;border:1px solid #BBF7D0;">Active</span>
            </div>
          </div>
        </div>
        <!-- Body: two columns -->
        <div style="display:flex;">
          <!-- Left: latest activity -->
          <div style="flex:0 0 40%;border-right:1px solid #E2E8F0;padding:14px 16px;background:#FAFAFA;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:10px;">Latest Case Activity</div>
            ${activityHtml}
            <!-- Last activity badge -->
            <div style="margin-top:12px;padding:10px 14px;border-radius:8px;background:${band.bg};border:1px solid ${band.border};display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:10px;font-weight:700;color:${band.text};text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Last Activity</div>
                <div style="font-size:14px;font-weight:800;color:${band.text};">${esc(formatDateGB(c.lastActivityDate))}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:20px;font-weight:800;color:${band.text};line-height:1;">${c.daysInactive}</div>
                <div style="font-size:10px;font-weight:500;color:${band.text};opacity:0.7;">days ago</div>
              </div>
            </div>
          </div>
          <!-- Right: messages -->
          <div style="flex:1;padding:14px 16px;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:10px;">Last ${msgs.length} Message${msgs.length !== 1 ? "s" : ""}</div>
            ${messagesHtml}
          </div>
        </div>
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inactive Cases Report — ${esc(reportDate)}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#F1F5F9;min-height:100vh;">

  <!-- Amber gradient header -->
  <div style="background:linear-gradient(135deg,#B45309 0%,#78350F 100%);padding:32px 40px 28px;color:#fff;">
    <div style="max-width:1120px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:11px;font-weight:700;opacity:0.7;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;">Acclaim Credit Management &middot; Weekly Report</div>
        <div style="font-size:26px;font-weight:800;line-height:1.15;margin-bottom:6px;">${totalCases} Case${totalCases !== 1 ? "s" : ""} Without Activity</div>
        <div style="font-size:13px;opacity:0.8;">${esc(reportDate)} &nbsp;&middot;&nbsp; Generated ${esc(generatedAt)} &nbsp;&middot;&nbsp; Cases inactive ${INACTIVE_DAYS_THRESHOLD}+ days</div>
      </div>
      <div style="opacity:0.25;font-size:56px;line-height:1;">&#x2198;</div>
    </div>
  </div>

  <div style="max-width:1120px;margin:0 auto;padding:28px 40px 40px;">

    <!-- Summary cards -->
    <div style="display:flex;gap:14px;margin-bottom:24px;">
      <div style="background:#fff;border-radius:12px;padding:20px 24px;border-top:4px solid #B45309;box-shadow:0 1px 8px rgba(0,0,0,0.06);flex:1;">
        <div style="font-size:34px;font-weight:800;color:#0f172a;line-height:1;margin-bottom:4px;">${totalCases}</div>
        <div style="font-size:13px;color:#64748b;font-weight:500;">Cases inactive ${INACTIVE_DAYS_THRESHOLD}+ days</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:20px 24px;border-top:4px solid #EF4444;box-shadow:0 1px 8px rgba(0,0,0,0.06);flex:1;">
        <div style="font-size:34px;font-weight:800;color:#0f172a;line-height:1;margin-bottom:4px;">${longestCase ? longestCase.daysInactive : 0}d</div>
        <div style="font-size:13px;color:#64748b;font-weight:500;">Longest inactivity gap</div>
        ${longestCase ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;">${esc(longestCase.caseName)}</div>` : ""}
      </div>
      <div style="background:#fff;border-radius:12px;padding:20px 24px;border-top:4px solid #F97316;box-shadow:0 1px 8px rgba(0,0,0,0.06);flex:1;">
        <div style="font-size:34px;font-weight:800;color:#0f172a;line-height:1;margin-bottom:4px;">${avgDays}d</div>
        <div style="font-size:13px;color:#64748b;font-weight:500;">Average inactivity</div>
      </div>
    </div>

    <!-- Breakdown panels -->
    <div style="display:flex;gap:14px;margin-bottom:28px;">
      <div style="flex:1;background:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 1px 6px rgba(0,0,0,0.05);border:1px solid #E2E8F0;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:14px;">By Inactivity Period</div>
        ${ageBandRows}
      </div>
      <div style="flex:1;background:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 1px 6px rgba(0,0,0,0.05);border:1px solid #E2E8F0;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:14px;">By Case Handler</div>
        ${handlerRows}
      </div>
    </div>

    <!-- Section divider -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="flex:1;height:1px;background:#E2E8F0;"></div>
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;">Cases &middot; Oldest First</div>
      <div style="flex:1;height:1px;background:#E2E8F0;"></div>
    </div>

    <!-- Case cards -->
    ${caseCardsHtml}

    <!-- Footer -->
    <div style="margin-top:4px;padding:16px 0;border-top:1px solid #E2E8F0;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;">
      <span>Acclaim Credit Management &middot; Automated weekly report &middot; Covers cases inactive ${INACTIVE_DAYS_THRESHOLD}+ days since 20 May 2026</span>
      <span>${esc(reportDate)}</span>
    </div>
  </div>
</body>
</html>`;
}

// ── Main processor ────────────────────────────────────────────────────────────

export async function runInactiveCasesReportCustom(
  daysThreshold: number,
  recipientEmail: string,
): Promise<{ sent: boolean; count: number }> {
  console.log(`[InactiveCases] Running on-demand report — days=${daysThreshold}, recipient=${recipientEmail}`);

  const inactiveCases = await storage.getInactiveCases(daysThreshold, INACTIVE_CASES_ACTIVE_FROM);

  if (inactiveCases.length === 0) {
    console.log("[InactiveCases] No inactive cases found — skipping report");
    return { sent: false, count: 0 };
  }

  const caseIds = inactiveCases.map(c => c.caseId);
  const [activityMap, messageMap] = await Promise.all([
    storage.getLatestCaseActivitiesBatch(caseIds),
    storage.getLastMessagesBatch(caseIds, 3),
  ]);

  const [excelBuffer, htmlContent] = await Promise.all([
    generateInactiveCasesExcel(inactiveCases),
    Promise.resolve(generateInactiveCasesHtml(inactiveCases, activityMap, messageMap)),
  ]);

  const dateStr = new Date().toISOString().split("T")[0];
  const excelFileName = `Acclaim_Inactive_Cases_${dateStr}.xlsx`;
  const htmlFileName = `Acclaim_Inactive_Cases_${dateStr}.html`;

  const sent = await sendInactiveCasesReportEmail(inactiveCases, excelBuffer, excelFileName, htmlContent, htmlFileName, recipientEmail);
  if (sent) {
    console.log(`[InactiveCases] On-demand report sent — ${inactiveCases.length} inactive case${inactiveCases.length !== 1 ? "s" : ""}`);
  } else {
    console.error("[InactiveCases] Failed to send on-demand inactive cases report email");
  }
  return { sent, count: inactiveCases.length };
}

export async function runInactiveCasesReportNow(): Promise<{ sent: boolean; count: number }> {
  console.log("[InactiveCases] Running on-demand inactive cases report...");

  const now = new Date();
  const inactiveCases = await storage.getInactiveCases(INACTIVE_DAYS_THRESHOLD, INACTIVE_CASES_ACTIVE_FROM);

  if (inactiveCases.length === 0) {
    console.log("[InactiveCases] No inactive cases found — skipping report");
    return { sent: false, count: 0 };
  }

  const caseIds = inactiveCases.map(c => c.caseId);
  const [activityMap, messageMap] = await Promise.all([
    storage.getLatestCaseActivitiesBatch(caseIds),
    storage.getLastMessagesBatch(caseIds, 3),
  ]);

  const [excelBuffer, htmlContent] = await Promise.all([
    generateInactiveCasesExcel(inactiveCases),
    Promise.resolve(generateInactiveCasesHtml(inactiveCases, activityMap, messageMap)),
  ]);

  const dateStr = now.toISOString().split("T")[0];
  const excelFileName = `Acclaim_Inactive_Cases_${dateStr}.xlsx`;
  const htmlFileName = `Acclaim_Inactive_Cases_${dateStr}.html`;

  const sent = await sendInactiveCasesReportEmail(inactiveCases, excelBuffer, excelFileName, htmlContent, htmlFileName);
  if (sent) {
    console.log(`[InactiveCases] On-demand report sent — ${inactiveCases.length} inactive case${inactiveCases.length !== 1 ? "s" : ""}`);
  } else {
    console.error("[InactiveCases] Failed to send on-demand inactive cases report email");
  }
  return { sent, count: inactiveCases.length };
}

export async function processInactiveCasesReport(): Promise<void> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 4 = Thursday
  const hour = now.getHours();

  if (dayOfWeek !== 4) return;
  if (hour !== 8) return;

  console.log("[InactiveCases] Running weekly inactive cases report...");

  try {
    const inactiveCases = await storage.getInactiveCases(INACTIVE_DAYS_THRESHOLD, INACTIVE_CASES_ACTIVE_FROM);

    if (inactiveCases.length === 0) {
      console.log("[InactiveCases] No inactive cases found — skipping report");
      return;
    }

    const caseIds = inactiveCases.map(c => c.caseId);
    const [activityMap, messageMap] = await Promise.all([
      storage.getLatestCaseActivitiesBatch(caseIds),
      storage.getLastMessagesBatch(caseIds, 3),
    ]);

    const [excelBuffer, htmlContent] = await Promise.all([
      generateInactiveCasesExcel(inactiveCases),
      Promise.resolve(generateInactiveCasesHtml(inactiveCases, activityMap, messageMap)),
    ]);

    const dateStr = now.toISOString().split("T")[0];
    const excelFileName = `Acclaim_Inactive_Cases_${dateStr}.xlsx`;
    const htmlFileName = `Acclaim_Inactive_Cases_${dateStr}.html`;

    const sent = await sendInactiveCasesReportEmail(inactiveCases, excelBuffer, excelFileName, htmlContent, htmlFileName);
    if (sent) {
      console.log(`[InactiveCases] Report sent — ${inactiveCases.length} inactive case${inactiveCases.length !== 1 ? "s" : ""}`);
    } else {
      console.error("[InactiveCases] Failed to send inactive cases report email");
    }
  } catch (error) {
    console.error("[InactiveCases] Error processing inactive cases report:", error);
  }
}
