import { StateCreator } from 'zustand';
import { ClaimLineCalculation } from '../../types';
import { calculateNDISClaim, ClaimInput } from '../../lib/ndisPricingService';

export interface BillingSlice {
  calculations: ClaimLineCalculation[];
  addCalculation: (input: ClaimInput) => ClaimLineCalculation;
  clearCalculations: () => void;
}

export const createBillingSlice: StateCreator<BillingSlice> = (set) => ({
  calculations: [],
  addCalculation: (input: ClaimInput) => {
    const result = calculateNDISClaim(input);
    set((state) => ({
      calculations: [result, ...state.calculations],
    }));
    return result;
  },
  clearCalculations: () => set({ calculations: [] }),
});
