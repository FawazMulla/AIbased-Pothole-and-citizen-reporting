import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { ExternalLink, ShieldCheck, Cpu } from "lucide-react";

interface AttributionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AttributionModal: React.FC<AttributionModalProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <DialogTitle>Open-Source AI Model Attribution</DialogTitle>
          </div>
          <DialogDescription>
            Provenances and architectural components powering this civic platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground mt-2">
          <div className="p-3 bg-muted rounded-lg border border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-foreground">Base YOLOv8 Model</span>
              <Badge variant="outline">Apache 2.0</Badge>
            </div>
            <p className="text-xs">
              <strong>PeterHdd/pothole-detection-yolo</strong> fine-tuned on benchmark road datasets with GPU/CPU inference.
            </p>
            <a
              href="https://github.com/PeterHdd/pothole-detection-yolo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2 font-medium"
            >
              GitHub Repository <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3 bg-muted rounded-lg border border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-foreground">Weights & Dataset</span>
              <Badge variant="secondary">HuggingFace</Badge>
            </div>
            <p className="text-xs">
              Pretrained checkpoint weights: <code>peterhdd/pothole-detection-yolov8</code> trained on <code>Ryukijano/Pothole-detection-Yolov8</code>.
            </p>
          </div>

          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-2 text-foreground font-medium mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Platform Contribution</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Our engineering work encompasses the complete citizen mobile/web reporting portal, GPS telemetry, FastAPI lifecycle endpoints, municipal complaint database, authority CMS dashboard, and repair verification workflows.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
