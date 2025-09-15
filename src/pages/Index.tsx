import { AnalyzerHeader } from "@/components/AnalyzerHeader";
import { AnalyzerInput } from "@/components/AnalyzerInput";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { AnalysisResults } from "@/components/AnalysisResults";
import { ConnectivityBanner } from "@/components/ConnectivityBanner";
import { useAnalyzer } from "@/store/useAnalyzer";

const Index = () => {
  const { progress, startAnalysis, rootUrl } = useAnalyzer();
  
  const showConnectivityBanner = progress.stage === 'failed' && 
    progress.error?.includes('EDGE_CONNECTIVITY_RESET');

  const handleRetryAfterConnectivity = () => {
    if (rootUrl) {
      startAnalysis(rootUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnalyzerHeader />
      {showConnectivityBanner && (
        <ConnectivityBanner onRetry={handleRetryAfterConnectivity} />
      )}
      <AnalyzerInput />
      <AnalysisProgress />
      <AnalysisResults />
    </div>
  );
};

export default Index;
