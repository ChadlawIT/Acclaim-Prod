import { useState } from "react";
import {
  Clock, FileText, MessageSquare, CreditCard, Download, Send,
  Bell, BellOff, Building, CheckCircle2, Paperclip,
  Calendar, PoundSterling, Scale, Upload, User
} from "lucide-react";

/* ── Static sample data ── */
const CASE = {
  caseName: "Pryce Information Management Ltd",
  accountNumber: "SOS-2024-001",
  debtorType: "company",
  organisationName: "Chadwick Lawrence LLP",
  outstandingAmount: 14850.00,
  totalDebtAmount: 18500.00,
  status: "active",
  stage: "claim",
  caseHandler: "Sarah Mitchell",
  openedDate: "12 Jan 2024",
};

const TIMELINE = [
  { id: 1, date: "14 Jun 2024", time: "09:41", title: "Client sent a message", detail: "Queried the outstanding balance breakdown.", icon: MessageSquare, accent: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  { id: 2, date: "10 Jun 2024", time: "14:22", title: "Document uploaded",     detail: "Invoice-Final-2024.pdf added to the case.",    icon: FileText,       accent: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  { id: 3, date: "03 Jun 2024", time: "11:05", title: "Partial payment received", detail: "£1,200.00 received. Outstanding reduced.",   icon: PoundSterling,  accent: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  { id: 4, date: "22 May 2024", time: "08:30", title: "Stage updated → Claim", detail: "Case progressed to Claim stage.",              icon: Scale,          accent: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  { id: 5, date: "12 Jan 2024", time: "09:00", title: "Case opened",           detail: "Case created and assigned to Sarah Mitchell.", icon: CheckCircle2,   accent: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" },
];

const MESSAGES = [
  { id: 1, sender: "Matt Perry",     initials: "MP", role: "client", date: "14 Jun 2024, 09:41", content: "Could you please provide a detailed breakdown of the outstanding balance, including any interest or costs that have been added?", attachment: null },
  { id: 2, sender: "Sarah Mitchell", initials: "SM", role: "admin",  date: "13 Jun 2024, 14:15", content: "Thank you for your query. The balance of £14,850.00 comprises the original debt of £13,650.00 plus £1,200.00 in costs. A full breakdown is attached.", attachment: "Balance-Breakdown.pdf" },
  { id: 3, sender: "Matt Perry",     initials: "MP", role: "client", date: "10 Jun 2024, 11:02", content: "Please find the signed payment agreement attached for your records.", attachment: "Payment-Agreement-Signed.pdf" },
];

const DOCUMENTS = [
  { id: 1, name: "Invoice-Final-2024.pdf",         size: "124 KB", date: "10 Jun 2024", ext: "PDF" },
  { id: 2, name: "Payment-Agreement-Signed.pdf",   size: "88 KB",  date: "10 Jun 2024", ext: "PDF" },
  { id: 3, name: "Original-Contract.docx",         size: "210 KB", date: "12 Jan 2024", ext: "DOC" },
  { id: 4, name: "Correspondence-May.pdf",          size: "56 KB",  date: "03 May 2024", ext: "PDF" },
];

const PAYMENTS = [
  { id: 1, date: "03 Jun 2024", amount: 1200.00, reference: "BACS-2024-0603", method: "BACS" },
  { id: 2, date: "15 Feb 2024", amount: 2450.00, reference: "BACS-2024-0215", method: "BACS" },
];

const TABS = [
  { key: "timeline",  label: "Timeline",  icon: Clock,         count: TIMELINE.length },
  { key: "messages",  label: "Messages",  icon: MessageSquare, count: MESSAGES.length },
  { key: "documents", label: "Documents", icon: FileText,      count: DOCUMENTS.length },
  { key: "payments",  label: "Payments",  icon: CreditCard,    count: PAYMENTS.length },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function Avatar({ initials, admin }: { initials: string; admin: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${admin ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"}`}>
      {initials}
    </div>
  );
}

export function Redesign() {
  const [tab, setTab] = useState("timeline");
  const [muted, setMuted] = useState(false);
  const [msg, setMsg] = useState("");

  const totalPaid = PAYMENTS.reduce((s, p) => s + p.amount, 0);
  const pct = Math.round((totalPaid / CASE.totalDebtAmount) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #064e3b 0%, #0d9488 60%, #0e9f8e 100%)" }}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative px-7 pt-6 pb-5">
          {/* Top: name + mute */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-[1.15rem] font-bold text-white leading-tight tracking-tight">{CASE.caseName}</h1>
                <p className="text-sm text-white/55 mt-0.5 font-mono">{CASE.accountNumber}</p>
              </div>
            </div>
            <button
              onClick={() => setMuted(m => !m)}
              className="flex items-center gap-2 text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3.5 py-2 transition-all backdrop-blur-sm text-white/80 hover:text-white flex-shrink-0"
            >
              {muted ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
              {muted ? "Unmuted" : "Muted? No"}
            </button>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-2.5">
            {[
              { icon: PoundSterling, label: "Outstanding", value: fmt(CASE.outstandingAmount), highlight: true },
              { icon: CheckCircle2,  label: "Total Paid",  value: fmt(totalPaid) },
              { icon: Scale,         label: "Stage",       value: "Claim" },
              { icon: Calendar,      label: "Opened",      value: CASE.openedDate },
              { icon: Building,      label: "Organisation",value: CASE.organisationName },
            ].map(s => (
              <div
                key={s.label}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border backdrop-blur-sm ${s.highlight ? "bg-white/20 border-white/30" : "bg-white/10 border-white/15"}`}
              >
                <s.icon className={`h-3.5 w-3.5 flex-shrink-0 ${s.highlight ? "text-white" : "text-white/60"}`} />
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-semibold text-white/50 leading-none mb-0.5">{s.label}</p>
                  <p className={`text-sm font-bold leading-none ${s.highlight ? "text-white" : "text-white/90"}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex justify-between text-[11px] font-medium text-white/50 mb-1.5">
              <span>Repayment progress</span>
              <span className="text-white/70">{pct}% paid · {fmt(CASE.outstandingAmount)} outstanding</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.9) 100%)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="px-7 flex gap-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all ${
                tab === t.key
                  ? "text-teal-700"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <t.icon className="h-[15px] w-[15px]" />
              {t.label}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${
                tab === t.key ? "bg-teal-50 text-teal-600" : "bg-gray-100 text-gray-400"
              }`}>
                {t.count}
              </span>
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 px-7 py-6 max-w-4xl">

        {/* TIMELINE */}
        {tab === "timeline" && (
          <div className="relative">
            <div className="absolute left-[19px] top-5 bottom-5 w-px bg-gradient-to-b from-gray-200 via-gray-200 to-transparent" />
            <div className="space-y-3">
              {TIMELINE.map(e => (
                <div key={e.id} className="flex gap-4 group">
                  <div
                    className="w-[38px] h-[38px] rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 shadow-sm transition-shadow group-hover:shadow-md"
                    style={{ background: e.bg, borderColor: e.border }}
                  >
                    <e.icon className="h-[15px] w-[15px]" style={{ color: e.accent }} />
                  </div>
                  <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[13.5px] text-gray-900">{e.title}</p>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 flex-shrink-0 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {e.time}
                      </div>
                    </div>
                    <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">{e.detail}</p>
                    <p className="text-[11px] text-gray-300 mt-2.5 font-medium">{e.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MESSAGES */}
        {tab === "messages" && (
          <div className="space-y-3">
            {MESSAGES.map(m => {
              const isAdmin = m.role === "admin";
              return (
                <div key={m.id} className={`flex gap-3 ${isAdmin ? "" : "flex-row-reverse"}`}>
                  <Avatar initials={m.initials} admin={isAdmin} />
                  <div className={`max-w-[78%] ${isAdmin ? "" : ""}`}>
                    <div className={`flex items-center gap-2 mb-1.5 ${isAdmin ? "" : "flex-row-reverse"}`}>
                      <span className={`text-[12px] font-semibold ${isAdmin ? "text-gray-700" : "text-gray-700"}`}>{m.sender}</span>
                      <span className="text-[11px] text-gray-400">{m.date}</span>
                    </div>
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      isAdmin
                        ? "bg-white border border-gray-100 rounded-tl-sm"
                        : "rounded-tr-sm text-white"
                    }`}
                    style={!isAdmin ? { background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" } : {}}>
                      <p className={`text-[13.5px] leading-relaxed ${isAdmin ? "text-gray-700" : "text-white"}`}>{m.content}</p>
                      {m.attachment && (
                        <div className={`mt-2.5 flex items-center gap-2 text-[12px] px-3 py-2 rounded-xl ${
                          isAdmin ? "bg-gray-50 border border-gray-200 text-gray-600" : "bg-white/15 text-white/90"
                        }`}>
                          <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
                          {m.attachment}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Compose */}
            <div className="mt-4 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 pt-4 pb-2">
                <textarea
                  rows={3}
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  placeholder="Write a message…"
                  className="w-full text-[13.5px] border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-300 focus:bg-white transition-all placeholder:text-gray-300"
                />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                <button className="flex items-center gap-2 text-[12px] text-gray-400 hover:text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-xl transition-all">
                  <Paperclip className="h-3.5 w-3.5" />
                  Attach file
                </button>
                <button className="flex items-center gap-2 text-[13px] font-medium text-white px-5 py-2 rounded-xl transition-all hover:opacity-90 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}>
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS */}
        {tab === "documents" && (
          <div className="space-y-3">
            {/* Upload zone */}
            <div className="border-2 border-dashed border-gray-200 hover:border-teal-300 rounded-2xl p-7 text-center transition-all bg-white hover:bg-teal-50/30 cursor-pointer group">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center mx-auto mb-3 transition-colors">
                <Upload className="h-5 w-5 text-gray-300 group-hover:text-teal-500 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-gray-500 group-hover:text-teal-700 transition-colors">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-300 mt-1">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG · max 10 MB</p>
            </div>

            {/* Document list */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {DOCUMENTS.map((doc, i) => (
                <div
                  key={doc.id}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${i > 0 ? "border-t border-gray-50" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0 shadow-sm ${doc.ext === "PDF" ? "bg-red-50 text-red-500 border border-red-100" : "bg-blue-50 text-blue-500 border border-blue-100"}`}>
                    {doc.ext}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-gray-800 truncate">{doc.name}</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">{doc.size} · {doc.date}</p>
                  </div>
                  <button className="flex items-center gap-1.5 text-[12px] font-medium text-teal-600 hover:text-teal-800 border border-teal-100 hover:border-teal-300 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl transition-all flex-shrink-0">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        {tab === "payments" && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Debt",   value: fmt(CASE.totalDebtAmount), sub: "Original amount",   color: "text-gray-900", bg: "bg-gray-50 border-gray-100" },
                { label: "Total Paid",   value: fmt(totalPaid),            sub: `${pct}% of total`,  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
                { label: "Outstanding",  value: fmt(CASE.outstandingAmount), sub: "Remaining balance", color: "text-red-600",  bg: "bg-red-50 border-red-100" },
              ].map(c => (
                <div key={c.label} className={`rounded-2xl border p-5 text-center ${c.bg}`}>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">{c.label}</p>
                  <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
              <div className="flex justify-between text-[12px] text-gray-500 mb-2">
                <span className="font-medium">Repayment progress</span>
                <span className="font-semibold text-emerald-600">{pct}% paid</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Payment table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-[13.5px] font-semibold text-gray-800">Payment History</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr>
                    {["Date", "Reference", "Method", "Amount", "Status"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PAYMENTS.map((p, i) => (
                    <tr key={p.id} className={`hover:bg-gray-50/70 transition-colors ${i > 0 ? "border-t border-gray-50" : ""}`}>
                      <td className="px-5 py-4 text-[13px] text-gray-600">{p.date}</td>
                      <td className="px-5 py-4 text-[12px] text-gray-400 font-mono">{p.reference}</td>
                      <td className="px-5 py-4 text-[13px] text-gray-600">{p.method}</td>
                      <td className="px-5 py-4 text-[13.5px] font-bold text-gray-900">{fmt(p.amount)}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          Confirmed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-300 text-center pb-6">* Outstanding amounts may include interest and costs</p>
    </div>
  );
}
