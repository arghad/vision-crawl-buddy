import { useState } from 'react';
import { AlertTriangle, X, ExternalLink, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useConnectivityTest } from '@/hooks/useConnectivityTest';
import { SUPABASE_FUNCTIONS_URL } from '@/integrations/supabase/client';

interface ConnectivityBannerProps {
  onRetry?: () => void;
}

export function ConnectivityBanner({ onRetry }: ConnectivityBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { testConnectivity, isTestingConnectivity } = useConnectivityTest();

  const handleRetryTest = async () => {
    const result = await testConnectivity();
    if (result.success && onRetry) {
      onRetry();
    }
  };

  const openHealthCheck = () => {
    window.open(`${SUPABASE_FUNCTIONS_URL}/health`, '_blank');
  };

  if (isDismissed) return null;

  return (
    <Alert className="mx-4 mb-4 border-destructive bg-destructive/10">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <strong className="text-destructive">Cannot reach Supabase Functions from this network.</strong>
          <p className="text-sm text-muted-foreground mt-1">
            This is usually caused by VPN, firewall, or corporate network restrictions. 
            Try disabling VPN, switching networks, or contact your IT administrator.
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={openHealthCheck}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Test URL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryTest}
            disabled={isTestingConnectivity}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isTestingConnectivity ? 'animate-spin' : ''}`} />
            Retry
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}