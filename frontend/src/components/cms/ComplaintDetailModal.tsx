import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { StatusBadge } from "../shared/StatusBadge";
import { SeverityBadge } from "../shared/SeverityBadge";
import {
  Complaint,
  ComplaintStatus,
  updateComplaintStatus,
  assignComplaintOfficer,
  resolveComplaintProof,
} from "../../services/api";
import {
  MapPin,
  Clock,
  UserCheck,
  CheckCheck,
  XCircle,
  FileText,
  Upload,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Phone,
  Mail,
  MessageSquare,
  PartyPopper,
} from "lucide-react";

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplaintUpdated: () => void;
}

const MUNICIPAL_DEPARTMENTS = [
  "Public Works Dept (Road Div 1 - North Zone)",
  "Public Works Dept (Road Div 2 - South Zone)",
  "Municipal Highway & Asphalt Maintenance",
  "Traffic & Road Safety Infrastructure",
  "Rapid Response Pothole Patching Unit",
  "Urban Drainage & Civil Works",
];

const MUNICIPAL_OFFICERS = [
  { name: "Eng. Rajiv Menon", role: "Lead Road Engineer", dept: "Public Works Dept (Road Div 1 - North Zone)" },
  { name: "Insp. Priya Sharma", role: "Field Safety Inspector", dept: "Traffic & Road Safety Infrastructure" },
  { name: "Eng. Vikram Patel", role: "Asphalt Maintenance Supervisor", dept: "Municipal Highway & Asphalt Maintenance" },
  { name: "Eng. Sandeep Kulkarni", role: "Rapid Patching Lead", dept: "Rapid Response Pothole Patching Unit" },
  { name: "Officer Anita Rao", role: "Quality & Safety Auditor", dept: "Public Works Dept (Road Div 2 - South Zone)" },
  { name: "Eng. Tariq Ahmed", role: "Civil Works Inspector", dept: "Urban Drainage & Civil Works" },
];

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  open,
  onOpenChange,
  onComplaintUpdated,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Assign State
  const [isAssigning, setIsAssigning] = useState(false);
  const [department, setDepartment] = useState(MUNICIPAL_DEPARTMENTS[0]);
  const [officer, setOfficer] = useState(MUNICIPAL_OFFICERS[0].name);
  const [assignNote, setAssignNote] = useState("");

  // Resolve State
  const [isResolving, setIsResolving] = useState(false);
  const [resolvingOfficer, setResolvingOfficer] = useState(MUNICIPAL_OFFICERS[0].name);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionImage, setResolutionImage] = useState<string>("");

  const [viewImage, setViewImage] = useState<"annotated" | "original">("annotated");

  if (!complaint) return null;

  // Handle Department Change (syncs default officer)
  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    const matched = MUNICIPAL_OFFICERS.find((o) => o.dept === dept);
    if (matched) {
      setOfficer(matched.name);
    }
  };

  // Handle Status Update
  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    setIsUpdatingStatus(true);
    try {
      await updateComplaintStatus(
        complaint.id,
        selectedStatus as ComplaintStatus,
        statusNote,
        "Municipal Admin"
      );
      setSelectedStatus("");
      setStatusNote("");
      onComplaintUpdated();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Assignment
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !officer) return;
    try {
      await assignComplaintOfficer(
        complaint.id,
        department,
        officer,
        assignNote
      );
      setIsAssigning(false);
      onComplaintUpdated();
    } catch (err: any) {
      alert("Failed to assign complaint: " + err.message);
    }
  };

  // Handle Resolution
  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNote) return;
    try {
      await resolveComplaintProof(
        complaint.id,
        resolutionNote,
        resolutionImage ? [resolutionImage] : [complaint.image],
        resolvingOfficer || "Field Engineer"
      );
      setIsResolving(false);
      setResolutionNote("");
      onComplaintUpdated();
    } catch (err: any) {
      alert("Failed to resolve complaint: " + err.message);
    }
  };

  const handleResolveImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setResolutionImage(reader.result);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold bg-muted px-2 py-0.5 rounded border">
                {complaint.id}
              </span>
              <SeverityBadge severity={complaint.severity} />
            </div>
            <StatusBadge status={complaint.status} />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground mt-1">
            {complaint.address}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Reported by {complaint.citizen_name || "Citizen"} on{" "}
            {new Date(complaint.created_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 my-2">
          {/* Photos Comparison */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Visual Inspection
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant={viewImage === "annotated" ? "default" : "outline"}
                  className="h-7 text-xs px-2.5"
                  onClick={() => setViewImage("annotated")}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  YOLO Annotated Overlay
                </Button>
                <Button
                  size="sm"
                  variant={viewImage === "original" ? "default" : "outline"}
                  className="h-7 text-xs px-2.5"
                  onClick={() => setViewImage("original")}
                >
                  Original Photo
                </Button>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden border bg-slate-950 flex items-center justify-center max-h-72">
              <img
                src={
                  viewImage === "annotated"
                    ? complaint.annotated_image || complaint.image
                    : complaint.image
                }
                alt="Defect Inspection"
                className="w-full max-h-72 object-contain"
              />
            </div>
          </div>

          {/* AI Metrics & Citizen Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg border text-xs">
            <div>
              <span className="text-muted-foreground">AI Detection Confidence:</span>
              <p className="font-bold text-foreground text-sm">
                {Math.round(complaint.confidence * 100)}%
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Department:</span>
              <p className="font-semibold text-foreground text-sm">
                {complaint.assigned_department || "Unassigned"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Assigned Officer:</span>
              <p className="font-semibold text-foreground text-sm">
                {complaint.assigned_officer || "Unassigned"}
              </p>
            </div>
            {complaint.description && (
              <div className="sm:col-span-3 border-t pt-2 mt-1">
                <span className="text-muted-foreground">Citizen Notes:</span>
                <p className="text-foreground mt-0.5">{complaint.description}</p>
              </div>
            )}
          </div>

          {/* Citizen Contact & Municipal Field Coordination Card */}
          <div className="p-3.5 rounded-lg border bg-card space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Citizen Contact & Coordination
              </span>
              <Badge variant="outline" className="text-[10px]">
                Direct Citizen Link
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-muted/30 p-2.5 rounded border">
              <div>
                <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  {complaint.citizen_name || "Citizen User"}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                  {complaint.citizen_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      {complaint.citizen_phone}
                    </span>
                  )}
                  {complaint.citizen_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-blue-600" />
                      {complaint.citizen_email}
                    </span>
                  )}
                  {!complaint.citizen_phone && !complaint.citizen_email && (
                    <span>No contact information provided</span>
                  )}
                </div>
              </div>

              {/* Direct Action Triggers */}
              <div className="flex items-center gap-1.5 shrink-0">
                {complaint.citizen_phone && (
                  <a
                    href={`tel:${complaint.citizen_phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    Call
                  </a>
                )}
                {complaint.citizen_phone && (
                  <a
                    href={`https://wa.me/${complaint.citizen_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${complaint.citizen_name}, regarding your road defect complaint #${complaint.id} at ${complaint.address}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    WhatsApp
                  </a>
                )}
                {complaint.citizen_email && (
                  <a
                    href={`mailto:${complaint.citizen_email}?subject=${encodeURIComponent(`Update on BMC Complaint #${complaint.id}`)}&body=${encodeURIComponent(`Dear ${complaint.citizen_name},\n\nRegarding your road defect complaint #${complaint.id} at ${complaint.address}.\n\nCurrent Status: ${complaint.status}\n\nBMC Public Works Department`)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    Email
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Workflow Action Panel */}
          <div className="p-4 border rounded-lg bg-card space-y-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Authority Actions & Workflow
            </h4>

            <div className="flex flex-wrap gap-2">
              {/* Assign Trigger */}
              <Button
                size="sm"
                variant={isAssigning ? "default" : "outline"}
                className="gap-1.5"
                onClick={() => setIsAssigning(!isAssigning)}
              >
                <UserCheck className="w-4 h-4 text-purple-600" />
                {complaint.assigned_officer !== "Unassigned"
                  ? "Reassign Officer"
                  : "Assign Team"}
              </Button>

              {/* Resolve Trigger */}
              {complaint.status !== "RESOLVED" && (
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setIsResolving(!isResolving)}
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark as Resolved
                </Button>
              )}
            </div>

            {/* Assignment Dropdown Subform */}
            {isAssigning && (
              <form onSubmit={handleAssign} className="p-3 bg-muted/60 rounded border space-y-3 animate-in fade-in duration-200">
                <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  Assign Responsible Department & Officer
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Department Dropdown */}
                  <div className="space-y-1">
                    <Label htmlFor="dept-select" className="text-[11px] font-medium text-foreground">
                      Select Department
                    </Label>
                    <div className="relative">
                      <select
                        id="dept-select"
                        value={department}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        required
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none pr-8 cursor-pointer"
                      >
                        {MUNICIPAL_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Officer Dropdown */}
                  <div className="space-y-1">
                    <Label htmlFor="officer-select" className="text-[11px] font-medium text-foreground">
                      Select Officer In Charge
                    </Label>
                    <div className="relative">
                      <select
                        id="officer-select"
                        value={officer}
                        onChange={(e) => setOfficer(e.target.value)}
                        required
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none pr-8 cursor-pointer"
                      >
                        {MUNICIPAL_OFFICERS.map((off) => (
                          <option key={off.name} value={off.name}>
                            {off.name} ({off.role})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="assign-note" className="text-[11px] font-medium">
                    Assignment Note (Optional)
                  </Label>
                  <Input
                    id="assign-note"
                    placeholder="Instructions for field engineering team..."
                    value={assignNote}
                    onChange={(e) => setAssignNote(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setIsAssigning(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Confirm Assignment
                  </Button>
                </div>
              </form>
            )}

            {/* Resolution Subform */}
            {isResolving && (
              <form onSubmit={handleResolve} className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 rounded space-y-3 animate-in fade-in duration-200">
                <h5 className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5" />
                  Upload Repair Completion Proof & Resolution Notes
                </h5>

                {/* Resolving Officer Dropdown */}
                <div className="space-y-1">
                  <Label htmlFor="resolving-officer-select" className="text-[11px] font-medium">
                    Verified By Officer
                  </Label>
                  <div className="relative">
                    <select
                      id="resolving-officer-select"
                      value={resolvingOfficer}
                      onChange={(e) => setResolvingOfficer(e.target.value)}
                      required
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none pr-8 cursor-pointer"
                    >
                      {MUNICIPAL_OFFICERS.map((off) => (
                        <option key={off.name} value={off.name}>
                          {off.name} ({off.role})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px]">Resolution Summary</Label>
                  <Textarea
                    placeholder="e.g. Asphalt patching applied, surface leveled and tested for drainage."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    required
                    className="text-xs resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <Label className="text-[11px]">Repair Evidence Photo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleResolveImageUpload}
                    className="text-xs h-9"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setIsResolving(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Submit Resolution & Close
                  </Button>
                </div>
              </form>
            )}

            {/* Quick Status Transition Dropdown */}
            <div className="border-t pt-3 flex flex-col sm:flex-row items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Change Status:
              </span>
              <div className="relative flex-1 w-full">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
                  className="w-full h-8 rounded-md border text-xs px-2.5 bg-background appearance-none pr-8 cursor-pointer"
                >
                  <option value="">-- Select Target Status --</option>
                  <option value="NEW">NEW</option>
                  <option value="UNDER REVIEW">UNDER REVIEW</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN PROGRESS">IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={!selectedStatus || isUpdatingStatus}
                onClick={handleStatusChange}
              >
                Update Status
              </Button>
            </div>
          </div>

          {/* Activity Timeline */}
          {complaint.timeline && complaint.timeline.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Audit Trail & History
              </h4>
              <div className="space-y-2">
                {complaint.timeline.map((event, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-muted/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{event.description}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">By {event.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
