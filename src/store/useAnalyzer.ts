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
  startAnalysis: (url: string) => void;
  updateProgress: (progress: Partial<AnalyzerStore['progress']>) => void;
  addPage: (page: PageAnalysis) => void;
  updatePage: (url: string, updates: Partial<PageAnalysis>) => void;
  reset: () => void;
}

// Mock data for development
const mockPages: PageAnalysis[] = [
  {
    url: 'https://example.com',
    screenshot: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    title: 'Homepage - Example Company',
    purpose: 'Corporate landing page showcasing services and company information',
    main_features: ['Hero section with CTA', 'Service overview cards', 'Contact information', 'Navigation menu'],
    possible_user_actions: ['Browse services', 'Contact company', 'Learn about team', 'View portfolio'],
    status: 'completed'
  },
  {
    url: 'https://example.com/about',
    screenshot: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
    title: 'About Us - Example Company',
    purpose: 'Company information and team presentation page',
    main_features: ['Team member profiles', 'Company history', 'Mission statement', 'Office locations'],
    possible_user_actions: ['View team profiles', 'Read company story', 'Find office locations', 'Contact team members'],
    status: 'completed'
  },
  {
    url: 'https://example.com/services',
    screenshot: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
    title: 'Our Services - Example Company',
    purpose: 'Detailed service offerings and pricing information',
    main_features: ['Service descriptions', 'Pricing tables', 'Feature comparisons', 'Call-to-action buttons'],
    possible_user_actions: ['Compare plans', 'Request quote', 'Start free trial', 'Contact sales'],
    status: 'completed'
  },
  {
    url: 'https://example.com/contact',
    screenshot: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
    title: 'Contact Us - Example Company',
    purpose: 'Contact form and business information page',
    main_features: ['Contact form', 'Address and hours', 'Map integration', 'Social media links'],
    possible_user_actions: ['Submit contact form', 'Call phone number', 'Visit office', 'Follow on social media'],
    status: 'completed'
  }
];

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

    try {
      // Import supabase client
      const { supabase } = await import("@/integrations/supabase/client");

      // Step 1: Crawl for pages
      console.log('Starting crawl for:', url);
      const { data: crawlData, error: crawlError } = await supabase.functions.invoke('crawler', {
        body: { rootUrl: url }
      });

      if (crawlError) {
        throw new Error(`Crawl failed: ${crawlError.message}`);
      }

      const urls = crawlData?.urls || [];
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
          const { data: screenshotData, error: screenshotError } = await supabase.functions.invoke('screenshot', {
            body: { url: pageUrl }
          });

          if (screenshotError) {
            throw new Error(`Screenshot failed: ${screenshotError.message}`);
          }

          const screenshot = screenshotData?.screenshot || '';

          // Analyze with OpenAI
          console.log('Analyzing:', pageUrl);
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze', {
            body: { 
              url: pageUrl, 
              screenshotBase64: screenshot 
            }
          });

          if (analysisError) {
            throw new Error(`Analysis failed: ${analysisError.message}`);
          }

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

        } catch (pageError) {
          console.error(`Error processing ${pageUrl}:`, pageError);
          // Update page with error status
          set(state => ({
            pages: state.pages.map(page => 
              page.url === pageUrl ? {
                ...page,
                status: 'error' as const,
                error: pageError.message
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