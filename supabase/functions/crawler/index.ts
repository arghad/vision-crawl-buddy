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
    const { rootUrl } = await req.json();
    
    if (!rootUrl) {
      throw new Error('rootUrl is required');
    }

    console.log('Crawling URL:', rootUrl);

    // Fetch the HTML content with timeout
    const response = await fetchWithTimeout(rootUrl, {}, 15000);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${rootUrl}: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse HTML and extract links
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    const links = new Set<string>();
    let match;

    // Extract the base domain for filtering
    const baseUrl = new URL(rootUrl);
    const baseDomain = baseUrl.origin;

    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1];
      
      // Skip email links, javascript, and fragments
      if (href.startsWith('mailto:') || href.startsWith('javascript:') || href.startsWith('#')) {
        continue;
      }

      // Convert relative URLs to absolute
      if (href.startsWith('/')) {
        href = baseDomain + href;
      } else if (href.startsWith('./')) {
        href = baseDomain + href.substring(1);
      } else if (!href.startsWith('http')) {
        href = baseDomain + '/' + href;
      }

      // Only include links from the same domain
      try {
        const linkUrl = new URL(href);
        if (linkUrl.origin === baseDomain) {
          links.add(href);
        }
      } catch (e) {
        console.warn('Invalid URL:', href);
      }

      // Limit to 20 links max
      if (links.size >= 20) {
        break;
      }
    }

    // Always include the root URL
    links.add(rootUrl);

    const uniqueLinks = Array.from(links).slice(0, 20);
    console.log(`Found ${uniqueLinks.length} internal links`);

    return new Response(
      JSON.stringify({ 
        urls: uniqueLinks.map(url => ({ url })),
        count: uniqueLinks.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in crawler function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});