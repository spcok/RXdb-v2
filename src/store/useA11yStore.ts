import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface A11yState {
  dyslexicFont: boolean;
  reducedMotion: boolean;
  readingRuler: boolean;
  updateSettings: (settings: Partial<A11yState>) => void;
}

export const useA11yStore = create<A11yState>()(
  persist(
    (set) => ({
      dyslexicFont: false,
      reducedMotion: false,
      readingRuler: false,
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    { name: 'koa-a11y-storage' }
  )
);
