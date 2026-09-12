import React, { useState, useEffect } from "react";
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
import { StatusBadge } from "../shared/StatusBadge";
import { SeverityBadge } from "../shared/SeverityBadge";
import {
  getComplaintById,
  getComplaints,
  Complaint,
  ComplaintStatus,
} from "../../services/api";
import {
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  UserCheck,
  Phone,
  Mail,
  ListFilter,
  ExternalLink,
  ChevronRight,
  PartyPopper,
  Share2,
  MapPin,
  Calendar,
  Layers,
} from "lucide-react";

interface CitizenProfile {
  name: string;
  email: string;
  phone: string;
}

interface CitizenTrackProps {
  initialComplaintId?: string;
  onBackToReport: () => void;
}

export const CitizenTrack: React.FC<CitizenTrackProps> = ({
  initialComplaintId = "",
  onBackToReport,
}) => {
  const [searchId, setSearchId] = useState(initialComplaintId);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Citizen Profile State
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");

  // My Complaints History
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Load Profile & Complaints History
  const loadProfileAndHistory = async () => {
    let currentProfile: CitizenProfile | null = null;
    const saved = localStorage.getItem("civicpothole_citizen_profile");
    if (saved) {
      try {
        currentProfile = JSON.parse(saved);
        setProfile(currentProfile);
        if (currentProfile) {
          setEditName(currentProfile.name || "");
          setEditEmail(currentProfile.email || "");
          setEditPhone(currentProfile.phone || "");
        }
      } catch (e) {
        // ignore
      }
    }

    // Load user complaint history from localStorage IDs + API search
    setLoadingHistory(true);
    try {
      const storedIdsStr = localStorage.getItem("civicpothole_user_complaints");
      let storedIds: string[] = [];
      if (storedIdsStr) {
        try {
          storedIds = JSON.parse(storedIdsStr);
        } catch (e) {
          storedIds = [];
        }
      }

      // Fetch complaints
      const allComplaints = await getComplaints({
        citizen_email: currentProfile?.email || undefined,
        citizen_phone: currentProfile?.phone || undefined,
      });

      // Combine matched and stored IDs
      const historyMap = new Map<string, Complaint>();
      allComplaints.forEach((c) => historyMap.set(c.id, c));

      // Also fetch by stored IDs if not already fetched
      for (const id of storedIds.slice(0, 10)) {
        if (!historyMap.has(id)) {
          try {
            const c = await getComplaintById(id);
            if (c) historyMap.set(c.id, c);
          } catch (e) {
            // ignore
          }
        }
      }

      // If no history found, provide default sample complaint for demo
      if (historyMap.size === 0) {
        try {
          const sample = await getComplaintById("CMP-2026-0101");
          if (sample) historyMap.set(sample.id, sample);
        } catch (e) {
          // ignore
        }
      }

      setMyComplaints(Array.from(historyMap.values()));
    } catch (err) {
      console.error("Failed to load complaint history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadProfileAndHistory();
  }, []);

  const fetchComplaint = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getComplaintById(id.trim());
      setComplaint(data);
    } catch (err: any) {
      setError(`Complaint "${id}" was not found. Please check your Reference ID and try again.`);
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialComplaintId) {
      fetchComplaint(initialComplaintId);
    }
  }, [initialComplaintId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaint(searchId);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const newProfile: CitizenProfile = {
      name: editName.trim() || "Citizen User",
      email: editEmail.trim(),
      phone: editPhone.trim(),
    };
    localStorage.setItem("civicpothole_citizen_profile", JSON.stringify(newProfile));
    setProfile(newProfile);
    setIsEditingProfile(false);
    loadProfileAndHistory();
  };

  // Status Step Order
  const statusSteps = [
    { key: "NEW", label: "Logged" },
    { key: "UNDER REVIEW", label: "Reviewed" },
    { key: "VERIFIED", label: "Verified" },
    { key: "ASSIGNED", label: "Assigned" },
    { key: "IN PROGRESS", label: "In Progress" },
    { key: "RESOLVED", label: "Resolved" },
  ];

  const getStepIndex = (st: ComplaintStatus) => {
    switch (st) {
      case "NEW":
        return 0;
      case "UNDER REVIEW":
        return 1;
      case "VERIFIED":
        return 2;
      case "ASSIGNED":
        return 3;
      case "IN PROGRESS":
        return 4;
      case "RESOLVED":
        return 5;
      case "REJECTED":
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = complaint ? getStepIndex(complaint.status) : 0;

  // Generate Tweet URLs
  const getShareTweetUrl = (c: Complaint) => {
    if (c.status === "RESOLVED") {
      const text = `✅ SOLVED & REPAIRED: Road defect resolved! Complaint #${c.id} at ${c.address} has been successfully repaired and leveled by @mybmc. Thank you BMC engineering team! 🛠️🎉 #BMCSolved #RoadSafety #MumbaiRepairs #CitizenImpact`;
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    }
    const text = `🚨 Road Defect Alert: Checking status of pothole complaint #${c.id} at ${c.address} [Status: ${c.status}]. Requesting prompt repair action @mybmc @CMOMaharashtra #BMC #RoadSafety #MumbaiRoads`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="max-w-3xl mx-auto py-3 sm:py-6 px-2 sm:px-4 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToReport}
          className="gap-1.5 text-xs text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Report Pothole
        </Button>
      </div>

      {/* Citizen Profile Bar / Quick Auth */}
      <Card className="p-3 sm:p-4 shadow-xs bg-gradient-to-r from-primary/5 via-card to-card border-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-foreground">
                  {profile ? profile.name : "Citizen Guest Profile"}
                </span>
                <Badge variant="outline" className="text-[10px] py-0 h-4 border-primary/30 text-primary">
                  Citizen Account
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                {profile?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {profile.phone}
                  </span>
                )}
                {profile?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-600" />
                    {profile.email}
                  </span>
                )}
                {!profile?.phone && !profile?.email && (
                  <span>Set your contact info to auto-track your reports</span>
                )}
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1 self-start sm:self-auto shrink-0"
            onClick={() => setIsEditingProfile(!isEditingProfile)}
          >
            {profile ? "Edit Profile / Switch" : "Sign In / Set Profile"}
          </Button>
        </div>

        {/* Profile Edit Subform */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-3 pt-3 border-t space-y-3 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="space-y-1">
                <Label htmlFor="edit-name" className="text-[11px]">Your Full Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="text-xs h-8"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-phone" className="text-[11px]">Phone Number</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. +91 98200 12345"
                  className="text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-email" className="text-[11px]">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. rahul@gmail.com"
                  className="text-xs h-8"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditingProfile(false)} className="h-7 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-7 text-xs">
                Save & Load My Complaints
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Search Header */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            Track Specific Complaint Reference ID
          </CardTitle>
          <CardDescription className="text-xs">
            Search any reference code (e.g. <code>CMP-2026-0101</code>) to inspect live engineering updates and resolution proof.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g. CMP-2026-0101"
              className="font-mono text-xs sm:text-sm flex-1 h-9"
              required
            />
            <Button type="submit" disabled={loading} className="gap-2 shrink-0 h-9 text-xs">
              <Search className="w-4 h-4" />
              {loading ? "Searching..." : "Track ID"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* "My Reported Complaints" List Section */}
      {!complaint && (
        <Card className="shadow-xs overflow-hidden">
          <CardHeader className="bg-muted/30 border-b p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                  My Reported Complaints
                </CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {myComplaints.length} Records Found
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-border">
            {loadingHistory ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Loading your complaints history...</div>
            ) : myComplaints.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                <p>No previous complaints found for your profile.</p>
                <p className="mt-1">Report a new pothole to start tracking here.</p>
              </div>
            ) : (
              myComplaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSearchId(c.id);
                    fetchComplaint(c.id);
                  }}
                  className="p-3 sm:p-4 hover:bg-muted/40 active:bg-muted/70 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={c.annotated_image || c.image}
                      alt="Defect"
                      className="w-14 h-12 sm:w-16 sm:h-14 object-cover rounded-md border bg-black/80 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-primary">
                          {c.id}
                        </span>
                        <SeverityBadge severity={c.severity} />
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="font-medium text-xs text-foreground truncate mt-1">
                        {c.address}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                        {c.assigned_officer && <span>&bull; {c.assigned_officer}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <span>Track</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Notice */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive p-4 text-xs sm:text-sm">
          {error}
        </Card>
      )}

      {/* Complaint Details View */}
      {complaint && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setComplaint(null)}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to My Complaints List
          </Button>

          {/* CELEBRATION RESOLUTION BANNER IF RESOLVED */}
          {complaint.status === "RESOLVED" && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-lg space-y-2.5 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <PartyPopper className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      Road Defect Repaired & Resolved!
                    </h3>
                    <p className="text-[11px] text-emerald-100">
                      Complaint #{complaint.id} verified and closed by Municipal Authority.
                    </p>
                  </div>
                </div>
                <Badge className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-[10px]">
                  VERIFIED FIXED
                </Badge>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                <a
                  href={getShareTweetUrl(complaint)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow transition-all"
                >
                  <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share Solved Proof on X & Tag @mybmc
                </a>
              </div>
            </div>
          )}

          {/* Main Status Card */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/40 border-b p-3 sm:p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono bg-background px-2 py-0.5 rounded border font-semibold">
                      {complaint.id}
                    </span>
                    <SeverityBadge severity={complaint.severity} />
                    <StatusBadge status={complaint.status} />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground mt-1.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    {complaint.address}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <a
                    href={getShareTweetUrl(complaint)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Post on X (@mybmc)
                  </a>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-6">
              {/* Stepper (if not rejected) */}
              {complaint.status !== "REJECTED" ? (
                <div className="py-2">
                  {/* Desktop/Tablet Horizontal Stepper */}
                  <div className="hidden sm:block relative">
                    <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 h-1 bg-muted -z-0">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{
                          width: `${(Math.max(0, currentStep) / (statusSteps.length - 1)) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center w-full">
                      {statusSteps.map((step, idx) => {
                        const isCompleted = idx <= currentStep;
                        const isCurrent = idx === currentStep;
                        return (
                          <div key={step.key} className="flex flex-col items-center relative z-10">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                isCompleted
                                  ? "bg-primary text-primary-foreground shadow"
                                  : "bg-card border-2 border-muted-foreground/30 text-muted-foreground"
                              } ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span
                              className={`text-[11px] mt-1.5 font-medium whitespace-nowrap ${
                                isCurrent
                                  ? "text-primary font-bold"
                                  : isCompleted
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile Compact Progress Badges */}
                  <div className="sm:hidden grid grid-cols-3 gap-1.5">
                    {statusSteps.map((step, idx) => {
                      const isCompleted = idx <= currentStep;
                      const isCurrent = idx === currentStep;
                      return (
                        <div
                          key={step.key}
                          className={`p-1.5 rounded-md border text-center text-[10px] ${
                            isCurrent
                              ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                              : isCompleted
                              ? "bg-muted text-foreground font-medium"
                              : "bg-card text-muted-foreground opacity-60"
                          }`}
                        >
                          <div className="opacity-75">Step {idx + 1}</div>
                          <div className="truncate font-semibold">{step.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-800 rounded-lg text-xs sm:text-sm">
                  This complaint was marked as rejected by the authority. Please check internal notes or report again if needed.
                </div>
              )}

              {/* Photos Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    AI Detection Photo (Reported Defect)
                  </span>
                  <div className="rounded-lg overflow-hidden border bg-black/90 flex items-center justify-center max-h-56">
                    <img
                      src={complaint.annotated_image || complaint.image}
                      alt="Pothole Detection"
                      className="w-full h-48 sm:h-56 object-cover"
                    />
                  </div>
                </div>

                {complaint.resolution_images && complaint.resolution_images.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Resolution & Repair Proof Photo
                    </span>
                    <div className="rounded-lg overflow-hidden border border-emerald-500/40 bg-black/90 flex items-center justify-center max-h-56">
                      <img
                        src={complaint.resolution_images[0]}
                        alt="Resolution Proof"
                        className="w-full h-48 sm:h-56 object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                      Assigned Department & Officer
                    </span>
                    <div className="p-4 bg-muted/40 border rounded-lg h-48 sm:h-56 flex flex-col justify-center text-xs space-y-2.5">
                      <div>
                        <span className="text-muted-foreground">Department:</span>
                        <p className="font-semibold text-foreground text-xs sm:text-sm">
                          {complaint.assigned_department || "Public Works Department"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Officer In Charge:</span>
                        <p className="font-semibold text-foreground text-xs sm:text-sm">
                          {complaint.assigned_officer || "Pending Assignment"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reported On:</span>
                        <p className="text-foreground">
                          {new Date(complaint.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resolution Note if resolved */}
              {complaint.resolution_note && (
                <div className="p-3.5 sm:p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1">
                    Authority Resolution Note
                  </h4>
                  <p className="text-xs sm:text-sm text-foreground">{complaint.resolution_note}</p>
                </div>
              )}

              {/* Timeline Audit Log */}
              {complaint.timeline && complaint.timeline.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Activity History & Municipal Audit
                  </h4>
                  <div className="space-y-2">
                    {complaint.timeline.map((event, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded bg-muted/30">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                            <span className="font-semibold text-foreground">
                              {event.description}
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            By {event.actor}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
