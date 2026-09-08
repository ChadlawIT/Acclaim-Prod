import { useMemo, useState } from "react";
import {
  Activity, Archive, ArrowLeft, BarChart3, Bell, Building, Calendar,
  Check, ChevronRight, ClipboardList, CreditCard, FilePlus, FileSpreadsheet,
  FileText, Mail, RefreshCw, Scale, Search, Shield, ShieldAlert, ShieldCheck,
  UserPlus, Users, Zap,
} from "lucide-react";
import "./_group.css";

type Tab = "users" | "organisations" | "cases" | "case-submissions" | "integration" | "broadcast" | "statements" | "reports";

const users = [
  { name: "Matt Perry", email: "mattperry@chadlaw.co.uk", org: "Chadwick Lawrence", role: "Super Admin", initials: "MP", colour: "#7c3aed", registered: true, reports: 2 },
  { name: "Sarah Mitchell", email: "sarah.mitchell@northgate.co.uk", org: "Northgate Housing Group", role: "Owner", initials: "SM", colour: "#0d9488", registered: true, reports: 1 },
  { name: "James Hartley", email: "j.hartley@abcfinance.co.uk", org: "ABC Finance Ltd", role: "User", initials: "JH", colour: "#0284c7", registered: false, reports: 0 },
  { name: "David Okoro", email: "d.okoro@chadlaw.co.uk", org: "Chadwick Lawrence", role: "Admin", initials: "DO", colour: "#16a34a", registered: true, reports: 0 },
  { name: "Priya Sharma", email: "priya.sharma@retailcorp.com", org: "RetailCorp UK, RetailCorp Scotland", role: "User", initials: "PS", colour: "#db2777", registered: true, reports: 1 },
  { name: "Genna Scollen", email: "genna.scollen@northgate.co.uk", org: "Northgate Housing Group", role: "User", initials: "GS", colour: "#d97706", registered: false, reports: 0 },
];

const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "users", label: "Users", icon: Users },
  { id: "organisations", label: "Orgs", icon: Building },
  { id: "cases", label: "Cases", icon: FileText },
  { id: "case-submissions", label: "Submissions", icon: ClipboardList },
  { id: "integration", label: "Integration", icon: Zap },
  { id: "broadcast", label: "Broadcast", icon: Mail },
  { id: "statements", label: "Statements", icon: FileSpreadsheet },
  { id: "reports", label: "Reports", icon: Calendar },
];

function Role({ role }: { role: string }) {
  const style = role === "Super Admin" ? "super" : role === "Admin" ? "admin" : role === "Owner" ? "owner" : "user";
  return <span className={`admin-current__role admin-current__role--${style}`}>{role === "Super Admin" && <ShieldAlert />} {role === "Admin" && <Shield />} {role === "Owner" && "♛"} {role}</span>;
}

function UsersPanel() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = useMemo(() => users.filter((user) => {
    const textMatches = `${user.name} ${user.email} ${user.org}`.toLowerCase().includes(search.toLowerCase());
    const filterMatches = filter === "all" || (filter === "admin" && ["Admin", "Super Admin"].includes(user.role)) || (filter === "user" && user.role === "User") || (filter === "registered" && user.registered) || (filter === "not_registered" && !user.registered);
    return textMatches && filterMatches;
  }), [search, filter]);
  return <section className="admin-current__card">
    <header className="admin-current__card-header">
      <div><h2>User Management</h2><p>Create and manage user accounts with comprehensive controls</p></div>
      <button className="admin-current__outline-button"><UserPlus /> Create User</button>
    </header>
    <div className="admin-current__card-body">
      <div className="admin-current__filters">
        <label className="admin-current__search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or organisation..." /></label>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="User type filter">
          <option value="all">All Users</option><option value="admin">Admins Only</option><option value="user">Non-Admins Only</option><option value="registered">Registered</option><option value="not_registered">Not Registered</option>
        </select>
        <select aria-label="Page size"><option>12 per page</option></select>
        <span className="admin-current__showing">Showing {filtered.length} of 26 users</span>
      </div>
      <div className="admin-current__user-grid">
        {filtered.map((user) => <button className={`admin-current__user ${selected === user.email ? "is-selected" : ""}`} key={user.email} onClick={() => setSelected(selected === user.email ? null : user.email)}>
          <div className="admin-current__user-top"><span className="admin-current__avatar" style={{ backgroundColor: user.colour }}>{user.initials}</span><div className="admin-current__user-name"><strong>{user.name}</strong><Role role={user.role} /><small>{user.email}</small></div><ChevronRight /></div>
          <div className="admin-current__user-org"><Building />{user.org}</div>
          <div className="admin-current__user-meta"><span><Bell /> <FilePlus /> {user.registered ? "Registered" : <em>Not registered</em>}</span>{user.reports > 0 && <span className="admin-current__report-count"><Calendar /> {user.reports}</span>}</div>
        </button>)}
      </div>
    </div>
  </section>;
}

function OrganisationsPanel() {
  const orgs = [["ABC Finance Ltd", "ABC-004", "4 users", "12 cases"], ["Northgate Housing Group", "NGH-001", "7 users", "28 cases"], ["RetailCorp UK", "RC-117", "5 users", "19 cases"], ["West Yorkshire Estates", "WYE-223", "3 users", "8 cases"]];
  return <section className="admin-current__card"><header className="admin-current__card-header"><div><h2>Organisation Management</h2><p>Create and manage organisations, users and account references</p></div><button className="admin-current__outline-button"><Building /> Create Organisation</button></header><div className="admin-current__card-body"><div className="admin-current__filters"><label className="admin-current__search"><Search /><input placeholder="Search organisations..." /></label><span className="admin-current__showing">Showing 4 of 12 organisations</span></div><div className="admin-current__table-wrap"><table><thead><tr><th>Organisation</th><th>External Ref</th><th>Users</th><th>Cases</th><th></th></tr></thead><tbody>{orgs.map(([name, ref, memberCount, caseCount]) => <tr key={name}><td><strong>{name}</strong></td><td>{ref}</td><td>{memberCount}</td><td>{caseCount}</td><td><button className="admin-current__icon-button"><ChevronRight /></button></td></tr>)}</tbody></table></div></div></section>;
}

function StandardPanel({ tab }: { tab: Tab }) {
  const details: Record<Exclude<Tab, "users" | "organisations">, [string, string, typeof FileText]> = {
    cases: ["Case Management", "Archive or permanently delete cases across all organisations", Archive],
    "case-submissions": ["Case Submissions", "Review and manage case submissions from users", ClipboardList],
    integration: ["Integration Management", "Monitor and manage system integrations", Zap],
    broadcast: ["Email Broadcast", "Send communications to portal users", Mail],
    statements: ["Statement Management", "Upload, view and notify users of organisation statements", FileSpreadsheet],
    reports: ["All Scheduled Reports", "View and manage all scheduled reports across all users and organisations", Calendar],
  };
  const [title, copy, Icon] = details[tab as Exclude<Tab, "users" | "organisations">];
  return <section className="admin-current__card"><header className="admin-current__card-header"><div className="admin-current__title-icon"><span><Icon /></span><div><h2>{title}</h2><p>{copy}</p></div></div>{tab === "reports" && <><button className="admin-current__plain-button"><RefreshCw /> Refresh</button><span className="admin-current__pill">4 reports</span></>}</header><div className="admin-current__empty"><Icon /><h3>{tab === "reports" ? "Scheduled reporting overview" : `No ${title.toLowerCase()} selected`}</h3><p>{tab === "cases" ? "Choose a case from the list to archive or permanently delete it." : "This static preview preserves the Admin Centre panel shell and controls."}</p></div></section>;
}

export function Current() {
  const [tab, setTab] = useState<Tab>("users");
  const [refreshing, setRefreshing] = useState(false);
  const refresh = () => { setRefreshing(true); window.setTimeout(() => setRefreshing(false), 700); };
  return <main className="admin-current">
    <div className="admin-current__header">
      <div className="admin-current__header-row"><div className="admin-current__identity"><button className="admin-current__back"><ArrowLeft /><span>Back</span></button><span className="admin-current__shield"><ShieldCheck /></span><div><h1>Admin Centre</h1><p>User, organisation &amp; system management</p></div></div><button className="admin-current__refresh" onClick={refresh}><RefreshCw className={refreshing ? "is-spinning" : ""} /><span>{refreshing ? "Refreshing…" : "Refresh"}</span></button></div>
      <nav className="admin-current__quick-links" aria-label="Admin shortcuts">
        <button><Activity />System Monitoring</button><button><CreditCard />Payment Performance</button><button><BarChart3 />Recovery Analysis</button><button><Calendar />Recovery Performance</button><button><Mail />Messages Report</button><button><BarChart3 />Portal Analytics</button><button><Scale />CL Analytics</button><button><Shield />Audit Management</button><button><Archive />Closed Cases</button>
      </nav>
    </div>
    <section className="admin-current__metrics"><div><span className="teal"><Users /></span><p>Total Users</p><strong>26</strong><small>3 unassigned</small></div><div><span className="blue"><Building /></span><p>Organisations</p><strong>12</strong><small>Active organisations</small></div><div><span className="amber"><ShieldCheck /></span><p>Admin Users</p><strong>3</strong><small>With admin privileges</small></div><div><span className="violet"><Shield /></span><p>Staff Users</p><strong>5</strong><small>Internal users</small></div></section>
    <div className="admin-current__tabs" role="tablist">{tabs.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}><Icon />{label}</button>)}</div>
    {tab === "users" ? <UsersPanel /> : tab === "organisations" ? <OrganisationsPanel /> : <StandardPanel tab={tab} />}
  </main>;
}

export default Current;