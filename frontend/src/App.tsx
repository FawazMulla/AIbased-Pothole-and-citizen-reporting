import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { CitizenReport } from "./components/citizen/CitizenReport";
import { CitizenTrack } from "./components/citizen/CitizenTrack";
import { CitizenSignIn, CitizenUser } from "./components/citizen/CitizenSignIn";
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
  Lock,
  UserCheck,
  User,
  LogOut,
} from "lucide-react";

export function App() {
  const [currentView, setCurrentView] = useState<"report" | "track" | "cms" | "profile">("report");
  const [trackTargetId, setTrackTargetId] = useState<string>("");
  const [authOfficer, setAuthOfficer] = useState<AuthorityUser | null>(null);
  const [citizenUser, setCitizenUser] = useState<CitizenUser | null>(null);
  const [hasEnteredApp, setHasEnteredApp] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Load saved officer session & citizen profile
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
    setHasEnteredApp(true);
    setCurrentView("report");
  };

  const handleWelcomeAuthoritySignIn = (user: AuthorityUser) => {
    setAuthOfficer(user);
    localStorage.setItem("civicpothole_auth_officer", JSON.stringify(user));
    setHasEnteredApp(true);
    setCurrentView("cms");
  };

  const handleGuestContinue = () => {
    setHasEnteredApp(true);
    setCurrentView("report");
  };

  const handleLoginSuccess = (user: AuthorityUser) => {
    setAuthOfficer(user);
    localStorage.setItem("civicpothole_auth_officer", JSON.stringify(user));
  };

  const handleLogout = () => {
    setAuthOfficer(null);
    localStorage.removeItem("civicpothole_auth_officer");
  };

  const handleCitizenSignIn = (user: CitizenUser) => {
    setCitizenUser(user);
    localStorage.setItem("civicpothole_citizen_profile", JSON.stringify(user));
    setCurrentView("track");
  };

  const handleCitizenSignOut = () => {
    setCitizenUser(null);
    localStorage.removeItem("civicpothole_citizen_profile");
  };

  const handleGlobalSignOut = () => {
    setCitizenUser(null);
    setAuthOfficer(null);
    localStorage.removeItem("civicpothole_citizen_profile");
    localStorage.removeItem("civicpothole_auth_officer");
    setHasEnteredApp(false);
  };

  const handleNavigateToTrack = (complaintId: string) => {
    setTrackTargetId(complaintId);
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

  // FIRST SCREEN: Show Welcome & Sign-In Screen before using the app
  if (!hasEnteredApp && !citizenUser && !authOfficer) {
    return (
      <WelcomeAuth
        onCitizenSignIn={handleWelcomeCitizenSignIn}
        onAuthoritySignIn={handleWelcomeAuthoritySignIn}
        onGuestContinue={handleGuestContinue}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20">
      {/* Top Civic Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-xs">
        <div className="container max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
          {/* Brand Logo & Civic Identification */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setCurrentView("report")}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-xs shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base tracking-tight text-foreground leading-none">
                  CivicPothole AI
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 font-medium">
                  YOLOv8
                </Badge>
              </div>
              <p className="hidden md:block text-[11px] text-muted-foreground mt-0.5">
                AI Defect Reporting & Municipal CMS
              </p>
            </div>
          </div>

          {/* Desktop Navigation Controls (sm: and up) */}
          <nav className="hidden sm:flex items-center gap-1.5">
            {!authOfficer && (
              /* Citizen Navigation Mode */
              <>
                <Button
                  variant={currentView === "report" ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5 text-xs h-9 px-3.5"
                  onClick={() => setCurrentView("report")}
                >
                  <Camera className="w-4 h-4" />
                  <span>Report Defect</span>
                </Button>

                <Button
                  variant={currentView === "track" ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5 text-xs h-9 px-3.5"
                  onClick={() => setCurrentView("track")}
                >
                  <Search className="w-4 h-4" />
                  <span>Track Status</span>
                </Button>
              </>
            )}

            {/* Global Sign Out Button */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9 px-3 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5"
              onClick={handleGlobalSignOut}
              title="Sign Out / Switch Portal"
            >
              <LogOut className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive" />
              <span>Sign Out</span>
            </Button>

            {/* PWA Install Button (When Available) */}
            {deferredPrompt && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs h-9 px-3 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50"
                onClick={handleInstallPWA}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </Button>
            )}
          </nav>

          {/* Mobile Status & Sign Out in header */}
          <div className="sm:hidden flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGlobalSignOut}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Viewport with responsive padding */}
      <main className="flex-1 container max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8">
        {authOfficer ? (
          <AuthorityCMS
            currentUser={authOfficer}
            onLogout={handleGlobalSignOut}
            onNavigateToCitizen={() => handleGlobalSignOut()}
          />
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

      {/* MOBILE BOTTOM NAVIGATION BAR (Visible on < sm screens) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t shadow-lg px-3 py-1.5 flex items-center justify-around">
        {authOfficer ? (
          <div className="flex items-center justify-between w-full px-2">
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              <span>Authority CMS Active</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGlobalSignOut}
              className="text-xs h-8 gap-1 text-destructive border-destructive/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setCurrentView("report")}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-lg text-[10px] font-medium transition-colors ${
                currentView === "report"
                  ? "text-primary font-bold bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Camera className="w-4 h-4 mb-0.5" />
              <span>Report Defect</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView("track")}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-lg text-[10px] font-medium transition-colors ${
                currentView === "track"
                  ? "text-primary font-bold bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="w-4 h-4 mb-0.5" />
              <span>Track Status</span>
            </button>

            <button
              type="button"
              onClick={handleGlobalSignOut}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4 mb-0.5" />
              <span>Sign Out</span>
            </button>
          </>
        )}
      </div>

      {/* Desktop Footer */}
      <footer className="hidden sm:block border-t bg-muted/20 py-4 mt-auto">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2 text-center sm:text-left">
          <p>
            CivicPothole AI &bull; Smart Municipal Road Defect & Complaint Platform
          </p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>PWA Enabled &bull; Civic Governance Standard</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
