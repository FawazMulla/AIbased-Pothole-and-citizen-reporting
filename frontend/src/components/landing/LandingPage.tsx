import React, { useState, useEffect } from "react";
import {
  Camera,
  Search,
  Building2,
  ShieldCheck,
  Layers,
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Smartphone,
  BarChart3,
  Cpu,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  Activity,
  Award,
  Users,
  Radio,
  FileCheck2,
  LogIn,
  Sliders,
  Share2,
  Navigation,
  Check,
  Flame,
  ArrowUpRight,
  Shield,
  Clock3,
  Crosshair,
  Gauge,
  Compass,
} from "lucide-react";
import { Complaint } from "../../services/api";

interface LandingPageProps {
  onStartReport: () => void;
  onStartTrack: (complaintId?: string) => void;
  onStartCMS: () => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartReport,
  onStartTrack,
  onStartCMS,
  onOpenAuth,
}) => {
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedDemo, setSelectedDemo] = useState<number>(0);
  const [quickTrackInput, setQuickTrackInput] = useState<string>("");
  const [activeLayer, setActiveLayer] = useState<"bbox" | "heatmap" | "audit">("bbox");

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch("/api/complaints");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setRecentComplaints(data.slice(0, 4));
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    };
    fetchRecent();
  }, []);

  const demoDefects = [
    {
      id: "CMP-2026-0842",
      title: "Severe Road Cavity",
      location: "Linking Road, Bandra West",
      ward: "Ward H-West (Bandra)",
      confidence: "96.8% Confidence",
      severity: "CRITICAL HAZARD",
      severityColor: "text-rose-700 bg-rose-50 border-rose-200",
      sla: "24 Hours Target",
      status: "In Progress",
      statusColor: "text-amber-700 bg-amber-50 border-amber-200",
      desc: "Deep broken asphalt cavity with exposed aggregate causing severe two-wheeler hazards.",
      coords: "19.0596° N, 72.8295° E",
      image: "/images/demo_pothole_1.jpg",
      dimensions: "78cm × 54cm",
      depth: "8.5 cm",
      inference: "38ms",
      engineer: "Er. S. Patil (Asst. Engineer)",
      box: { top: "36%", left: "20%", width: "46%", height: "44%" },
    },
    {
      id: "CMP-2026-0843",
      title: "Longitudinal Trench Defect",
      location: "Andheri-Kurla Road, Chakala",
      ward: "Ward K-East (Andheri)",
      confidence: "91.4% Confidence",
      severity: "MODERATE HAZARD",
      severityColor: "text-amber-700 bg-amber-50 border-amber-200",
      sla: "48 Hours Target",
      status: "Assigned",
      statusColor: "text-blue-700 bg-blue-50 border-blue-200",
      desc: "Continuous lane trenching causing vehicular instability along commercial transit corridor.",
      coords: "19.1136° N, 72.8697° E",
      image: "/images/demo_pothole_2.jpg",
      dimensions: "140cm × 35cm",
      depth: "4.2 cm",
      inference: "41ms",
      engineer: "Er. M. Kulkarni (Sub Engineer)",
      box: { top: "32%", left: "34%", width: "40%", height: "52%" },
    },
    {
      id: "CMP-2026-0844",
      title: "Mastic Asphalt Leveling",
      location: "Senapati Bapat Marg, Dadar",
      ward: "Ward G-North (Dadar)",
      confidence: "99.2% Verified Proof",
      severity: "AUDITED & CLOSED",
      severityColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
      sla: "Completed in 18h",
      status: "Resolved",
      statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
      desc: "Hot mastic asphalt patch rolled and sealed flush with road surface. Compaction audit passed.",
      coords: "19.0178° N, 72.8478° E",
      image: "/images/demo_pothole_3.jpg",
      dimensions: "110cm × 95cm",
      depth: "0.0 cm (Level)",
      inference: "34ms",
      engineer: "Er. V. Deshmukh (Ward Inspector)",
      box: { top: "40%", left: "22%", width: "50%", height: "42%" },
    },
  ];

  const faqs = [
    {
      q: "How does the AI model measure and classify road defects?",
      a: "The system runs a YOLOv8 deep learning vision model trained specifically on municipal asphalt defects. When a photo is taken, the model runs bounding box localization, calculates surface area ratios against reference coordinates, and assigns severity ratings in under 45ms directly in the browser or on the edge server.",
    },
    {
      q: "Do citizens need to download an application from the Play Store or App Store?",
      a: "No installation is required. CivicPothole functions as an instant Progressive Web App (PWA). You can open it directly in Safari or Chrome, or tap 'Add to Home Screen' for one-tap camera access and offline capture.",
    },
    {
      q: "How is the complaint routed to the correct municipal authority?",
      a: "The platform captures high-precision GPS telemetry at the exact instant the photo is snapped. The coordinates are reverse-geocoded to the exact municipal ward boundary (e.g. Ward H-West, Ward K-East) and immediately dispatched into the Ward Engineer's triage portal.",
    },
    {
      q: "How are repairs verified to eliminate false status updates?",
      a: "Tickets cannot be closed with a single text note. Field maintenance crews are required to upload a geotagged 'After Repair' photo proof showing the restored, compacted asphalt surface. This proof is stamped directly into the citizen's public tracking timeline.",
    },
  ];

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackInput.trim()) {
      onStartTrack(quickTrackInput.trim());
    } else {
      onStartTrack();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          {/* Brand Identity */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center text-white font-bold shadow-sm border border-slate-800">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-lg text-slate-950 tracking-tight">
                  CivicPothole
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-700 font-mono font-medium">
                  Public Works
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-500 font-normal">
                Municipal Road Defect &amp; Citizen Infrastructure Network
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#triage" className="hover:text-slate-950 transition-colors">Triage Scanner</a>
            <a href="#pipeline" className="hover:text-slate-950 transition-colors">Resolution Pipeline</a>
            <a href="#live-feed" className="hover:text-slate-950 transition-colors">Public Audit Log</a>
            <a href="#faq" className="hover:text-slate-950 transition-colors">Documentation</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenAuth}
              className="text-xs font-semibold px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-600" />
              <span>Sign In / Track</span>
            </button>

            <button
              type="button"
              onClick={onStartReport}
              className="text-xs font-bold px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-lg shadow-sm border border-slate-800 transition-all flex items-center gap-1.5 hover:shadow-md"
            >
              <Camera className="w-4 h-4 text-blue-400" />
              <span>Report Defect</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. BESPOKE COMMAND-CENTER HERO SECTION */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-slate-200/80 bg-white civic-grid overflow-hidden">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-blue-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="container max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Hero Column: Clear, Authoritative Civic Proposition */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Telemetry Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-700 text-xs font-mono shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>MUNICIPAL INFRASTRUCTURE &bull; WARD DISPATCH SYSTEM</span>
              </div>

              {/* High-Impact Bespoke Headline */}
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
                Fixing City Roads with Precision AI &amp; Verified Municipal Action.
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Citizens capture road defects in seconds. Computer vision quantifies dimensions and exact GPS telemetry. Ward engineers are automatically dispatched with mandatory before/after photo audits.
              </p>

              {/* Interactive Report & Inline Track Bar */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <button
                    type="button"
                    onClick={onStartReport}
                    className="h-12 px-7 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2.5 hover:scale-[1.01]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Report a Road Defect</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <form onSubmit={handleQuickTrackSubmit} className="flex-1 flex items-center relative">
                    <input
                      type="text"
                      value={quickTrackInput}
                      onChange={(e) => setQuickTrackInput(e.target.value)}
                      placeholder="Lookup Ticket (e.g. CMP-2026-0842)"
                      className="w-full h-12 pl-10 pr-24 rounded-xl border border-slate-300 bg-white text-xs font-mono placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 shadow-xs"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <button
                      type="submit"
                      className="absolute right-1.5 h-9 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                    >
                      Track
                    </button>
                  </form>
                </div>
              </div>

              {/* Trust & Performance Metrics Bar */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/90 text-left">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-950 font-heading font-extrabold text-xl sm:text-2xl">
                    <span>24-48h</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Target Ward SLA</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-600 font-heading font-extrabold text-xl sm:text-2xl">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    <span>100%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Photo-Verified Proofs</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-blue-600 font-heading font-extrabold text-xl sm:text-2xl">
                    <span>&lt;45ms</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Edge AI Inference</p>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Live Telemetry & Road Scanner Workbench */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                {/* Scanner Header Bar */}
                <div className="bg-slate-950 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-xs font-semibold tracking-wide text-slate-200">
                      LIVE TRIAGE HUD &bull; {demoDefects[selectedDemo].id}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {demoDefects[selectedDemo].inference} Inference
                  </span>
                </div>

                {/* Defect Switcher Tabs */}
                <div className="grid grid-cols-3 bg-slate-100/80 p-1 gap-1 border-b border-slate-200">
                  {demoDefects.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDemo(idx)}
                      className={`text-[11px] py-1.5 px-2 rounded-md font-medium transition-all text-center truncate ${
                        selectedDemo === idx
                          ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80"
                          : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>

                {/* Main Viewport Screen */}
                <div className="p-4 space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-200 shadow-inner group">
                    <img
                      src={demoDefects[selectedDemo].image}
                      alt={demoDefects[selectedDemo].title}
                      className="w-full h-full object-cover select-none"
                    />

                    {/* Animated Scan Line */}
                    <div className="absolute inset-x-0 h-0.5 bg-blue-400/80 shadow-[0_0_10px_#60a5fa] animate-scanline pointer-events-none" />

                    {/* Overlaid Defect Bounding Box */}
                    {activeLayer === "bbox" && (
                      <div
                        className="absolute border-2 border-amber-400 bg-amber-500/15 rounded flex flex-col justify-between p-2 pointer-events-none transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        style={{
                          top: demoDefects[selectedDemo].box.top,
                          left: demoDefects[selectedDemo].box.left,
                          width: demoDefects[selectedDemo].box.width,
                          height: demoDefects[selectedDemo].box.height,
                        }}
                      >
                        <div className="flex items-center gap-1 self-start">
                          <span className="bg-slate-950 text-amber-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-amber-400/40">
                            {demoDefects[selectedDemo].severity.split(" ")[0]} &bull; {demoDefects[selectedDemo].dimensions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between w-full self-end gap-1">
                          <span className="bg-slate-950/90 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                            Depth: {demoDefects[selectedDemo].depth}
                          </span>
                          <span className="bg-slate-950/90 text-slate-300 text-[9px] font-mono px-1.5 py-0.5 rounded">
                            {demoDefects[selectedDemo].coords.split(",")[0]}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Telemetry Corner Stamp */}
                    <div className="absolute top-2.5 left-3 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-slate-200 font-mono pointer-events-none border border-white/10">
                      <Crosshair className="w-3 h-3 text-blue-400" />
                      <span>{demoDefects[selectedDemo].coords}</span>
                    </div>

                    <div className="absolute bottom-2.5 right-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-emerald-400 font-mono pointer-events-none border border-white/10">
                      {demoDefects[selectedDemo].confidence}
                    </div>
                  </div>

                  {/* Telemetry Data Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-mono block">WARD ROUTE</span>
                      <p className="font-bold text-slate-900 truncate mt-0.5">{demoDefects[selectedDemo].ward.split(" ")[0]}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-mono block">SEVERITY</span>
                      <p className="font-bold text-slate-900 truncate mt-0.5">{demoDefects[selectedDemo].severity.split(" ")[0]}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-mono block">EST. DEPTH</span>
                      <p className="font-bold text-slate-900 truncate mt-0.5">{demoDefects[selectedDemo].depth}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-mono block">STATUS</span>
                      <p className="font-bold text-blue-600 truncate mt-0.5">{demoDefects[selectedDemo].status}</p>
                    </div>
                  </div>

                  {/* Bottom Action inside preview */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      Assigned to: <strong className="text-slate-800">{demoDefects[selectedDemo].engineer}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => onStartTrack(demoDefects[selectedDemo].id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>Inspect Ticket</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. THE 3-STEP CLOSED-LOOP RESOLUTION PIPELINE */}
      <section id="pipeline" className="py-20 sm:py-24 border-b border-slate-200/80 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
              CLOSED-LOOP INFRASTRUCTURE PIPELINE
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              From Citizen Photo to Verified Asphalt Seal
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              A transparent, auditable municipal engineering workflow that leaves no room for lost complaints or phantom repairs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm">
                  01
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  ZERO FORMS
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading text-base font-bold text-slate-950">
                  Citizen Snap &amp; GPS Lock
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Open the browser camera, snap the hazard. High-precision GPS coordinates, timestamp, and device telemetry are captured instantaneously without filling out lengthy manual forms.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                &bull; Instant Geolocation Lock
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-slate-950 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm">
                  02
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  YOLOv8 EDGE
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading text-base font-bold text-slate-950">
                  Defect Triage &amp; Ward Dispatch
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Our computer vision model detects boundary dimensions, estimates cavity depth, tags severity, and routes the ticket directly to the designated Ward Maintenance Engineer.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                &bull; Auto Ward Geo-fencing &amp; SLA
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm">
                  03
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  PHOTO PROOF
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading text-base font-bold text-slate-950">
                  Crew Repair &amp; Mandatory Audit
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Field crews fill and roll mastic asphalt. To resolve the complaint, they must upload an inspection photo proof, which is published immediately to the citizen's tracking page.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                &bull; 100% Verified Closure Proof
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE TRIAGE WORKBENCH / DEFECT EXPLORER */}
      <section id="triage" className="py-20 sm:py-24 border-b border-slate-200/80 bg-slate-50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
                COMPUTER VISION BENCHMARK
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-950">
                Municipal Road Inspection Standards
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onStartReport}
                className="text-xs font-bold px-4 py-2 bg-slate-950 text-white hover:bg-slate-900 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>Test With Your Camera</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="font-heading text-sm font-bold text-slate-950">Sub-45ms Edge Inference</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Optimized YOLOv8 architecture processes road asphalt captures in fractions of a second, with automatic confidence scoring and defect boundary box generation.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <h4 className="font-heading text-sm font-bold text-slate-950">Precision Geo-Boundary Routing</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reverse-geocodes street locations to official municipal boundary shapes to prevent inter-ward jurisdiction conflicts and eliminate dispatch delay.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h4 className="font-heading text-sm font-bold text-slate-950">Immutable Inspection Timelines</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every ticket status transition is recorded with timestamped audit logs, assigned engineer IDs, and mandatory closure photo proofs accessible to the public.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PUBLIC AUDIT STREAM & RECENT DEFECTS */}
      <section id="live-feed" className="py-20 sm:py-24 border-b border-slate-200/80 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider">
                PUBLIC TRANSPARENCY
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-950">
                Recent Road Defect Reports
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onStartTrack()}
              className="text-xs font-semibold px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>Search All Complaints</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(recentComplaints.length > 0 ? recentComplaints : [
              { id: "CMP-2026-0842", address: "Linking Road, Bandra West", status: "IN PROGRESS", ward: "Ward H-West", image: "/images/demo_pothole_1.jpg", desc: "Severe asphalt cavity on commuter corridor." },
              { id: "CMP-2026-0843", address: "Andheri-Kurla Road, Andheri", status: "ASSIGNED", ward: "Ward K-East", image: "/images/demo_pothole_2.jpg", desc: "Longitudinal lane trench defect." },
              { id: "CMP-2026-0844", address: "Senapati Bapat Marg, Dadar", status: "RESOLVED", ward: "Ward G-North", image: "/images/demo_pothole_3.jpg", desc: "Mastic asphalt compaction & leveling complete." },
              { id: "CMP-2026-0845", address: "Dr. Annie Besant Rd, Worli", status: "NEW", ward: "Ward G-South", image: "/images/demo_pothole_1.jpg", desc: "Deep cavity near traffic junction." },
            ]).map((c: any) => (
              <div
                key={c.id}
                onClick={() => onStartTrack(c.id)}
                className="rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between group"
              >
                <div className="relative h-36 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={c.annotated_image || c.image || "/images/demo_pothole_1.jpg"}
                    alt={c.address}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-mono font-bold text-white bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                      {c.id}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      c.status === "RESOLVED"
                        ? "bg-emerald-600 text-white"
                        : c.status === "IN PROGRESS"
                        ? "bg-blue-600 text-white"
                        : "bg-amber-600 text-white"
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="font-heading text-xs font-bold text-slate-950 line-clamp-1">{c.address}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 font-normal">{c.description || c.desc || "Verified road defect report."}</p>
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{c.assigned_department?.split(" ")[0] || c.ward || "Ward Office"}</span>
                    <span className="text-blue-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Track <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section id="faq" className="py-20 border-b border-slate-200/80 bg-slate-50">
        <div className="container max-w-3xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="text-center space-y-1">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
              OPERATIONAL PROTOCOL
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-950">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${activeFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. MUNICIPAL ACTION CALLOUT */}
      <section className="py-16 sm:py-20 relative bg-slate-950 text-white">
        <div className="container max-w-4xl mx-auto px-4 sm:px-8 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800 text-blue-400 text-xs font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>DIRECT PUBLIC GRIEVANCE REDRESSAL</span>
          </div>

          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Spot a Road Hazard? Report It Right Now.
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Every report is permanently logged into the municipal database and routed to field maintenance crews with verified photo audit requirements.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={onStartReport}
              className="w-full sm:w-auto h-11 px-7 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Launch Citizen Camera</span>
            </button>
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full sm:w-auto h-11 px-6 border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-slate-400" />
              <span>Citizen &amp; Officer Sign In</span>
            </button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-950 flex items-center justify-center text-white font-bold text-xs">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="font-bold text-slate-900">CivicPothole</span>
            <span>&bull; Municipal Works &amp; Road Infrastructure Portal</span>
          </div>

          <div className="flex items-center gap-5">
            <a href="#triage" className="hover:text-slate-900">Triage Scanner</a>
            <a href="#pipeline" className="hover:text-slate-900">Pipeline</a>
            <a href="#live-feed" className="hover:text-slate-900">Public Feed</a>
            <button type="button" onClick={onStartCMS} className="hover:text-slate-900 font-medium">Authority CMS</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
