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

  let requestUrl: string | undefined;

  try {
    const { url, screenshotBase64 } = await req.json();
    requestUrl = url;

    if (!url || !screenshotBase64) {
      throw new Error('url and screenshotBase64 are required');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Analyzing screenshot for:', url);

    const systemPrompt = `Analyze this webpage screenshot at ${url}. Return JSON with exactly these keys:
{
  "title": "The page title or main heading",
  "purpose": "Brief description of what this page is for",
  "main_features": ["Feature 1", "Feature 2", "Feature 3"],
  "possible_user_actions": ["Action 1", "Action 2", "Action 3"]
}`;

    const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        max_completion_tokens: 800,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Analyze this screenshot from ${url}` },
              { type: 'image_url', image_url: { url: screenshotBase64 } }
            ]
          }
        ]
      }),
    }, 60000);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content ?? '';

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      console.warn('OpenAI did not return pure JSON. Wrapping fallback.');
      analysis = {
        title: `Page: ${new URL(url).pathname || '/'}`,
        purpose: 'Automated analysis summary',
        main_features: [analysisText.slice(0, 120)],
        possible_user_actions: []
      };
    }

    return new Response(JSON.stringify({ url, ...analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze function:', error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message,
        url: requestUrl ?? 'unknown',
        title: 'Analysis Error',
        purpose: 'Could not analyze this page',
        main_features: ['Error occurred'],
        possible_user_actions: ['Retry analysis']
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
