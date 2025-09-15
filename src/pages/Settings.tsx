import { useState } from 'react';
import { useSettings } from '@/store/useSettings';
import { useConnectivityTest } from '@/hooks/useConnectivityTest';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Settings as SettingsIcon, Eye, EyeOff, ExternalLink, Shield, AlertTriangle, CheckCircle2, Wifi, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  const {
    screenshotOneApiKey,
    openaiApiKey,
    setScreenshotOneApiKey,
    setOpenaiApiKey,
    clearSettings,
    hasValidScreenshotOneKey,
    hasValidOpenaiKey,
  } = useSettings();
  
  const { testConnectivity, isTestingConnectivity, lastTestResult } = useConnectivityTest();

  const [showScreenshotKey, setShowScreenshotKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [localScreenshotKey, setLocalScreenshotKey] = useState(screenshotOneApiKey);
  const [localOpenaiKey, setLocalOpenaiKey] = useState(openaiApiKey);

  const handleSave = () => {
    setScreenshotOneApiKey(localScreenshotKey);
    setOpenaiApiKey(localOpenaiKey);
    toast({
      title: "Settings saved",
      description: "Your API keys have been saved to this browser session.",
    });
  };

  const handleClear = () => {
    clearSettings();
    setLocalScreenshotKey('');
    setLocalOpenaiKey('');
    toast({
      title: "Settings cleared",
      description: "All API keys have been removed from this browser session.",
    });
  };

  const handleConnectivityTest = async () => {
    const result = await testConnectivity();
    
    if (result.success) {
      toast({
        title: "Connection successful",
        description: `Connected to Supabase Edge Functions in ${result.latency}ms`,
      });
    } else {
      toast({
        title: "Connection failed",
        description: result.error || "Unable to reach Supabase Edge Functions",
        variant: "destructive",
      });
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 6) + '...' + key.substring(key.length - 4);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Analyzer
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">API Configuration</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Security Warning */}
        <Alert className="mb-6 border-amber-500/20 bg-amber-500/10">
          <Shield className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <strong>Security Notice:</strong> API keys are stored in your browser session and will be cleared when you close the browser. 
            Never share your browser session or API keys with others.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {/* Connectivity Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="w-5 h-5 text-primary" />
                <span>Connection Test</span>
              </CardTitle>
              <CardDescription>
                Test connectivity to Supabase Edge Functions to diagnose connection issues.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Edge Functions Status</p>
                  {lastTestResult && (
                    <p className="text-xs text-muted-foreground">
                      Last tested: {new Date(lastTestResult.timestamp).toLocaleTimeString()}
                      {lastTestResult.success && lastTestResult.latency && (
                        <span className="text-analyzer-green"> • {lastTestResult.latency}ms</span>
                      )}
                      {!lastTestResult.success && (
                        <span className="text-destructive"> • Failed</span>
                      )}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleConnectivityTest}
                  disabled={isTestingConnectivity}
                  variant="outline"
                >
                  {isTestingConnectivity ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
              {lastTestResult && !lastTestResult.success && (
                <Alert className="border-destructive/20 bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive/90">
                    <strong>Connection failed:</strong> {lastTestResult.error}
                    <br />
                    <span className="text-sm">
                      Try checking your network connection, VPN settings, or corporate firewall. 
                      If the issue persists, contact your network administrator.
                    </span>
                  </AlertDescription>
                </Alert>
              )}
              {lastTestResult && lastTestResult.success && (
                <Alert className="border-analyzer-green/20 bg-analyzer-green/10">
                  <CheckCircle2 className="h-4 w-4 text-analyzer-green" />
                  <AlertDescription className="text-analyzer-green/90">
                    <strong>Connection successful!</strong> Edge Functions are reachable.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* ScreenshotOne API Key */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>ScreenshotOne Access Key</span>
                    {hasValidScreenshotOneKey() && <CheckCircle2 className="w-4 h-4 text-analyzer-green" />}
                    {!hasValidScreenshotOneKey() && screenshotOneApiKey && <AlertTriangle className="w-4 h-4 text-destructive" />}
                  </CardTitle>
                  <CardDescription>
                    Required for taking website screenshots. Get your Access Key from ScreenshotOne dashboard.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://screenshotone.com/dashboard/api-keys" target="_blank" rel="noopener noreferrer">
                    Get Access Key <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="screenshot-key">Access Key</Label>
                <div className="relative">
                  <Input
                    id="screenshot-key"
                    type={showScreenshotKey ? "text" : "password"}
                    placeholder="bg8Rs8eabCiV"
                    value={localScreenshotKey}
                    onChange={(e) => setLocalScreenshotKey(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowScreenshotKey(!showScreenshotKey)}
                  >
                    {showScreenshotKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {localScreenshotKey && !/^[a-zA-Z0-9]+$/.test(localScreenshotKey) && (
                  <p className="text-sm text-destructive">Access key should contain only letters and numbers</p>
                )}
              </div>
              {screenshotOneApiKey && (
                <div className="text-sm text-muted-foreground">
                  Current key: {maskKey(screenshotOneApiKey)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* OpenAI API Key */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>OpenAI API Key</span>
                    {hasValidOpenaiKey() && <CheckCircle2 className="w-4 h-4 text-analyzer-green" />}
                    {!hasValidOpenaiKey() && openaiApiKey && <AlertTriangle className="w-4 h-4 text-destructive" />}
                  </CardTitle>
                  <CardDescription>
                    Required for AI-powered website analysis. Get your API key from OpenAI.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                    Get API Key <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="openai-key"
                    type={showOpenaiKey ? "text" : "password"}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={localOpenaiKey}
                    onChange={(e) => setLocalOpenaiKey(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  >
                    {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {localOpenaiKey && !localOpenaiKey.startsWith('sk-') && (
                  <p className="text-sm text-destructive">API key should start with "sk-"</p>
                )}
              </div>
              {openaiApiKey && (
                <div className="text-sm text-muted-foreground">
                  Current key: {maskKey(openaiApiKey)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="destructive" onClick={handleClear}>
              Clear All Keys
            </Button>
            <div className="space-x-2">
              <Button variant="outline" asChild>
                <Link to="/">Cancel</Link>
              </Button>
              <Button onClick={handleSave}>
                Save Settings
              </Button>
            </div>
          </div>

          {/* Info */}
          <Alert>
            <AlertDescription>
              <strong>How it works:</strong> Your API keys are stored securely in your browser session and used directly 
              for API calls. This ensures you have full control over your usage and costs. Keys are automatically cleared 
              when you close your browser for security.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default Settings;