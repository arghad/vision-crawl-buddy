import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConnectivityResult {
  success: boolean;
  latency?: number;
  error?: string;
  timestamp: string;
  status?: 'healthy' | 'error' | 'unknown';
}

export function useConnectivityTest() {
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<ConnectivityResult | null>(null);

  const testConnectivity = async (): Promise<ConnectivityResult> => {
    setIsTestingConnectivity(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('health', {
        body: {}
      });
      
      const latency = Date.now() - startTime;
      
      if (error) {
        const result: ConnectivityResult = {
          success: false,
          error: error.message || 'Connection failed',
          timestamp: new Date().toISOString()
        };
        setLastTestResult(result);
        return result;
      }
      
      const result: ConnectivityResult = {
        success: true,
        latency,
        timestamp: new Date().toISOString(),
        status: data?.status || 'healthy'
      };
      setLastTestResult(result);
      return result;
      
    } catch (error) {
      const result: ConnectivityResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown connection error',
        timestamp: new Date().toISOString()
      };
      setLastTestResult(result);
      return result;
    } finally {
      setIsTestingConnectivity(false);
    }
  };

  return {
    testConnectivity,
    isTestingConnectivity,
    lastTestResult
  };
}