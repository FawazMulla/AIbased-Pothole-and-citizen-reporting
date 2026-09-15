import React from "react";
import { Badge } from "../ui/badge";
import { DefectSeverity } from "../../services/api";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface SeverityBadgeProps {
  severity: DefectSeverity | string;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className }) => {
  switch (severity) {
    case "HIGH":
      return (
        <Badge variant="destructive" className={`bg-rose-600 hover:bg-rose-700 text-white gap-1 px-2.5 py-0.5 font-bold ${className || ""}`}>
          <AlertCircle className="w-3 h-3" />
          <span>HIGH SEVERITY</span>
        </Badge>
      );
    case "MEDIUM":
      return (
        <Badge variant="warning" className={`bg-amber-500 hover:bg-amber-600 text-white gap-1 px-2.5 py-0.5 font-semibold ${className || ""}`}>
          <AlertTriangle className="w-3 h-3" />
          <span>MEDIUM SEVERITY</span>
        </Badge>
      );
    case "LOW":
      return (
        <Badge variant="secondary" className={`bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 gap-1 px-2.5 py-0.5 ${className || ""}`}>
          <Info className="w-3 h-3" />
          <span>LOW SEVERITY</span>
        </Badge>
      );
    default:
      return <Badge variant="outline" className={className}>{severity}</Badge>;
  }
};
