import ExcelJS from "exceljs";
import { storage } from "./storage";
import { sendEscalationReportEmail } from "./email-service-sendgrid";

// Only messages received after this date are considered for escalation.
// Set to the date this feature was activated so historical backlog is not reported.
export const ESCALATION_ACTIVE_FROM = new Date("2026-06-25T00:00:00.000Z");

// Minimum days old before a message is considered overdue
const MIN_DAYS_OVERDUE = 7;

// ── Acknowledgement detection ────────────────────────────────────────────────

const ACKNOWLEDGEMENT_PHRASES = new Set([
  // Gratitude
  "thanks", "thank you", "thank you very much", "many thanks", "thanks very much",
  "thanks a lot", "thanks so much", "much appreciated", "appreciated", "grateful",
  // British/informal positives
  "cheers", "ta", "brilliant", "lovely", "fab", "fabulous", "great", "fantastic",
  "wonderful", "excellent", "perfect", "ace", "brill", "splendid", "superb", "marvellous",
  // Receipt/acknowledgement
  "ok", "okay", "noted", "received", "got it", "understood", "will do", "duly noted",
  "roger", "confirmed", "all noted", "all received",
  // No action needed
  "no problem", "no worries", "no probs", "not a problem", "thats fine", "thats great",
  "thats perfect", "all good", "sounds good", "good to know", "makes sense",
  "understood thank you",
  // Emoji only
  "👍", "🙏", "✅", "😊", "🎉",
]);

const ACTION_TRIGGER_WORDS = [
  "please", "can you", "could you", "need", "help", "urgent", "query",
  "when", "deadline", "issue", "problem", "question",
];

export function isLikelyAcknowledgement(content: string): boolean {
  // Strip punctuation and normalise, then check against phrase list
  const stripped = content.toLowerCase().replace(/[^\w\s\p{Emoji}]/gu, "").trim();
  if (ACKNOWLEDGEMENT_PHRASES.has(stripped)) return true;

  // Heuristic fallback: short + no question mark + no action trigger words
  if (content.length < 100 && !content.includes("?")) {
    const lower = content.toLowerCase();
    const hasAction = ACTION_TRIGGER_WORDS.some(w => lower.includes(w));
    if (!hasAction) return true;
  }
  return false;
}

// ── Excel report generation ──────────────────────────────────────────────────

export type EscalatedMessage = Awaited<ReturnType<typeof storage.getEscalatedCaseMessages>>[number];

export async function generateEscalationExcel(msgs: EscalatedMessage[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Acclaim Credit Management";
  workbook.created = new Date();

  // ── Sheet 1: Escalation Report ─────────────────────────────────────────────
  const sheet = workbook.addWorksheet("Escalation Report");
  sheet.columns = [
    { header: "Case Name",       key: "caseName",     width: 28 },
    { header: "Account Number",  key: "accountNumber", width: 15 },
    { header: "Case Handler",    key: "caseHandler",   width: 20 },
    { header: "Message Date",    key: "msgDate",       width: 14 },
    { header: "Days Overdue",    key: "daysOverdue",   width: 13 },
    { header: "Sender",          key: "sender",        width: 22 },
    { header: "Sender Email",    key: "senderEmail",   width: 30 },
    { header: "Subject",         key: "subject",       width: 25 },
    { header: "Message",         key: "message",       width: 55 },
    { header: "Status",          key: "status",        width: 26 },
  ];

  // Header row — amber
  const hdr = sheet.getRow(1);
  hdr.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  hdr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB45309" } };
  hdr.alignment = { vertical: "middle", horizontal: "center" };
  hdr.height = 22;
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // Group by case, sort cases by oldest message first (highest daysOverdue)
  const grouped = new Map<number, EscalatedMessage[]>();
  for (const m of msgs) {
    if (!grouped.has(m.caseId)) grouped.set(m.caseId, []);
    grouped.get(m.caseId)!.push(m);
  }

  const sortedCaseIds = [...grouped.keys()].sort((a, b) => {
    const aMax = Math.max(...grouped.get(a)!.map(m => m.daysOverdue));
    const bMax = Math.max(...grouped.get(b)!.map(m => m.daysOverdue));
    return bMax - aMax;
  });

  for (const caseId of sortedCaseIds) {
    const caseMsgs = grouped.get(caseId)!.sort((a, b) => b.daysOverdue - a.daysOverdue);
    const first = caseMsgs[0];

    // Case group header
    const groupRow = sheet.addRow({
      caseName: `${first.caseName}  ·  ${first.accountNumber}  ·  Handler: ${first.caseHandler || "Unassigned"}`,
    });
    sheet.mergeCells(`A${groupRow.number}:J${groupRow.number}`);
    groupRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    groupRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    groupRow.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    groupRow.height = 20;

    for (const m of caseMsgs) {
      const ack = isLikelyAcknowledgement(m.messageContent);
      const truncatedMsg = m.messageContent.length > 500
        ? m.messageContent.slice(0, 500) + "…"
        : m.messageContent;

      const ageColor = ack
        ? "FFF3F4F6"                           // grey — likely acknowledgement
        : m.daysOverdue >= 28 ? "FFFEE2E2"     // red tint
        : m.daysOverdue >= 21 ? "FFFEF3C7"     // amber tint
        : "FFFFF8E6";                           // yellow tint

      const row = sheet.addRow({
        caseName:     m.caseName,
        accountNumber: m.accountNumber,
        caseHandler:  m.caseHandler || "Unassigned",
        msgDate:      m.messageCreatedAt.toLocaleDateString("en-GB"),
        daysOverdue:  m.daysOverdue,
        sender:       m.senderName,
        senderEmail:  m.senderEmail,
        subject:      m.messageSubject || "(no subject)",
        message:      truncatedMsg,
        status:       ack ? "ℹ️ Likely Acknowledgement" : "❗ Awaiting Response",
      });

      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ageColor } };
      if (ack) row.font = { color: { argb: "FF6B7280" }, italic: true };
      row.alignment = { wrapText: true, vertical: "top" };
      row.height = 40;
    }
  }

  // ── Sheet 2: Summary ───────────────────────────────────────────────────────
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { key: "label", width: 35 },
    { key: "value", width: 20 },
  ];

  const addSummaryRow = (label: string, value: string | number, bold = false, bgArgb?: string) => {
    const r = summary.addRow({ label, value });
    if (bold) r.font = { bold: true };
    if (bgArgb) r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    return r;
  };

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const totalCases = grouped.size;
  const totalMsgs = msgs.length;
  const ackMsgs = msgs.filter(m => isLikelyAcknowledgement(m.messageContent));
  const realEscalations = msgs.filter(m => !isLikelyAcknowledgement(m.messageContent));

  addSummaryRow("Escalation Report", today, true, "FFB45309");
  summary.getRow(summary.rowCount).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 13 };
  summary.addRow({});

  addSummaryRow("Total escalated messages", totalMsgs, true);
  addSummaryRow("Total cases affected", totalCases, true);
  addSummaryRow("Requiring response", realEscalations.length, true);
  addSummaryRow("Likely acknowledgements (flagged, may not need reply)", ackMsgs.length);
  summary.addRow({});

  addSummaryRow("── By Age ──", "", true, "FFE5E7EB");
  const bands = [
    { label: "7–14 days", min: 7,  max: 14 },
    { label: "14–21 days", min: 14, max: 21 },
    { label: "21–28 days", min: 21, max: 28 },
    { label: "28+ days",   min: 28, max: Infinity },
  ];
  for (const b of bands) {
    const count = realEscalations.filter(m => m.daysOverdue >= b.min && m.daysOverdue < b.max).length;
    addSummaryRow(b.label, count);
  }
  summary.addRow({});

  addSummaryRow("── By Case Handler ──", "", true, "FFE5E7EB");
  const handlerMap = new Map<string, { msgs: number; cases: Set<number> }>();
  for (const m of realEscalations) {
    const key = m.caseHandler || "Unassigned";
    if (!handlerMap.has(key)) handlerMap.set(key, { msgs: 0, cases: new Set() });
    const h = handlerMap.get(key)!;
    h.msgs++;
    h.cases.add(m.caseId);
  }
  for (const [handler, data] of [...handlerMap.entries()].sort((a, b) => b[1].msgs - a[1].msgs)) {
    addSummaryRow(handler, `${data.msgs} message${data.msgs !== 1 ? "s" : ""} across ${data.cases.size} case${data.cases.size !== 1 ? "s" : ""}`);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// ── HTML report generation ───────────────────────────────────────────────────

export function generateEscalationHtml(msgs: EscalatedMessage[]): string {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const totalCases = new Set(msgs.map(m => m.caseId)).size;
  const totalMsgs = msgs.length;
  const ackMsgs = msgs.filter(m => isLikelyAcknowledgement(m.messageContent)).length;

  const bands = [
    { label: "7–14 days", min: 7,  max: 14 },
    { label: "14–21 days", min: 14, max: 21 },
    { label: "21–28 days", min: 21, max: 28 },
    { label: "28+ days",   min: 28, max: Infinity },
  ];

  const handlerMap = new Map<string, number>();
  for (const m of msgs) {
    const key = m.caseHandler || "Unassigned";
    handlerMap.set(key, (handlerMap.get(key) ?? 0) + 1);
  }

  // Group by case, sorted by oldest first (highest daysOverdue)
  const grouped = new Map<number, EscalatedMessage[]>();
  for (const m of msgs) {
    if (!grouped.has(m.caseId)) grouped.set(m.caseId, []);
    grouped.get(m.caseId)!.push(m);
  }
  const sortedCaseIds = [...grouped.keys()].sort((a, b) => {
    const aMax = Math.max(...grouped.get(a)!.map(m => m.daysOverdue));
    const bMax = Math.max(...grouped.get(b)!.map(m => m.daysOverdue));
    return bMax - aMax;
  });

  const ageBandRows = bands.map(b => {
    const count = msgs.filter(m => m.daysOverdue >= b.min && m.daysOverdue < b.max).length;
    const bg = b.min >= 28 ? "#FEE2E2" : b.min >= 21 ? "#FEF3C7" : b.min >= 14 ? "#FFFBEB" : "#F9FAFB";
    return `<tr style="background:${bg}"><td style="padding:6px 14px;color:#374151">${b.label}</td><td style="padding:6px 14px;color:#374151;font-weight:600">${count}</td></tr>`;
  }).join("");

  const handlerRows = [...handlerMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([h, c]) => `<tr><td style="padding:6px 14px;color:#374151">${escHtml(h)}</td><td style="padding:6px 14px;color:#374151;font-weight:600">${c}</td></tr>`)
    .join("");

  const caseRows = sortedCaseIds.map(caseId => {
    const caseMsgs = grouped.get(caseId)!.sort((a, b) => b.daysOverdue - a.daysOverdue);
    const first = caseMsgs[0];
    const msgRows = caseMsgs.map(m => {
      const ack = isLikelyAcknowledgement(m.messageContent);
      const rowBg = ack ? "#F3F4F6" : m.daysOverdue >= 28 ? "#FEE2E2" : m.daysOverdue >= 21 ? "#FEF3C7" : "#FFFBEB";
      const statusBadge = ack
        ? `<span style="background:#E5E7EB;color:#6B7280;padding:2px 8px;border-radius:9999px;font-size:12px">Likely Acknowledgement</span>`
        : `<span style="background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600">Awaiting Response</span>`;
      const truncated = m.messageContent.length > 400 ? m.messageContent.slice(0, 400) + "…" : m.messageContent;
      return `
        <tr style="background:${rowBg};border-bottom:1px solid #E5E7EB">
          <td style="padding:10px 14px;color:#374151;font-size:13px;vertical-align:top;white-space:nowrap">${m.messageCreatedAt.toLocaleDateString("en-GB")}</td>
          <td style="padding:10px 14px;color:#374151;font-size:13px;vertical-align:top;white-space:nowrap;font-weight:600">${m.daysOverdue}d</td>
          <td style="padding:10px 14px;color:#374151;font-size:13px;vertical-align:top">${escHtml(m.senderName)}<br><span style="color:#9CA3AF;font-size:12px">${escHtml(m.senderEmail)}</span></td>
          <td style="padding:10px 14px;color:#374151;font-size:13px;vertical-align:top;max-width:320px;word-break:break-word">${m.messageSubject ? `<strong>${escHtml(m.messageSubject)}</strong><br>` : ""}${escHtml(truncated)}</td>
          <td style="padding:10px 14px;vertical-align:top;white-space:nowrap">${statusBadge}</td>
        </tr>`;
    }).join("");

    return `
      <tr style="background:#1E3A5F">
        <td colspan="5" style="padding:10px 14px;color:#FFFFFF;font-weight:700;font-size:13px">
          ${escHtml(first.caseName)} &nbsp;·&nbsp; ${escHtml(first.accountNumber)} &nbsp;·&nbsp; Handler: ${escHtml(first.caseHandler || "Unassigned")}
        </td>
      </tr>
      ${msgRows}`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Escalation Report — ${today}</title>
<style>
  body{margin:0;padding:24px;background:#F3F4F6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif}
  h1,h2,h3{margin:0}
  table{border-collapse:collapse;width:100%}
  th{text-align:left}
</style>
</head>
<body>
  <div style="max-width:900px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#B45309 0%,#92400E 100%);padding:36px 40px;text-align:center">
      <h1 style="color:#FFFFFF;font-size:22px;font-weight:700">Daily Escalation Report — Unanswered Messages</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0">${today}</p>
    </div>
    <!-- Summary cards -->
    <div style="display:flex;gap:16px;padding:32px 40px 0">
      <div style="flex:1;background:#FEF3C7;border:1px solid #F59E0B;border-radius:10px;padding:20px;text-align:center">
        <p style="margin:0;font-size:36px;font-weight:800;color:#92400E">${totalMsgs}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#78350F">Unanswered Messages</p>
      </div>
      <div style="flex:1;background:#FEE2E2;border:1px solid #EF4444;border-radius:10px;padding:20px;text-align:center">
        <p style="margin:0;font-size:36px;font-weight:800;color:#991B1B">${totalCases}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#7F1D1D">Cases Affected</p>
      </div>
      <div style="flex:1;background:#F3F4F6;border:1px solid #D1D5DB;border-radius:10px;padding:20px;text-align:center">
        <p style="margin:0;font-size:36px;font-weight:800;color:#6B7280">${ackMsgs}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6B7280">Likely Acknowledgements</p>
      </div>
    </div>
    <!-- Breakdown tables -->
    <div style="display:flex;gap:24px;padding:28px 40px">
      <div style="flex:1">
        <h3 style="font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">By Age</h3>
        <table style="border-radius:8px;overflow:hidden;border:1px solid #E5E7EB;font-size:13px">
          <tr style="background:#F9FAFB"><th style="padding:8px 14px;color:#6B7280;font-weight:600">Age Band</th><th style="padding:8px 14px;color:#6B7280;font-weight:600">Messages</th></tr>
          ${ageBandRows}
        </table>
      </div>
      <div style="flex:1">
        <h3 style="font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">By Case Handler</h3>
        <table style="border-radius:8px;overflow:hidden;border:1px solid #E5E7EB;font-size:13px">
          <tr style="background:#F9FAFB"><th style="padding:8px 14px;color:#6B7280;font-weight:600">Handler</th><th style="padding:8px 14px;color:#6B7280;font-weight:600">Messages</th></tr>
          ${handlerRows}
        </table>
      </div>
    </div>
    <!-- Case detail table -->
    <div style="padding:0 40px 40px">
      <h3 style="font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Full Case Detail</h3>
      <table style="border-radius:8px;overflow:hidden;border:1px solid #E5E7EB;font-size:13px">
        <tr style="background:#F9FAFB">
          <th style="padding:8px 14px;color:#6B7280;font-weight:600">Date</th>
          <th style="padding:8px 14px;color:#6B7280;font-weight:600">Age</th>
          <th style="padding:8px 14px;color:#6B7280;font-weight:600">Sender</th>
          <th style="padding:8px 14px;color:#6B7280;font-weight:600">Message</th>
          <th style="padding:8px 14px;color:#6B7280;font-weight:600">Status</th>
        </tr>
        ${caseRows}
      </table>
    </div>
    <!-- Footer -->
    <div style="background:#1F2937;padding:20px 40px;text-align:center">
      <p style="margin:0;color:#9CA3AF;font-size:12px">Automated escalation report — Acclaim Client Portal</p>
    </div>
  </div>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── On-demand trigger with custom params ─────────────────────────────────────

export async function runEscalationReportOnDemand(
  minDays: number,
  recipientEmail: string,
): Promise<{ sent: boolean; count: number; cases: number }> {
  console.log(`[Escalation] Running on-demand report — minDays=${minDays}, recipient=${recipientEmail}`);

  const escalatedMsgs = await storage.getEscalatedCaseMessages(ESCALATION_ACTIVE_FROM, minDays);

  if (escalatedMsgs.length === 0) {
    console.log("[Escalation] No escalated messages found — skipping report");
    return { sent: false, count: 0, cases: 0 };
  }

  const dateStr = new Date().toISOString().split("T")[0];
  const excelBuffer = await generateEscalationExcel(escalatedMsgs);
  const excelFileName = `Acclaim_Escalation_Report_${dateStr}.xlsx`;
  const htmlContent = generateEscalationHtml(escalatedMsgs);
  const htmlFileName = `Acclaim_Escalation_Report_${dateStr}.html`;

  const sent = await sendEscalationReportEmail(escalatedMsgs, excelBuffer, excelFileName, htmlContent, htmlFileName, recipientEmail);
  if (sent) {
    const caseCount = new Set(escalatedMsgs.map(m => m.caseId)).size;
    console.log(`[Escalation] On-demand report sent — ${escalatedMsgs.length} messages across ${caseCount} cases`);
    return { sent: true, count: escalatedMsgs.length, cases: caseCount };
  }
  console.error("[Escalation] Failed to send on-demand escalation report email");
  return { sent: false, count: escalatedMsgs.length, cases: 0 };
}

// ── Main processor ───────────────────────────────────────────────────────────

export async function processEscalationReport(): Promise<void> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();

  // Weekdays only (Mon–Fri), at 8am
  if (dayOfWeek === 0 || dayOfWeek === 6) return;
  if (hour !== 8) return;

  console.log("[Escalation] Running daily escalation report...");

  try {
    const escalatedMsgs = await storage.getEscalatedCaseMessages(ESCALATION_ACTIVE_FROM, MIN_DAYS_OVERDUE);

    if (escalatedMsgs.length === 0) {
      console.log("[Escalation] No escalated messages found — skipping report");
      return;
    }

    const dateStr = now.toISOString().split("T")[0];
    const excelBuffer = await generateEscalationExcel(escalatedMsgs);
    const excelFileName = `Acclaim_Escalation_Report_${dateStr}.xlsx`;
    const htmlContent = generateEscalationHtml(escalatedMsgs);
    const htmlFileName = `Acclaim_Escalation_Report_${dateStr}.html`;

    const sent = await sendEscalationReportEmail(escalatedMsgs, excelBuffer, excelFileName, htmlContent, htmlFileName);
    if (sent) {
      console.log(`[Escalation] Report sent — ${escalatedMsgs.length} messages across ${new Set(escalatedMsgs.map(m => m.caseId)).size} cases`);
    } else {
      console.error("[Escalation] Failed to send escalation report email");
    }
  } catch (error) {
    console.error("[Escalation] Error processing escalation report:", error);
  }
}
