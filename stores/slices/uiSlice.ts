import { StateCreator } from 'zustand';

export type MainNavTab =
  | 'dashboard'
  | 'participants'
  | 'case_notes'
  | 'restrictive_practices'
  | 'incident_escalation'
  | 'clinical_outcomes'
  | 'billing_papl'
  | 'schads_roster'
  | 'audit_compliance'
  | 'workspace_hub'
  | 'security_rollout';

export interface UISlice {
  activeTab: MainNavTab;
  isQuickActionOpen: boolean;
  commandPaletteOpen: boolean;
  activeFilterSearch: string;
  setActiveTab: (tab: MainNavTab) => void;
  setQuickActionOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveFilterSearch: (query: string) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  activeTab: 'dashboard',
  isQuickActionOpen: false,
  commandPaletteOpen: false,
  activeFilterSearch: '',
  setActiveTab: (tab: MainNavTab) => set({ activeTab: tab }),
  setQuickActionOpen: (open: boolean) => set({ isQuickActionOpen: open }),
  setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),
  setActiveFilterSearch: (query: string) => set({ activeFilterSearch: query }),
});
