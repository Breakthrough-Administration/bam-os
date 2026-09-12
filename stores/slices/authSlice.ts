import { StateCreator } from 'zustand';
import { UserProfile, UserRole } from '../../types';
import { INITIAL_USER_PROFILE } from '../../lib/seedData';

export interface AuthSlice {
  currentUser: UserProfile;
  tenantId: string;
  branchId: string;
  switchRole: (role: UserRole) => void;
  setBranch: (branchId: string) => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  currentUser: INITIAL_USER_PROFILE,
  tenantId: INITIAL_USER_PROFILE.tenantId,
  branchId: INITIAL_USER_PROFILE.branchId,
  switchRole: (role: UserRole) =>
    set((state) => ({
      currentUser: { ...state.currentUser, role },
    })),
  setBranch: (branchId: string) =>
    set((state) => ({
      branchId,
      currentUser: { ...state.currentUser, branchId },
    })),
});
