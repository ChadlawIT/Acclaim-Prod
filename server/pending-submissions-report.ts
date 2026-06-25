import ExcelJS from "exceljs";
import { storage } from "./storage";
import { sendPendingSubmissionsReportEmail } from "./email-service-sendgrid";

const MIN_DAYS_PENDING = 3;

type PendingSubmission = Awaited<ReturnType<typeof storage.getPendingSubmissionsOlderThan>>[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function debtorDisplayName(s: PendingSubmission): string {
  if (s.debtorType === "organisation") {
    return s.organisationTradingName || s.organisationName || "—";
  }
  const parts = [s.principalSalutation, s.principalFirstName, s.principalLastName].filter(Boolean);
  const fullName = parts.join(" ") || "—";
  if (s.tradingName) return `${s.tradingName} (${fullName})`;
  return fullName;
}

function debtorTypeLabel(s: PendingSubmission): string {
  if (s.debtorType === "organisation") return "Organisation";
  if (s.individualType === "business") return "Sole Trader";
  return "Individual";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.split("-").reverse().join("/");
}

function formatAmount(s: PendingSubmission): string {
  const ccy = s.currency || "GBP";
  const sym = ccy === "GBP" ? "£" : ccy === "EUR" ? "€" : ccy === "USD" ? "$" : ccy + " ";
  try {
    return sym + Number(s.totalDebtAmount).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch {
    return `${sym}${s.totalDebtAmount}`;
  }
}

function formatAddress(s: PendingSubmission): string {
  return [s.addressLine1, s.addressLine2, s.city, s.county, s.postcode].filter(Boolean).join(", ") || "—";
}

// ── Excel generation ──────────────────────────────────────────────────────────

export async function generatePendingSubmissionsExcel(submissions: PendingSubmission[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Acclaim Credit Management";
  workbook.created = new Date();

  const TEAL   = "FF008B8B";
  const WHITE  = "FFFFFFFF";
  const AMBER  = "FFFBBF24";
  const RED    = "FFFEE2E2";
  const YELLOW = "FFFEF9C3";
  const GREEN  = "FFF0FDF4";

  // ── Sheet 1: Pending Cases ────────────────────────────────────────────────
  const sheet = workbook.addWorksheet("Pending Submissions");
  sheet.columns = [
    { header: "Ref #",              key: "id",           width: 8  },
    { header: "Case Name",          key: "caseName",     width: 30 },
    { header: "Debtor Name",        key: "debtorName",   width: 28 },
    { header: "Debtor Type",        key: "debtorType",   width: 16 },
    { header: "Client Organisation",key: "clientOrg",    width: 26 },
    { header: "Submitted By",       key: "submittedBy",  width: 22 },
    { header: "Submitted Date",     key: "submittedDate",width: 16 },
    { header: "Days Pending",       key: "daysPending",  width: 14 },
    { header: "Total Debt",         key: "totalDebt",    width: 16 },
    { header: "Main Email",         key: "mainEmail",    width: 30 },
    { header: "Main Phone",         key: "mainPhone",    width: 18 },
    { header: "Address",            key: "address",      width: 40 },
    { header: "Debt Description",   key: "debtDetails",  width: 55 },
  ];

  // Header row
  const hdr = sheet.getRow(1);
  hdr.font = { bold: true, color: { argb: WHITE }, size: 11 };
  hdr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
  hdr.alignment = { vertical: "middle", horizontal: "center" };
  hdr.height = 24;
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  for (const s of submissions) {
    const rowColor = s.daysPending >= 14 ? RED : s.daysPending >= 7 ? YELLOW : GREEN;
    const row = sheet.addRow({
      id:           s.id,
      caseName:     s.caseName,
      debtorName:   debtorDisplayName(s),
      debtorType:   debtorTypeLabel(s),
      clientOrg:    s.clientOrganisationName || "—",
      submittedBy:  s.submittedByName || "—",
      submittedDate: s.submittedAt.toLocaleDateString("en-GB"),
      daysPending:  s.daysPending,
      totalDebt:    formatAmount(s),
      mainEmail:    s.mainEmail || "—",
      mainPhone:    s.mainPhone || "—",
      address:      formatAddress(s),
      debtDetails:  s.debtDetails ? (s.debtDetails.length > 300 ? s.debtDetails.slice(0, 300) + "…" : s.debtDetails) : "—",
    });
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowColor } };
    row.alignment = { wrapText: true, vertical: "top" };
    row.height = 40;

    // Bold the days-pending cell if >= 7
    if (s.daysPending >= 7) {
      row.getCell("daysPending").font = { bold: true, color: { argb: "FFB91C1C" } };
    }
  }

  // ── Sheet 2: Summary ────────────────────────────────────────────────────
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [{ key: "label", width: 38 }, { key: "value", width: 22 }];

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const addRow = (label: string, value: string | number, bold = false, bgArgb?: string) => {
    const r = summary.addRow({ label, value });
    if (bold) r.font = { bold: true };
    if (bgArgb) {
      r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
      if (bgArgb === TEAL) r.font = { bold: true, color: { argb: WHITE }, size: 13 };
    }
    return r;
  };

  addRow("Pending Submissions Escalation Report", today, true, TEAL);
  summary.addRow({});
  addRow("Cases pending > 3 days", submissions.length, true);
  addRow("Total debt value outstanding", submissions.reduce((acc, s) => acc + Number(s.totalDebtAmount), 0).toLocaleString("en-GB", { style: "currency", currency: "GBP" }), true);
  summary.addRow({});

  addRow("── By Age ──", "", true, "FFE5E7EB");
  const bands = [
    { label: "3–7 days",  min: 3, max: 7  },
    { label: "7–14 days", min: 7, max: 14 },
    { label: "14+ days",  min: 14, max: Infinity },
  ];
  for (const b of bands) {
    addRow(b.label, submissions.filter(s => s.daysPending >= b.min && s.daysPending < b.max).length);
  }
  summary.addRow({});

  addRow("── By Client Organisation ──", "", true, "FFE5E7EB");
  const orgMap = new Map<string, number>();
  for (const s of submissions) {
    const org = s.clientOrganisationName || "Unknown";
    orgMap.set(org, (orgMap.get(org) || 0) + 1);
  }
  for (const [org, count] of [...orgMap.entries()].sort((a, b) => b[1] - a[1])) {
    addRow(org, `${count} case${count !== 1 ? "s" : ""}`);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// ── HTML report generation ────────────────────────────────────────────────────

export function generatePendingSubmissionsHtml(submissions: PendingSubmission[], reportDate: string): string {
  const totalDebt = submissions.reduce((acc, s) => acc + Number(s.totalDebtAmount), 0);
  const totalDebtFormatted = totalDebt.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

  const ageColor = (days: number) =>
    days >= 14 ? "#FEE2E2" :
    days >= 7  ? "#FEF9C3" :
                 "#F0FDF4";

  const ageTextColor = (days: number) =>
    days >= 14 ? "#B91C1C" :
    days >= 7  ? "#92400E" :
                 "#166534";

  const rows = submissions.map(s => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px 10px; font-size: 13px; color: #1e293b; font-weight: 600;">${s.caseName}</td>
      <td style="padding: 12px 10px; font-size: 13px; color: #1e293b;">${debtorDisplayName(s)}</td>
      <td style="padding: 12px 10px; font-size: 12px; color: #475569;">${debtorTypeLabel(s)}</td>
      <td style="padding: 12px 10px; font-size: 13px; color: #475569;">${s.clientOrganisationName || "—"}</td>
      <td style="padding: 12px 10px; font-size: 13px; color: #1e293b; font-weight: 600;">${formatAmount(s)}</td>
      <td style="padding: 12px 10px; font-size: 13px; color: #475569;">${s.submittedAt.toLocaleDateString("en-GB")}</td>
      <td style="padding: 12px 10px; text-align: center;">
        <span style="display: inline-block; background: ${ageColor(s.daysPending)}; color: ${ageTextColor(s.daysPending)}; font-weight: 700; font-size: 13px; padding: 3px 10px; border-radius: 99px;">
          ${s.daysPending}d
        </span>
      </td>
      <td style="padding: 12px 10px; font-size: 12px; color: #475569;">${s.mainEmail || "—"}</td>
      <td style="padding: 12px 10px; font-size: 12px; color: #475569;">${s.mainPhone || "—"}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pending Submissions Escalation — ${reportDate}</title>
  <style>
    body { margin: 0; padding: 0; background: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    @media print { body { background: #fff; } .no-print { display: none; } }
  </style>
</head>
<body>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f4f8;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="900" cellspacing="0" cellpadding="0" style="max-width:900px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#008b8b 0%,#006666 100%); padding:40px 40px 30px 40px; text-align:center;">
              <h1 style="margin:0; color:#fff; font-size:26px; font-weight:700; letter-spacing:-0.5px;">⚠️ Pending Submissions Escalation</h1>
              <p style="margin:10px 0 0 0; color:rgba(255,255,255,0.85); font-size:15px;">${reportDate}</p>
            </td>
          </tr>

          <!-- Summary bar -->
          <tr>
            <td style="padding:0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:30px 0; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">
                <tr>
                  <td style="background:#f8fafc; padding:20px; text-align:center; border-right:1px solid #e2e8f0; width:33%;">
                    <p style="margin:0 0 4px 0; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:#64748b;">Cases Pending</p>
                    <p style="margin:0; font-size:32px; font-weight:800; color:#008b8b;">${submissions.length}</p>
                  </td>
                  <td style="background:#f8fafc; padding:20px; text-align:center; border-right:1px solid #e2e8f0; width:33%;">
                    <p style="margin:0 0 4px 0; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:#64748b;">Total Debt Value</p>
                    <p style="margin:0; font-size:28px; font-weight:800; color:#1e293b;">${totalDebtFormatted}</p>
                  </td>
                  <td style="background:#f8fafc; padding:20px; text-align:center; width:33%;">
                    <p style="margin:0 0 4px 0; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:#64748b;">Longest Pending</p>
                    <p style="margin:0; font-size:32px; font-weight:800; color:#B91C1C;">${submissions.length > 0 ? submissions[0].daysPending : 0} days</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Legend -->
          <tr>
            <td style="padding:0 40px 20px 40px;">
              <div style="display:flex; gap:16px; font-size:12px; color:#64748b;">
                <span style="display:inline-flex; align-items:center; gap:6px;"><span style="display:inline-block; width:12px; height:12px; border-radius:3px; background:#F0FDF4;"></span> 3–7 days</span>
                <span style="display:inline-flex; align-items:center; gap:6px;"><span style="display:inline-block; width:12px; height:12px; border-radius:3px; background:#FEF9C3;"></span> 7–14 days</span>
                <span style="display:inline-flex; align-items:center; gap:6px;"><span style="display:inline-block; width:12px; height:12px; border-radius:3px; background:#FEE2E2;"></span> 14+ days</span>
              </div>
            </td>
          </tr>

          <!-- Table -->
          <tr>
            <td style="padding:0 40px 40px 40px;">
              <div style="overflow-x:auto;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                  <thead>
                    <tr style="background:#f1f5f9;">
                      <th style="padding:10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#475569; text-align:left;">Case Name</th>
                      <th style="padding:10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#475569; text-align:left;">Debtor</th>
                      <th style="padding:10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#475569; text-align:left;">Type</th>
                      <th style="padding:10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#475569; text-align:left;">Client Org</th>
                      <th style="padding:10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#475569; text-align:left;">Amount</th>
                      <th style="padding:10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#475569; text-align:left;">Submitted</th>
                      <th style="padding:10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#475569; text-align:center;">Age</th>
                      <th style="padding:10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#475569; text-align:left;">Email</th>
                      <th style="padding:10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#475569; text-align:left;">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${submissions.length > 0 ? rows : `
                    <tr><td colspan="9" style="padding:40px; text-align:center; color:#64748b; font-size:14px;">No pending submissions found</td></tr>
                    `}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1f2937; padding:24px 40px; text-align:center; border-radius:0 0 16px 16px;">
              <p style="margin:0; color:#9ca3af; font-size:12px;">Automated escalation report — Acclaim Client Portal · Generated ${reportDate}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Main processor ────────────────────────────────────────────────────────────

export async function processPendingSubmissionsReport(): Promise<void> {
  const now = new Date();
  const hour = now.getHours();

  // Daily at noon (12pm)
  if (hour !== 12) return;

  console.log("[PendingSubmissions] Running daily pending submissions escalation report...");

  try {
    const submissions = await storage.getPendingSubmissionsOlderThan(MIN_DAYS_PENDING);

    if (submissions.length === 0) {
      console.log("[PendingSubmissions] No pending submissions older than 3 days — skipping report");
      return;
    }

    const dateStr = now.toISOString().split("T")[0];
    const reportDate = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    const excelBuffer = await generatePendingSubmissionsExcel(submissions);
    const htmlContent = generatePendingSubmissionsHtml(submissions, reportDate);

    const sent = await sendPendingSubmissionsReportEmail(submissions, excelBuffer, htmlContent, dateStr);
    if (sent) {
      console.log(`[PendingSubmissions] Report sent — ${submissions.length} pending submission${submissions.length !== 1 ? "s" : ""}`);
    } else {
      console.error("[PendingSubmissions] Failed to send pending submissions report email");
    }
  } catch (error) {
    console.error("[PendingSubmissions] Error processing pending submissions report:", error);
  }
}
