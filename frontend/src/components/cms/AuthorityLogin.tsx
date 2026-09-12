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
  UserCheck,
  Sparkles,
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts: AuthorityUser[] = [
    {
      name: "Eng. Rajiv Menon",
      email: "r.menon@pwd.municipal.gov",
      role: "Lead Road Engineer",
      department: "Public Works Dept (Div 1)",
      badgeId: "PWD-OFFICER-4882",
    },
    {
      name: "Insp. Priya Sharma",
      email: "p.sharma@traffic.municipal.gov",
      role: "Field Safety Inspector",
      department: "Traffic & Road Infrastructure",
      badgeId: "TRAFFIC-INSP-2109",
    },
  ];

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      if (email.trim().toLowerCase().includes("pwd") || email.trim().toLowerCase().includes("gov") || password.length >= 4) {
        const user: AuthorityUser = {
          name: email.split("@")[0].replace(".", " ").toUpperCase(),
          email: email.trim(),
          role: "Municipal Officer",
          department: "Public Works Department",
          badgeId: `OFFICER-${Math.floor(1000 + Math.random() * 9000)}`,
        };
        setIsLoading(false);
        onLoginSuccess(user);
      } else {
        setIsLoading(false);
        setError("Invalid municipal credentials. Please enter a valid authority email or use 1-click Quick Login.");
      }
    }, 400);
  };

  const handleQuickLogin = (demoUser: AuthorityUser) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(demoUser);
    }, 200);
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 animate-in fade-in duration-300">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Lock className="w-4 h-4 text-amber-500" />
            <Badge variant="outline" className="text-xs font-semibold">
              Restricted Authority Access
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Municipal CMS Login
          </CardTitle>
          <CardDescription className="text-xs">
            Sign in with authorized municipal department credentials to review, assign, and verify road complaints.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle className="text-xs">Authentication Failed</AlertTitle>
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleStandardLogin} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="auth-email" className="text-xs font-medium">
                Official Email ID
              </Label>
              <Input
                id="auth-email"
                type="email"
                placeholder="officer@pwd.municipal.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="auth-pass" className="text-xs font-medium">
                  Password
                </Label>
              </div>
              <Input
                id="auth-pass"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full gap-2 mt-2">
              <KeyRound className="w-4 h-4" />
              {isLoading ? "Authenticating..." : "Sign In to CMS"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-medium text-[11px]">
                Quick Demo Evaluation Login
              </span>
            </div>
          </div>

          {/* Quick Demo Login Cards */}
          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => handleQuickLogin(account)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/80 hover:border-primary/40 transition-all text-left text-xs group"
              >
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                    {account.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {account.role} &bull; {account.department}
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  1-Click Login
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>

        <CardFooter className="border-t bg-muted/20 py-3 flex justify-between text-xs text-muted-foreground">
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
