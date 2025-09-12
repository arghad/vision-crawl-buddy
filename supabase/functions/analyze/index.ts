import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, screenshotBase64 } = await req.json();
    
    if (!url || !screenshotBase64) {
      throw new Error('url and screenshotBase64 are required');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Analyzing screenshot for:', url);

    const systemPrompt = `You are analyzing a webpage screenshot. Your task is to identify the page's purpose, main features, and possible user actions based on what you can see in the screenshot.

Return your analysis as a JSON object with this exact structure:
{
  "title": "The page title or main heading",
  "purpose": "Brief description of what this page is for",
  "main_features": ["Feature 1", "Feature 2", "Feature 3"],
  "possible_user_actions": ["Action 1", "Action 2", "Action 3"]
}

Focus on visible UI elements, navigation, forms, buttons, content sections, and interactive components.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        max_completion_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this webpage screenshot from ${url}:`
              },
              {
                type: 'image_url',
                image_url: {
                  url: screenshotBase64
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', analysisText);
      // Fallback analysis
      analysis = {
        title: `Page: ${new URL(url).pathname}`,
        purpose: 'Website page with various features and content',
        main_features: ['Navigation menu', 'Content sections', 'Interactive elements'],
        possible_user_actions: ['Browse content', 'Navigate to other pages', 'Interact with elements']
      };
    }

    console.log('Analysis completed for:', url);

    return new Response(
      JSON.stringify({
        url,
        ...analysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        url: url || 'unknown',
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