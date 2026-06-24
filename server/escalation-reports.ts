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

    const excelBuffer = await generateEscalationExcel(escalatedMsgs);
    const dateStr = now.toISOString().split("T")[0];
    const fileName = `Acclaim_Escalation_Report_${dateStr}.xlsx`;

    const sent = await sendEscalationReportEmail(escalatedMsgs, excelBuffer, fileName);
    if (sent) {
      console.log(`[Escalation] Report sent — ${escalatedMsgs.length} messages across ${new Set(escalatedMsgs.map(m => m.caseId)).size} cases`);
    } else {
      console.error("[Escalation] Failed to send escalation report email");
    }
  } catch (error) {
    console.error("[Escalation] Error processing escalation report:", error);
  }
}
