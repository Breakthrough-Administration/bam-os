import { StateCreator } from 'zustand';

export interface SyncSlice {
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncedAt: string | null;
  setOnlineStatus: (online: boolean) => void;
  setPendingSyncCount: (count: number) => void;
  recordSyncSuccess: () => void;
}

export const createSyncSlice: StateCreator<SyncSlice> = (set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingSyncCount: 0,
  lastSyncedAt: new Date().toISOString(),
  setOnlineStatus: (online: boolean) => set({ isOnline: online }),
  setPendingSyncCount: (count: number) => set({ pendingSyncCount: count }),
  recordSyncSuccess: () =>
    set({
      pendingSyncCount: 0,
      lastSyncedAt: new Date().toISOString(),
    }),
});
