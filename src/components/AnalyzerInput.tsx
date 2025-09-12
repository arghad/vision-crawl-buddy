import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Globe, Loader2 } from "lucide-react";
import { useAnalyzer } from "@/store/useAnalyzer";

export function AnalyzerInput() {
  const [url, setUrl] = useState("https://example.com");
  const { isAnalyzing, startAnalysis } = useAnalyzer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && !isAnalyzing) {
      startAnalysis(url);
    }
  };

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="url"
              placeholder="Enter website URL to analyze..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-12 h-14 text-lg bg-card border-2 border-border hover:border-primary/50 focus:border-primary transition-colors"
              disabled={isAnalyzing}
            />
          </div>
          
          <Button 
            type="submit" 
            size="lg"
            disabled={!url || !isValidUrl(url) || isAnalyzing}
            className="w-full h-14 text-lg font-semibold bg-analyzer-gradient hover:opacity-90 transition-opacity shadow-analyzer-glow"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Website...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Start Analysis
              </>
            )}
          </Button>
        </form>

        {isAnalyzing && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            This may take a few moments while we crawl and analyze each page
          </p>
        )}
      </div>
    </div>
  );
}