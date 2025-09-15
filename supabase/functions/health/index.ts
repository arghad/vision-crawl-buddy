import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Simple health check that returns current time and basic system info
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'supabase-edge-functions',
      region: Deno.env.get('DENO_REGION') || 'unknown',
      uptime: Date.now(),
    };

    return new Response(
      JSON.stringify(healthData),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});