import { create } from 'zustand';

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
    stage: 'crawling' | 'screenshot' | 'analyzing' | 'completed';
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
    set({
      rootUrl: url,
      isAnalyzing: true,
      pages: [],
      progress: { current: 0, total: 0, stage: 'crawling' }
    });

    // Helper to call Edge Functions reliably with fallback to direct fetch
    const callFunction = async (name: string, body: any) => {
      const { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } = await import("@/integrations/supabase/client");
      try {
        const { data, error } = await supabase.functions.invoke(name, { body });
        if (!error && data) return data as any;
        console.warn(`supabase.functions.invoke(${name}) returned error, falling back:`, error?.message);
      } catch (e) {
        console.warn(`supabase.functions.invoke(${name}) threw, falling back:`, e);
      }

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Function ${name} failed: ${resp.status} ${text}`);
      }
      return await resp.json();
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
          const screenshotData = await callFunction('screenshot', { url: pageUrl });
          const screenshot = screenshotData?.screenshot || '';

          // Analyze with OpenAI
          console.log('Analyzing:', pageUrl);
          const analysisData = await callFunction('analyze', { url: pageUrl, screenshotBase64: screenshot });

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
        progress: { current: 0, total: 0, stage: 'completed' }
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