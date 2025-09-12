import { AnalyzerHeader } from "@/components/AnalyzerHeader";
import { AnalyzerInput } from "@/components/AnalyzerInput";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { AnalysisResults } from "@/components/AnalysisResults";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AnalyzerHeader />
      <AnalyzerInput />
      <AnalysisProgress />
      <AnalysisResults />
    </div>
  );
};

export default Index;
