import { useState } from "react";
import {
  Clock, MessageSquare, FileText, CreditCard, Building,
  Bell, BellOff, CheckCircle2, Paperclip, Send, Download,
  Upload, Scale, PoundSterling, ChevronDown, ChevronUp, Dot
} from "lucide-react";

const CASE = {
  caseName: "Pryce Information Management Ltd",
  accountNumber: "SOS-2024-001",
  organisationName: "Chadwick Lawrence LLP",
  outstandingAmount: 14850.00,
  totalDebtAmount: 18500.00,
  stage: "Claim",
  openedDate: "12 Jan 2024",
  caseHandler: "Sarah Mitchell",
};

const TIMELINE = [
  { id: 1, date: "14 Jun 2024", time: "09:41", title: "Client sent a message", detail: "Queried the outstanding balance breakdown.", dot: "bg-blue-400" },
  { id: 2, date: "10 Jun 2024", time: "14:22", title: "Document uploaded", detail: "Invoice-Final-2024.pdf added.", dot: "bg-violet-400" },
  { id: 3, date: "03 Jun 2024", time: "11:05", title: "Payment received", detail: "£1,200.00 via BACS.", dot: "bg-green-400" },
  { id: 4, date: "22 May 2024", time: "08:30", title: "Stage → Claim", detail: "Case progressed to Claim stage.", dot: "bg-orange-400" },
  { id: 5, date: "12 Jan 2024", time: "09:00", title: "Case opened", detail: "Assigned to Sarah Mitchell.", dot: "bg-teal-400" },
];

const MESSAGES = [
  { id: 1, sender: "Matt Perry", role: "client", date: "14 Jun 2024", preview: "Could you please provide a detailed breakdown of the outstanding balance?", unread: true },
  { id: 2, sender: "Sarah Mitchell", role: "admin", date: "13 Jun 2024", preview: "The balance of £14,850.00 comprises the original debt plus £1,200.00 in costs.", unread: false },
  { id: 3, sender: "Matt Perry", role: "client", date: "10 Jun 2024", preview: "Please find the signed payment agreement attached.", unread: false },
];

const DOCUMENTS = [
  { id: 1, name: "Invoice-Final-2024.pdf", size: "124 KB", date: "10 Jun 2024", type: "pdf", new: true },
  { id: 2, name: "Payment-Agreement-Signed.pdf", size: "88 KB", date: "10 Jun 2024", type: "pdf", new: false },
  { id: 3, name: "Original-Contract.docx", size: "210 KB", date: "12 Jan 2024", type: "doc", new: false },
];

const PAYMENTS = [
  { id: 1, date: "03 Jun 2024", amount: 1200.00, ref: "BACS-2024-0603" },
  { id: 2, date: "15 Feb 2024", amount: 2450.00, ref: "BACS-2024-0215" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

type PanelKey = "timeline" | "messages" | "documents" | "payments";

function Panel({ id, open, toggle, label, icon: Icon, count, badge, children }: {
  id: PanelKey; open: boolean; toggle: () => void;
  label: string; icon: any; count: number; badge?: number; children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-xl border transition-all shadow-sm ${open ? "border-teal-200 shadow-md" : "border-gray-200"}`}>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${open ? "bg-teal-50 text-teal-600" : "bg-gray-50 text-gray-400"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <span className={`font-semibold text-sm ${open ? "text-teal-800" : "text-gray-800"}`}>{label}</span>
            <span className="text-xs text-gray-400 ml-2">{count} item{count !== 1 ? "s" : ""}</span>
          </div>
          {(badge ?? 0) > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
              {badge}
            </span>
          )}
        </div>
        <div className={`text-gray-300 transition-transform ${open ? "rotate-180" : ""}`}>
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function Digest() {
  const [muted, setMuted] = useState(false);
  const [open, setOpen] = useState<Record<PanelKey, boolean>>({
    timeline: true, messages: true, documents: false, payments: false
  });
  const [msg, setMsg] = useState("");

  const toggle = (k: PanelKey) => setOpen(o => ({ ...o, [k]: !o[k] }));
  const totalPaid = 3650;
  const pct = Math.round((totalPaid / CASE.totalDebtAmount) * 100);
  const unreadMessages = MESSAGES.filter(m => m.unread).length;
  const newDocs = DOCUMENTS.filter(d => d.new).length;

  return (
    <div className="min-h-screen bg-[#f4f6f8] font-sans">
      {/* Header — compact strip */}
      <div className="bg-gradient-to-r from-[#0a7c6e] to-[#0e9f8e] text-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
              <Building className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight truncate">{CASE.caseName}</h1>
              <p className="text-xs text-white/60">{CASE.accountNumber}</p>
            </div>
          </div>
          <button onClick={() => setMuted(m => !m)} className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0">
            {muted ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
      </div>

      {/* KPI bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-3">
        <div className="flex flex-wrap gap-6 items-center">
          {[
            { l: "Outstanding", v: fmt(CASE.outstandingAmount), c: "text-red-600 font-bold" },
            { l: "Total Paid",  v: fmt(totalPaid),              c: "text-green-700 font-bold" },
            { l: "Stage",       v: CASE.stage,                  c: "text-gray-900" },
            { l: "Handler",     v: CASE.caseHandler,            c: "text-gray-900" },
            { l: "Opened",      v: CASE.openedDate,             c: "text-gray-900" },
          ].map((s, i) => (
            <div key={s.l} className={`flex items-center gap-2 ${i > 0 ? "pl-6 border-l border-gray-200" : ""}`}>
              <span className="text-xs text-gray-400">{s.l}:</span>
              <span className={`text-sm ${s.c}`}>{s.v}</span>
            </div>
          ))}
          {/* progress */}
          <div className="flex items-center gap-2 pl-6 border-l border-gray-200 flex-1">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[80px]">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{pct}% paid</span>
          </div>
        </div>
      </div>

      {/* Accordion panels */}
      <div className="px-6 py-5 space-y-3 max-w-4xl mx-auto">

        <Panel id="timeline" open={open.timeline} toggle={() => toggle("timeline")}
          label="Timeline" icon={Clock} count={TIMELINE.length}>
          <div className="space-y-2">
            {TIMELINE.map(e => (
              <div key={e.id} className="flex items-center gap-4 py-2.5 border-b border-gray-50 last:border-0">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${e.dot}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">{e.title}</span>
                  <span className="text-xs text-gray-400 ml-2">{e.detail}</span>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">{e.date}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel id="messages" open={open.messages} toggle={() => toggle("messages")}
          label="Messages" icon={MessageSquare} count={MESSAGES.length} badge={unreadMessages}>
          <div className="space-y-2">
            {MESSAGES.map(m => (
              <div key={m.id} className={`rounded-xl border p-3.5 ${m.unread ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-gray-50"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${m.role === "admin" ? "text-teal-700" : "text-blue-700"}`}>{m.sender}</span>
                  <div className="flex items-center gap-2">
                    {m.unread && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">New</span>}
                    <span className="text-xs text-gray-400">{m.date}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{m.preview}</p>
              </div>
            ))}
            {/* Inline compose */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mt-2">
              <textarea rows={2} value={msg} onChange={e => setMsg(e.target.value)}
                placeholder="Write a reply…"
                className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 mb-2" />
              <div className="flex items-center justify-between">
                <button className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 bg-white rounded-lg px-3 py-1.5 hover:bg-gray-50">
                  <Paperclip className="h-3.5 w-3.5" /> Attach
                </button>
                <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors">
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </div>
            </div>
          </div>
        </Panel>

        <Panel id="documents" open={open.documents} toggle={() => toggle("documents")}
          label="Documents" icon={FileText} count={DOCUMENTS.length} badge={newDocs}>
          <div>
            <div className="border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-xl p-4 text-center mb-3 cursor-pointer transition-colors group">
              <Upload className="h-5 w-5 text-gray-300 group-hover:text-teal-400 mx-auto mb-1 transition-colors" />
              <p className="text-xs text-gray-400">Click to upload or drag and drop</p>
            </div>
            <div className="space-y-2">
              {DOCUMENTS.map(d => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${d.type === "pdf" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                    {d.type.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{d.name}</p>
                      {d.new && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full flex-shrink-0">New</span>}
                    </div>
                    <p className="text-xs text-gray-400">{d.size} · {d.date}</p>
                  </div>
                  <button className="text-xs text-teal-600 border border-teal-200 bg-white px-2.5 py-1.5 rounded-lg hover:bg-teal-50 transition-colors flex items-center gap-1 flex-shrink-0">
                    <Download className="h-3 w-3" /> Get
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel id="payments" open={open.payments} toggle={() => toggle("payments")}
          label="Payments" icon={CreditCard} count={PAYMENTS.length}>
          <div className="space-y-3">
            {/* Mini summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: "Total Debt",   v: fmt(CASE.totalDebtAmount), c: "text-gray-900" },
                { l: "Total Paid",   v: fmt(totalPaid),            c: "text-green-700" },
                { l: "Outstanding",  v: fmt(CASE.outstandingAmount),c: "text-red-600" },
              ].map(s => (
                <div key={s.l} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{s.l}</p>
                  <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
            {/* Payment rows */}
            {PAYMENTS.map(p => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{fmt(p.amount)}</p>
                  <p className="text-xs text-gray-400 font-mono">{p.ref}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{p.date}</span>
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Confirmed</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
