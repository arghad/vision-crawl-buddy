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
  pages: mockPages,
  progress: {
    current: 4,
    total: 4,
    stage: 'completed'
  },

  setRootUrl: (url) => set({ rootUrl: url }),

  startAnalysis: (url) => {
    set({
      rootUrl: url,
      isAnalyzing: true,
      pages: [],
      progress: { current: 0, total: 0, stage: 'crawling' }
    });

    // Mock the analysis process
    setTimeout(() => {
      set({ 
        progress: { current: 0, total: mockPages.length, stage: 'screenshot' },
        pages: mockPages.map(p => ({ ...p, status: 'pending' as const }))
      });

      // Simulate progressive analysis
      mockPages.forEach((page, index) => {
        setTimeout(() => {
          const { pages } = get();
          const updatedPages = [...pages];
          updatedPages[index] = { ...page, status: 'analyzing' as const };
          set({ pages: updatedPages });

          setTimeout(() => {
            const { pages } = get();
            const updatedPages = [...pages];
            updatedPages[index] = { ...page, status: 'completed' as const };
            set({ 
              pages: updatedPages,
              progress: { 
                current: index + 1, 
                total: mockPages.length, 
                stage: index === mockPages.length - 1 ? 'completed' : 'analyzing'
              }
            });

            if (index === mockPages.length - 1) {
              set({ isAnalyzing: false });
            }
          }, 1000);
        }, index * 500);
      });
    }, 1500);
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