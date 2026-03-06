import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, MessageSquare, TrendingUp, Shield, KeyRound } from "lucide-react";
import acclaimLogo from "@assets/acclaim_rose_transparent_1768474381340.png";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'azure_login_failed': 'Microsoft sign-in failed. Please try again.',
        'no_code': 'Authentication was cancelled or failed.',
        'no_account': 'Could not retrieve account information from Microsoft.',
        'no_email': 'No email address found in your Microsoft account.',
        'user_not_found': 'Your Microsoft account is not registered with Acclaim. Please contact your administrator.',
        'session_error': 'Failed to create session. Please try again.',
        'callback_failed': 'Authentication callback failed. Please try again.',
      };
      setError(errorMessages[errorParam] || `Authentication error: ${errorParam}`);
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
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
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
              <CardTitle className="text-lg">Sign In</CardTitle>
              <CardDescription>Sign in with your organisation account to access the portal.</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="button"
                className="w-full h-11 font-medium bg-acclaim-teal hover:bg-acclaim-teal/90"
                onClick={handleAzureLogin}
                data-testid="button-azure-login"
              >
                <KeyRound className="h-4 w-4" />
                <span className="ml-2">Sign in with SSO</span>
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-card px-2 text-muted-foreground">First time?</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 font-medium"
                onClick={handleAzureSignup}
                data-testid="button-azure-signup"
              >
                <KeyRound className="h-4 w-4" />
                <span className="ml-2">Register as a client</span>
              </Button>

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
      {/* Right side - Feature showcase */}
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