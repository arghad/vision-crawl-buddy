import { create } from 'zustand';

interface SettingsStore {
  screenshotOneApiKey: string;
  openaiApiKey: string;
  functionsBaseUrl: string; // Optional override for Supabase Functions base URL
  setScreenshotOneApiKey: (key: string) => void;
  setOpenaiApiKey: (key: string) => void;
  setFunctionsBaseUrl: (url: string) => void;
  clearSettings: () => void;
  loadSettings: () => void;
  hasValidScreenshotOneKey: () => boolean;
  hasValidOpenaiKey: () => boolean;
}

const STORAGE_KEY = 'web-analyzer-settings';

export const useSettings = create<SettingsStore>((set, get) => ({
  screenshotOneApiKey: '',
  openaiApiKey: '',
  functionsBaseUrl: '',

  setScreenshotOneApiKey: (key: string) => {
    set({ screenshotOneApiKey: key });
    saveToStorage(get());
  },

  setOpenaiApiKey: (key: string) => {
    set({ openaiApiKey: key });
    saveToStorage(get());
  },

  setFunctionsBaseUrl: (url: string) => {
    set({ functionsBaseUrl: url.trim() });
    saveToStorage(get());
  },

  clearSettings: () => {
    set({ screenshotOneApiKey: '', openaiApiKey: '', functionsBaseUrl: '' });
    sessionStorage.removeItem(STORAGE_KEY);
  },

  loadSettings: () => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        set({
          screenshotOneApiKey: settings.screenshotOneApiKey || '',
          openaiApiKey: settings.openaiApiKey || '',
          functionsBaseUrl: settings.functionsBaseUrl || '',
        });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  },

  hasValidScreenshotOneKey: () => {
    const key = get().screenshotOneApiKey;
    return key.length > 0 && /^[a-zA-Z0-9]+$/.test(key);
  },

  hasValidOpenaiKey: () => {
    const key = get().openaiApiKey;
    return key.length > 0 && key.startsWith('sk-');
  },
}));

const saveToStorage = (state: SettingsStore) => {
  const settings = {
    screenshotOneApiKey: state.screenshotOneApiKey,
    openaiApiKey: state.openaiApiKey,
    functionsBaseUrl: state.functionsBaseUrl,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

// Load settings on initialization
useSettings.getState().loadSettings();