import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { CitizenReport } from "./components/citizen/CitizenReport";
import { CitizenTrack } from "./components/citizen/CitizenTrack";
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
} from "lucide-react";

export function App() {
  const [currentView, setCurrentView] = useState<"report" | "track" | "cms">("report");
  const [trackTargetId, setTrackTargetId] = useState<string>("");
  const [authOfficer, setAuthOfficer] = useState<AuthorityUser | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Load saved officer session if exists
  useEffect(() => {
    const saved = localStorage.getItem("civicpothole_auth_officer");
    if (saved) {
      try {
        setAuthOfficer(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("civicpothole_auth_officer");
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

  const handleLoginSuccess = (user: AuthorityUser) => {
    setAuthOfficer(user);
    localStorage.setItem("civicpothole_auth_officer", JSON.stringify(user));
  };

  const handleLogout = () => {
    setAuthOfficer(null);
    localStorage.removeItem("civicpothole_auth_officer");
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top Civic Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xs">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-3 sm:px-6">
          {/* Brand Logo & Civic Identification */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none"
            onClick={() => setCurrentView("report")}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-foreground leading-none">
                  CivicPothole AI
                </span>
                <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 font-medium">
                  YOLOv8
                </Badge>
              </div>
              <p className="hidden xs:block text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                AI Defect Reporting & Municipal CMS
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button
              variant={currentView === "report" ? "default" : "ghost"}
              size="sm"
              className="gap-1 sm:gap-1.5 text-xs h-8 sm:h-9 px-2.5 sm:px-3.5"
              onClick={() => setCurrentView("report")}
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Report Defect</span>
              <span className="md:hidden">Report</span>
            </Button>

            <Button
              variant={currentView === "track" ? "default" : "ghost"}
              size="sm"
              className="gap-1 sm:gap-1.5 text-xs h-8 sm:h-9 px-2.5 sm:px-3.5"
              onClick={() => setCurrentView("track")}
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Track Status</span>
              <span className="md:hidden">Track</span>
            </Button>

            <Button
              variant={currentView === "cms" ? "default" : "ghost"}
              size="sm"
              className="gap-1 sm:gap-1.5 text-xs h-8 sm:h-9 px-2.5 sm:px-3.5 relative"
              onClick={() => setCurrentView("cms")}
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Authority CMS</span>
              <span className="md:hidden">CMS</span>
              {!authOfficer && (
                <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 ml-0.5" />
              )}
            </Button>

            {/* PWA Install Button (When Available) */}
            {deferredPrompt && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs h-8 sm:h-9 px-2 sm:px-3 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50"
                onClick={handleInstallPWA}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Install</span>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Viewport with responsive padding */}
      <main className="flex-1 container max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
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

        {currentView === "cms" && (
          authOfficer ? (
            <AuthorityCMS
              currentUser={authOfficer}
              onLogout={handleLogout}
              onNavigateToCitizen={() => setCurrentView("report")}
            />
          ) : (
            <AuthorityLogin
              onLoginSuccess={handleLoginSuccess}
              onCancel={() => setCurrentView("report")}
            />
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-4 mt-auto">
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
