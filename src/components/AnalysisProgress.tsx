import { useAnalyzer } from "@/store/useAnalyzer";
import { Progress } from "@/components/ui/progress";
import { Globe, Camera, Brain, CheckCircle } from "lucide-react";

const stageIcons = {
  crawling: Globe,
  screenshot: Camera,
  analyzing: Brain,
  completed: CheckCircle
};

const stageLabels = {
  crawling: 'Discovering pages...',
  screenshot: 'Capturing screenshots...',
  analyzing: 'Analyzing with AI...',
  completed: 'Analysis complete!'
};

export function AnalysisProgress() {
  const { isAnalyzing, progress } = useAnalyzer();

  if (!isAnalyzing && progress.stage !== 'completed') {
    return null;
  }

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const Icon = stageIcons[progress.stage];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              progress.stage === 'completed' 
                ? 'bg-analyzer-green/10 border-analyzer-green text-analyzer-green' 
                : 'bg-primary/10 border-primary text-primary'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">{stageLabels[progress.stage]}</h3>
              <p className="text-sm text-muted-foreground">
                {progress.total > 0 && (
                  <>Processing {progress.current} of {progress.total} pages</>
                )}
              </p>
            </div>
          </div>

          {progress.total > 0 && (
            <div className="space-y-2">
              <Progress 
                value={percentage} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress.current} completed</span>
                <span>{Math.round(percentage)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}