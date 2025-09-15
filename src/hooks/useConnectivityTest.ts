import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConnectivityResult {
  success: boolean;
  latency?: number;
  error?: string;
  timestamp: string;
  status?: 'healthy' | 'error' | 'unknown';
  method?: 'supabase-client' | 'direct-fetch';
  networkIssue?: boolean;
}

export function useConnectivityTest() {
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<ConnectivityResult | null>(null);

  const testConnectivity = async (): Promise<ConnectivityResult> => {
    setIsTestingConnectivity(true);
    const startTime = Date.now();
    
    // First try: Supabase client method
    try {
      const { data, error } = await supabase.functions.invoke('health', {
        body: {}
      });
      
      const latency = Date.now() - startTime;
      
      if (error) {
        // If Supabase client fails, try direct fetch
        return await tryDirectFetch(startTime);
      }
      
      const result: ConnectivityResult = {
        success: true,
        latency,
        timestamp: new Date().toISOString(),
        status: data?.status || 'healthy',
        method: 'supabase-client'
      };
      setLastTestResult(result);
      return result;
      
    } catch (error) {
      // If Supabase client fails, try direct fetch
      return await tryDirectFetch(startTime);
    } finally {
      setIsTestingConnectivity(false);
    }
  };

  const tryDirectFetch = async (originalStartTime: number): Promise<ConnectivityResult> => {
    try {
      const directStartTime = Date.now();
      const response = await fetch('https://prnzuoladzdixamlxmrv.functions.supabase.co/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const latency = Date.now() - directStartTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const result: ConnectivityResult = {
        success: true,
        latency,
        timestamp: new Date().toISOString(),
        status: data?.status || 'healthy',
        method: 'direct-fetch'
      };
      setLastTestResult(result);
      return result;
      
    } catch (error) {
      const isNetworkError = error instanceof Error && (
        error.message.includes('ERR_CONNECTION_RESET') ||
        error.message.includes('ERR_NETWORK') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      );
      
      const result: ConnectivityResult = {
        success: false,
        error: isNetworkError 
          ? 'Network blocked (VPN/firewall/proxy may be blocking Supabase Functions)'
          : error instanceof Error ? error.message : 'Unknown connection error',
        timestamp: new Date().toISOString(),
        networkIssue: isNetworkError
      };
      setLastTestResult(result);
      return result;
    }
  };

  return {
    testConnectivity,
    isTestingConnectivity,
    lastTestResult
  };
}