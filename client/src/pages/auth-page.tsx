import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, MessageSquare, TrendingUp, Shield, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import acclaimLogo from "@assets/acclaim_rose_transparent_1768474381340.png";

type Step = "email" | "password";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation } = useAuth();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'azure_login_failed': 'Sign-in failed. Please try again.',
        'no_code': 'Authentication was cancelled or failed.',
        'no_account': 'Could not retrieve account information.',
        'no_email': 'No email address found in your account.',
        'user_not_found': 'Your account is not registered with Acclaim. Please contact your administrator.',
        'session_error': 'Failed to create session. Please try again.',
        'callback_failed': 'Authentication callback failed. Please try again.',
      };
      setError(errorMessages[errorParam] || `Authentication error: ${errorParam}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (loginMutation.error) {
      setError(loginMutation.error.message || "Invalid email or password.");
    }
  }, [loginMutation.error]);

  if (user) {
    setTimeout(() => navigate("/"), 0);
    return null;
  }

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setCheckingEmail(true);
    setError("");

    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();

      if (data.flow === 'sso') {
        window.location.href = `/auth/azure/login?login_hint=${encodeURIComponent(email.trim())}`;
      } else {
        setStep("password");
        setCheckingEmail(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setCheckingEmail(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError("");
    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => navigate("/"),
        onError: (err: any) => {
          setError(err.message || "Invalid email or password.");
        },
      }
    );
  };

  const handleBack = () => {
    setStep("email");
    setPassword("");
    setError("");
  };

  const isLoading = checkingEmail || loginMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <img
                src={acclaimLogo}
                alt="Acclaim Credit Management"
                className="h-16 w-16 mr-3"
              />
              <div className="text-left">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Acclaim</h1>
                <p className="text-sm text-muted-foreground">Credit Management & Recovery</p>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Welcome to your Portal</h2>
            <p className="text-muted-foreground text-sm">Access your cases</p>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                {step === "password" && (
                  <button
                    onClick={handleBack}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <CardTitle className="text-lg">Sign In</CardTitle>
              </div>
              <CardDescription>
                {step === "email"
                  ? "Enter your email address to continue."
                  : `Enter your password for ${email}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {step === "email" ? (
                <form onSubmit={handleEmailContinue} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full h-11 font-medium bg-acclaim-teal hover:bg-acclaim-teal/90"
                    disabled={isLoading || !email.trim()}
                  >
                    {checkingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handlePasswordSignIn} className="space-y-3">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 font-medium bg-acclaim-teal hover:bg-acclaim-teal/90"
                    disabled={isLoading || !password}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <div className="text-center">
                    <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary hover:underline">
                      Forgot your password?
                    </Link>
                  </div>
                </form>
              )}

              <div className="mt-6 text-center text-xs text-muted-foreground">Need assistance? Please contact us at email@acclaim.law | 0113 225 8811</div>
              <div className="mt-3 text-center text-xs text-muted-foreground">
                <Link href="/terms" className="hover:text-primary hover:underline">
                  Terms of Use
                </Link>
                <span className="mx-2">|</span>
                <Link href="/privacy" className="hover:text-primary hover:underline">
                  Privacy Notice
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden md:flex md:flex-1 bg-gradient-to-br from-teal-700 via-teal-600 to-slate-800 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 items-center justify-center p-8">
        <div className="max-w-lg text-white">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-center">Acclaim Credit Management & Recovery</h2>
            <p className="text-lg opacity-90 leading-relaxed text-center">Streamline your debt recovery cases with our comprehensive case management portal.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Case Management</h3>
                <p className="text-sm opacity-90">Track cases from initial contact through to resolution with detailed stage progression and activity logs.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure Communications</h3>
                <p className="text-sm opacity-90">Integrated messaging system and document management.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Analytics & Reporting</h3>
                <p className="text-sm opacity-90">Comprehensive reporting tools for recovery analysis, payment tracking, and performance metrics.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Enterprise Security</h3>
                <p className="text-sm opacity-90">High-level security with role-based access control and complete data protection.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-sm opacity-75 text-center">Part of Chadwick Lawrence LLP</p>
          </div>
        </div>
      </div>
    </div>
  );
}
