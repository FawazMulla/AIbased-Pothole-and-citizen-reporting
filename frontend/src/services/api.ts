const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export type ComplaintStatus =
  | "NEW"
  | "UNDER REVIEW"
  | "VERIFIED"
  | "ASSIGNED"
  | "IN PROGRESS"
  | "RESOLVED"
  | "REJECTED";

export type DefectSeverity = "LOW" | "MEDIUM" | "HIGH";

export interface BoundingBox {
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number];
  area_ratio?: number;
}

export interface DetectionResult {
  detected: boolean;
  pothole_count: number;
  confidence: number;
  severity: DefectSeverity;
  detections: BoundingBox[];
  summary: string;
  annotated_image: string;
  original_image: string;
  duration_ms?: number;
  model_provenance?: string;
}

export interface TimelineEvent {
  timestamp: string;
  status: string;
  description: string;
  actor: string;
}

export interface Complaint {
  id: string;
  created_at: string;
  updated_at: string;
  image: string;
  annotated_image?: string;
  detection_result?: DetectionResult;
  confidence: number;
  severity: DefectSeverity;
  latitude?: number;
  longitude?: number;
  address: string;
  description?: string;
  citizen_name: string;
  status: ComplaintStatus;
  assigned_department?: string;
  assigned_officer?: string;
  internal_notes: string[];
  timeline: TimelineEvent[];
  resolution_note?: string;
  resolution_images: string[];
}

export interface DashboardStats {
  total_complaints: number;
  new_complaints: number;
  under_review: number;
  in_progress: number;
  resolved: number;
  high_severity: number;
  recent_complaints: Complaint[];
}

export async function detectPotholes(file: File): Promise<DetectionResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/detect`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Detection failed" }));
    throw new Error(err.detail || `Detection error: ${res.statusText}`);
  }

  return res.json();
}

export async function createComplaint(payload: {
  image: string;
  annotated_image?: string;
  detection_result?: DetectionResult;
  confidence: number;
  severity: DefectSeverity;
  latitude?: number;
  longitude?: number;
  address: string;
  description?: string;
  citizen_name?: string;
}): Promise<Complaint> {
  const res = await fetch(`${API_BASE_URL}/api/complaints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to submit complaint" }));
    throw new Error(err.detail || `Submission error: ${res.statusText}`);
  }

  return res.json();
}

export async function getComplaints(params?: {
  status?: string;
  severity?: string;
  search?: string;
}): Promise<Complaint[]> {
  const url = new URL(`${API_BASE_URL}/api/complaints`);
  if (params?.status && params.status !== "ALL") url.searchParams.append("status", params.status);
  if (params?.severity && params.severity !== "ALL") url.searchParams.append("severity", params.severity);
  if (params?.search) url.searchParams.append("search", params.search);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch complaints");
  return res.json();
}

export async function getComplaintById(id: string): Promise<Complaint> {
  const res = await fetch(`${API_BASE_URL}/api/complaints/${id}`);
  if (!res.ok) throw new Error(`Complaint ${id} not found`);
  return res.json();
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  note?: string,
  officer_name: string = "Authority Officer"
): Promise<Complaint> {
  const res = await fetch(`${API_BASE_URL}/api/complaints/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, note, officer_name }),
  });

  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

export async function assignComplaintOfficer(
  id: string,
  assigned_department: string,
  assigned_officer: string,
  note?: string
): Promise<Complaint> {
  const res = await fetch(`${API_BASE_URL}/api/complaints/${id}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assigned_department, assigned_officer, note }),
  });

  if (!res.ok) throw new Error("Failed to assign complaint");
  return res.json();
}

export async function resolveComplaintProof(
  id: string,
  resolution_note: string,
  resolution_images: string[] = [],
  officer_name: string = "Field Inspector"
): Promise<Complaint> {
  const res = await fetch(`${API_BASE_URL}/api/complaints/${id}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolution_note, resolution_images, officer_name }),
  });

  if (!res.ok) throw new Error("Failed to resolve complaint");
  return res.json();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}
