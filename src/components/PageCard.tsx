import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageAnalysis } from "@/store/useAnalyzer";
import { ExternalLink, Eye, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { PageDetailModal } from "./PageDetailModal";

interface PageCardProps {
  page: PageAnalysis;
}

const statusConfig = {
  pending: { 
    icon: Loader2, 
    label: 'Queued', 
    className: 'bg-muted text-muted-foreground',
    spin: false
  },
  analyzing: { 
    icon: Loader2, 
    label: 'Analyzing', 
    className: 'bg-primary/10 text-primary border-primary/20',
    spin: true
  },
  completed: { 
    icon: CheckCircle, 
    label: 'Complete', 
    className: 'bg-analyzer-green/10 text-analyzer-green border-analyzer-green/20',
    spin: false
  },
  error: { 
    icon: AlertCircle, 
    label: 'Error', 
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    spin: false
  }
};

export function PageCard({ page }: PageCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const status = statusConfig[page.status];
  const StatusIcon = status.icon;

  return (
    <>
      <Card className="group hover:shadow-analyzer transition-all duration-300 hover:-translate-y-1 bg-card border-border">
        <CardContent className="p-4 space-y-4">
          {/* Screenshot */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border">
            {page.screenshot && (
              <>
                <img
                  src={page.screenshot}
                  alt={`Screenshot of ${page.url}`}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </>
            )}
            
            {/* Status overlay */}
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className={`${status.className} border`}>
                <StatusIcon className={`w-3 h-3 mr-1 ${status.spin ? 'animate-spin' : ''}`} />
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-card-foreground line-clamp-1">
                {page.title || new URL(page.url).pathname}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {page.url}
              </p>
            </div>

            {page.status === 'completed' && (
              <>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {page.purpose}
                </p>

                <div className="space-y-2">
                  <div>
                    <h4 className="text-xs font-medium text-card-foreground mb-1">Key Features</h4>
                    <div className="flex flex-wrap gap-1">
                      {page.main_features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {page.main_features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{page.main_features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(page.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}

            {page.status === 'error' && page.error && (
              <p className="text-sm text-destructive">
                {page.error}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <PageDetailModal
        page={page}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}