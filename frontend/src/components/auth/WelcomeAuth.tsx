import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { CitizenUser } from "../citizen/CitizenSignIn";
import { AuthorityUser } from "../cms/AuthorityLogin";
import {
  Layers,
  User,
  Building2,
  ShieldCheck,
  Camera,
  Search,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  Zap,
  CheckCircle2,
  ChevronRight,
  Lock,
} from "lucide-react";

interface WelcomeAuthProps {
  onCitizenSignIn: (user: CitizenUser) => void;
  onAuthoritySignIn: (user: AuthorityUser) => void;
  onGuestContinue: () => void;
}

const DEMO_CITIZENS: CitizenUser[] = [
  {
    id: "user_aarav_01",
    name: "Aarav Deshmukh",
    phone: "+91 98201 45890",
    email: "aarav.deshmukh@gmail.com",
    avatar: "AD",
    reportedCount: 3,
  },
  {
    id: "user_neha_02",
    name: "Neha Kulkarni",
    phone: "+91 98334 12789",
    email: "neha.kulkarni@yahoo.co.in",
    avatar: "NK",
    reportedCount: 1,
  },
  {
    id: "user_vikram_03",
    name: "Vikram Mehta",
    phone: "+91 97690 88214",
    email: "vikram.mehta@outlook.com",
    avatar: "VM",
    reportedCount: 2,
  },
];

const DEMO_OFFICER: AuthorityUser = {
  id: "OFF-BMC-8821",
  name: "R. Deshmukh",
  role: "Chief Ward Engineer",
  ward: "K-West (Andheri)",
  token: "mock-jwt-bmc-token-8821",
};

export const WelcomeAuth: React.FC<WelcomeAuthProps> = ({
  onCitizenSignIn,
  onAuthoritySignIn,
  onGuestContinue,
}) => {
  const [activeTab, setActiveTab] = useState<"citizen" | "authority">("citizen");

  // Custom Citizen Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Officer State
  const [officerId, setOfficerId] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const handleCustomCitizenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const newUser: CitizenUser = {
      id: `usr_${Date.now().toString(36)}`,
      name: name.trim(),
      phone: phone.trim() || "+91 98000 00000",
      email: email.trim() || "citizen@mumbai.gov.in",
      avatar: initials || "CT",
      reportedCount: 0,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onCitizenSignIn(newUser);
    }, 400);
  };

  const handleCustomOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerId.trim() || !password.trim()) {
      setAuthError("Please enter both Officer ID and Password.");
      return;
    }

    const officer: AuthorityUser = {
      id: officerId.toUpperCase(),
      name: `Officer ${officerId.toUpperCase()}`,
      role: "Municipal Ward Engineer",
      ward: "BMC Ward Office",
      token: `mock-jwt-${Date.now()}`,
    };
    onAuthoritySignIn(officer);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background flex flex-col justify-between p-3 sm:p-6 lg:p-10 antialiased selection:bg-primary/20">
      {/* Top Header Branding */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-foreground">
                CivicPothole AI
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 font-semibold">
                YOLOv8 Smart CMS
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Municipal Road Grievance &amp; AI Triage Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onGuestContinue}
            className="text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Skip &amp; Explore as Guest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full my-auto py-6 sm:py-10">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Civic Governance 2.0</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Sign in to Report, Track &amp; Resolve Road Defects
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Report road hazards with real-time YOLOv8 AI vision, track repair progress with municipal alerts, or manage ward field operations.
          </p>
        </div>

        {/* Portal Selection Switcher */}
        <div className="flex justify-center mb-6">
          <div className="bg-muted p-1 rounded-xl flex items-center gap-1 border shadow-xs max-w-sm w-full">
            <button
              type="button"
              onClick={() => setActiveTab("citizen")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "citizen"
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-4 h-4 text-primary" />
              <span>Citizen Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("authority")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "authority"
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>Authority CMS</span>
            </button>
          </div>
        </div>

        {/* Dynamic Card Container */}
        {activeTab === "citizen" ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* 1-Click Quick Demo Profiles */}
            <div className="md:col-span-6 space-y-4">
              <Card className="border-primary/20 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-600 text-white text-[10px]">
                      ⚡ Instant 1-Click Login
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">Test Profiles</span>
                  </div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 pt-1">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    <span>Select a Demo Citizen</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sign in with pre-loaded complaint history &amp; track your road reports immediately.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {DEMO_CITIZENS.map((demo) => (
                    <button
                      key={demo.id}
                      type="button"
                      onClick={() => onCitizenSignIn(demo)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group bg-card"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-xs">
                          {demo.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                            {demo.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {demo.phone} &bull; {demo.reportedCount} reported defects
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onGuestContinue}
                      className="w-full text-xs gap-1.5 h-9 text-muted-foreground hover:text-foreground"
                    >
                      <span>Continue without Sign In (Guest Mode)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Custom Citizen Sign-In Form */}
            <div className="md:col-span-6">
              <Card className="shadow-md h-full flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>Or Sign In with Your Details</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Receive SMS and WhatsApp alerts when your reported road defect is repaired by municipal authorities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCustomCitizenSubmit} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Full Name</span>
                      </label>
                      <Input
                        placeholder="e.g. Priya Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Mobile Number (WhatsApp)</span>
                      </label>
                      <Input
                        placeholder="e.g. +91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Email Address</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="e.g. priya.sharma@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !name.trim()}
                        className="w-full h-10 text-xs font-bold gap-2 shadow-xs"
                      >
                        {isSubmitting ? (
                          <span>Signing In...</span>
                        ) : (
                          <>
                            <span>Enter Citizen App</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Authority CMS Login Panel */
          <div className="max-w-xl mx-auto space-y-4">
            <Card className="border-amber-500/20 shadow-md">
              <CardHeader className="pb-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2">
                  <Building2 className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold">
                  Municipal Authority &amp; Ward Engineer Portal
                </CardTitle>
                <CardDescription className="text-xs">
                  Access live defect triage, automated severity metrics, SLA priority queues, and contractor repair workflows.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 1-Click Quick Admin Access */}
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <Zap className="w-4 h-4 text-amber-600 animate-bounce" />
                    <span>Quick 1-Click Municipal Access</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Sign in immediately as <strong>{DEMO_OFFICER.name}</strong> ({DEMO_OFFICER.ward})
                  </p>
                  <Button
                    type="button"
                    onClick={() => onAuthoritySignIn(DEMO_OFFICER)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 text-xs gap-2 shadow-xs"
                  >
                    <span>Quick Admin Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-border w-full absolute" />
                  <span className="bg-card px-3 text-[10px] uppercase font-bold text-muted-foreground relative">
                    Or Enter Municipal Credentials
                  </span>
                </div>

                <form onSubmit={handleCustomOfficerSubmit} className="space-y-3">
                  {authError && (
                    <div className="p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
                      {authError}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold flex items-center gap-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span>Officer ID / Badge Number</span>
                    </label>
                    <Input
                      placeholder="e.g. OFF-BMC-8821"
                      value={officerId}
                      onChange={(e) => setOfficerId(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                      <span>Security PIN / Password</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full h-9 text-xs font-semibold"
                  >
                    Sign In to Authority CMS
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feature Grid Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          <div className="p-3 rounded-xl bg-card border shadow-xs text-center space-y-1">
            <Camera className="w-5 h-5 text-primary mx-auto" />
            <p className="font-bold text-xs">AI Vision</p>
            <p className="text-[10px] text-muted-foreground">YOLOv8 defect detection</p>
          </div>
          <div className="p-3 rounded-xl bg-card border shadow-xs text-center space-y-1">
            <Search className="w-5 h-5 text-emerald-500 mx-auto" />
            <p className="font-bold text-xs">Live Tracking</p>
            <p className="text-[10px] text-muted-foreground">Real-time status updates</p>
          </div>
          <div className="p-3 rounded-xl bg-card border shadow-xs text-center space-y-1">
            <Building2 className="w-5 h-5 text-amber-500 mx-auto" />
            <p className="font-bold text-xs">Ward CMS</p>
            <p className="text-[10px] text-muted-foreground">Direct citizen dispatch</p>
          </div>
          <div className="p-3 rounded-xl bg-card border shadow-xs text-center space-y-1">
            <CheckCircle2 className="w-5 h-5 text-blue-500 mx-auto" />
            <p className="font-bold text-xs">X (@mybmc)</p>
            <p className="text-[10px] text-muted-foreground">Social proof of repairs</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center py-2 text-[11px] text-muted-foreground flex items-center justify-between border-t pt-4">
        <span>CivicPothole AI &bull; Smart Road Defect Management</span>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>PWA Enabled &bull; Civic Governance Standard</span>
        </div>
      </div>
    </div>
  );
};
