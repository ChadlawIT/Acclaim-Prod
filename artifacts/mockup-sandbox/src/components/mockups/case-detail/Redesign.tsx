import { useState } from "react";
import {
  Clock, FileText, MessageSquare, CreditCard, Download, Send,
  Bell, BellOff, Building, User, ChevronDown, ChevronUp,
  Paperclip, CheckCircle2, AlertCircle, ArrowUpRight, Upload,
  Calendar, PoundSterling, Scale
} from "lucide-react";

/* ── Static sample data ── */
const CASE = {
  id: 1,
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
  muted: false,
};

const TIMELINE = [
  { id: 1, date: "14 Jun 2024", time: "09:41", type: "message", title: "Client sent a message", detail: "Queried the outstanding balance breakdown.", icon: MessageSquare, color: "text-blue-500 bg-blue-50 border-blue-100" },
  { id: 2, date: "10 Jun 2024", time: "14:22", type: "document", title: "Document uploaded", detail: "Invoice-Final-2024.pdf added to the case.", icon: FileText, color: "text-purple-500 bg-purple-50 border-purple-100" },
  { id: 3, date: "03 Jun 2024", time: "11:05", type: "payment", title: "Partial payment received", detail: "£1,200.00 received. Outstanding reduced.", icon: PoundSterling, color: "text-green-500 bg-green-50 border-green-100" },
  { id: 4, date: "22 May 2024", time: "08:30", type: "stage", title: "Stage updated → Claim", detail: "Case progressed to Claim stage.", icon: Scale, color: "text-orange-500 bg-orange-50 border-orange-100" },
  { id: 5, date: "12 Jan 2024", time: "09:00", type: "open", title: "Case opened", detail: "Case created and assigned to Sarah Mitchell.", icon: CheckCircle2, color: "text-teal-500 bg-teal-50 border-teal-100" },
];

const MESSAGES = [
  { id: 1, sender: "Matt Perry", role: "client", date: "14 Jun 2024, 09:41", content: "Could you please provide a detailed breakdown of the outstanding balance, including any interest or costs that have been added?", hasAttachment: false },
  { id: 2, sender: "Sarah Mitchell", role: "admin", date: "13 Jun 2024, 14:15", content: "Thank you for your query. I can confirm the balance of £14,850.00 comprises the original debt of £13,650.00 plus £1,200.00 in costs. A full breakdown is attached.", hasAttachment: true },
  { id: 3, sender: "Matt Perry", role: "client", date: "10 Jun 2024, 11:02", content: "Please find the signed payment agreement attached for your records.", hasAttachment: true },
];

const DOCUMENTS = [
  { id: 1, name: "Invoice-Final-2024.pdf", size: "124 KB", date: "10 Jun 2024", type: "pdf" },
  { id: 2, name: "Payment-Agreement-Signed.pdf", size: "88 KB", date: "10 Jun 2024", type: "pdf" },
  { id: 3, name: "Original-Contract.docx", size: "210 KB", date: "12 Jan 2024", type: "doc" },
  { id: 4, name: "Correspondence-May.pdf", size: "56 KB", date: "03 May 2024", type: "pdf" },
];

const PAYMENTS = [
  { id: 1, date: "03 Jun 2024", amount: 1200.00, reference: "BACS-2024-0603", method: "BACS", status: "confirmed" },
  { id: 2, date: "15 Feb 2024", amount: 2450.00, reference: "BACS-2024-0215", method: "BACS", status: "confirmed" },
];

const TABS = [
  { key: "timeline",  label: "Timeline",  icon: Clock,          count: TIMELINE.length },
  { key: "messages",  label: "Messages",  icon: MessageSquare,  count: MESSAGES.length },
  { key: "documents", label: "Documents", icon: FileText,        count: DOCUMENTS.length },
  { key: "payments",  label: "Payments",  icon: CreditCard,      count: PAYMENTS.length },
];

const stageColor: Record<string, string> = {
  "pre-legal":   "bg-blue-100 text-blue-800",
  "claim":       "bg-yellow-100 text-yellow-800",
  "judgment":    "bg-purple-100 text-purple-800",
  "enforcement": "bg-orange-100 text-orange-800",
  "closed":      "bg-gray-100 text-gray-600",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function FileIcon({ type }: { type: string }) {
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${type === "pdf" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
      {type.toUpperCase()}
    </div>
  );
}

export function Redesign() {
  const [tab, setTab] = useState("timeline");
  const [muted, setMuted] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [msgText, setMsgText] = useState("");

  const totalPaid = PAYMENTS.reduce((s, p) => s + p.amount, 0);
  const outstanding = CASE.outstandingAmount;
  const pctPaid = Math.round((totalPaid / CASE.totalDebtAmount) * 100);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Header banner ── */}
      <div className="bg-gradient-to-r from-[#0a7c6e] to-[#0e9f8e] text-white px-6 pt-6 pb-5 shadow-lg">
        <div className="max-w-5xl mx-auto">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold leading-snug">{CASE.caseName}</h1>
                <p className="text-sm text-white/70 mt-0.5">Acc: {CASE.accountNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setMuted(m => !m)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs transition-colors"
              >
                {muted
                  ? <><BellOff className="h-3.5 w-3.5" /><span>Unmute</span></>
                  : <><Bell className="h-3.5 w-3.5" /><span>Muted? No</span></>
                }
              </button>
            </div>
          </div>

          {/* Stat pills row */}
          <div className="mt-5 flex flex-wrap gap-3">
            {/* Outstanding */}
            <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-xl px-4 py-2.5">
              <PoundSterling className="h-4 w-4 text-white/70" />
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-wide leading-none mb-0.5">Outstanding</p>
                <p className="text-base font-bold leading-none">{fmt(outstanding)}</p>
              </div>
            </div>
            {/* Total paid */}
            <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-xl px-4 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-white/70" />
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-wide leading-none mb-0.5">Total Paid</p>
                <p className="text-base font-bold leading-none">{fmt(totalPaid)}</p>
              </div>
            </div>
            {/* Stage */}
            <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-xl px-4 py-2.5">
              <Scale className="h-4 w-4 text-white/70" />
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-wide leading-none mb-0.5">Stage</p>
                <p className="text-base font-bold leading-none capitalize">{CASE.stage}</p>
              </div>
            </div>
            {/* Opened */}
            <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-xl px-4 py-2.5">
              <Calendar className="h-4 w-4 text-white/70" />
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-wide leading-none mb-0.5">Opened</p>
                <p className="text-base font-bold leading-none">{CASE.openedDate}</p>
              </div>
            </div>
            {/* Organisation */}
            <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-xl px-4 py-2.5">
              <Building className="h-4 w-4 text-white/70" />
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-wide leading-none mb-0.5">Organisation</p>
                <p className="text-base font-bold leading-none">{CASE.organisationName}</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>Repayment progress</span>
              <span>{pctPaid}% paid</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pctPaid}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-0">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors relative ${
                  tab === t.key
                    ? "border-[#0a7c6e] text-[#0a7c6e]"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === t.key ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* TIMELINE */}
        {tab === "timeline" && (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[22px] top-2 bottom-2 w-px bg-gray-200" />
            <div className="space-y-4">
              {TIMELINE.map((entry, i) => (
                <div key={entry.id} className="flex gap-4">
                  {/* Icon circle */}
                  <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${entry.color}`}>
                    <entry.icon className="h-4 w-4" />
                  </div>
                  {/* Card */}
                  <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{entry.title}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        {entry.time}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{entry.detail}</p>
                    <p className="text-xs text-gray-400 mt-2">{entry.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MESSAGES */}
        {tab === "messages" && (
          <div className="space-y-4">
            <div className="space-y-3">
              {MESSAGES.map(msg => {
                const isAdmin = msg.role === "admin";
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${isAdmin ? "bg-white border border-gray-200 rounded-tl-sm" : "bg-teal-600 text-white rounded-tr-sm"}`}>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <span className={`text-xs font-semibold ${isAdmin ? "text-teal-700" : "text-teal-100"}`}>{msg.sender}</span>
                        <span className={`text-xs ${isAdmin ? "text-gray-400" : "text-teal-200"}`}>{msg.date}</span>
                      </div>
                      <p className={`text-sm leading-relaxed ${isAdmin ? "text-gray-700" : "text-white"}`}>{msg.content}</p>
                      {msg.hasAttachment && (
                        <div className={`mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${isAdmin ? "bg-gray-50 text-gray-600 border border-gray-200" : "bg-white/20 text-white"}`}>
                          <Paperclip className="h-3.5 w-3.5" />
                          Attachment included
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compose */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <p className="text-sm font-semibold text-gray-700 mb-3">Send a message</p>
                <textarea
                  rows={3}
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  placeholder="Type your message here…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                  <Paperclip className="h-3.5 w-3.5" />
                  Attach file
                </button>
                <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS */}
        {tab === "documents" && (
          <div className="space-y-4">
            {/* Upload zone */}
            <div className="border-2 border-dashed border-gray-300 hover:border-teal-400 rounded-xl p-6 text-center transition-colors bg-white cursor-pointer group">
              <Upload className="h-8 w-8 text-gray-300 group-hover:text-teal-400 mx-auto mb-2 transition-colors" />
              <p className="text-sm font-medium text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG up to 10 MB</p>
            </div>

            {/* Document list */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {DOCUMENTS.map((doc, i) => (
                <div key={doc.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${i > 0 ? "border-t border-gray-100" : ""}`}>
                  <FileIcon type={doc.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{doc.size} · {doc.date}</p>
                  </div>
                  <button className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors flex-shrink-0">
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
                { label: "Total Debt", value: fmt(CASE.totalDebtAmount), sub: "Original amount", color: "text-gray-900" },
                { label: "Total Paid", value: fmt(totalPaid), sub: `${pctPaid}% of total`, color: "text-green-700" },
                { label: "Outstanding", value: fmt(outstanding), sub: "Remaining balance", color: "text-red-600" },
              ].map(card => (
                <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{card.label}</p>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Payment table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">Payment History</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    {["Date", "Reference", "Method", "Amount", "Status"].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PAYMENTS.map((p, i) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-700 border-b border-gray-50">{p.date}</td>
                      <td className="px-5 py-3.5 text-gray-500 font-mono text-xs border-b border-gray-50">{p.reference}</td>
                      <td className="px-5 py-3.5 text-gray-700 border-b border-gray-50">{p.method}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900 border-b border-gray-50">{fmt(p.amount)}</td>
                      <td className="px-5 py-3.5 border-b border-gray-50">
                        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
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
    </div>
  );
}
