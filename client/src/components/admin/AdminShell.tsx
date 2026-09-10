import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, ArrowLeft, BarChart3, CreditCard, Menu, MessagesSquare, Scale, Shield, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AdminShellProps {
  children: ReactNode;
}

/**
 * Shared chrome for admin specialist pages. The specialist pages retain their
 * existing URLs and own all of their content; this component only supplies the
 * redesigned admin navigation and responsive drawer.
 */
export default function AdminShell({ children }: AdminShellProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(true);
  const drawerId = useId();
  const drawerRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) closeRef.current?.focus();
    else if (wasOpen.current) openerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []).filter(el => !el.hasAttribute("hidden") && el.getAttribute("aria-hidden") !== "true");
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      location === href ? "bg-teal-700 text-white shadow-sm" : "text-teal-100 hover:bg-white/10 hover:text-white"
    }`;

  const specialistLinks = [
    { href: "/system-monitoring", label: "System monitoring", icon: Activity },
    { href: "/admin-payment-performance-report", label: "Payment performance", icon: CreditCard },
    { href: "/messages-report", label: "Messages report", icon: MessagesSquare },
    { href: "/portal-analytics", label: "Portal analytics", icon: BarChart3 },
    { href: "/cl-analytics", label: "CL analytics", icon: Scale },
  ];

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background lg:flex">
      {open && <button className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" aria-label="Close admin navigation" onClick={() => setOpen(false)} />}
      <aside ref={drawerRef} id={drawerId} role={open ? "dialog" : undefined} aria-modal={open || undefined}
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#173e40] p-4 shadow-xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 border-b border-teal-100/20 px-2 pb-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-teal-200/40 bg-teal-700 text-teal-50"><Shield className="h-5 w-5" /></span>
          <div className="min-w-0"><p className="font-semibold text-white">Acclaim</p><p className="text-xs uppercase tracking-wider text-teal-200">Admin Centre</p></div>
          <button ref={closeRef} className="ml-auto text-teal-100 lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="mt-5 flex-1 overflow-y-auto" aria-label="Admin navigation">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-300">Workspace</p>
          <Link href="/admin" className={linkClass("/admin")} onClick={() => setOpen(false)}>Admin overview</Link>
          <p className="mt-6 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-300">System tools</p>
          <button type="button" className="mb-1 flex w-full items-center px-3 pb-2 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-300" onClick={() => setToolsOpen(v => !v)} aria-expanded={toolsOpen}>Specialist reports</button>
          {toolsOpen && <div className="space-y-0.5">
            {specialistLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={linkClass(href)} onClick={() => setOpen(false)}><Icon className="h-4 w-4" />{label}</Link>)}
            {user?.isSuperAdmin && <Link href="/audit-management" className={linkClass("/audit-management")} onClick={() => setOpen(false)}><Shield className="h-4 w-4" />Audit management</Link>}
          </div>}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button ref={openerRef} className="lg:hidden" aria-label="Open navigation" aria-expanded={open} aria-controls={drawerId} onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
            <Link href="/"><span className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm hover:bg-muted"><ArrowLeft className="h-4 w-4" />Back to Acclaim</span></Link>
          </div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}