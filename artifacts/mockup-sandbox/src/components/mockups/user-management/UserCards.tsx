import { useState } from "react";
import {
  Mail, Shield, Building2, Clock, Send, KeyRound,
  UserPlus, MoreHorizontal, Search, Plus, X,
  Crown, ShieldAlert, Bell, BellOff, History,
  ChevronRight, CheckCircle2, AlertCircle, UserX,
  Phone, BadgeCheck, Calendar
} from "lucide-react";

const TEAL = "#008b8b";

const mockUsers = [
  {
    id: 1,
    firstName: "Sarah",
    lastName: "Mitchell",
    email: "sarah.mitchell@northgate.co.uk",
    username: "sarah.mitchell",
    organisations: ["Northgate Housing Group"],
    isAdmin: false,
    isSuperAdmin: false,
    isOwner: true,
    lastLogin: "2026-06-23T09:14:00Z",
    loginMethod: "SSO",
    inviteAccepted: true,
    notificationsEnabled: true,
    scheduledReports: 2,
    casesCount: 14,
    tempPassword: null,
  },
  {
    id: 2,
    firstName: "James",
    lastName: "Hartley",
    email: "j.hartley@abcfinance.co.uk",
    username: "j.hartley",
    organisations: ["ABC Finance Ltd"],
    isAdmin: false,
    isSuperAdmin: false,
    isOwner: false,
    lastLogin: "2026-06-20T15:42:00Z",
    loginMethod: "Password",
    inviteAccepted: false,
    notificationsEnabled: true,
    scheduledReports: 0,
    casesCount: 7,
    tempPassword: "Temp@1234",
  },
  {
    id: 3,
    firstName: "Matt",
    lastName: "Perry",
    email: "mattperry@chadlaw.co.uk",
    username: "mattperry",
    organisations: ["Internal — Chadwick Lawrence"],
    isAdmin: true,
    isSuperAdmin: true,
    isOwner: false,
    lastLogin: "2026-06-23T13:55:00Z",
    loginMethod: "SSO",
    inviteAccepted: true,
    notificationsEnabled: true,
    scheduledReports: 0,
    casesCount: null,
  },
  {
    id: 4,
    firstName: "Genna",
    lastName: "Scollen",
    email: "genna.scollen@northgate.co.uk",
    username: "genna.scollen",
    organisations: ["Northgate Housing Group"],
    isAdmin: false,
    isSuperAdmin: false,
    isOwner: false,
    lastLogin: null,
    loginMethod: null,
    inviteAccepted: false,
    notificationsEnabled: false,
    scheduledReports: 0,
    casesCount: 3,
    tempPassword: "Temp@5678",
  },
  {
    id: 5,
    firstName: "Priya",
    lastName: "Sharma",
    email: "priya.sharma@retailcorp.com",
    username: "priya.sharma",
    organisations: ["RetailCorp UK", "RetailCorp Scotland"],
    isAdmin: false,
    isSuperAdmin: false,
    isOwner: false,
    lastLogin: "2026-06-18T11:20:00Z",
    loginMethod: "SSO",
    inviteAccepted: true,
    notificationsEnabled: true,
    scheduledReports: 1,
    casesCount: 22,
    tempPassword: null,
  },
  {
    id: 6,
    firstName: "David",
    lastName: "Okoro",
    email: "d.okoro@chadlaw.co.uk",
    username: "d.okoro",
    organisations: ["Internal — Chadwick Lawrence"],
    isAdmin: true,
    isSuperAdmin: false,
    isOwner: false,
    lastLogin: "2026-06-22T08:30:00Z",
    loginMethod: "SSO",
    inviteAccepted: true,
    notificationsEnabled: true,
    scheduledReports: 0,
    casesCount: null,
  },
];

function initials(u: (typeof mockUsers)[0]) {
  return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
}

const avatarColours = [
  "#0d9488", "#0284c7", "#7c3aed", "#db2777", "#d97706",
  "#16a34a", "#dc2626", "#475569",
];

function avatarColor(id: number) {
  return avatarColours[id % avatarColours.length];
}

function timeAgo(iso: string | null) {
  if (!iso) return "Never signed in";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function RoleBadge({ user }: { user: (typeof mockUsers)[0] }) {
  if (user.isSuperAdmin)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
        <ShieldAlert className="h-3 w-3" /> Super Admin
      </span>
    );
  if (user.isAdmin)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        <Shield className="h-3 w-3" /> Admin
      </span>
    );
  if (user.isOwner)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        <Crown className="h-3 w-3" /> Owner
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      User
    </span>
  );
}

function InviteStatus({ user }: { user: (typeof mockUsers)[0] }) {
  if (user.isAdmin) return null;
  if (user.inviteAccepted)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="h-3 w-3" /> Invite accepted
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
      <AlertCircle className="h-3 w-3" /> Awaiting invite
    </span>
  );
}

function UserCard({
  user,
  onClick,
}: {
  user: (typeof mockUsers)[0];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-teal-400 hover:shadow-md transition-all duration-150 relative flex flex-col gap-3"
    >
      {/* Top row: avatar + name + role */}
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: avatarColor(user.id) }}
        >
          {initials(user)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm leading-tight">
              {user.firstName} {user.lastName}
            </span>
            <RoleBadge user={user} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-teal-500 flex-shrink-0 mt-1 transition-colors" />
      </div>

      {/* Org */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Building2 className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{user.organisations.join(", ")}</span>
      </div>

      {/* Bottom row: last login + invite status */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          {timeAgo(user.lastLogin)}
        </span>
        <InviteStatus user={user} />
      </div>

      {/* Temp password badge */}
      {user.tempPassword && (
        <div className="absolute top-3 right-8 w-2 h-2 bg-amber-400 rounded-full" title="Has temporary password" />
      )}
    </button>
  );
}

function ActionButton({
  icon,
  label,
  variant = "default",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "danger";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
        variant === "danger"
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className={variant === "danger" ? "text-red-400" : "text-gray-400"}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function DetailPanel({
  user,
  onClose,
}: {
  user: (typeof mockUsers)[0];
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-2xl flex flex-col z-10 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
        <h2 className="font-semibold text-gray-900 text-sm">User Details</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Profile */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
            style={{ background: avatarColor(user.id) }}
          >
            {initials(user)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </h3>
            <RoleBadge user={user} />
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-start gap-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 break-all">{user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BadgeCheck className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-500">Username:</span>
            <span className="text-gray-700 font-mono text-xs">{user.username}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Building2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              {user.organisations.map((o) => (
                <div key={o} className="text-gray-700">{o}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="px-5 py-4 border-b border-gray-100 space-y-2.5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Status</p>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Last sign-in
          </span>
          <span className="text-gray-700 font-medium">{timeAgo(user.lastLogin)}</span>
        </div>

        {user.loginMethod && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Login method
            </span>
            <span className="text-gray-700 font-medium">{user.loginMethod}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </span>
          {user.notificationsEnabled ? (
            <span className="text-emerald-600 flex items-center gap-1 font-medium">
              <Bell className="h-3 w-3" /> On
            </span>
          ) : (
            <span className="text-gray-400 flex items-center gap-1 font-medium">
              <BellOff className="h-3 w-3" /> Off
            </span>
          )}
        </div>

        {!user.isAdmin && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Invite status
            </span>
            {user.inviteAccepted ? (
              <span className="text-emerald-600 font-medium">Accepted</span>
            ) : (
              <span className="text-amber-600 font-medium">Pending</span>
            )}
          </div>
        )}

        {user.tempPassword && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> Password
            </span>
            <span className="text-amber-600 font-medium">Temporary</span>
          </div>
        )}

        {user.scheduledReports > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Scheduled reports
            </span>
            <span className="text-gray-700 font-medium">{user.scheduledReports} active</span>
          </div>
        )}

        {user.casesCount !== null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Cases</span>
            <span className="text-gray-700 font-medium">{user.casesCount}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Actions</p>
        <div className="space-y-0.5">
          <ActionButton icon={<Mail className="h-4 w-4" />} label="Send welcome email" />
          {!user.isAdmin && (
            <ActionButton icon={<Send className="h-4 w-4" />} label="Send Microsoft invitation" />
          )}
          <ActionButton icon={<KeyRound className="h-4 w-4" />} label="Reset password" />
          <ActionButton icon={<UserPlus className="h-4 w-4" />} label="Assign to organisation" />
          <ActionButton icon={<History className="h-4 w-4" />} label="View login history" />
          {!user.isAdmin && (
            <ActionButton icon={<Shield className="h-4 w-4" />} label="Manage case restrictions" />
          )}
          <ActionButton icon={<Calendar className="h-4 w-4" />} label="Scheduled reports" />
          <div className="my-2 border-t border-gray-100" />
          <ActionButton
            icon={<UserX className="h-4 w-4" />}
            label="Delete user"
            variant="danger"
          />
        </div>
      </div>
    </div>
  );
}

export function UserCards() {
  const [selected, setSelected] = useState<(typeof mockUsers)[0] | null>(null);
  const [search, setSearch] = useState("");

  const filtered = mockUsers.filter(
    (u) =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.organisations.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500">{mockUsers.length} accounts</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: TEAL }}
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ "--tw-ring-color": TEAL } as React.CSSProperties}
            placeholder="Search by name, email or organisation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Card grid + detail panel */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className={`p-6 grid gap-4 transition-all duration-200 ${
            selected
              ? "grid-cols-1 sm:grid-cols-2 mr-96"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {filtered.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onClick={() => setSelected(selected?.id === user.id ? null : user)}
            />
          ))}
        </div>

        {selected && (
          <DetailPanel user={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
