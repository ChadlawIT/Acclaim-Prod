import ExcelJS from "exceljs";
import { storage } from "./storage";
import { sendStuckActivityReportEmail } from "./email-service-sendgrid";

export type StuckCase = Awaited<ReturnType<typeof storage.getCasesStuckAtActivity>>[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return "£" + amount;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(num);
}

function formatDateGB(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatStage(stage: string): string {
  const map: Record<string, string> = {
    initial_contact: "Initial Contact",
    pre_legal: "Pre-Legal",
    legal_action: "Legal Action",
  };
  return map[stage] ?? stage.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

type AgeBand = { bg: string; border: string; text: string; label: string };

function ageBand(days: number): AgeBand {
  if (days >= 60) return { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", label: "60+ days" };
  if (days >= 30) return { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412", label: "30–60 days" };
  return              { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", label: "Under 30 days" };
}

// ── Excel report ──────────────────────────────────────────────────────────────

export async function generateStuckActivityExcel(
  cases: StuckCase[],
  selectedDescriptions: string[],
  minDays: number,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Acclaim Credit Management";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Stuck Cases");
  sheet.columns = [
    { header: "Case Name",            key: "caseName",         width: 30 },
    { header: "Account Number",       key: "accountNumber",    width: 16 },
    { header: "Handler",              key: "handler",          width: 22 },
    { header: "Outstanding",          key: "outstanding",      width: 16 },
    { header: "Stage",                key: "stage",            width: 18 },
    { header: "Last Activity",        key: "lastActivity",     width: 55 },
    { header: "Activity Date",        key: "activityDate",     width: 16 },
    { header: "Days Since Activity",  key: "daysSince",        width: 18 },
  ];

  const hdr = sheet.getRow(1);
  hdr.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  hdr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
  hdr.alignment = { vertical: "middle", horizontal: "center" };
  hdr.height = 22;
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const sorted = [...cases].sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);

  for (const c of sorted) {
    const band = ageBand(c.daysSinceActivity);
    const argbMap: Record<string, string> = {
      "#FEF2F2": "FFFEF2F2",
      "#FFF7ED": "FFFFF7ED",
      "#FFFBEB": "FFFFFBEB",
    };

    const row = sheet.addRow({
      caseName:     c.caseName,
      accountNumber: c.accountNumber,
      handler:      c.assignedTo || "Unassigned",
      outstanding:  formatCurrency(c.outstandingAmount),
      stage:        formatStage(c.stage),
      lastActivity: c.lastActivityDescription,
      activityDate: formatDateGB(c.lastActivityDate),
      daysSince:    c.daysSinceActivity,
    });
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argbMap[band.bg] ?? "FFFFFFFF" } };
    row.alignment = { vertical: "middle", wrapText: true };
    row.height = 20;
  }

  // Summary sheet
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [{ key: "label", width: 35 }, { key: "value", width: 20 }];

  const addRow = (label: string, value: string | number, bold = false, bgArgb?: string) => {
    const r = summary.addRow({ label, value });
    if (bold) r.font = { bold: true };
    if (bgArgb) r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    return r;
  };

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  addRow("Stuck Cases Report", today, true, "FF7C3AED");
  summary.getRow(summary.rowCount).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 13 };
  summary.addRow({});
  addRow("Total cases", sorted.length, true);
  addRow("Days threshold", `${minDays}+ days`);
  addRow("Activities searched", selectedDescriptions.join(", "));
  summary.addRow({});

  addRow("── By Inactivity Period ──", "", true, "FFE5E7EB");
  const bands = [
    { label: "Under 30 days", min: 0,  max: 30 },
    { label: "30–60 days",    min: 30, max: 60 },
    { label: "60+ days",      min: 60, max: Infinity },
  ];
  for (const b of bands) {
    addRow(b.label, sorted.filter(c => c.daysSinceActivity >= b.min && c.daysSinceActivity < b.max).length);
  }
  summary.addRow({});

  addRow("── By Activity ──", "", true, "FFE5E7EB");
  const descMap = new Map<string, number>();
  for (const c of sorted) {
    descMap.set(c.lastActivityDescription, (descMap.get(c.lastActivityDescription) ?? 0) + 1);
  }
  for (const [desc, count] of [...descMap.entries()].sort((a, b) => b[1] - a[1])) {
    addRow(desc, count);
  }
  summary.addRow({});

  addRow("── By Case Handler ──", "", true, "FFE5E7EB");
  const handlerMap = new Map<string, number>();
  for (const c of sorted) {
    const key = c.assignedTo || "Unassigned";
    handlerMap.set(key, (handlerMap.get(key) ?? 0) + 1);
  }
  for (const [handler, count] of [...handlerMap.entries()].sort((a, b) => b[1] - a[1])) {
    addRow(handler, count);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// ── HTML report ───────────────────────────────────────────────────────────────

export function generateStuckActivityHtml(
  cases: StuckCase[],
  selectedDescriptions: string[],
  minDays: number,
  messageMap: Map<number, Array<{ sender: string; isAdmin: boolean; content: string; createdAt: Date }>>,
): string {
  const now = new Date();
  const reportDate = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const generatedAt = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const sorted = [...cases].sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);
  const totalCases = sorted.length;
  const longestCase = sorted[0];
  const avgDays = totalCases > 0
    ? Math.round(sorted.reduce((s, c) => s + c.daysSinceActivity, 0) / totalCases)
    : 0;

  const handlerMap = new Map<string, number>();
  for (const c of sorted) {
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
          <div style="width:26px;height:26px;border-radius:50%;background:${isUnassigned ? "#F1F5F9" : "#EDE9FE"};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${isUnassigned ? "#94a3b8" : "#6D28D9"};flex-shrink:0;">${initial}</div>
          <div style="flex:1;font-size:13px;color:#334155;">${esc(name)}</div>
          <div style="font-size:13px;font-weight:700;color:#0f172a;background:#F8FAFC;padding:2px 12px;border-radius:6px;border:1px solid #E2E8F0;">${count}</div>
        </div>`;
    }).join("");

  const activityRows = selectedDescriptions.map(desc => {
    const count = sorted.filter(c => c.lastActivityDescription === desc).length;
    return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <div style="width:8px;height:8px;border-radius:2px;background:#7C3AED;flex-shrink:0;"></div>
        <div style="flex:1;font-size:12px;color:#334155;">${esc(desc)}</div>
        <div style="font-size:13px;font-weight:700;color:#0f172a;background:#F8FAFC;padding:2px 12px;border-radius:6px;border:1px solid #E2E8F0;">${count} case${count !== 1 ? "s" : ""}</div>
      </div>`;
  }).join("");

  const caseCardsHtml = sorted.map(c => {
    const band = ageBand(c.daysSinceActivity);
    const msgs = messageMap.get(c.caseId) ?? [];
    const amount = formatCurrency(c.outstandingAmount);
    const stageName = formatStage(c.stage);

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
        <div style="padding:14px 20px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex:1;min-width:0;">
              <span style="font-size:16px;font-weight:700;color:#0f172a;">${esc(c.caseName)}</span>
              <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;background:${band.bg};color:${band.text};border:1px solid ${band.border};white-space:nowrap;">
                &#x23F3; ${c.daysSinceActivity} days since activity
              </span>
            </div>
          </div>
          <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div style="display:flex;gap:16px;flex-wrap:wrap;">
              <span style="font-size:12px;color:#64748b;">#&nbsp;${esc(c.accountNumber)}</span>
              <span style="font-size:12px;color:#64748b;">${esc(c.assignedTo || "Unassigned")}</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
              <div style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:8px 14px;text-align:right;">
                <div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Outstanding</div>
                <div style="font-size:20px;font-weight:800;color:#0f172a;">${esc(amount)}</div>
              </div>
              <div style="background:#EDE9FE;border:1px solid #DDD6FE;border-radius:10px;padding:8px 14px;text-align:center;">
                <div style="font-size:10px;color:#6D28D9;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;opacity:0.75;margin-bottom:2px;">Stage</div>
                <div style="font-size:13px;font-weight:700;color:#6D28D9;">${esc(stageName)}</div>
              </div>
            </div>
          </div>
        </div>
        <div style="display:flex;">
          <div style="flex:0 0 42%;border-right:1px solid #E2E8F0;padding:14px 16px;background:#FAFAFA;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:10px;">Last Activity</div>
            <div style="background:#fff;border:1px solid #E2E8F0;border-left:3px solid #7C3AED;border-radius:0 8px 8px 0;padding:12px 14px;">
              <div style="font-size:13px;color:#1e293b;line-height:1.6;margin-bottom:8px;">${esc(c.lastActivityDescription)}</div>
              <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#94a3b8;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${esc(formatDateGB(c.lastActivityDate))}
              </div>
            </div>
            <div style="margin-top:12px;padding:10px 14px;border-radius:8px;background:${band.bg};border:1px solid ${band.border};display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:10px;font-weight:700;color:${band.text};text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Days Since</div>
                <div style="font-size:14px;font-weight:800;color:${band.text};">${esc(formatDateGB(c.lastActivityDate))}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:20px;font-weight:800;color:${band.text};line-height:1;">${c.daysSinceActivity}</div>
                <div style="font-size:10px;font-weight:500;color:${band.text};opacity:0.7;">days ago</div>
              </div>
            </div>
          </div>
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
  <title>Stuck Cases Report — ${esc(reportDate)}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#F1F5F9;min-height:100vh;">
  <div style="background:linear-gradient(135deg,#6D28D9 0%,#4C1D95 100%);padding:32px 40px 28px;color:#fff;">
    <div style="max-width:1120px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:11px;font-weight:700;opacity:0.7;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;">Acclaim Credit Management &middot; On-Demand Report</div>
        <div style="font-size:26px;font-weight:800;line-height:1.15;margin-bottom:6px;">${totalCases} Case${totalCases !== 1 ? "s" : ""} Stuck at Activity</div>
        <div style="font-size:13px;opacity:0.8;">${esc(reportDate)} &nbsp;&middot;&nbsp; Generated ${esc(generatedAt)} &nbsp;&middot;&nbsp; No activity for ${minDays}+ days after selected milestone</div>
      </div>
      <div style="opacity:0.25;font-size:56px;line-height:1;">&#x23F3;</div>
    </div>
  </div>

  <div style="max-width:1120px;margin:0 auto;padding:28px 40px 40px;">

    <div style="display:flex;gap:14px;margin-bottom:24px;">
      <div style="background:#fff;border-radius:12px;padding:20px 24px;border-top:4px solid #7C3AED;box-shadow:0 1px 8px rgba(0,0,0,0.06);flex:1;">
        <div style="font-size:34px;font-weight:800;color:#0f172a;line-height:1;margin-bottom:4px;">${totalCases}</div>
        <div style="font-size:13px;color:#64748b;font-weight:500;">Cases matching criteria</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:20px 24px;border-top:4px solid #EF4444;box-shadow:0 1px 8px rgba(0,0,0,0.06);flex:1;">
        <div style="font-size:34px;font-weight:800;color:#0f172a;line-height:1;margin-bottom:4px;">${longestCase ? longestCase.daysSinceActivity : 0}d</div>
        <div style="font-size:13px;color:#64748b;font-weight:500;">Longest gap</div>
        ${longestCase ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;">${esc(longestCase.caseName)}</div>` : ""}
      </div>
      <div style="background:#fff;border-radius:12px;padding:20px 24px;border-top:4px solid #F97316;box-shadow:0 1px 8px rgba(0,0,0,0.06);flex:1;">
        <div style="font-size:34px;font-weight:800;color:#0f172a;line-height:1;margin-bottom:4px;">${avgDays}d</div>
        <div style="font-size:13px;color:#64748b;font-weight:500;">Average days since activity</div>
      </div>
    </div>

    <div style="display:flex;gap:14px;margin-bottom:28px;">
      <div style="flex:1;background:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 1px 6px rgba(0,0,0,0.05);border:1px solid #E2E8F0;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:14px;">By Activity Type</div>
        ${activityRows}
      </div>
      <div style="flex:1;background:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 1px 6px rgba(0,0,0,0.05);border:1px solid #E2E8F0;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:14px;">By Case Handler</div>
        ${handlerRows}
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="flex:1;height:1px;background:#E2E8F0;"></div>
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;">Cases &middot; Oldest First</div>
      <div style="flex:1;height:1px;background:#E2E8F0;"></div>
    </div>

    ${caseCardsHtml}

    <div style="margin-top:4px;padding:16px 0;border-top:1px solid #E2E8F0;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;">
      <span>Acclaim Credit Management &middot; On-demand stuck-activity report &middot; Threshold: ${minDays}+ days</span>
      <span>${esc(reportDate)}</span>
    </div>
  </div>
</body>
</html>`;
}

// ── On-demand trigger ─────────────────────────────────────────────────────────

export async function runStuckActivityReportOnDemand(
  descriptions: string[],
  minDays: number,
  recipientEmail: string,
): Promise<{ sent: boolean; count: number }> {
  console.log(`[StuckActivity] Running report — descriptions=${descriptions.length}, minDays=${minDays}, recipient=${recipientEmail}`);

  const cases = await storage.getCasesStuckAtActivity(descriptions, minDays);

  if (cases.length === 0) {
    console.log("[StuckActivity] No matching cases found — skipping report");
    return { sent: false, count: 0 };
  }

  const caseIds = cases.map(c => c.caseId);
  const messageMap = await storage.getLastMessagesBatch(caseIds, 3);

  const [excelBuffer, htmlContent] = await Promise.all([
    generateStuckActivityExcel(cases, descriptions, minDays),
    Promise.resolve(generateStuckActivityHtml(cases, descriptions, minDays, messageMap)),
  ]);

  const dateStr = new Date().toISOString().split("T")[0];
  const excelFileName = `Acclaim_Stuck_Activity_${dateStr}.xlsx`;
  const htmlFileName  = `Acclaim_Stuck_Activity_${dateStr}.html`;

  const sent = await sendStuckActivityReportEmail(
    cases, descriptions, minDays,
    excelBuffer, excelFileName,
    htmlContent, htmlFileName,
    recipientEmail,
  );

  if (sent) {
    console.log(`[StuckActivity] Report sent — ${cases.length} case${cases.length !== 1 ? "s" : ""}`);
  } else {
    console.error("[StuckActivity] Failed to send report email");
  }

  return { sent, count: cases.length };
}
