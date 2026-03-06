import { create } from 'zustand';
import type { Battery } from '../types';

interface BatteryStore extends Battery {
  spend: (credits: number) => void;
  reset: () => void;
}

export const useBatteryStore = create<BatteryStore>((set) => ({
  mode: 'unlimited',
  creditsRemaining: 500,
  creditsUsedToday: 0,
  spend: (credits) =>
    set((s) => ({
      creditsRemaining: s.creditsRemaining - credits,
      creditsUsedToday: s.creditsUsedToday + credits,
    })),
  reset: () => set({ creditsRemaining: 500, creditsUsedToday: 0 }),
}));
