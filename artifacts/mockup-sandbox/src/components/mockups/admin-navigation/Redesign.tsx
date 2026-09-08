import { useMemo, useState } from "react";
import {
  Activity, Archive, ArrowLeft, BarChart3, Bell, Building2, CalendarDays, ChevronDown,
  ChevronRight, CircleHelp, ClipboardList, CreditCard, FileSpreadsheet, FileText, LayoutDashboard,
  Mail, Menu, RefreshCw, Scale, Search, Settings2, Shield, ShieldCheck, UserPlus, Users, X, Zap,
} from "lucide-react";
import "./redesign.css";

type Destination = "overview" | "users" | "organisations" | "cases" | "case-submissions" | "integration" | "broadcast" | "statements" | "reports";

const users = [
  { name: "Matt Perry", email: "mattperry@chadlaw.co.uk", org: "Chadwick Lawrence", role: "Super Admin", initials: "MP", colour: "#277b75", registered: true, reports: 2 },
  { name: "Sarah Mitchell", email: "sarah.mitchell@northgate.co.uk", org: "Northgate Housing Group", role: "Owner", initials: "SM", colour: "#b56b4a", registered: true, reports: 1 },
  { name: "James Hartley", email: "j.hartley@abcfinance.co.uk", org: "ABC Finance Ltd", role: "User", initials: "JH", colour: "#527b9b", registered: false, reports: 0 },
  { name: "David Okoro", email: "d.okoro@chadlaw.co.uk", org: "Chadwick Lawrence", role: "Admin", initials: "DO", colour: "#6a8a69", registered: true, reports: 0 },
  { name: "Priya Sharma", email: "priya.sharma@retailcorp.com", org: "RetailCorp UK, RetailCorp Scotland", role: "User", initials: "PS", colour: "#a75b76", registered: true, reports: 1 },
  { name: "Genna Scollen", email: "genna.scollen@northgate.co.uk", org: "Northgate Housing Group", role: "User", initials: "GS", colour: "#ae7b48", registered: false, reports: 0 },
];

const primary: { id: Destination; label: string; icon: typeof Users; count?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users, count: "26" },
  { id: "organisations", label: "Organisations", icon: Building2, count: "12" },
  { id: "cases", label: "Cases", icon: FileText },
  { id: "case-submissions", label: "Case submissions", icon: ClipboardList },
];

const operations: { id: Destination; label: string; icon: typeof Mail }[] = [
  { id: "broadcast", label: "Email broadcast", icon: Mail },
  { id: "statements", label: "Statements", icon: FileSpreadsheet },
  { id: "reports", label: "Scheduled reports", icon: CalendarDays },
];

const specialist = [
  { label: "System monitoring", icon: Activity },
  { label: "Payment performance", icon: CreditCard },
  { label: "Recovery analysis", icon: BarChart3 },
  { label: "Recovery performance", icon: CalendarDays },
  { label: "Messages report", icon: Mail },
  { label: "Portal analytics", icon: BarChart3 },
  { label: "CL analytics", icon: Scale },
  { label: "Audit management", icon: Shield },
  { label: "Closed cases", icon: Archive },
];

function Role({ role }: { role: string }) {
  return <span className={`admin-redesign__role admin-redesign__role--${role.toLowerCase().replace(" ", "-")}`}>
    {role === "Super Admin" && <ShieldCheck />}{role === "Admin" && <Shield />}{role}
  </span>;
}

function UsersView() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = useMemo(() => users.filter((user) => {
    const matchesText = `${user.name} ${user.email} ${user.org}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "admin" && ["Admin", "Super Admin"].includes(user.role)) || (filter === "user" && user.role === "User") || (filter === "registered" && user.registered) || (filter === "not_registered" && !user.registered);
    return matchesText && matchesFilter;
  }), [search, filter]);
  return <section className="admin-redesign__surface">
    <header className="admin-redesign__surface-head">
      <div><div className="admin-redesign__eyebrow">Directory</div><h2>User management</h2><p>Create and manage user accounts with comprehensive controls.</p></div>
      <button className="admin-redesign__button admin-redesign__button--accent"><UserPlus /> Create user</button>
    </header>
    <div className="admin-redesign__surface-body">
      <div className="admin-redesign__filters">
        <label className="admin-redesign__search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or organisation" /></label>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter users">
          <option value="all">All users</option><option value="admin">Admins only</option><option value="user">Non-admins only</option><option value="registered">Registered</option><option value="not_registered">Not registered</option>
        </select>
        <span className="admin-redesign__showing">{filtered.length} of 26 users</span>
      </div>
      <div className="admin-redesign__user-grid">
        {filtered.map((user) => <button className={`admin-redesign__user ${selected === user.email ? "is-selected" : ""}`} key={user.email} onClick={() => setSelected(selected === user.email ? null : user.email)}>
          <div className="admin-redesign__user-top"><span className="admin-redesign__avatar" style={{ backgroundColor: user.colour }}>{user.initials}</span><span className="admin-redesign__user-name"><strong>{user.name}</strong><Role role={user.role} /><small>{user.email}</small></span><ChevronRight /></div>
          <span className="admin-redesign__user-org"><Building2 />{user.org}</span>
          <span className="admin-redesign__user-meta"><span className={user.registered ? "is-registered" : "is-pending"}><span className="admin-redesign__status-dot" />{user.registered ? "Registered" : "Not registered"}</span>{user.reports > 0 && <span><CalendarDays /> {user.reports} report{user.reports > 1 ? "s" : ""}</span>}</span>
        </button>)}
      </div>
      {filtered.length === 0 && <div className="admin-redesign__empty-small"><Search /><strong>No users match that search</strong><span>Try a different name, organisation or filter.</span></div>}
    </div>
  </section>;
}

function OrganisationsView() {
  const [search, setSearch] = useState("");
  const orgs = [["ABC Finance Ltd", "ABC-004", "4 users", "12 cases"], ["Northgate Housing Group", "NGH-001", "7 users", "28 cases"], ["RetailCorp UK", "RC-117", "5 users", "19 cases"], ["West Yorkshire Estates", "WYE-223", "3 users", "8 cases"]];
  const filtered = orgs.filter(([name, ref]) => `${name} ${ref}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="admin-redesign__surface"><header className="admin-redesign__surface-head"><div><div className="admin-redesign__eyebrow">Directory</div><h2>Organisation management</h2><p>Create and manage organisations, users and account references.</p></div><button className="admin-redesign__button admin-redesign__button--accent"><Building2 /> Create organisation</button></header><div className="admin-redesign__surface-body"><div className="admin-redesign__filters"><label className="admin-redesign__search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search organisations" /></label><span className="admin-redesign__showing">{filtered.length} of 12 organisations</span></div><div className="admin-redesign__table-wrap"><table><thead><tr><th>Organisation</th><th>External ref</th><th>Users</th><th>Cases</th><th /></tr></thead><tbody>{filtered.map(([name, ref, memberCount, caseCount]) => <tr key={name}><td><strong>{name}</strong></td><td>{ref}</td><td>{memberCount}</td><td>{caseCount}</td><td><button className="admin-redesign__row-button"><ChevronRight /></button></td></tr>)}</tbody></table></div></div></section>;
}

function StandardView({ destination }: { destination: Destination }) {
  const details: Record<string, [string, string, typeof FileText, string]> = {
    cases: ["Case management", "Archive or permanently delete cases across all organisations.", Archive, "Choose a case from the list to archive or permanently delete it."],
    "case-submissions": ["Case submissions", "Review and manage case submissions from users.", ClipboardList, "Select a submission to review its details and next action."],
    integration: ["Integration management", "Monitor and manage system integrations.", Zap, "Integration status and controls will appear here."],
    broadcast: ["Email broadcast", "Send communications to portal users.", Mail, "Create a broadcast to reach portal users."],
    statements: ["Statement management", "Upload, view and notify users of organisation statements.", FileSpreadsheet, "Select an organisation to manage its statements."],
    reports: ["Scheduled reports", "View and manage scheduled reports across all users and organisations.", CalendarDays, "Your scheduled reporting overview will appear here."],
  };
  const [title, copy, Icon, empty] = details[destination] || details.cases;
  return <section className="admin-redesign__surface"><header className="admin-redesign__surface-head"><div className="admin-redesign__heading-with-icon"><span className="admin-redesign__feature-icon"><Icon /></span><div><div className="admin-redesign__eyebrow">Workspace</div><h2>{title}</h2><p>{copy}</p></div></div>{destination === "reports" && <button className="admin-redesign__button"><RefreshCw /> Refresh</button>}</header><div className="admin-redesign__empty"><span className="admin-redesign__empty-icon"><Icon /></span><h3>{empty}</h3><p>This workspace is ready for your next action.</p><button className="admin-redesign__text-button">View guidance <ChevronRight /></button></div></section>;
}

function SpecialistView({ label }: { label: string }) {
  const Icon = specialist.find((item) => item.label === label)?.icon || Activity;
  return <section className="admin-redesign__surface"><header className="admin-redesign__surface-head"><div className="admin-redesign__heading-with-icon"><span className="admin-redesign__feature-icon"><Icon /></span><div><div className="admin-redesign__eyebrow">System tools</div><h2>{label}</h2><p>Specialist reporting and oversight for Acclaim staff.</p></div></div><button className="admin-redesign__button"><RefreshCw /> Refresh</button></header><div className="admin-redesign__empty"><span className="admin-redesign__empty-icon"><Icon /></span><h3>{label} is ready</h3><p>Use this workspace to review the latest operational data and controls.</p><button className="admin-redesign__text-button">View guidance <ChevronRight /></button></div></section>;
}

export function Redesign() {
  const [destination, setDestination] = useState<Destination>("overview");
  const [specialistSelected, setSpecialistSelected] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [specialistOpen, setSpecialistOpen] = useState(false);
  const refresh = () => { setRefreshing(true); window.setTimeout(() => setRefreshing(false), 700); };
  const go = (next: Destination) => { setDestination(next); setSpecialistSelected(null); setMobileOpen(false); };
  return <main className="admin-redesign">
    <aside className={`admin-redesign__sidebar ${mobileOpen ? "is-open" : ""}`}>
      <div className="admin-redesign__brand"><span className="admin-redesign__brand-mark"><ShieldCheck /></span><span><strong>Acclaim</strong><small>Admin Centre</small></span><button className="admin-redesign__close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button></div>
      <div className="admin-redesign__scope"><span className="admin-redesign__scope-dot" /><span>Operations workspace</span><ChevronDown /></div>
      <nav className="admin-redesign__nav" aria-label="Admin navigation">
        <p className="admin-redesign__nav-label">Workspace</p>
        {primary.map(({ id, label, icon: Icon, count }) => <button key={id} className={destination === id ? "is-active" : ""} onClick={() => go(id)}><Icon /><span>{label}</span>{count && <small>{count}</small>}</button>)}
        <p className="admin-redesign__nav-label">Communications &amp; reporting</p>
        {operations.map(({ id, label, icon: Icon }) => <button key={id} className={destination === id ? "is-active" : ""} onClick={() => go(id)}><Icon /><span>{label}</span></button>)}
        <p className="admin-redesign__nav-label admin-redesign__nav-label--toggle" onClick={() => setSpecialistOpen(!specialistOpen)}>System tools <ChevronDown className={specialistOpen ? "is-rotated" : ""} /></p>
        <div className={`admin-redesign__specialist ${specialistOpen ? "is-open" : ""}`}>{specialist.map(({ label, icon: Icon }) => <button key={label} className={specialistSelected === label ? "is-active" : ""} onClick={() => { setSpecialistSelected(label); setDestination("overview"); setSpecialistOpen(true); setMobileOpen(false); }}><Icon /><span>{label}</span></button>)}</div>
      </nav>
      <div className="admin-redesign__sidebar-foot"><button><Settings2 /> Settings</button><button><CircleHelp /> Help centre</button><div className="admin-redesign__staff"><span>AC</span><div><strong>Acclaim staff</strong><small>Staff access</small></div><ChevronRight /></div></div>
    </aside>
    {mobileOpen && <button className="admin-redesign__scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <div className="admin-redesign__content">
      <header className="admin-redesign__topbar"><button className="admin-redesign__menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></button><button className="admin-redesign__back"><ArrowLeft /><span>Back to Acclaim</span></button><div className="admin-redesign__top-actions"><span className="admin-redesign__last-sync"><span className="admin-redesign__status-dot" />Last synced 2 mins ago</span><button className="admin-redesign__refresh" onClick={refresh} aria-label="Refresh"><RefreshCw className={refreshing ? "is-spinning" : ""} /></button><span className="admin-redesign__top-avatar">AC</span></div></header>
      <section className="admin-redesign__intro"><div><p className="admin-redesign__kicker">Operations control centre</p><h1>{specialistSelected || (destination === "overview" ? "Good morning, team" : (primary.find((item) => item.id === destination)?.label || operations.find((item) => item.id === destination)?.label || "System tools"))}</h1><p className="admin-redesign__intro-copy">{destination === "overview" && !specialistSelected ? "Everything you need to keep the Acclaim portal moving." : "Manage access, activity and controls across the Acclaim portal."}</p></div><div className="admin-redesign__intro-actions"><button className="admin-redesign__button" onClick={() => go("reports")}><FileText /> View activity</button><button className="admin-redesign__button admin-redesign__button--accent" onClick={() => go("users")}><UserPlus /> Create user</button></div></section>
       {specialistSelected ? <SpecialistView label={specialistSelected} /> : destination === "overview" ? <><section className="admin-redesign__metrics"><div><span className="teal"><Users /></span><div><p>Total users</p><strong>26</strong><small>3 unassigned</small></div></div><div><span className="blue"><Building2 /></span><div><p>Organisations</p><strong>12</strong><small>Active organisations</small></div></div><div><span className="amber"><ShieldCheck /></span><div><p>Admin users</p><strong>3</strong><small>With admin privileges</small></div></div><div><span className="violet"><Activity /></span><div><p>Open submissions</p><strong>8</strong><small>2 need attention</small></div></div></section><section className="admin-redesign__overview-grid"><div className="admin-redesign__surface admin-redesign__attention"><header className="admin-redesign__surface-head"><div><div className="admin-redesign__eyebrow">Needs attention</div><h2>Keep work moving</h2><p>Three items are waiting for an admin action.</p></div><button className="admin-redesign__text-button" onClick={() => go("case-submissions")}>View all <ChevronRight /></button></header><div className="admin-redesign__attention-row"><span className="admin-redesign__attention-icon amber"><ClipboardList /></span><div><strong>Case submissions</strong><small>2 submissions are ready for review</small></div><ChevronRight /></div><div className="admin-redesign__attention-row"><span className="admin-redesign__attention-icon teal"><Users /></span><div><strong>Unassigned users</strong><small>3 users need an organisation</small></div><ChevronRight /></div><div className="admin-redesign__attention-row"><span className="admin-redesign__attention-icon blue"><Bell /></span><div><strong>Scheduled reports</strong><small>1 report needs a recipient check</small></div><ChevronRight /></div></div><div className="admin-redesign__surface admin-redesign__quick"><header className="admin-redesign__surface-head"><div><div className="admin-redesign__eyebrow">Shortcuts</div><h2>Frequent work</h2><p>Direct access to common admin tasks.</p></div></header><div className="admin-redesign__quick-grid"><button onClick={() => go("users")}><UserPlus /><span><strong>Create a user</strong><small>Invite someone to Acclaim</small></span><ChevronRight /></button><button onClick={() => go("organisations")}><Building2 /><span><strong>Add an organisation</strong><small>Set up a new account</small></span><ChevronRight /></button><button onClick={() => go("broadcast")}><Mail /><span><strong>Send a broadcast</strong><small>Message portal users</small></span><ChevronRight /></button><button onClick={() => go("reports")}><CalendarDays /><span><strong>Review reports</strong><small>Check scheduled delivery</small></span><ChevronRight /></button></div></div></section></> : null}
      {destination === "users" && <UsersView />}{destination === "organisations" && <OrganisationsView />}{!["overview", "users", "organisations"].includes(destination) && <StandardView destination={destination} />}
    </div>
  </main>;
}

export default Redesign;