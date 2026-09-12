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
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  Search,
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

  // Form State
  const [description, setDescription] = useState<string>("");
  const [citizenName, setCitizenName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

    setIsSubmitting(true);
    try {
      const complaint = await createComplaint({
        image: detectionResult.original_image,
        annotated_image: detectionResult.annotated_image,
        detection_result: detectionResult,
        confidence: detectionResult.confidence,
        severity: detectionResult.severity,
        latitude: latitude || 28.6139,
        longitude: longitude || 77.2090,
        address: address || "Road location captured via camera GPS",
        description: description,
        citizen_name: citizenName || "Citizen User",
      });

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
    return (
      <div className="max-w-xl mx-auto py-8 px-4 animate-in fade-in duration-300">
        <Card className="border-emerald-500/40 shadow-lg text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center text-emerald-600 mb-3">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Complaint Successfully Submitted!
            </CardTitle>
            <CardDescription className="text-sm">
              Your road defect report has been registered in the municipal complaint system.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/60 rounded-lg border border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Your Complaint Tracking ID
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-mono font-bold text-primary">
                  {submittedComplaint.id}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1"
                  onClick={() => handleCopyId(submittedComplaint.id)}
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left text-xs p-3 bg-card border rounded-md">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="mt-1">
                  <StatusBadge status={submittedComplaint.status} />
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Severity:</span>
                <div className="mt-1">
                  <SeverityBadge severity={submittedComplaint.severity} />
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Location:</span>
                <p className="font-medium text-foreground truncate mt-0.5">
                  {submittedComplaint.address}
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              className="w-full sm:w-auto gap-2"
              onClick={() => onNavigateToTrack(submittedComplaint.id)}
            >
              <Search className="w-4 h-4" />
              Track Status Live
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2"
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

              {/* Severity Banner */}
              <div className="absolute bottom-3 left-3">
                <SeverityBadge severity={detectionResult.severity} />
              </div>
            </div>

            <CardContent className="p-5 space-y-3">
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

              {/* Description & Citizen Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="citizen-name" className="text-xs font-medium">
                    Your Name (Optional)
                  </Label>
                  <Input
                    id="citizen-name"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="desc-input" className="text-xs font-medium">
                    Additional Details / Notes (Optional)
                  </Label>
                  <Textarea
                    id="desc-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Near bus stop on the left lane, severe waterlogging..."
                    className="text-sm resize-none"
                    rows={2}
                  />
                </div>
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
