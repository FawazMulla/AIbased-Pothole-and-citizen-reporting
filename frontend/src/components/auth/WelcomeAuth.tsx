import React, { useState } from "react";
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
  ArrowRight,
  Phone,
  Mail,
  Zap,
  CheckCircle2,
  ChevronRight,
  Lock,
  FileText,
  MapPin,
} from "lucide-react";

interface WelcomeAuthProps {
  onCitizenSignIn: (user: CitizenUser) => void;
  onAuthoritySignIn: (user: AuthorityUser) => void;
  onGuestContinue: () => void;
  onTrackLookup?: (id?: string) => void;
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
  onTrackLookup,
}) => {
  const [activeTab, setActiveTab] = useState<"citizen" | "track" | "authority">("citizen");

  // Custom Citizen Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track Form State
  const [trackingId, setTrackingId] = useState("");

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
    }, 300);
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onTrackLookup) {
      onTrackLookup(trackingId.trim() || undefined);
    }
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-4 sm:p-8 antialiased selection:bg-indigo-500/20 selection:text-indigo-900 relative">
      {/* Top Header Branding */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-lg tracking-tight text-slate-900">
                CivicPothole
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-700 font-semibold">
                Public Works Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Municipal Road Grievance &amp; Verification System
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onGuestContinue}
          className="text-xs h-9 px-3.5 gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition-all"
        >
          <span>Report as Guest</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full my-auto py-8 sm:py-10 relative z-10">
        {/* Title Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-semibold shadow-xs">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Civic Access &amp; Tracking Center</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Sign In or Track Your Grievance
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Sign in as a resident, look up an existing complaint ID, or log into the municipal ward system.
          </p>
        </div>

        {/* Portal Switcher (3 Tabs) */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200 max-w-md w-full">
            <button
              type="button"
              onClick={() => setActiveTab("citizen")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "citizen"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Citizen Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("track")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "track"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Report</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("authority")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "authority"
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Authority CMS</span>
            </button>
          </div>
        </div>

        {/* Dynamic Card Container */}
        {activeTab === "citizen" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* 1-Click Quick Demo Profiles */}
            <div className="md:col-span-6 space-y-4">
              <div className="bg-white rounded-2xl p-5 space-y-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    ⚡ 1-Click Demo Profiles
                  </span>
                  <span className="text-[11px] text-slate-500">Instant Access</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Select a Sample Citizen</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sign in with pre-loaded complaint history to view your filed road reports.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {DEMO_CITIZENS.map((demo) => (
                    <button
                      key={demo.id}
                      type="button"
                      onClick={() => onCitizenSignIn(demo)}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/60 hover:border-indigo-300 transition-all text-left group shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors text-xs">
                          {demo.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                            {demo.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {demo.phone} &bull; {demo.reportedCount} reported defects
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onGuestContinue}
                      className="w-full text-xs gap-1.5 h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs"
                    >
                      <span>Continue without Sign-In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Citizen Sign-In Form */}
            <div className="md:col-span-6">
              <div className="bg-white rounded-2xl p-5 h-full flex flex-col justify-between space-y-4 border border-slate-200 shadow-sm">
                <div className="space-y-1">
                  <h3 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>Enter Your Details</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Receive SMS and status notifications when municipal authorities resolve your report.
                  </p>
                </div>

                <form onSubmit={handleCustomCitizenSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Full Name</span>
                    </label>
                    <Input
                      placeholder="e.g. Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-10 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Mobile Number</span>
                    </label>
                    <Input
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Email Address</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="e.g. priya.sharma@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !name.trim()}
                      className="w-full h-11 text-xs font-bold gap-2 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                    >
                      {isSubmitting ? (
                        <span>Signing In...</span>
                      ) : (
                        <>
                          <span>Continue to Report</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Track Grievance Directly */}
        {activeTab === "track" && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="bg-white rounded-2xl p-6 space-y-5 border border-slate-200 shadow-sm">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-slate-900">
                  Track Grievance Status
                </h3>
                <p className="text-xs text-slate-600">
                  Enter your ticket ID to check repair progress, assigned municipal ward, and inspection photo proof.
                </p>
              </div>

              <form onSubmit={handleTrackSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Complaint Ticket ID</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. CMP-2026-0101"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      className="h-11 text-xs font-mono bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl"
                    />
                    <Button
                      type="submit"
                      className="h-11 px-6 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shrink-0 shadow-sm"
                    >
                      <span>Track</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </form>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500">Quick Track Recent Tickets:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: "CMP-2026-0101", loc: "Bandra West", st: "IN PROGRESS" },
                    { id: "CMP-2026-0103", loc: "Dadar", st: "RESOLVED" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onTrackLookup && onTrackLookup(item.id)}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="font-mono text-xs font-bold text-slate-800">{item.id}</p>
                        <p className="text-[10px] text-slate-500">{item.loc}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        item.st === "RESOLVED" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {item.st}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => onTrackLookup && onTrackLookup(undefined)}
                className="w-full h-10 text-xs font-semibold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl"
              >
                Browse All Public Road Grievances
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Authority CMS Login */}
        {activeTab === "authority" && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="bg-white rounded-2xl p-6 space-y-5 border border-slate-200 shadow-sm">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-slate-900">
                  Municipal Ward Engineer Portal
                </h3>
                <p className="text-xs text-slate-600">
                  Access defect triage queue, contractor work orders, and resolution photo verification.
                </p>
              </div>

              {/* 1-Click Quick Admin Access */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-2.5">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-800">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Demo Engineer 1-Click Login</span>
                </div>
                <p className="text-[11px] text-amber-900/80">
                  Sign in immediately as <strong>{DEMO_OFFICER.name}</strong> ({DEMO_OFFICER.ward})
                </p>
                <Button
                  type="button"
                  onClick={() => onAuthoritySignIn(DEMO_OFFICER)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 text-xs gap-2 rounded-xl shadow-sm"
                >
                  <span>Log in as Ward Engineer</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full absolute" />
                <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-500 relative">
                  Or Officer Login
                </span>
              </div>

              <form onSubmit={handleCustomOfficerSubmit} className="space-y-3.5">
                {authError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                    {authError}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>Officer ID / Badge Number</span>
                  </label>
                  <Input
                    placeholder="e.g. OFF-BMC-8821"
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    className="h-10 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Security Password</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full h-10 text-xs font-bold border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-xl shadow-xs"
                >
                  Sign In to Ward CMS
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Feature Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-8">
          <div className="bg-white border border-slate-200 shadow-xs p-3.5 rounded-xl text-center space-y-1">
            <Camera className="w-5 h-5 text-indigo-600 mx-auto" />
            <p className="font-bold text-xs text-slate-900">Mobile Capture</p>
            <p className="text-[10px] text-slate-500">Camera &amp; GPS auto-tag</p>
          </div>
          <div className="bg-white border border-slate-200 shadow-xs p-3.5 rounded-xl text-center space-y-1">
            <Search className="w-5 h-5 text-emerald-600 mx-auto" />
            <p className="font-bold text-xs text-slate-900">Live Tracking</p>
            <p className="text-[10px] text-slate-500">Real-time repair milestones</p>
          </div>
          <div className="bg-white border border-slate-200 shadow-xs p-3.5 rounded-xl text-center space-y-1">
            <Building2 className="w-5 h-5 text-amber-600 mx-auto" />
            <p className="font-bold text-xs text-slate-900">Ward CMS</p>
            <p className="text-[10px] text-slate-500">Direct engineer dispatch</p>
          </div>
          <div className="bg-white border border-slate-200 shadow-xs p-3.5 rounded-xl text-center space-y-1">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mx-auto" />
            <p className="font-bold text-xs text-slate-900">Verified Proofs</p>
            <p className="text-[10px] text-slate-500">Mandatory photo audit</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center py-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200 pt-4 relative z-10">
        <span>CivicPothole &bull; Municipal Public Works Platform</span>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Municipal Standards</span>
        </div>
      </div>
    </div>
  );
};

