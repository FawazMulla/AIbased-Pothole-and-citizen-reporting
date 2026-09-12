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
  UserCheck,
  ShieldCheck,
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
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
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

  const handleRowClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* CMS Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Municipal Authority CMS
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              Live Operations
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Review AI-detected road defect reports, assign engineering teams, and verify repair evidence.
          </p>
        </div>

        {/* Authenticated Officer Ribbon & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {currentUser && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/60 border rounded-md text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="font-semibold text-foreground">{currentUser.name}</span>
                <span className="text-muted-foreground ml-1">({currentUser.department})</span>
              </div>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {onLogout && (
            <Button variant="ghost" size="sm" onClick={onLogout} className="gap-1.5 h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20">
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          )}

          <Button size="sm" onClick={onNavigateToCitizen} variant="secondary" className="h-8 text-xs">
            Citizen View
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Complaints */}
        <Card className="p-4 shadow-sm bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase">Total Complaints</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {stats ? stats.total_complaints : <Skeleton className="h-8 w-12" />}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Registered road defects</p>
        </Card>

        {/* Action Required (New) */}
        <Card className="p-4 shadow-sm bg-card hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase">Action Required</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600">
            {stats ? stats.new_complaints : <Skeleton className="h-8 w-12" />}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Awaiting triage & review</p>
        </Card>

        {/* In Progress */}
        <Card className="p-4 shadow-sm bg-card hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase">In Progress</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {stats ? stats.in_progress : <Skeleton className="h-8 w-12" />}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Assigned for repairs</p>
        </Card>

        {/* Resolved */}
        <Card className="p-4 shadow-sm bg-card hover:border-emerald-400 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {stats ? stats.resolved : <Skeleton className="h-8 w-12" />}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Repairs verified & closed</p>
        </Card>

        {/* High Severity */}
        <Card className="p-4 shadow-sm bg-card hover:border-rose-400 transition-colors col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase text-rose-600">High Severity</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {stats ? stats.high_severity : <Skeleton className="h-8 w-12" />}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Urgent hazard priority</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 shadow-sm bg-card">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Complaint ID (e.g. CMP-2026-0101) or Road Area..."
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border text-xs px-2.5 bg-background"
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
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="h-9 rounded-md border text-xs px-2.5 bg-background"
              >
                <option value="ALL">All Severities</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <Button type="submit" size="sm" className="gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Apply
            </Button>
          </div>
        </form>
      </Card>

      {/* Complaints Table */}
      <Card className="shadow overflow-hidden">
        <CardHeader className="bg-muted/30 border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Road Defect Complaints Log
              </CardTitle>
              <CardDescription className="text-xs">
                Showing {complaints.length} complaint records
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead className="w-[80px]">Photo</TableHead>
                <TableHead>Location / Road Area</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Officer</TableHead>
                <TableHead>Reported Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-12 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : complaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
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
                      <div className="font-medium text-xs text-foreground truncate max-w-xs">
                        {c.address}
                      </div>
                      {c.description && (
                        <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                          {c.description}
                        </div>
                      )}
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
