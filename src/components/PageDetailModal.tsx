import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageAnalysis } from "@/store/useAnalyzer";
import { ExternalLink, Globe, Target, Zap, MousePointer } from "lucide-react";

interface PageDetailModalProps {
  page: PageAnalysis;
  isOpen: boolean;
  onClose: () => void;
}

export function PageDetailModal({ page, isOpen, onClose }: PageDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>{page.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Screenshot */}
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted">
              {page.screenshot && (
                <img
                  src={page.screenshot}
                  alt={`Screenshot of ${page.url}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground break-all">
                {page.url}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(page.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit
              </Button>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            {/* Purpose */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-analyzer-purple" />
                <h3 className="font-semibold">Purpose</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {page.purpose}
              </p>
            </div>

            {/* Main Features */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-analyzer-green" />
                <h3 className="font-semibold">Main Features</h3>
              </div>
              <div className="space-y-2">
                {page.main_features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-analyzer-green mt-2 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User Actions */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MousePointer className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Possible User Actions</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {page.possible_user_actions.map((action, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Analysis Metadata */}
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Analysis Info</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {page.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Features Found:</span>
                  <span className="ml-2 font-medium">{page.main_features.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}