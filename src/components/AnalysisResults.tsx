import { useAnalyzer } from "@/store/useAnalyzer";
import { PageCard } from "./PageCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Share2 } from "lucide-react";

export function AnalysisResults() {
  const { pages, rootUrl, reset, isAnalyzing } = useAnalyzer();

  if (pages.length === 0) {
    return null;
  }

  const completedPages = pages.filter(p => p.status === 'completed');
  const totalFeatures = completedPages.reduce((sum, page) => sum + page.main_features.length, 0);

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Analysis Results</h2>
          <p className="text-muted-foreground">
            Found {pages.length} pages • {completedPages.length} analyzed • {totalFeatures} features discovered
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={reset}
            disabled={isAnalyzing}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
          
          {completedPages.length > 0 && (
            <>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </>
          )}
        </div>
      </div>

      {/* URL Badge */}
      <div className="mb-6">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium text-primary">Analyzing:</span>
          <span className="text-sm text-muted-foreground ml-2">{rootUrl}</span>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {pages.map((page) => (
          <PageCard key={page.url} page={page} />
        ))}
      </div>

      {/* Summary Stats */}
      {completedPages.length > 0 && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{pages.length}</div>
            <div className="text-sm text-muted-foreground">Pages Discovered</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-analyzer-green mb-2">{totalFeatures}</div>
            <div className="text-sm text-muted-foreground">Features Identified</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-analyzer-purple mb-2">
              {completedPages.reduce((sum, page) => sum + page.possible_user_actions.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">User Actions Found</div>
          </div>
        </div>
      )}
    </div>
  );
}