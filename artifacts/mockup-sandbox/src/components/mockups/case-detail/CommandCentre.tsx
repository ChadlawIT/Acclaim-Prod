import { useState } from "react";
import {
  Clock, MessageSquare, FileText, CreditCard, Building,
  Bell, BellOff, CheckCircle2, Paperclip, Send, Download,
  Upload, Scale, PoundSterling, ChevronRight, User, AlertCircle, ArrowRight
} from "lucide-react";

const CASE = {
  caseName: "Pryce Information Management Ltd",
  accountNumber: "SOS-2024-001",
  organisationName: "Chadwick Lawrence LLP",
  outstandingAmount: 14850.00,
  totalDebtAmount: 18500.00,
  stage: "Claim",
  status: "active",
  caseHandler: "Sarah Mitchell",
  openedDate: "12 Jan 2024",
  debtorType: "Company",
};

const TIMELINE = [
  { id: 1, date: "14 Jun 2024", time: "09:41", title: "Client sent a message", detail: "Queried the outstanding balance breakdown.", icon: MessageSquare, dot: "bg-blue-400" },
  { id: 2, date: "10 Jun 2024", time: "14:22", title: "Document uploaded", detail: "Invoice-Final-2024.pdf added to the case.", icon: FileText, dot: "bg-violet-400" },
  { id: 3, date: "03 Jun 2024", time: "11:05", title: "Partial payment received", detail: "£1,200.00 received via BACS.", icon: PoundSterling, dot: "bg-green-400" },
  { id: 4, date: "22 May 2024", time: "08:30", title: "Stage → Claim", detail: "Case progressed to Claim stage.", icon: Scale, dot: "bg-orange-400" },
  { id: 5, date: "12 Jan 2024", time: "09:00", title: "Case opened", detail: "Assigned to Sarah Mitchell.", icon: CheckCircle2, dot: "bg-teal-400" },
];

const MESSAGES = [
  { id: 1, sender: "Matt Perry", role: "client", date: "14 Jun 2024", content: "Could you please provide a detailed breakdown of the outstanding balance?" },
  { id: 2, sender: "Sarah Mitchell", role: "admin", date: "13 Jun 2024", content: "The balance of £14,850.00 comprises the original debt plus £1,200.00 in costs. A breakdown is attached.", attachment: "Balance-Breakdown.pdf" },
  { id: 3, sender: "Matt Perry", role: "client", date: "10 Jun 2024", content: "Please find the signed payment agreement attached.", attachment: "Agreement-Signed.pdf" },
];

const DOCUMENTS = [
  { id: 1, name: "Invoice-Final-2024.pdf", size: "124 KB", date: "10 Jun 2024", type: "pdf" },
  { id: 2, name: "Payment-Agreement-Signed.pdf", size: "88 KB", date: "10 Jun 2024", type: "pdf" },
  { id: 3, name: "Original-Contract.docx", size: "210 KB", date: "12 Jan 2024", type: "doc" },
];

const PAYMENTS = [
  { id: 1, date: "03 Jun 2024", amount: 1200.00, ref: "BACS-2024-0603" },
  { id: 2, date: "15 Feb 2024", amount: 2450.00, ref: "BACS-2024-0215" },
];

type Section = "timeline" | "messages" | "documents" | "payments";

const NAV: { key: Section; label: string; icon: any; count: number }[] = [
  { key: "timeline",  label: "Timeline",  icon: Clock,         count: 5 },
  { key: "messages",  label: "Messages",  icon: MessageSquare, count: 3 },
  { key: "documents", label: "Documents", icon: FileText,      count: 3 },
  { key: "payments",  label: "Payments",  icon: CreditCard,    count: 2 },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

export function CommandCentre() {
  const [section, setSection] = useState<Section>("timeline");
  const [muted, setMuted] = useState(false);
  const [msg, setMsg] = useState("");
  const totalPaid = 3650;
  const pct = Math.round((totalPaid / CASE.totalDebtAmount) * 100);

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-72 bg-[#0d2d2a] text-white flex flex-col flex-shrink-0">
        {/* Case identity */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-3">
            <Building className="h-5 w-5 text-white/70" />
          </div>
          <h2 className="font-bold text-sm leading-snug">{CASE.caseName}</h2>
          <p className="text-xs text-white/50 mt-0.5">{CASE.accountNumber}</p>
        </div>

        {/* Stats grid */}
        <div className="px-5 py-4 border-b border-white/10 grid grid-cols-2 gap-3">
          {[
            { l: "Outstanding", v: fmt(CASE.outstandingAmount), highlight: true },
            { l: "Total Paid",  v: fmt(totalPaid), highlight: false },
            { l: "Stage",       v: CASE.stage, highlight: false },
            { l: "Handler",     v: CASE.caseHandler, highlight: false },
            { l: "Opened",      v: CASE.openedDate, highlight: false },
            { l: "Debtor type", v: CASE.debtorType, highlight: false },
          ].map(s => (
            <div key={s.l} className="bg-white/5 rounded-lg p-2.5">
              <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">{s.l}</p>
              <p className={`text-xs font-semibold leading-snug ${s.highlight ? "text-teal-300" : "text-white"}`}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="px-5 py-3 border-b border-white/10">
          <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
            <span>Repayment</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-teal-400 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Organisation */}
        <div className="px-5 py-3 border-b border-white/10">
          <p className="text-[9px] text-white/40 uppercase tracking-wider mb-1">Organisation</p>
          <p className="text-xs text-white/70">{CASE.organisationName}</p>
        </div>

        {/* Section nav */}
        <nav className="px-3 py-4 flex-1">
          <p className="text-[9px] text-white/30 uppercase tracking-wider px-2 mb-2">Sections</p>
          {NAV.map(n => (
            <button
              key={n.key}
              onClick={() => setSection(n.key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
                section === n.key
                  ? "bg-teal-500/20 text-teal-300"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <n.icon className="h-4 w-4" />
                {n.label}
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${section === n.key ? "bg-teal-500/30 text-teal-300" : "bg-white/10 text-white/40"}`}>
                {n.count}
              </span>
            </button>
          ))}
        </nav>

        {/* Mute */}
        <div className="px-5 py-4 border-t border-white/10">
          <button
            onClick={() => setMuted(m => !m)}
            className="w-full flex items-center justify-center gap-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2.5 transition-colors text-white/60 hover:text-white"
          >
            {muted ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            {muted ? "Unmute notifications" : "Mute notifications"}
          </button>
        </div>
      </aside>

      {/* ── MAIN PANEL ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Panel header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-gray-900 capitalize">{section}</h3>
            <p className="text-xs text-gray-400">{NAV.find(n => n.key === section)?.count} items</p>
          </div>
          {section === "documents" && (
            <button className="flex items-center gap-1.5 text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors">
              <Upload className="h-3.5 w-3.5" /> Upload
            </button>
          )}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-6">

          {section === "timeline" && (
            <div className="space-y-3">
              {TIMELINE.map(e => (
                <div key={e.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${e.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{e.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{e.detail}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{e.date}</p>
                    <p className="text-xs text-gray-300">{e.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === "messages" && (
            <div className="space-y-3">
              {MESSAGES.map(m => (
                <div key={m.id} className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm border-l-4 ${m.role === "admin" ? "border-l-teal-400" : "border-l-blue-400"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${m.role === "admin" ? "text-teal-700" : "text-blue-700"}`}>{m.sender}</span>
                    <span className="text-xs text-gray-400">{m.date}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{m.content}</p>
                  {m.attachment && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">
                      <Paperclip className="h-3 w-3" />{m.attachment}
                    </div>
                  )}
                </div>
              ))}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <textarea rows={3} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Reply to this case…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 mb-3" />
                <div className="flex justify-end">
                  <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                    <Send className="h-3.5 w-3.5" /> Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {section === "documents" && (
            <div className="space-y-2">
              {DOCUMENTS.map(d => (
                <div key={d.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${d.type === "pdf" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                    {d.type.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.size} · {d.date}</p>
                  </div>
                  <button className="flex items-center gap-1.5 text-xs text-teal-600 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              ))}
            </div>
          )}

          {section === "payments" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { l: "Total Debt", v: fmt(CASE.totalDebtAmount), c: "text-gray-900" },
                  { l: "Total Paid", v: fmt(totalPaid), c: "text-green-700" },
                  { l: "Outstanding", v: fmt(CASE.outstandingAmount), c: "text-red-600" },
                ].map(s => (
                  <div key={s.l} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{s.l}</p>
                    <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Date", "Reference", "Amount", "Status"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PAYMENTS.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3.5 text-gray-700">{p.date}</td>
                        <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{p.ref}</td>
                        <td className="px-5 py-3.5 font-semibold text-gray-900">{fmt(p.amount)}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium">Confirmed</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
