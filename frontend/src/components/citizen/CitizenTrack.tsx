import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { StatusBadge } from "../shared/StatusBadge";
import { SeverityBadge } from "../shared/SeverityBadge";
import { getComplaintById, Complaint, ComplaintStatus } from "../../services/api";
import {
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

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

  const fetchComplaint = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getComplaintById(id.trim());
      setComplaint(data);
    } catch (err: any) {
      setError(`Complaint "${id}" was not found. Please check your ID and try again.`);
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

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-6 px-2 sm:px-4 space-y-5 sm:space-y-6">
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

      {/* Search Header */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Track Road Complaint Status
          </CardTitle>
          <CardDescription className="text-xs">
            Enter your unique Complaint Reference ID (e.g. <code>CMP-2026-0101</code>) to view real-time resolution progress.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g. CMP-2026-0101"
              className="font-mono text-sm sm:text-base flex-1"
              required
            />
            <Button type="submit" disabled={loading} className="gap-2 shrink-0">
              <Search className="w-4 h-4" />
              {loading ? "Searching..." : "Track"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Notice */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive p-4 text-xs sm:text-sm">
          {error}
        </Card>
      )}

      {/* Complaint Details */}
      {complaint && (
        <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
          {/* Main Status Card */}
          <Card className="shadow overflow-hidden">
            <CardHeader className="bg-muted/40 border-b p-4 sm:p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono bg-background px-2 py-0.5 rounded border font-semibold">
                      {complaint.id}
                    </span>
                    <SeverityBadge severity={complaint.severity} />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground mt-1.5">
                    {complaint.address}
                  </h2>
                </div>
                <StatusBadge status={complaint.status} className="text-xs sm:text-sm px-2.5 sm:px-3 py-1 self-start sm:self-auto" />
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-5 sm:space-y-6">
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
                  <div className="sm:hidden grid grid-cols-3 gap-2">
                    {statusSteps.map((step, idx) => {
                      const isCompleted = idx <= currentStep;
                      const isCurrent = idx === currentStep;
                      return (
                        <div
                          key={step.key}
                          className={`p-2 rounded-md border text-center text-xs ${
                            isCurrent
                              ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                              : isCompleted
                              ? "bg-muted text-foreground font-medium"
                              : "bg-card text-muted-foreground opacity-60"
                          }`}
                        >
                          <div className="text-[10px] opacity-75">Step {idx + 1}</div>
                          <div className="truncate">{step.label}</div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    AI Detection Photo
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
                      Assigned Department
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
                    Activity History
                  </h4>
                  <div className="space-y-2">
                    {complaint.timeline.map((event, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-muted/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
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
