import { create } from 'zustand';
import { useSettings } from './useSettings';

export interface PageAnalysis {
  url: string;
  screenshot: string; // base64 or URL
  title: string;
  purpose: string;
  main_features: string[];
  possible_user_actions: string[];
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  error?: string;
}

interface AnalyzerStore {
  isAnalyzing: boolean;
  rootUrl: string;
  pages: PageAnalysis[];
  progress: {
    current: number;
    total: number;
    stage: 'crawling' | 'screenshot' | 'analyzing' | 'completed' | 'failed';
  };
  
  // Actions
  setRootUrl: (url: string) => void;
  startAnalysis: (url: string) => Promise<void>;
  updateProgress: (progress: Partial<AnalyzerStore['progress']>) => void;
  addPage: (page: PageAnalysis) => void;
  updatePage: (url: string, updates: Partial<PageAnalysis>) => void;
  reset: () => void;
}

// Removed mock pages; analysis is now fully dynamic
const mockPages: PageAnalysis[] = [];

export const useAnalyzer = create<AnalyzerStore>((set, get) => ({
  isAnalyzing: false,
  rootUrl: '',
  pages: [],
  progress: {
    current: 0,
    total: 0,
    stage: 'crawling'
  },

  setRootUrl: (url) => set({ rootUrl: url }),

  startAnalysis: async (url) => {
    set({ isAnalyzing: true, rootUrl: url, pages: [], progress: { current: 0, total: 0, stage: 'crawling' } });

    // Get API keys from settings
    const settings = useSettings.getState();
    const { screenshotOneApiKey, openaiApiKey, hasValidScreenshotOneKey, hasValidOpenaiKey } = settings;

    // Check if required API keys are available
    if (!hasValidScreenshotOneKey() || !hasValidOpenaiKey()) {
      set({ 
        isAnalyzing: false,
        progress: { 
          current: 0, 
          total: 0, 
          stage: 'completed'
        }
      });
      return;
    }

    // Helper to call Edge Functions with retry logic and proper error handling
    const callFunction = async (name: string, body: any, retries = 2) => {
      const { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_FUNCTIONS_URL } = await import("@/integrations/supabase/client");
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          // Try using supabase client first
          const { data, error } = await supabase.functions.invoke(name, { 
            body,
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!error && data) {
            console.log(`${name} function succeeded via supabase client`);
            return data as any;
          }
          
          if (error) {
            console.warn(`supabase.functions.invoke(${name}) error:`, error.message);
            if (attempt === retries) throw new Error(error.message);
          }
        } catch (e: any) {
          console.warn(`supabase.functions.invoke(${name}) attempt ${attempt + 1} failed:`, e.message);
          if (attempt === retries) {
            // Last attempt - try direct fetch as fallback
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 60000);
              
              const resp = await fetch(`${SUPABASE_FUNCTIONS_URL}/${name}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                  'apikey': SUPABASE_ANON_KEY,
                },
                body: JSON.stringify(body),
                signal: controller.signal,
              });
              
              clearTimeout(timeoutId);
              
              if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`Function ${name} failed: ${resp.status} ${text}`);
              }
              
              const result = await resp.json();
              console.log(`${name} function succeeded via direct fetch`);
              return result;
            } catch (fetchError: any) {
              console.error(`Final attempt for ${name} failed:`, fetchError.message);
              throw new Error(`Function ${name} failed after all retries: ${fetchError.message}`);
            }
          }
        }
        
        // Wait before retry
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    };

    try {
      // Step 1: Crawl for pages
      console.log('Starting crawl for:', url);
      const crawlData = await callFunction('crawler', { rootUrl: url });

      const urls: { url: string }[] = crawlData?.urls || crawlData?.links?.map((u: string) => ({ url: u })) || [];
      console.log('Found URLs:', urls);

      set({
        progress: { current: 0, total: urls.length, stage: 'screenshot' },
        pages: urls.map((item: any) => ({
          url: item.url,
          screenshot: '',
          title: '',
          purpose: '',
          main_features: [],
          possible_user_actions: [],
          status: 'pending' as const
        }))
      });

      // Step 2: Process each URL (screenshot + analyze)
      for (let i = 0; i < urls.length; i++) {
        const urlData = urls[i];
        const pageUrl = urlData.url;

        try {
          // Update status to analyzing
          set(state => ({
            pages: state.pages.map(page => 
              page.url === pageUrl ? { ...page, status: 'analyzing' as const } : page
            )
          }));

          // Take screenshot
          console.log('Taking screenshot for:', pageUrl);
          const screenshotData = await callFunction('screenshot', { 
            url: pageUrl, 
            screenshotOneApiKey 
          });
          const screenshot = screenshotData?.screenshot || '';

          // Analyze with OpenAI
          console.log('Analyzing:', pageUrl);
          const analysisData = await callFunction('analyze', { 
            url: pageUrl, 
            screenshotBase64: screenshot,
            openaiApiKey
          });

          // Update page with results
          set(state => ({
            pages: state.pages.map(page => 
              page.url === pageUrl ? {
                ...page,
                screenshot: screenshot,
                title: analysisData?.title || `Page: ${pageUrl}`,
                purpose: analysisData?.purpose || 'Website page',
                main_features: analysisData?.main_features || [],
                possible_user_actions: analysisData?.possible_user_actions || [],
                status: 'completed' as const
              } : page
            ),
            progress: {
              current: i + 1,
              total: urls.length,
              stage: i === urls.length - 1 ? 'completed' : 'analyzing'
            }
          }));

        } catch (pageError: any) {
          console.error(`Error processing ${pageUrl}:`, pageError);
          // Update page with error status
          set(state => ({
            pages: state.pages.map(page => 
              page.url === pageUrl ? {
                ...page,
                status: 'error' as const,
                error: pageError?.message || 'Unknown error'
              } : page
            )
          }));
        }
      }

      set({ isAnalyzing: false });

    } catch (error) {
      console.error('Analysis failed:', error);
      set({ 
        isAnalyzing: false,
        progress: { current: 0, total: 0, stage: 'failed' }
      });
    }
  },

  updateProgress: (progress) => set((state) => ({
    progress: { ...state.progress, ...progress }
  })),

  addPage: (page) => set((state) => ({
    pages: [...state.pages, page]
  })),

  updatePage: (url, updates) => set((state) => ({
    pages: state.pages.map(page => 
      page.url === url ? { ...page, ...updates } : page
    )
  })),

  reset: () => set({
    isAnalyzing: false,
    rootUrl: '',
    pages: [],
    progress: { current: 0, total: 0, stage: 'crawling' }
  })
}));