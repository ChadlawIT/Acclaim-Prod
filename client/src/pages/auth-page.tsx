import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Info, ArrowLeft, Loader2 } from "lucide-react";
import acclaimLogo from "@assets/acclaim_rose_transparent_1768474381340.png";

const MicrosoftIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 11H0V0H11V11Z" fill="#F25022"/>
    <path d="M23 11H12V0H23V11Z" fill="#7FBA00"/>
    <path d="M11 23H0V12H11V23Z" fill="#00A4EF"/>
    <path d="M23 23H12V12H23V23Z" fill="#FFB900"/>
  </svg>
);

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);
  const [showAltLogin, setShowAltLogin] = useState(false);
  const [altEmail, setAltEmail] = useState("");
  const [altPassword, setAltPassword] = useState("");
  const [altLoading, setAltLoading] = useState(false);
  const [altError, setAltError] = useState("");
  const [devEmail, setDevEmail] = useState("");
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState("");
  const isDev = import.meta.env.DEV;

  const handleDevLogin = async () => {
    if (!devEmail.trim()) return;
    setDevLoading(true);
    setDevError("");
    try {
      const res = await fetch("/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: devEmail.trim() }),
        credentials: "include",
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json();
        setDevError(data.message || "Login failed");
      }
    } catch {
      setDevError("Network error");
    } finally {
      setDevLoading(false);
    }
  };

  const handleAltLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!altEmail.trim() || !altPassword) return;
    setAltLoading(true);
    setAltError("");
    try {
      const res = await fetch("/api/auth/login/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: altEmail.trim(), password: altPassword }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user?.mustChangePassword) {
          window.location.href = "/change-password";
        } else {
          window.location.href = "/";
        }
      } else {
        setAltError(data.message || "Sign in failed. Please check your details and try again.");
      }
    } catch {
      setAltError("Network error. Please try again.");
    } finally {
      setAltLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'azure_login_failed': 'Sign-in failed. Please try again.',
        'invalid_request': 'Sign-in could not be completed. Please try again.',
        'no_code': 'Authentication was cancelled or failed.',
        'no_account': 'Could not retrieve account information.',
        'no_email': 'No email address was found in your account.',
        'user_not_found': 'This account is not registered with Acclaim. Please contact your administrator.',
        'session_error': 'Failed to create session. Please try again.',
        'callback_failed': 'Authentication failed. Please try again.',
      };
      setError(errorMessages[errorParam] || 'Sign-in failed. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (user) {
    setTimeout(() => navigate("/"), 0);
    return null;
  }

  const handleAzureLogin = () => {
    window.location.href = '/auth/azure/login';
  };

  const handleAzureSignup = () => {
    window.location.href = '/auth/azure/signup';
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-gray-900">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12 text-center">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex justify-center mb-10">
            <div className="flex items-center gap-3">
              <img src={acclaimLogo} alt="Acclaim" className="h-16 w-16 object-contain" />
              <div className="text-left">
                <div className="font-bold text-slate-800 dark:text-white text-3xl leading-tight">Acclaim</div>
                <div className="text-base text-slate-400 tracking-wide">Credit Management & Recovery</div>
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            {showAltLogin ? (
              <button
                onClick={() => { setShowAltLogin(false); setAltError(""); }}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            ) : null}
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {showAltLogin ? "Sign in with password" : "Welcome."}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {showAltLogin
                ? "Enter your email address and password below."
                : "Sign in to access your portal account."}
            </p>
          </div>

          {error && !showAltLogin && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showAltLogin ? (
            <button
              type="button"
              onClick={handleAzureLogin}
              data-testid="button-azure-login"
              className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold text-sm transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <MicrosoftIcon />
              Sign in with Microsoft
            </button>
          ) : (
            <form onSubmit={handleAltLogin} className="space-y-4">
              {altError && (
                <Alert variant="destructive">
                  <AlertDescription>{altError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="alt-email" className="text-xs font-medium text-slate-600 dark:text-slate-400">Email address</Label>
                <Input
                  id="alt-email"
                  type="email"
                  placeholder="you@example.com"
                  value={altEmail}
                  onChange={e => setAltEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="h-11 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alt-password" className="text-xs font-medium text-slate-600 dark:text-slate-400">Password</Label>
                <Input
                  id="alt-password"
                  type="password"
                  placeholder="Enter your password"
                  value={altPassword}
                  onChange={e => setAltPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="h-11 rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold bg-acclaim-teal hover:bg-acclaim-teal/90"
                disabled={altLoading || !altEmail.trim() || !altPassword}
              >
                {altLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {altLoading ? "Signing in…" : "Sign In"}
              </Button>
              <p className="text-xs text-center text-slate-400">
                Use the temporary password provided by Acclaim. You'll be asked to set a new one on first sign in.
              </p>
            </form>
          )}

          {/* Divider + contact */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-gray-800 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Need help?{" "}
              <a href="mailto:email@acclaim.law" className="text-teal-600 hover:underline font-medium">email@acclaim.law</a>
              {" · "}
              <a href="tel:01132258811" className="text-teal-600 hover:underline font-medium">0113 225 8811</a>
            </p>
            <p className="text-xs text-slate-300 dark:text-slate-600">
              <Link href="/terms" className="hover:text-slate-500 transition-colors">Terms of Use</Link>
              {" · "}
              <Link href="/privacy" className="hover:text-slate-500 transition-colors">Privacy Notice</Link>
            </p>
          </div>

          {/* Dev-only bypass login — never shown in production */}
          {isDev && (
            <div className="mt-4 p-4 rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 dark:bg-amber-900/20">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 uppercase tracking-wide">
                Dev Login (Replit only — not shown in production)
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter user email to log in as..."
                  value={devEmail}
                  onChange={e => setDevEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleDevLogin()}
                  className="flex-1 px-3 py-2 text-sm border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-800"
                />
                <Button
                  onClick={handleDevLogin}
                  disabled={devLoading || !devEmail.trim()}
                  className="text-sm bg-amber-500 hover:bg-amber-600 text-white px-3"
                >
                  {devLoading ? "..." : "Go"}
                </Button>
              </div>
              {devError && (
                <p className="mt-1 text-xs text-red-600">{devError}</p>
              )}
            </div>
          )}

          {/* First time guidance */}
          <div className="mt-4">
            <button
              onClick={() => setShowFirstTimeGuide(!showFirstTimeGuide)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm"
            >
              <span className="flex items-center gap-2 font-medium">
                <Info className="h-4 w-4 text-teal-600" />
                Need help signing in?
              </span>
              {showFirstTimeGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showFirstTimeGuide && (
              <div className="mt-2 px-4 py-4 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 text-sm text-gray-700 dark:text-gray-300">
                {!showAltLogin ? (
                  <>
                    <p className="font-medium text-gray-800 dark:text-gray-100 mb-3">
                      Signing in for the first time? Here's what to do:
                    </p>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-semibold">1</span>
                        <span><strong>Check your email for a Microsoft invitation</strong> — you should have received an email from <em>invitations@microsoft.com</em> sent by Chadwick Lawrence.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-semibold">2</span>
                        <span><strong>Accept the invitation</strong> — click the link in that email and follow the on-screen steps. You won't be able to sign in until this is done.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-semibold">3</span>
                        <span><strong>Return here and click "Sign in with Microsoft"</strong> — use the same email address the invitation was sent to.</span>
                      </li>
                    </ol>
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      Haven't received an invitation, or accepted it but still can't access the portal? Please contact us at <strong>email@acclaim.law</strong> or call <strong>0113 225 8811</strong>.
                    </p>
                    <div className="mt-3 pt-3 border-t border-teal-200 dark:border-teal-700">
                      <button
                        onClick={() => { setShowAltLogin(true); setError(""); }}
                        className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors"
                      >
                        Sign in another way
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-800 dark:text-gray-100 mb-3">
                      Signing in with your password for the first time:
                    </p>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-semibold">1</span>
                        <span><strong>Enter your email address</strong> — use the same email address your account was set up with.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-semibold">2</span>
                        <span><strong>Enter your temporary password</strong> — this was provided to you by Acclaim when your account was created.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-semibold">3</span>
                        <span><strong>Set a new password</strong> — you will be prompted to choose a permanent password before accessing the portal.</span>
                      </li>
                    </ol>
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      If you don't have a temporary password or are having difficulty signing in, please contact us at <strong>email@acclaim.law</strong> or call <strong>0113 225 8811</strong>.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Right side - Brand panel */}
      <div
        className="hidden md:flex md:w-[36%] shrink-0 flex-col justify-between relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0f2027 0%, #0d3d3d 55%, #005f5f 100%)" }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #00b4b4 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #008b8b 0%, transparent 70%)" }}
        />

        <div className="relative z-10 p-8 pt-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <img src={acclaimLogo} alt="Acclaim" className="h-12 w-12 object-contain" />
            <div>
              <div className="text-white font-semibold text-xl leading-tight tracking-wide">Acclaim</div>
              <div className="text-teal-300 text-xs tracking-widest uppercase opacity-80">Credit Management & Recovery</div>
            </div>
          </div>

          {/* Main heading */}
          <h2 className="text-white text-3xl font-bold leading-tight mb-3" style={{ letterSpacing: "-0.02em", textShadow: "0 0 40px rgba(0,180,180,0.45), 0 0 80px rgba(0,180,180,0.15)" }}>
            Debt Recovery Portal.
          </h2>
          <p className="text-teal-200 text-sm opacity-75 leading-relaxed">
            Track cases, communicate with our team, and monitor recovery progress — all in one place.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-5">
            {[
              { icon: "📁", label: "Case Management", desc: "Track every case from open to resolution" },
              { icon: "💬", label: "Secure Messaging", desc: "Direct communication with our team" },
              { icon: "📊", label: "Analytics & Reports", desc: "Payment tracking and performance metrics" },
              { icon: "📄", label: "Document Management", desc: "Store and share case documents securely" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-4">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: "rgba(255,255,255,0.10)" }}
                >
                  {f.icon}
                </div>
                <div>
                  <div className="text-white text-base font-semibold leading-snug">{f.label}</div>
                  <div className="text-teal-300 text-xs opacity-75 mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust strip */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Why clients trust us</p>
            <div className="space-y-2">
              {[
                { badge: "✓", text: "Yorkshire-based legal specialists" },
                { badge: "✓", text: "GDPR compliant & data secure" },
                { badge: "✓", text: "Dedicated case handler support" },
              ].map((t) => (
                <div key={t.text} className="flex items-center gap-2">
                  <span className="text-teal-400 text-xs font-bold">{t.badge}</span>
                  <span className="text-white/60 text-xs">{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Frosted-glass cards */}
        <div className="relative z-10 px-8 pb-6 space-y-3">
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base"
              style={{ background: "rgba(0,180,180,0.15)" }}
            >
              🔒
            </div>
            <div>
              <div className="text-white text-xs font-semibold">Secure Portal Access</div>
              <div className="text-white/40 text-[10px] mt-0.5">Protected by enterprise-grade encryption</div>
            </div>
          </div>
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base"
              style={{ background: "rgba(0,180,180,0.15)" }}
            >
              ⚖️
            </div>
            <div>
              <div className="text-white text-xs font-semibold">Backed by Legal Expertise</div>
              <div className="text-white/40 text-[10px] mt-0.5">Part of Chadwick Lawrence LLP solicitors</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-8 pb-8">
          <div className="border-t border-white/10 pt-5">
            <p className="text-white/40 text-xs">Part of Chadwick Lawrence LLP</p>
          </div>
        </div>
      </div>
    </div>
  );
}
