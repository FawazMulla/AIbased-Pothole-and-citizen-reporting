import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import {
  ShieldCheck,
  Lock,
  Building2,
  KeyRound,
  AlertCircle,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface AuthorityUser {
  name: string;
  email: string;
  role: string;
  department: string;
  badgeId: string;
}

interface AuthorityLoginProps {
  onLoginSuccess: (user: AuthorityUser) => void;
  onCancel: () => void;
}

export const AuthorityLogin: React.FC<AuthorityLoginProps> = ({
  onLoginSuccess,
  onCancel,
}) => {
  const [email, setEmail] = useState("admin@pwd.bmc.gov.in");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // Single Quick Admin Account
  const ADMIN_USER: AuthorityUser = {
    name: "Eng. Rajesh Varma",
    email: "admin@pwd.bmc.gov.in",
    role: "Chief Municipal Road Engineer",
    department: "BMC Public Works Department",
    badgeId: "BMC-PWD-ADMIN-01",
  };

  const handleQuickAdminLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(ADMIN_USER);
    }, 150);
  };

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      if (
        email.trim().toLowerCase().includes("pwd") ||
        email.trim().toLowerCase().includes("bmc") ||
        email.trim().toLowerCase().includes("gov") ||
        email.trim().toLowerCase().includes("admin") ||
        password.length >= 4
      ) {
        const user: AuthorityUser = {
          name: email.split("@")[0].replace(".", " ").toUpperCase(),
          email: email.trim(),
          role: "Municipal Admin Officer",
          department: "BMC Public Works Department",
          badgeId: `BMC-${Math.floor(1000 + Math.random() * 9000)}`,
        };
        setIsLoading(false);
        onLoginSuccess(user);
      } else {
        setIsLoading(false);
        setError("Invalid credentials. Please click '1-Click Quick Admin Login' above.");
      }
    }, 200);
  };

  return (
    <div className="max-w-md w-full mx-auto py-4 sm:py-8 px-3 sm:px-4 animate-in fade-in duration-300">
      <Card className="shadow-lg border-primary/20 overflow-hidden">
        <CardHeader className="text-center pb-3 sm:pb-4 bg-muted/20 border-b">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <Badge variant="outline" className="text-[11px] font-semibold">
              Municipal Portal Access
            </Badge>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
            Authority CMS Login
          </CardTitle>
          <CardDescription className="text-xs max-w-xs mx-auto">
            Access the Municipal Road Defect Triage, Engineering Assignment, and Resolution Management System.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle className="text-xs">Authentication Notice</AlertTitle>
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {/* SINGLE QUICK ADMIN LOGIN BUTTON */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/30 text-center space-y-3 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
                <Zap className="w-4 h-4 fill-primary text-primary" />
                Instant Access
              </div>
              <h3 className="font-bold text-foreground text-sm sm:text-base">
                1-Click Quick Admin Login
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Sign in instantly as <strong className="text-foreground">Chief Municipal Road Engineer</strong> ({ADMIN_USER.name})
              </p>
            </div>

            <Button
              type="button"
              onClick={handleQuickAdminLogin}
              disabled={isLoading}
              className="w-full gap-2 h-11 text-sm font-semibold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              {isLoading ? (
                "Signing In..."
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Enter CMS as Admin
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </Button>
          </div>

          {/* Accordion for Manual Login Option */}
          <div className="border-t pt-3">
            <button
              type="button"
              onClick={() => setShowManualForm(!showManualForm)}
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground font-medium py-1"
            >
              <span>Or sign in with custom credentials</span>
              {showManualForm ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showManualForm && (
              <form onSubmit={handleStandardLogin} className="space-y-3 pt-3 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <Label htmlFor="auth-email" className="text-xs font-medium">
                    Official Email ID
                  </Label>
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="officer@pwd.bmc.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="auth-pass" className="text-xs font-medium">
                    Password
                  </Label>
                  <Input
                    id="auth-pass"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <Button type="submit" disabled={isLoading} variant="outline" className="w-full gap-2 h-9 text-xs">
                  <KeyRound className="w-3.5 h-3.5" />
                  {isLoading ? "Authenticating..." : "Sign In with Credentials"}
                </Button>
              </form>
            )}
          </div>
        </CardContent>

        <CardFooter className="border-t bg-muted/20 py-3 px-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            TLS 256-bit Encrypted
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="hover:text-foreground underline"
          >
            Back to Citizen View
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};
