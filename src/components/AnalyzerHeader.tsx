import { Zap, Brain, Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSettings } from "@/store/useSettings";

export function AnalyzerHeader() {
  const { hasValidScreenshotOneKey, hasValidOpenaiKey } = useSettings();
  const hasRequiredKeys = hasValidScreenshotOneKey() && hasValidOpenaiKey();
  
  return (
    <header className="relative overflow-hidden border-b border-border bg-card">
      <div className="absolute inset-0 bg-analyzer-gradient opacity-5" />
      <div className="container relative mx-auto px-6 py-12">
        <div className="absolute top-4 right-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/settings">
              <Settings className="w-4 h-4 mr-2" />
              API Settings
              {!hasRequiredKeys && (
                <span className="ml-2 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-analyzer-purple bg-clip-text text-transparent">
            Web Feature Analyzer
          </h1>
        </div>
        
        <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
          Automatically crawl, screenshot, and analyze website features using AI vision.
          Discover what makes websites tick with intelligent feature extraction.
        </p>

        <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-primary" />
            <span>Auto Crawling</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-analyzer-green" />
            <span>AI Analysis</span>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-analyzer-purple" />
            <span>Visual Intelligence</span>
          </div>
        </div>
      </div>
    </header>
  );
}