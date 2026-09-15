import React, { useState, useRef } from "react";
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
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { StatusBadge } from "../shared/StatusBadge";
import { SeverityBadge } from "../shared/SeverityBadge";
import {
  detectPotholes,
  createComplaint,
  DetectionResult,
  Complaint,
} from "../../services/api";
import {
  Camera,
  Upload,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  Search,
  UserCheck,
  User,
  Phone,
  Mail,
} from "lucide-react";

interface CitizenReportProps {
  onNavigateToTrack: (complaintId: string) => void;
  onNavigateToCMS: () => void;
}

export const CitizenReport: React.FC<CitizenReportProps> = ({
  onNavigateToTrack,
  onNavigateToCMS,
}) => {
  // Upload & Inference State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [viewMode, setViewMode] = useState<"annotated" | "original">("annotated");
  const [detectionError, setDetectionError] = useState<string | null>(null);

  // Location State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string>("");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Form State & Citizen Profile
  const [description, setDescription] = useState<string>("");
  const [citizenName, setCitizenName] = useState<string>("");
  const [citizenEmail, setCitizenEmail] = useState<string>("");
  const [citizenPhone, setCitizenPhone] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load saved profile on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("civicpothole_citizen_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) setCitizenName(parsed.name);
        if (parsed.email) setCitizenEmail(parsed.email);
        if (parsed.phone) setCitizenPhone(parsed.phone);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Handle GPS Capture
  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setIsLocating(false);

        // Reverse geocoding attempt
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.display_name) {
              setAddress(data.display_name.split(",").slice(0, 3).join(","));
            } else {
              setAddress(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            }
          })
          .catch(() => {
            setAddress(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          });
      },
      (error) => {
        setIsLocating(false);
        setLocationError(error.message || "Location permission denied. Please enter address manually.");
        // Fallback default
        if (!address) {
          setAddress("Main Street Road Sector");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle File Selection and Automatic AI Inference
  const handleFileProcess = async (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setDetectionError(null);
    setDetectionResult(null);
    setIsDetecting(true);

    // Auto-fetch location in parallel if not already fetched
    if (!latitude && !longitude) {
      handleCaptureLocation();
    }

    try {
      const result = await detectPotholes(file);
      setDetectionResult(result);
      setViewMode("annotated");
    } catch (err: any) {
      setDetectionError(err.message || "Failed to analyze road image with YOLO.");
    } finally {
      setIsDetecting(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Handle Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detectionResult) return;

    // Save/Update Citizen Profile locally
    const profile = {
      name: citizenName.trim() || "Citizen User",
      email: citizenEmail.trim(),
      phone: citizenPhone.trim(),
    };
    localStorage.setItem("civicpothole_citizen_profile", JSON.stringify(profile));

    setIsSubmitting(true);
    try {
      const complaint = await createComplaint({
        image: detectionResult.original_image,
        annotated_image: detectionResult.annotated_image,
        detection_result: detectionResult,
        confidence: detectionResult.confidence,
        severity: detectionResult.severity,
        latitude: latitude || 19.0760,
        longitude: longitude || 72.8777,
        address: address || "Road location captured via camera GPS",
        description: description,
        citizen_name: citizenName || "Citizen User",
        citizen_email: citizenEmail || undefined,
        citizen_phone: citizenPhone || undefined,
      });

      // Save to user complaint history in localStorage
      const existing = localStorage.getItem("civicpothole_user_complaints");
      let list: string[] = [];
      if (existing) {
        try {
          list = JSON.parse(existing);
        } catch (e) {
          list = [];
        }
      }
      if (!list.includes(complaint.id)) {
        list.unshift(complaint.id);
        localStorage.setItem("civicpothole_user_complaints", JSON.stringify(list));
      }

      setSubmittedComplaint(complaint);
    } catch (err: any) {
      alert("Error submitting complaint: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetectionResult(null);
    setSubmittedComplaint(null);
    setDescription("");
    setDetectionError(null);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // SUCCESS CONFIRMATION STATE
  if (submittedComplaint) {
    const tweetText = `🚨 Road Defect Alert: Pothole reported via @CivicPotholeAI!\n📍 Location: ${submittedComplaint.address}\n🆔 Reference ID: ${submittedComplaint.id}\n⚠️ Severity: ${submittedComplaint.severity}\n\nUrgent road repair & inspection requested @mybmc @CMOMaharashtra @MahaDGIPR #BMC #RoadSafety #MumbaiRoads #PotholeFix #CivicAction`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

    return (
      <div className="max-w-xl mx-auto py-6 sm:py-8 px-3 sm:px-4 animate-in fade-in duration-300">
        <Card className="border-emerald-500/40 shadow-lg text-center overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4 bg-emerald-50/40 dark:bg-emerald-950/20 border-b">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center text-emerald-600 mb-2 shadow-xs">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
              Complaint Successfully Submitted!
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Your road defect report has been registered in the municipal complaint system.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="p-3 sm:p-4 bg-muted/60 rounded-lg border border-border">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Your Complaint Tracking ID
              </p>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl font-mono font-bold text-primary truncate">
                  {submittedComplaint.id}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 text-xs shrink-0"
                  onClick={() => handleCopyId(submittedComplaint.id)}
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-left text-xs p-3 bg-card border rounded-md">
              <div>
                <span className="text-muted-foreground text-[11px]">Status:</span>
                <div className="mt-1">
                  <StatusBadge status={submittedComplaint.status} />
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Severity:</span>
                <div className="mt-1">
                  <SeverityBadge severity={submittedComplaint.severity} />
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground text-[11px]">Location:</span>
                <p className="font-medium text-foreground truncate mt-0.5">
                  {submittedComplaint.address}
                </p>
              </div>
            </div>

            {/* SHARE ON X (TWITTER) TAGGING BMC */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950 text-white border border-slate-800 text-left space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="text-xs font-bold text-white tracking-wide">
                    Amplify on X & Tag Municipal Authority
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] text-sky-400 border-sky-400/40 bg-sky-950/40">
                  @mybmc
                </Badge>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Post this road defect directly on X to alert municipal road engineers and tag <strong className="text-white">@mybmc</strong> for expedited repair action.
              </p>

              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 bg-white text-slate-950 hover:bg-slate-100 active:scale-[0.99] rounded-lg text-xs sm:text-sm font-bold shadow transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Post on X & Tag @mybmc
              </a>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center pt-2 pb-4 px-4">
            <Button
              className="w-full sm:w-auto gap-2 text-xs sm:text-sm"
              onClick={() => onNavigateToTrack(submittedComplaint.id)}
            >
              <Search className="w-4 h-4" />
              Track Status Live
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2 text-xs sm:text-sm"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4" />
              Report Another Pothole
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <Badge variant="outline" className="gap-1.5 px-3 py-1 font-medium bg-primary/5 text-primary border-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Assisted Citizen Portal
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Report a Road Defect
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Snap a photo of the pothole. The AI will immediately detect the defect and assist your municipal submission in seconds.
        </p>
      </div>

      {/* Step 1: Upload Card */}
      {!previewUrl && (
        <Card className="border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors shadow-sm bg-card/60">
          <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Capture or Upload Road Photo
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Take a clear picture of the pothole or select an existing photo from your device.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              {/* Camera Trigger */}
              <Button
                type="button"
                className="gap-2 shadow"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </Button>

              {/* Upload Trigger */}
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Choose File
              </Button>
            </div>

            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFileInputChange}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={onFileInputChange}
            />
          </CardContent>
        </Card>
      )}

      {/* AI Analyzing State */}
      {isDetecting && (
        <Card className="p-6 text-center space-y-4">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Skeleton className="w-full h-64 rounded-lg" />
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Sparkles className="w-4 h-4 animate-spin" />
              Running YOLOv8 Pothole Detection Model...
            </div>
            <p className="text-xs text-muted-foreground">
              Extracting defect bounding boxes, confidence score, and severity classification.
            </p>
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {detectionError && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>AI Detection Notice</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>{detectionError}</span>
            <Button size="sm" variant="outline" onClick={handleReset} className="w-fit">
              Upload Different Image
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Step 2: AI Detection Result & Confirmation Form */}
      {detectionResult && !isDetecting && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
          {/* Visual Detection Card */}
          <Card className="overflow-hidden shadow">
            <div className="relative bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[420px] overflow-hidden">
              <img
                src={
                  viewMode === "annotated"
                    ? detectionResult.annotated_image
                    : detectionResult.original_image
                }
                alt="Detected Road Defect"
                className="max-h-[420px] w-full object-contain"
              />

              {/* View Toggle Overlay */}
              {detectionResult.detected && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1 rounded-md border border-white/10">
                  <Button
                    type="button"
                    size="sm"
                    variant={viewMode === "annotated" ? "default" : "ghost"}
                    className="h-7 text-xs px-2.5 text-white"
                    onClick={() => setViewMode("annotated")}
                  >
                    <Layers className="w-3.5 h-3.5 mr-1" />
                    AI Detection Box
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={viewMode === "original" ? "default" : "ghost"}
                    className="h-7 text-xs px-2.5 text-white"
                    onClick={() => setViewMode("original")}
                  >
                    Original Photo
                  </Button>
                </div>
              )}

              {/* Severity Banner */}
              {detectionResult.detected && (
                <div className="absolute bottom-3 left-3">
                  <SeverityBadge severity={detectionResult.severity} />
                </div>
              )}
            </div>

            <CardContent className="p-5 space-y-3">
              {detectionResult.detected ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Pothole Detected
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {detectionResult.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Confidence</div>
                      <div className="text-base font-bold text-primary">
                        {Math.round(detectionResult.confidence * 100)}%
                      </div>
                    </div>
                    <div className="border-l pl-2 text-right">
                      <div className="text-xs text-muted-foreground">Defect Count</div>
                      <div className="text-base font-bold text-foreground">
                        {detectionResult.pothole_count}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-b pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-base flex items-center gap-2 text-amber-600">
                      <AlertCircle className="w-5 h-5" />
                      No Road Defects Detected
                    </h3>
                    <Badge variant="outline" className="text-xs text-muted-foreground">0 Defect Bounding Boxes</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The AI model did not identify any potholes in this image. You may re-upload a clearer road photograph, or continue below if you wish to report this location for municipal inspection.
                  </p>
                </div>
              )}

              {/* Location Details */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="address-input" className="text-xs font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    Location & Area
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-primary gap-1"
                    onClick={handleCaptureLocation}
                    disabled={isLocating}
                  >
                    {isLocating ? "Locating..." : "Refresh GPS"}
                  </Button>
                </div>
                <Input
                  id="address-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Road / Landmark name"
                  className="text-sm"
                  required
                />
                {latitude && longitude && (
                  <p className="text-[11px] text-muted-foreground">
                    GPS Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                )}
                {locationError && (
                  <p className="text-[11px] text-amber-600">{locationError}</p>
                )}
              </div>

              {/* Citizen Contact Profile (Name, Email, Phone) */}
              <div className="pt-2 border-t space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                    Citizen Contact Info (For Municipal Follow-up)
                  </span>
                  <span className="text-[10px] text-muted-foreground">Auto-saved to profile</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="citizen-name" className="text-[11px] font-medium">
                      Your Name
                    </Label>
                    <Input
                      id="citizen-name"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="citizen-phone" className="text-[11px] font-medium">
                      Phone Number (SMS / Call)
                    </Label>
                    <Input
                      id="citizen-phone"
                      type="tel"
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      placeholder="e.g. +91 98200 12345"
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="citizen-email" className="text-[11px] font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="citizen-email"
                      type="email"
                      value={citizenEmail}
                      onChange={(e) => setCitizenEmail(e.target.value)}
                      placeholder="e.g. rahul@gmail.com"
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="desc-input" className="text-xs font-medium">
                  Additional Road Notes / Landmark (Optional)
                </Label>
                <Textarea
                  id="desc-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Near bus stop on the left lane, severe waterlogging..."
                  className="text-xs resize-none"
                  rows={2}
                />
              </div>
            </CardContent>

            <CardFooter className="bg-muted/40 p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="w-full sm:w-auto text-muted-foreground"
              >
                Cancel & Retake
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto gap-2 text-base px-6 h-11"
              >
                {isSubmitting ? (
                  "Submitting Complaint..."
                ) : (
                  <>
                    Submit Complaint
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
};
