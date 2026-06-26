import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye, MousePointerClick, Users, TrendingUp, ArrowLeft, Search,
  ChevronDown, ChevronUp, ExternalLink, User,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import chadwickLawrenceLogo from "@assets/CL_long_logo_1768312503635.png";

const CL_NAVY  = "#2e3192";
const CL_PINK  = "#ba1b6e";

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function CategoryBadge({ cat }: { cat: string | null | undefined }) {
  if (!cat) return null;
  const styles: Record<string, { bg: string; color: string }> = {
    business: { bg: "#e8eaf6", color: CL_NAVY },
    personal: { bg: "#fce4ec", color: CL_PINK },
    events:   { bg: "#f3e5f5", color: "#6a1b9a" },
    contact:  { bg: "#e8f5e9", color: "#2e7d32" },
  };
  const s = styles[cat] || { bg: "#f5f5f5", color: "#555" };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize"
      style={{ background: s.bg, color: s.color }}
    >
      {cat}
    </span>
  );
}

type UserSortKey = "name" | "pageViews" | "linkClicks" | "lastPageView" | "lastLinkClick";
type LinkSortKey = "linkTitle" | "linkCategory" | "clicks" | "uniqueUsers" | "lastClick";

export default function CLAnalytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [userSearch, setUserSearch] = useState("");
  const [linkSearch, setLinkSearch] = useState("");
  const [userSort, setUserSort]     = useState<UserSortKey>("pageViews");
  const [userSortDir, setUserSortDir] = useState<"asc" | "desc">("desc");
  const [linkSort, setLinkSort]     = useState<LinkSortKey>("clicks");
  const [linkSortDir, setLinkSortDir] = useState<"asc" | "desc">("desc");

  const [selectedUser, setSelectedUser] = useState<{ userId: string; name: string } | null>(null);
  const [selectedLink, setSelectedLink] = useState<{ title: string; href: string } | null>(null);

  const { data, isLoading } = useQuery<{
    summary: { totalPageViews: number; uniqueVisitors: number; totalLinkClicks: number; uniqueLinkClickers: number };
    userStats: any[];
    linkStats: any[];
  }>({ queryKey: ["/api/admin/cl-analytics"] });

  const { data: userEvents, isLoading: userEventsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/cl-analytics/user", selectedUser?.userId],
    enabled: !!selectedUser,
  });

  const { data: linkClickers, isLoading: linkClickersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/cl-analytics/link", selectedLink?.href],
    enabled: !!selectedLink,
  });

  if (!user?.isAdmin) {
    return <div className="p-8 text-center text-gray-500">You do not have permission to view this page.</div>;
  }

  function toggleUserSort(key: UserSortKey) {
    if (userSort === key) setUserSortDir(d => d === "asc" ? "desc" : "asc");
    else { setUserSort(key); setUserSortDir("desc"); }
  }
  function toggleLinkSort(key: LinkSortKey) {
    if (linkSort === key) setLinkSortDir(d => d === "asc" ? "desc" : "asc");
    else { setLinkSort(key); setLinkSortDir("desc"); }
  }

  const filteredUsers = (data?.userStats || [])
    .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
    .sort((a, b) => {
      const av = a[userSort] ?? ""; const bv = b[userSort] ?? "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return userSortDir === "asc" ? cmp : -cmp;
    });

  const filteredLinks = (data?.linkStats || [])
    .filter(l => (l.linkTitle || "").toLowerCase().includes(linkSearch.toLowerCase()))
    .sort((a, b) => {
      const av = a[linkSort] ?? ""; const bv = b[linkSort] ?? "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return linkSortDir === "asc" ? cmp : -cmp;
    });

  function SortIcon({ col, current, dir }: { col: string; current: string; dir: "asc" | "desc" }) {
    if (col !== current) return <ChevronDown className="h-3 w-3 opacity-30 inline ml-1" />;
    return dir === "asc"
      ? <ChevronUp className="h-3 w-3 inline ml-1" />
      : <ChevronDown className="h-3 w-3 inline ml-1" />;
  }

  const summary = data?.summary;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">

      {/* CL Branded Header */}
      <div style={{ background: `linear-gradient(135deg, ${CL_NAVY} 0%, ${CL_PINK} 100%)` }} className="text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Back link */}
          <div className="pt-4">
            <button
              onClick={() => setLocation("/admin")}
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Panel
            </button>
          </div>

          {/* Logo + title row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 py-6">
            <div className="bg-white rounded-xl px-5 py-3 shadow-md flex-shrink-0 self-start">
              <img
                src={chadwickLawrenceLogo}
                alt="Chadwick Lawrence"
                className="h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Page Analytics</h1>
              <p className="text-white/75 text-sm mt-0.5">
                Monitoring user engagement with the Chadwick Lawrence services page
              </p>
            </div>
          </div>

          {/* Summary stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/20 border-t border-white/20 -mx-4 sm:-mx-6">
            {[
              { label: "Page Views",      value: summary?.totalPageViews      ?? "—", icon: Eye },
              { label: "Unique Visitors", value: summary?.uniqueVisitors      ?? "—", icon: Users },
              { label: "Link Clicks",     value: summary?.totalLinkClicks     ?? "—", icon: MousePointerClick },
              { label: "Link Clickers",   value: summary?.uniqueLinkClickers  ?? "—", icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/10 hover:bg-white/20 transition-colors px-6 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-white/60" />
                  <span className="text-xs text-white/60 uppercase tracking-wide font-medium">{label}</span>
                </div>
                <div className="text-2xl font-bold">{isLoading ? "—" : value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* User Breakdown */}
        <Card className="overflow-hidden shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-700">
          <CardHeader className="border-b py-4" style={{ background: `${CL_NAVY}08` }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: CL_NAVY }}>
                <User className="h-4 w-4" />
                User Breakdown
              </CardTitle>
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search users…" value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-9 h-8 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">No data yet — users will appear once they visit the page.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ background: `${CL_NAVY}06` }}>
                      {([
                        { key: "name",         label: "User",           align: "left"  },
                        { key: "pageViews",    label: "Page Views",     align: "right" },
                        { key: "lastPageView", label: "Last Visit",     align: "left"  },
                        { key: "linkClicks",   label: "Link Clicks",    align: "right" },
                        { key: "lastLinkClick",label: "Last Link Click",align: "left"  },
                      ] as const).map(({ key, label, align }) => (
                        <TableHead
                          key={key}
                          className={`cursor-pointer select-none whitespace-nowrap text-xs font-semibold uppercase tracking-wide ${align === "right" ? "text-right" : ""}`}
                          style={{ color: CL_NAVY }}
                          onClick={() => toggleUserSort(key as UserSortKey)}
                        >
                          {label}
                          <SortIcon col={key} current={userSort} dir={userSortDir} />
                        </TableHead>
                      ))}
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u: any) => (
                      <TableRow key={u.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <TableCell>
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{u.name}</div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-block min-w-[2rem] text-center font-semibold text-sm rounded-full px-2 py-0.5" style={{ background: `${CL_NAVY}12`, color: CL_NAVY }}>
                            {u.pageViews}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">{formatDate(u.lastPageView)}</TableCell>
                        <TableCell className="text-right">
                          {u.linkClicks > 0 ? (
                            <span className="inline-block min-w-[2rem] text-center font-semibold text-sm rounded-full px-2 py-0.5" style={{ background: `${CL_PINK}12`, color: CL_PINK }}>
                              {u.linkClicks}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-300">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">{formatDate(u.lastLinkClick)}</TableCell>
                        <TableCell className="text-right">
                          {u.linkClicks > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7"
                              style={{ color: CL_NAVY }}
                              onClick={() => setSelectedUser({ userId: u.userId, name: u.name })}
                            >
                              View links
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Link Breakdown */}
        <Card className="overflow-hidden shadow-sm border-0 ring-1 ring-gray-200 dark:ring-gray-700">
          <CardHeader className="border-b py-4" style={{ background: `${CL_PINK}08` }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: CL_PINK }}>
                <ExternalLink className="h-4 w-4" />
                Link Engagement
              </CardTitle>
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search links…" value={linkSearch} onChange={e => setLinkSearch(e.target.value)} className="pl-9 h-8 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
            ) : filteredLinks.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">No link clicks recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ background: `${CL_PINK}06` }}>
                      {([
                        { key: "linkTitle",    label: "Link",         align: "left"  },
                        { key: "linkCategory", label: "Category",     align: "left"  },
                        { key: "clicks",       label: "Clicks",       align: "right" },
                        { key: "uniqueUsers",  label: "Unique Users", align: "right" },
                        { key: "lastClick",    label: "Last Click",   align: "left"  },
                      ] as const).map(({ key, label, align }) => (
                        <TableHead
                          key={key}
                          className={`cursor-pointer select-none whitespace-nowrap text-xs font-semibold uppercase tracking-wide ${align === "right" ? "text-right" : ""}`}
                          style={{ color: CL_PINK }}
                          onClick={() => toggleLinkSort(key as LinkSortKey)}
                        >
                          {label}
                          <SortIcon col={key} current={linkSort} dir={linkSortDir} />
                        </TableHead>
                      ))}
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLinks.map((l: any) => (
                      <TableRow key={l.linkHref} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <TableCell>
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{l.linkTitle}</div>
                          <div className="text-xs text-gray-400 truncate max-w-xs">{l.linkHref}</div>
                        </TableCell>
                        <TableCell><CategoryBadge cat={l.linkCategory} /></TableCell>
                        <TableCell className="text-right">
                          <span className="inline-block min-w-[2rem] text-center font-semibold text-sm rounded-full px-2 py-0.5" style={{ background: `${CL_PINK}12`, color: CL_PINK }}>
                            {l.clicks}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-600">{l.uniqueUsers}</TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">{formatDate(l.lastClick)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            style={{ color: CL_PINK }}
                            onClick={() => setSelectedLink({ title: l.linkTitle, href: l.linkHref })}
                          >
                            View users
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer branding */}
        <div className="flex items-center justify-center pt-2 pb-6 opacity-40">
          <img src={chadwickLawrenceLogo} alt="Chadwick Lawrence" className="h-6 object-contain" />
        </div>
      </div>

      {/* User drill-down dialog */}
      <Dialog open={!!selectedUser} onOpenChange={open => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base" style={{ color: CL_PINK }}>
              <MousePointerClick className="h-4 w-4" />
              Links clicked by {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          {userEventsLoading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
          ) : !userEvents?.length ? (
            <div className="p-6 text-center text-gray-400 text-sm">No link clicks recorded.</div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide" style={{ color: CL_NAVY }}>Link</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide" style={{ color: CL_NAVY }}>Category</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide" style={{ color: CL_NAVY }}>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userEvents.map((e: any) => (
                    <TableRow key={e.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-sm">{e.linkTitle}</TableCell>
                      <TableCell><CategoryBadge cat={e.linkCategory} /></TableCell>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">{formatDate(e.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Link drill-down dialog */}
      <Dialog open={!!selectedLink} onOpenChange={open => !open && setSelectedLink(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base" style={{ color: CL_NAVY }}>
              <Users className="h-4 w-4" />
              Users who clicked: {selectedLink?.title}
            </DialogTitle>
          </DialogHeader>
          {linkClickersLoading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
          ) : !linkClickers?.length ? (
            <div className="p-6 text-center text-gray-400 text-sm">No clickers found.</div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide" style={{ color: CL_NAVY }}>User</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-right" style={{ color: CL_NAVY }}>Clicks</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide" style={{ color: CL_NAVY }}>Last Click</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkClickers.map((u: any) => (
                    <TableRow key={u.userId} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium text-sm">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-block font-semibold text-sm rounded-full px-2 py-0.5" style={{ background: `${CL_PINK}12`, color: CL_PINK }}>
                          {u.clicks}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">{formatDate(u.lastClick)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
