import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ChevronDown, ChevronUp, ExternalLink, Building2, User, Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function categoryBadge(cat: string | null) {
  if (!cat) return null;
  const map: Record<string, string> = {
    business: "bg-blue-100 text-blue-700",
    personal: "bg-pink-100 text-pink-700",
    events: "bg-purple-100 text-purple-700",
    contact: "bg-green-100 text-green-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${map[cat] || "bg-gray-100 text-gray-600"}`}>
      {cat}
    </span>
  );
}

type SortKey = "name" | "pageViews" | "linkClicks" | "lastPageView" | "lastLinkClick";
type LinkSortKey = "linkTitle" | "linkCategory" | "clicks" | "uniqueUsers" | "lastClick";

export default function CLAnalytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [userSearch, setUserSearch] = useState("");
  const [linkSearch, setLinkSearch] = useState("");
  const [userSort, setUserSort] = useState<SortKey>("pageViews");
  const [userSortDir, setUserSortDir] = useState<"asc" | "desc">("desc");
  const [linkSort, setLinkSort] = useState<LinkSortKey>("clicks");
  const [linkSortDir, setLinkSortDir] = useState<"asc" | "desc">("desc");

  const [selectedUser, setSelectedUser] = useState<{ userId: string; name: string } | null>(null);
  const [selectedLink, setSelectedLink] = useState<{ title: string; href: string } | null>(null);

  const { data, isLoading } = useQuery<{
    summary: { totalPageViews: number; uniqueVisitors: number; totalLinkClicks: number; uniqueLinkClickers: number };
    userStats: any[];
    linkStats: any[];
    recentEvents: any[];
  }>({
    queryKey: ["/api/admin/cl-analytics"],
  });

  const { data: userEvents, isLoading: userEventsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/cl-analytics/user", selectedUser?.userId],
    enabled: !!selectedUser,
  });

  const { data: linkClickers, isLoading: linkClickersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/cl-analytics/link", selectedLink?.href],
    enabled: !!selectedLink,
  });

  if (!user?.isAdmin) {
    return (
      <div className="p-8 text-center text-gray-500">
        You do not have permission to view this page.
      </div>
    );
  }

  function toggleUserSort(key: SortKey) {
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
      const av = a[userSort] ?? "";
      const bv = b[userSort] ?? "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return userSortDir === "asc" ? cmp : -cmp;
    });

  const filteredLinks = (data?.linkStats || [])
    .filter(l => (l.linkTitle || "").toLowerCase().includes(linkSearch.toLowerCase()))
    .sort((a, b) => {
      const av = a[linkSort] ?? "";
      const bv = b[linkSort] ?? "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return linkSortDir === "asc" ? cmp : -cmp;
    });

  function SortIcon({ col, current, dir }: { col: string; current: string; dir: "asc" | "desc" }) {
    if (col !== current) return <ChevronDown className="h-3 w-3 opacity-30 inline ml-1" />;
    return dir === "asc"
      ? <ChevronUp className="h-3 w-3 inline ml-1" />
      : <ChevronDown className="h-3 w-3 inline ml-1" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Admin Panel
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chadwick Lawrence Page Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track which users visit the Chadwick Lawrence page and which links they engage with.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Page Views</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {isLoading ? "—" : data?.summary.totalPageViews ?? 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">total visits</p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Unique Visitors</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {isLoading ? "—" : data?.summary.uniqueVisitors ?? 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">distinct users</p>
                </div>
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                  <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Link Clicks</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {isLoading ? "—" : data?.summary.totalLinkClicks ?? 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">total clicks</p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                  <MousePointerClick className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Link Clickers</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {isLoading ? "—" : data?.summary.uniqueLinkClickers ?? 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">distinct users</p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Breakdown */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                User Breakdown
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">Loading…</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No data yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer select-none whitespace-nowrap"
                        onClick={() => toggleUserSort("name")}
                      >
                        User <SortIcon col="name" current={userSort} dir={userSortDir} />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none text-right whitespace-nowrap"
                        onClick={() => toggleUserSort("pageViews")}
                      >
                        Page Views <SortIcon col="pageViews" current={userSort} dir={userSortDir} />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none whitespace-nowrap"
                        onClick={() => toggleUserSort("lastPageView")}
                      >
                        Last Visit <SortIcon col="lastPageView" current={userSort} dir={userSortDir} />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none text-right whitespace-nowrap"
                        onClick={() => toggleUserSort("linkClicks")}
                      >
                        Link Clicks <SortIcon col="linkClicks" current={userSort} dir={userSortDir} />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none whitespace-nowrap"
                        onClick={() => toggleUserSort("lastLinkClick")}
                      >
                        Last Link Click <SortIcon col="lastLinkClick" current={userSort} dir={userSortDir} />
                      </TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u: any) => (
                      <TableRow key={u.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell>
                          <div className="font-medium text-sm">{u.name}</div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{u.pageViews}</TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(u.lastPageView)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{u.linkClicks}</TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(u.lastLinkClick)}
                        </TableCell>
                        <TableCell>
                          {u.linkClicks > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
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
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-gray-500" />
                Link Breakdown
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search links…"
                  value={linkSearch}
                  onChange={e => setLinkSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">Loading…</div>
            ) : filteredLinks.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No link clicks recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => toggleLinkSort("linkTitle")}
                      >
                        Link <SortIcon col="linkTitle" current={linkSort} dir={linkSortDir} />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => toggleLinkSort("linkCategory")}
                      >
                        Category <SortIcon col="linkCategory" current={linkSort} dir={linkSortDir} />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none text-right whitespace-nowrap"
                        onClick={() => toggleLinkSort("clicks")}
                      >
                        Clicks <SortIcon col="clicks" current={linkSort} dir={linkSortDir} />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none text-right whitespace-nowrap"
                        onClick={() => toggleLinkSort("uniqueUsers")}
                      >
                        Unique Users <SortIcon col="uniqueUsers" current={linkSort} dir={linkSortDir} />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none whitespace-nowrap"
                        onClick={() => toggleLinkSort("lastClick")}
                      >
                        Last Click <SortIcon col="lastClick" current={linkSort} dir={linkSortDir} />
                      </TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLinks.map((l: any) => (
                      <TableRow key={l.linkHref} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell>
                          <div className="font-medium text-sm">{l.linkTitle}</div>
                          <div className="text-xs text-gray-400 truncate max-w-xs">{l.linkHref}</div>
                        </TableCell>
                        <TableCell>{categoryBadge(l.linkCategory)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{l.clicks}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{l.uniqueUsers}</TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(l.lastClick)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
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

      </div>

      {/* User drill-down dialog */}
      <Dialog open={!!selectedUser} onOpenChange={open => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-purple-500" />
              Links clicked by {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          {userEventsLoading ? (
            <div className="p-6 text-center text-gray-400">Loading…</div>
          ) : !userEvents || userEvents.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No link clicks recorded.</div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userEvents.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{e.linkTitle}</div>
                      </TableCell>
                      <TableCell>{categoryBadge(e.linkCategory)}</TableCell>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(e.createdAt)}
                      </TableCell>
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
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Users who clicked: {selectedLink?.title}
            </DialogTitle>
          </DialogHeader>
          {linkClickersLoading ? (
            <div className="p-6 text-center text-gray-400">Loading…</div>
          ) : !linkClickers || linkClickers.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No clickers found.</div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead>Last Click</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkClickers.map((u: any) => (
                    <TableRow key={u.userId}>
                      <TableCell>
                        <div className="font-medium text-sm">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{u.clicks}</TableCell>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(u.lastClick)}
                      </TableCell>
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
