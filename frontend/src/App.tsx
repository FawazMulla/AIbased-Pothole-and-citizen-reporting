import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { LandingPage } from "./components/landing/LandingPage";
import { CitizenReport } from "./components/citizen/CitizenReport";
import { CitizenTrack } from "./components/citizen/CitizenTrack";
import { CitizenUser } from "./components/citizen/CitizenSignIn";
import { WelcomeAuth } from "./components/auth/WelcomeAuth";
import { AuthorityCMS } from "./components/cms/AuthorityCMS";
import { AuthorityLogin, AuthorityUser } from "./components/cms/AuthorityLogin";
import {
  Camera,
  Search,
  Building2,
  ShieldCheck,
  Layers,
  Download,
  Home,
  User,
  LogOut,
  Sparkles,
  ArrowRight,
  LogIn,
} from "lucide-react";

export function App() {
  const [currentView, setCurrentView] = useState<"landing" | "report" | "track" | "cms" | "auth">("landing");
  const [trackTargetId, setTrackTargetId] = useState<string>("");
  const [authOfficer, setAuthOfficer] = useState<AuthorityUser | null>(null);
  const [citizenUser, setCitizenUser] = useState<CitizenUser | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Load saved session
  useEffect(() => {
    const savedOfficer = localStorage.getItem("civicpothole_auth_officer");
    if (savedOfficer) {
      try {
        setAuthOfficer(JSON.parse(savedOfficer));
      } catch (e) {
        localStorage.removeItem("civicpothole_auth_officer");
      }
    }

    const savedCitizen = localStorage.getItem("civicpothole_citizen_profile");
    if (savedCitizen) {
      try {
        setCitizenUser(JSON.parse(savedCitizen));
      } catch (e) {
        // ignore
      }
    }

    // PWA Install Prompt Listener
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleWelcomeCitizenSignIn = (user: CitizenUser) => {
    setCitizenUser(user);
    localStorage.setItem("civicpothole_citizen_profile", JSON.stringify(user));
    setCurrentView("report");
  };

  const handleWelcomeAuthoritySignIn = (user: AuthorityUser) => {
    setAuthOfficer(user);
    localStorage.setItem("civicpothole_auth_officer", JSON.stringify(user));
    setCurrentView("cms");
  };

  const handleGuestContinue = () => {
    setCurrentView("report");
  };

  const handleLoginSuccess = (user: AuthorityUser) => {
    setAuthOfficer(user);
    localStorage.setItem("civicpothole_auth_officer", JSON.stringify(user));
    setCurrentView("cms");
  };

  const handleGlobalSignOut = () => {
    setCitizenUser(null);
    setAuthOfficer(null);
    localStorage.removeItem("civicpothole_citizen_profile");
    localStorage.removeItem("civicpothole_auth_officer");
    setCurrentView("landing");
  };

  const handleNavigateToTrack = (complaintId?: string) => {
    if (complaintId) {
      setTrackTargetId(complaintId);
    }
    setCurrentView("track");
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // 1. Landing Page (Default Route)
  if (currentView === "landing") {
    return (
      <LandingPage
        onStartReport={() => setCurrentView("report")}
        onStartTrack={(id) => handleNavigateToTrack(id)}
        onStartCMS={() => setCurrentView("cms")}
        onOpenAuth={() => setCurrentView("auth")}
      />
    );
  }

  // 2. Auth / Sign In View
  if (currentView === "auth") {
    return (
      <div className="relative min-h-screen bg-slate-50">
        <div className="fixed top-4 left-4 z-50">
          <button
            type="button"
            onClick={() => setCurrentView("landing")}
            className="text-xs h-9 px-3.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>
        <WelcomeAuth
          onCitizenSignIn={handleWelcomeCitizenSignIn}
          onAuthoritySignIn={handleWelcomeAuthoritySignIn}
          onGuestContinue={handleGuestContinue}
          onTrackLookup={(id) => handleNavigateToTrack(id)}
        />
      </div>
    );
  }

  // 3. Application Interior (Report / Track / CMS)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Top Civic Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setCurrentView("landing")}
            title="Return to Home"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center text-white font-bold shadow-sm border border-slate-800">
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-base sm:text-lg tracking-tight text-slate-950 leading-none">
                  CivicPothole
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-50 text-emerald-700 font-mono font-semibold">
                  YOLOv8
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-500 mt-0.5">
                AI Defect Reporting &amp; Municipal CMS
              </p>
            </div>
          </div>

          {/* Desktop Navigation Controls */}
          <nav className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              className={`gap-1.5 text-xs h-9 px-3.5 rounded-lg font-semibold transition-all flex items-center ${
                currentView === "landing"
                  ? "bg-slate-950 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
              }`}
              onClick={() => setCurrentView("landing")}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              type="button"
              className={`gap-1.5 text-xs h-9 px-3.5 rounded-lg font-semibold transition-all flex items-center ${
                currentView === "report"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
              }`}
              onClick={() => setCurrentView("report")}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Report Defect</span>
            </button>

            <button
              type="button"
              className={`gap-1.5 text-xs h-9 px-3.5 rounded-lg font-semibold transition-all flex items-center ${
                currentView === "track"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
              }`}
              onClick={() => setCurrentView("track")}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Status</span>
            </button>

            {/* Authority CMS - ONLY visible to logged-in Municipal Officers */}
            {authOfficer && (
              <button
                type="button"
                className={`gap-1.5 text-xs h-9 px-3.5 rounded-lg font-semibold transition-all flex items-center ${
                  currentView === "cms"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200"
                }`}
                onClick={() => setCurrentView("cms")}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Authority CMS</span>
              </button>
            )}

            {/* Profile / Sign In / Sign Out */}
            {citizenUser || authOfficer ? (
              <div className="flex items-center gap-2">
                {citizenUser && (
                  <span className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{citizenUser.name.split(" ")[0]}</span>
                  </span>
                )}
                {authOfficer && (
                  <span className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Officer {authOfficer.name.split(" ")[0]}</span>
                  </span>
                )}
                <button
                  type="button"
                  className="gap-1.5 text-xs h-9 px-3 border border-slate-200 bg-white text-slate-700 hover:text-red-600 hover:border-red-300 rounded-lg shadow-xs transition-all flex items-center"
                  onClick={handleGlobalSignOut}
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="gap-1.5 text-xs h-9 px-3 border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg shadow-xs transition-all flex items-center"
                onClick={() => setCurrentView("auth")}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* PWA Install Button */}
            {deferredPrompt && (
              <button
                type="button"
                className="gap-1 text-xs h-9 px-3 text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-lg flex items-center shadow-xs"
                onClick={handleInstallPWA}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            )}
          </nav>

          {/* Mobile Home Button */}
          <div className="sm:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentView("landing")}
              className="h-8 px-2.5 text-xs text-slate-700 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 container max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8">
        {currentView === "cms" ? (
          authOfficer ? (
            <AuthorityCMS
              currentUser={authOfficer}
              onLogout={handleGlobalSignOut}
              onNavigateToCitizen={() => setCurrentView("report")}
            />
          ) : (
            <AuthorityLogin
              onLoginSuccess={handleLoginSuccess}
              onBackToCitizen={() => setCurrentView("report")}
            />
          )
        ) : (
          <>
            {currentView === "report" && (
              <CitizenReport
                onNavigateToTrack={handleNavigateToTrack}
                onNavigateToCMS={() => setCurrentView("cms")}
              />
            )}

            {currentView === "track" && (
              <CitizenTrack
                initialComplaintId={trackTargetId}
                onBackToReport={() => setCurrentView("report")}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => setCurrentView("landing")}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            currentView === "landing" ? "text-blue-600 font-bold bg-blue-50" : "text-slate-500"
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView("report")}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            currentView === "report" ? "text-blue-600 font-bold bg-blue-50" : "text-slate-500"
          }`}
        >
          <Camera className="w-4 h-4 mb-0.5" />
          <span>Report</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView("track")}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            currentView === "track" ? "text-blue-600 font-bold bg-blue-50" : "text-slate-500"
          }`}
        >
          <Search className="w-4 h-4 mb-0.5" />
          <span>Track</span>
        </button>

        {authOfficer && (
          <button
            type="button"
            onClick={() => setCurrentView("cms")}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
              currentView === "cms" ? "text-amber-600 font-bold bg-amber-50" : "text-slate-500"
            }`}
          >
            <Building2 className="w-4 h-4 mb-0.5" />
            <span>CMS</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
