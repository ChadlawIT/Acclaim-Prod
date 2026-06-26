import { useState } from "react";
import {
  MessageSquare, FileText, PoundSterling, Scale, CheckCircle2,
  Building, Bell, BellOff, Paperclip, Send, Download, Upload,
  Clock, ChevronDown, User
} from "lucide-react";

const CASE = {
  caseName: "Pryce Information Management Ltd",
  accountNumber: "SOS-2024-001",
  organisationName: "Chadwick Lawrence LLP",
  outstandingAmount: 14850.00,
  totalDebtAmount: 18500.00,
  stage: "Claim",
  openedDate: "12 Jan 2024",
};

// Unified feed — everything interleaved chronologically
const FEED = [
  {
    id: 1, date: "14 Jun 2024", time: "09:41", kind: "message",
    sender: "Matt Perry", role: "client",
    content: "Could you please provide a detailed breakdown of the outstanding balance, including any interest or costs that have been added?",
    attachment: null,
  },
  {
    id: 2, date: "13 Jun 2024", time: "14:15", kind: "message",
    sender: "Sarah Mitchell", role: "admin",
    content: "Thank you for your query. The balance of £14,850.00 comprises the original debt of £13,650.00 plus £1,200.00 in costs. A full breakdown is attached.",
    attachment: "Balance-Breakdown.pdf",
  },
  {
    id: 3, date: "10 Jun 2024", time: "11:02", kind: "document",
    sender: "Matt Perry", role: "client",
    content: "Payment-Agreement-Signed.pdf uploaded to the case.",
    attachment: "Payment-Agreement-Signed.pdf",
  },
  {
    id: 4, date: "03 Jun 2024", time: "11:05", kind: "payment",
    sender: null, role: "system",
    content: "Partial payment of £1,200.00 received via BACS. Outstanding balance reduced to £14,850.00.",
    attachment: null,
    amount: 1200.00,
  },
  {
    id: 5, date: "22 May 2024", time: "08:30", kind: "stage",
    sender: null, role: "system",
    content: "Case progressed to Claim stage.",
    attachment: null,
  },
  {
    id: 6, date: "15 Feb 2024", time: "10:00", kind: "payment",
    sender: null, role: "system",
    content: "Partial payment of £2,450.00 received via BACS.",
    attachment: null,
    amount: 2450.00,
  },
  {
    id: 7, date: "12 Jan 2024", time: "09:00", kind: "open",
    sender: null, role: "system",
    content: "Case opened and assigned to Sarah Mitchell.",
    attachment: null,
  },
];

const kindMeta: Record<string, { icon: any; accent: string; label: string }> = {
  message:  { icon: MessageSquare, accent: "border-l-blue-400",   label: "Message" },
  document: { icon: FileText,       accent: "border-l-violet-400", label: "Document" },
  payment:  { icon: PoundSterling,  accent: "border-l-green-400",  label: "Payment" },
  stage:    { icon: Scale,          accent: "border-l-orange-400", label: "Stage update" },
  open:     { icon: CheckCircle2,   accent: "border-l-teal-400",   label: "Case opened" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

export function Chronicle() {
  const [muted, setMuted] = useState(false);
  const [msg, setMsg] = useState("");
  const totalPaid = 3650;
  const pct = Math.round((totalPaid / CASE.totalDebtAmount) * 100);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Slim header */}
      <div className="bg-gradient-to-r from-[#0a7c6e] to-[#0e9f8e] text-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">{CASE.caseName}</h1>
              <p className="text-xs text-white/60">{CASE.accountNumber} · {CASE.organisationName}</p>
            </div>
          </div>
          <button
            onClick={() => setMuted(m => !m)}
            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 transition-colors"
          >
            {muted ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>

        {/* Inline stats row */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          {[
            { l: "Outstanding", v: fmt(CASE.outstandingAmount) },
            { l: "Total Paid",  v: fmt(totalPaid) },
            { l: "Stage",       v: CASE.stage },
            { l: "Opened",      v: CASE.openedDate },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-1.5">
              <span className="text-white/50">{s.l}:</span>
              <span className="font-semibold text-white">{s.v}</span>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-white/50 mt-1">{pct}% paid · {fmt(CASE.outstandingAmount)} remaining</p>
        </div>
      </div>

      {/* Feed label */}
      <div className="px-6 pt-5 pb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Case activity — newest first</p>
        <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none">
          <option>All activity</option>
          <option>Messages only</option>
          <option>Documents only</option>
          <option>Payments only</option>
        </select>
      </div>

      {/* Unified chronological feed */}
      <div className="flex-1 px-6 pb-4 space-y-3 overflow-y-auto">
        {FEED.map(item => {
          const meta = kindMeta[item.kind];
          const Icon = meta.icon;
          const isClientMsg = item.kind === "message" && item.role === "client";
          const isAdminMsg  = item.kind === "message" && item.role === "admin";
          const isSystem    = item.role === "system";

          return (
            <div key={item.id} className={`bg-white rounded-xl border-l-4 ${meta.accent} border border-gray-200 border-l-[4px] shadow-sm p-4`}>
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-gray-500" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${isAdminMsg ? "text-teal-700" : isClientMsg ? "text-blue-700" : "text-gray-500"}`}>
                        {item.sender || meta.label}
                      </span>
                      {item.kind === "payment" && (
                        <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                          {fmt((item as any).amount)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {item.time} · {item.date}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-gray-700 leading-relaxed">{item.content}</p>

                  {/* Attachment chip */}
                  {item.attachment && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors">
                      <Paperclip className="h-3 w-3" />
                      {item.attachment}
                      <Download className="h-3 w-3 ml-1 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pinned compose bar */}
      <div className="border-t border-gray-200 bg-white px-6 py-4 shadow-lg">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              rows={2}
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Add a message, or drop a file here…"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
              <Paperclip className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 h-9 rounded-xl transition-colors">
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
