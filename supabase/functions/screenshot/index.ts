import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to add timeout to fetch requests
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('url is required');
    }

    const screenshotOneApiKey = Deno.env.get('SCREENSHOTONE_API_KEY');
    if (!screenshotOneApiKey) {
      throw new Error('SCREENSHOTONE_API_KEY not configured');
    }

    console.log('Taking screenshot of:', url);

    // ScreenshotOne API call
    const screenshotUrl = new URL('https://api.screenshotone.com/take');
    screenshotUrl.searchParams.set('access_key', screenshotOneApiKey);
    screenshotUrl.searchParams.set('url', url);
    screenshotUrl.searchParams.set('format', 'png');
    screenshotUrl.searchParams.set('viewport_width', '1200');
    screenshotUrl.searchParams.set('viewport_height', '800');
    screenshotUrl.searchParams.set('device_scale_factor', '1');
    screenshotUrl.searchParams.set('format', 'png');
    screenshotUrl.searchParams.set('image_quality', '80');
    screenshotUrl.searchParams.set('cache', 'true');
    screenshotUrl.searchParams.set('cache_ttl', '2592000');

    const response = await fetchWithTimeout(screenshotUrl.toString(), {}, 45000);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ScreenshotOne API error:', errorText);
      throw new Error(`Screenshot API failed: ${response.status} - ${errorText}`);
    }

    // Convert to base64
    const imageBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const dataUrl = `data:image/png;base64,${base64}`;

    console.log('Screenshot taken successfully for:', url);

    return new Response(
      JSON.stringify({ 
        screenshot: dataUrl,
        url: url 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in screenshot function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        screenshot: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop' // Fallback
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});