import { Clock, User, Building2, MessageSquare, Activity, TrendingDown, Calendar, AlertTriangle } from "lucide-react";

// ── Realistic sample data ─────────────────────────────────────────────────────

const reportDate = "Thursday, 26 June 2026";
const generatedAt = "08:00 AM";

const summary = {
  totalCases: 14,
  longestGap: 112,
  avg: 47,
  handlers: [
    { name: "Sarah Mitchell", count: 5 },
    { name: "James Okafor", count: 4 },
    { name: "Priya Sharma", count: 3 },
    { name: "Unassigned", count: 2 },
  ],
  ageBands: [
    { label: "30–60 days", count: 7, color: "#FBBF24" },
    { label: "60–90 days", count: 4, color: "#F97316" },
    { label: "90+ days",   count: 3, color: "#EF4444" },
  ],
};

const cases = [
  {
    id: 1,
    caseName: "Henderson Building Supplies Ltd",
    accountNumber: "ACC-2024-0041",
    organisation: "Chadwick Lawrence LLP",
    handler: "Sarah Mitchell",
    outstanding: "£47,250.00",
    status: "Active",
    stage: "Legal Action",
    daysInactive: 112,
    lastActivity: "14 Feb 2026",
    timeline: {
      code: "TL0088",
      description: "Letter Before Claim issued — 14-day response window opened",
      date: "14 Feb 2026",
    },
    messages: [
      { sender: "Henderson Building Supplies Ltd", direction: "in",  date: "12 Feb 2026", content: "We are disputing the invoice dated November 2024. Our records show a credit note was issued." },
      { sender: "Sarah Mitchell",                  direction: "out", date: "14 Feb 2026", content: "Thank you for your message. We have reviewed the file and cannot identify a credit note. Please provide the credit note reference number so we can investigate." },
      { sender: "Henderson Building Supplies Ltd", direction: "in",  date: "14 Feb 2026", content: "Will check with our accounts department and come back to you shortly." },
    ],
  },
  {
    id: 2,
    caseName: "Fernwood Estates (Yorkshire) Ltd",
    accountNumber: "ACC-2025-0118",
    organisation: "Chadwick Lawrence LLP",
    handler: "James Okafor",
    outstanding: "£12,800.00",
    status: "Active",
    stage: "Pre-Legal",
    daysInactive: 84,
    lastActivity: "3 Apr 2026",
    timeline: {
      code: "TL0045",
      description: "Debtor requested payment plan — awaiting supporting financial information",
      date: "3 Apr 2026",
    },
    messages: [
      { sender: "Fernwood Estates",  direction: "in",  date: "2 Apr 2026", content: "We would like to propose a payment plan of £800 per month over 16 months. Could you confirm if this is acceptable?" },
      { sender: "James Okafor",      direction: "out", date: "3 Apr 2026", content: "We can consider a payment arrangement. Please provide a statement of means so we can assess the proposal." },
      { sender: "Fernwood Estates",  direction: "in",  date: "3 Apr 2026", content: "Thank you, we will gather this and send across by end of week." },
    ],
  },
  {
    id: 3,
    caseName: "Blackthorn Media Group",
    accountNumber: "ACC-2024-0077",
    organisation: "Northern Credit Solutions",
    handler: "Priya Sharma",
    outstanding: "£6,400.00",
    status: "Active",
    stage: "Initial Contact",
    daysInactive: 61,
    lastActivity: "25 Apr 2026",
    timeline: {
      code: "TL0012",
      description: "First formal demand letter sent — no response received",
      date: "25 Apr 2026",
    },
    messages: [
      { sender: "Priya Sharma",     direction: "out", date: "25 Apr 2026", content: "This is a formal notice that the outstanding balance of £6,400.00 remains unpaid. Please contact us within 7 days to avoid further action." },
      { sender: "Blackthorn Media", direction: "in",  date: "25 Apr 2026", content: "Received." },
    ],
  },
  {
    id: 4,
    caseName: "Thorngate Retail Partners",
    accountNumber: "ACC-2025-0203",
    organisation: "Northern Credit Solutions",
    handler: "Unassigned",
    outstanding: "£3,190.00",
    status: "Active",
    stage: "Initial Contact",
    daysInactive: 38,
    lastActivity: "18 May 2026",
    timeline: {
      code: "TL0005",
      description: "Case opened — debtor details verified",
      date: "18 May 2026",
    },
    messages: [
      { sender: "System", direction: "out", date: "18 May 2026", content: "Case ACC-2025-0203 has been created and assigned for initial outreach." },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function ageBandStyle(days: number) {
  if (days >= 90) return { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", pill: "#EF4444" };
  if (days >= 60) return { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412", pill: "#F97316" };
  return { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", pill: "#FBBF24" };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ value, label, sub, color }: { value: string | number; label: string; sub?: string; color: string }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "20px 24px",
      borderTop: `4px solid ${color}`,
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)", flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 34, fontWeight: 800, color: "#0f172a", lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function MessageBubble({ msg }: { msg: { sender: string; direction: string; date: string; content: string } }) {
  const isOut = msg.direction === "out";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isOut ? "flex-end" : "flex-start", marginBottom: 8 }}>
      <div style={{
        maxWidth: "85%",
        background: isOut ? "#EFF6FF" : "#F8FAFC",
        border: isOut ? "1px solid #BFDBFE" : "1px solid #E2E8F0",
        borderRadius: isOut ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
        padding: "8px 12px",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: isOut ? "#1E40AF" : "#475569", marginBottom: 3 }}>{msg.sender}</div>
        <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.55 }}>{msg.content}</div>
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, textAlign: isOut ? "right" : "left" }}>{msg.date}</div>
      </div>
    </div>
  );
}

function CaseCard({ c }: { c: typeof cases[number] }) {
  const s = ageBandStyle(c.daysInactive);
  return (
    <div style={{
      background: "#fff", borderRadius: 14, marginBottom: 20,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #E2E8F0", overflow: "hidden",
    }}>
      {/* Case header bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0",
        gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{c.caseName}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
              background: s.bg, color: s.text, border: `1px solid ${s.border}`,
              display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
            }}>
              <Clock size={10} /> {c.daysInactive} days inactive
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { icon: null, text: c.accountNumber, prefix: "#" },
              { icon: <Building2 size={11} />, text: c.organisation },
              { icon: <User size={11} />, text: c.handler },
            ].map((item, i) => (
              <span key={i} style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                {item.icon}{item.prefix && <span style={{ opacity: 0.5 }}>{item.prefix}</span>}{item.text}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{c.outstanding}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>outstanding</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            <span style={{
              fontSize: 11, padding: "2px 10px", borderRadius: 999, fontWeight: 600,
              background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0",
            }}>{c.status}</span>
            <span style={{
              fontSize: 11, padding: "2px 10px", borderRadius: 999, fontWeight: 500,
              background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0",
            }}>{c.stage}</span>
          </div>
        </div>
      </div>

      {/* Body: two columns */}
      <div style={{ display: "flex" }}>

        {/* Left: timeline + last activity */}
        <div style={{
          flex: "0 0 36%", borderRight: "1px solid #E2E8F0",
          padding: "14px 16px", background: "#FAFAFA",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px",
            color: "#94a3b8", display: "flex", alignItems: "center", gap: 5, marginBottom: 10,
          }}>
            <Activity size={11} /> Latest Timeline Entry
          </div>

          <div style={{
            background: "#fff", border: "1px solid #E2E8F0",
            borderLeft: "3px solid #B45309", borderRadius: "0 8px 8px 0", padding: "10px 12px",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#B45309", marginBottom: 4, fontFamily: "monospace", letterSpacing: "0.5px" }}>
              {c.timeline.code}
            </div>
            <div style={{ fontSize: 12, color: "#1e293b", lineHeight: 1.5, marginBottom: 6 }}>
              {c.timeline.description}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#94a3b8" }}>
              <Calendar size={9} /> {c.timeline.date}
            </div>
          </div>

          {/* Last activity badge */}
          <div style={{
            marginTop: 12, padding: "10px 12px", borderRadius: 8,
            background: s.bg, border: `1px solid ${s.border}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: s.text, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Last Activity
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: s.text }}>{c.lastActivity}</div>
            <div style={{ fontSize: 11, color: s.text, opacity: 0.75, marginTop: 1 }}>{c.daysInactive} days ago</div>
          </div>
        </div>

        {/* Right: messages */}
        <div style={{ flex: 1, padding: "14px 16px" }}>
          <div style={{
            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px",
            color: "#94a3b8", display: "flex", alignItems: "center", gap: 5, marginBottom: 10,
          }}>
            <MessageSquare size={11} /> Last {c.messages.length} Message{c.messages.length !== 1 ? "s" : ""}
          </div>
          {c.messages.length === 0
            ? <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No messages on record</div>
            : c.messages.map((m, i) => <MessageBubble key={i} msg={m} />)
          }
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function InactiveCasesReport() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: "#F1F5F9", minHeight: "100vh" }}>

      {/* Amber gradient header */}
      <div style={{ background: "linear-gradient(135deg, #B45309 0%, #78350F 100%)", padding: "32px 40px 28px", color: "#fff" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 8 }}>
              Acclaim Credit Management · Weekly Report
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.15, marginBottom: 6 }}>
              {summary.totalCases} Cases Without Activity
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {reportDate} &nbsp;·&nbsp; Generated {generatedAt} &nbsp;·&nbsp; Cases inactive 30+ days
            </div>
          </div>
          <div style={{ opacity: 0.25 }}>
            <TrendingDown size={56} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 40px 40px" }}>

        {/* Top summary cards */}
        <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
          <SummaryCard value={summary.totalCases}       label="Cases inactive 30+ days"  color="#B45309" />
          <SummaryCard value={`${summary.longestGap}d`} label="Longest inactivity gap"   color="#EF4444" sub="Henderson Building Supplies" />
          <SummaryCard value={`${summary.avg}d`}        label="Average inactivity"        color="#F97316" />
        </div>

        {/* Age band + handler breakdown */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>

          <div style={{
            flex: 1, background: "#fff", borderRadius: 12, padding: "18px 20px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.05)", border: "1px solid #E2E8F0",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "#94a3b8", marginBottom: 14 }}>
              By Inactivity Period
            </div>
            {summary.ageBands.map(b => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 13, color: "#334155" }}>{b.label}</div>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: "#0f172a",
                  background: "#F8FAFC", padding: "2px 12px", borderRadius: 6, border: "1px solid #E2E8F0",
                }}>{b.count} cases</div>
              </div>
            ))}
          </div>

          <div style={{
            flex: 1, background: "#fff", borderRadius: 12, padding: "18px 20px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.05)", border: "1px solid #E2E8F0",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "#94a3b8", marginBottom: 14 }}>
              By Case Handler
            </div>
            {summary.handlers.map((h, i) => (
              <div key={h.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: i === summary.handlers.length - 1 ? "#F1F5F9" : "#FEF3C7",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: i === summary.handlers.length - 1 ? "#94a3b8" : "#92400E",
                  flexShrink: 0,
                }}>
                  {h.name[0]}
                </div>
                <div style={{ flex: 1, fontSize: 13, color: "#334155" }}>{h.name}</div>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: "#0f172a",
                  background: "#F8FAFC", padding: "2px 12px", borderRadius: 6, border: "1px solid #E2E8F0",
                }}>{h.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", whiteSpace: "nowrap" }}>
            Cases · Oldest First
          </div>
          <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
        </div>

        {/* Case cards */}
        {cases.map(c => <CaseCard key={c.id} c={c} />)}

        {/* Footer */}
        <div style={{
          marginTop: 4, padding: "16px 0", borderTop: "1px solid #E2E8F0",
          display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8",
        }}>
          <span>Acclaim Credit Management · Automated weekly report · Covers cases inactive 30+ days since 20 May 2026</span>
          <span>{reportDate}</span>
        </div>
      </div>
    </div>
  );
}
