import React from "react";
import { Badge } from "../ui/badge";
import { ComplaintStatus } from "../../services/api";
import {
  Clock,
  Search,
  CheckCircle2,
  UserCheck,
  Wrench,
  CheckCheck,
  XCircle,
} from "lucide-react";

interface StatusBadgeProps {
  status: ComplaintStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  switch (status) {
    case "NEW":
      return (
        <Badge variant="default" className={`bg-blue-600 hover:bg-blue-700 text-white gap-1 px-2.5 py-1 ${className}`}>
          <Clock className="w-3 h-3" />
          <span>NEW</span>
        </Badge>
      );
    case "UNDER REVIEW":
      return (
        <Badge variant="secondary" className={`bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 gap-1 px-2.5 py-1 ${className}`}>
          <Search className="w-3 h-3" />
          <span>UNDER REVIEW</span>
        </Badge>
      );
    case "VERIFIED":
      return (
        <Badge variant="info" className={`bg-cyan-600 text-white gap-1 px-2.5 py-1 ${className}`}>
          <CheckCircle2 className="w-3 h-3" />
          <span>VERIFIED</span>
        </Badge>
      );
    case "ASSIGNED":
      return (
        <Badge variant="secondary" className={`bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 gap-1 px-2.5 py-1 ${className}`}>
          <UserCheck className="w-3 h-3" />
          <span>ASSIGNED</span>
        </Badge>
      );
    case "IN PROGRESS":
      return (
        <Badge variant="warning" className={`bg-amber-500 text-white gap-1 px-2.5 py-1 ${className}`}>
          <Wrench className="w-3 h-3 animate-spin-slow" />
          <span>IN PROGRESS</span>
        </Badge>
      );
    case "RESOLVED":
      return (
        <Badge variant="success" className={`bg-emerald-600 text-white gap-1 px-2.5 py-1 ${className}`}>
          <CheckCheck className="w-3 h-3" />
          <span>RESOLVED</span>
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive" className={`gap-1 px-2.5 py-1 ${className}`}>
          <XCircle className="w-3 h-3" />
          <span>REJECTED</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={`gap-1 ${className}`}>
          <span>{status}</span>
        </Badge>
      );
  }
};
