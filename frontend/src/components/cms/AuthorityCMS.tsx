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
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";
import { Skeleton } from "../ui/skeleton";
import { StatusBadge } from "../shared/StatusBadge";
import { SeverityBadge } from "../shared/SeverityBadge";
import { ComplaintDetailModal } from "./ComplaintDetailModal";
import { AuthorityUser } from "./AuthorityLogin";
import {
  getComplaints,
  getDashboardStats,
  Complaint,
  DashboardStats,
} from "../../services/api";
import {
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Search,
  Filter,
  RefreshCw,
  Eye,
  LogOut,
  MapPin,
  Calendar,
  UserCheck,
  RotateCcw,
} from "lucide-react";

interface AuthorityCMSProps {
  currentUser?: AuthorityUser | null;
  onLogout?: () => void;
  onNavigateToCitizen: () => void;
}

export const AuthorityCMS: React.FC<AuthorityCMSProps> = ({
  currentUser,
  onLogout,
  onNavigateToCitizen,
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [listData, statsData] = await Promise.all([
        getComplaints({
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          severity: severityFilter !== "ALL" ? severityFilter : undefined,
          search: searchQuery.trim() || undefined,
        }),
        getDashboardStats(),
      ]);
      setComplaints(listData);
      setStats(statsData);
    } catch (err: any) {
      console.error("Failed to load CMS data:", err);
      setFetchError(err.message || "Failed to load municipal data from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, severityFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setSeverityFilter("ALL");
    setSearchQuery("");
  };

  const handleRowClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 animate-in fade-in duration-300">
      {/* CMS Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 border-b pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Municipal Authority CMS
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] sm:text-xs">
              Live Operations
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Review AI-detected road defect reports, assign engineering teams, and verify repair evidence.
          </p>
        </div>

        {/* Refresh Action */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </Button>
        </div>
      </div>

      {/* Error Alert if Fetch Failed */}
      {fetchError && (
        <Card className="border-destructive/30 bg-destructive/5 p-4 text-xs sm:text-sm text-destructive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchData} className="h-7 text-xs gap-1">
            <RefreshCw className="w-3 h-3" /> Retry Connection
          </Button>
        </Card>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Total Complaints */}
        <Card className="p-3 sm:p-4 shadow-xs bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Total</span>
            <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground">
            {stats ? stats.total_complaints : <Skeleton className="h-7 sm:h-8 w-10" />}
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Registered defects</p>
        </Card>

        {/* Action Required (New) */}
        <Card className="p-3 sm:p-4 shadow-xs bg-card hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">New / Triage</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-600">
            {stats ? stats.new_complaints : <Skeleton className="h-7 sm:h-8 w-10" />}
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Awaiting review</p>
        </Card>

        {/* In Progress */}
        <Card className="p-3 sm:p-4 shadow-xs bg-card hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">In Progress</span>
            <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600">
            {stats ? stats.in_progress : <Skeleton className="h-7 sm:h-8 w-10" />}
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Assigned for repair</p>
        </Card>

        {/* Resolved */}
        <Card className="p-3 sm:p-4 shadow-xs bg-card hover:border-emerald-400 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Resolved</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
            {stats ? stats.resolved : <Skeleton className="h-7 sm:h-8 w-10" />}
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Repairs closed</p>
        </Card>

        {/* High Severity */}
        <Card className="p-3 sm:p-4 shadow-xs bg-card hover:border-rose-400 transition-colors col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-rose-600 truncate">High Severity</span>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-600">
            {stats ? stats.high_severity : <Skeleton className="h-7 sm:h-8 w-10" />}
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Urgent hazard priority</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 sm:p-4 shadow-xs bg-card">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID (CMP-2026-0101) or Road Area..."
              className="pl-9 text-xs sm:text-sm h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium hidden sm:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto h-9 rounded-md border text-xs px-2.5 bg-background"
                aria-label="Filter by Status"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">NEW</option>
                <option value="UNDER REVIEW">UNDER REVIEW</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium hidden sm:inline">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full sm:w-auto h-9 rounded-md border text-xs px-2.5 bg-background"
                aria-label="Filter by Severity"
              >
                <option value="ALL">All Severities</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <Button type="submit" size="sm" className="gap-1.5 h-9 text-xs">
              <Filter className="w-3.5 h-3.5" />
              Apply
            </Button>

            {(statusFilter !== "ALL" || severityFilter !== "ALL" || searchQuery) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-9 text-xs text-muted-foreground gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Complaints Log Section */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                Road Defect Complaints Log
              </CardTitle>
              <CardDescription className="text-xs">
                Showing {complaints.length} complaint records
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* MOBILE VIEW: Touch-friendly Card List (< md screens) */}
        <div className="block md:hidden divide-y divide-border">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-16 w-20 rounded" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </div>
            ))
          ) : complaints.length === 0 ? (
            <div className="text-center py-10 px-4 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-semibold text-foreground text-sm">No complaints match your filters.</p>
              <p className="text-xs mt-1">Try clearing filters or submitting a new citizen report.</p>
            </div>
          ) : (
            complaints.map((c) => (
              <div
                key={c.id}
                onClick={() => handleRowClick(c)}
                className="p-3 sm:p-4 hover:bg-muted/40 active:bg-muted/70 transition-colors cursor-pointer space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20">
                    {c.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <SeverityBadge severity={c.severity} />
                    <StatusBadge status={c.status} />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <img
                    src={c.annotated_image || c.image}
                    alt="Defect Preview"
                    className="w-20 h-16 object-cover rounded-md border bg-black/80 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1 line-clamp-1">
                      <MapPin className="w-3 h-3 text-primary shrink-0" />
                      {c.address}
                    </div>
                    {c.citizen_name && (
                      <p className="text-[11px] text-primary font-medium truncate mt-0.5">
                        👤 {c.citizen_name} {c.citizen_phone ? `(${c.citizen_phone})` : ""}
                      </p>
                    )}
                    {c.description && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        {c.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
                      <span className="flex items-center gap-1 truncate">
                        <UserCheck className="w-3 h-3" />
                        {c.assigned_officer || "Unassigned"}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs gap-1.5 mt-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRowClick(c);
                  }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Review & Triage Complaint
                </Button>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP VIEW: Full Table (md: and above) */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">ID</TableHead>
                <TableHead className="w-[70px]">Photo</TableHead>
                <TableHead>Location / Road Area</TableHead>
                <TableHead>Citizen Contact</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Officer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-12 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : complaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="font-semibold text-foreground">No complaints match your filters.</p>
                    <p className="text-xs mt-1">Try clearing filters or submitting a new citizen report.</p>
                  </TableCell>
                </TableRow>
              ) : (
                complaints.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/60 transition-colors"
                    onClick={() => handleRowClick(c)}
                  >
                    <TableCell className="font-mono font-bold text-xs text-primary">
                      {c.id}
                    </TableCell>
                    <TableCell>
                      <img
                        src={c.annotated_image || c.image}
                        alt="Defect Preview"
                        className="w-12 h-10 object-cover rounded border bg-black/80"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs text-foreground truncate max-w-[200px]">
                        {c.address}
                      </div>
                      {c.description && (
                        <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                          {c.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-foreground truncate max-w-[160px]">
                        {c.citizen_name || "Citizen"}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                        {c.citizen_phone || c.citizen_email || "No direct phone"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={c.severity} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.assigned_officer || "Unassigned"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(c);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Complaint Detail & Workflow Modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onComplaintUpdated={() => {
          fetchData();
          setIsDetailOpen(false);
        }}
      />
    </div>
  );
};
