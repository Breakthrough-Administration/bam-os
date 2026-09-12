import { StateCreator } from 'zustand';
import { RestrictivePracticeProtocol, RestrictivePracticeLog } from '../../types';
import { INITIAL_RESTRICTIVE_PROTOCOLS, INITIAL_RESTRICTIVE_LOGS } from '../../lib/seedData';
import { offlineQueue } from '../../lib/offlineQueue';

export interface ComplianceSlice {
  protocols: RestrictivePracticeProtocol[];
  logs: RestrictivePracticeLog[];
  addProtocol: (protocol: RestrictivePracticeProtocol) => void;
  updateProtocolFading: (protocolId: string, currentFrequency: number) => void;
  logRestrictivePractice: (log: RestrictivePracticeLog) => Promise<void>;
  updateRestrictivePracticeLog: (id: string, updates: Partial<RestrictivePracticeLog>) => void;
}

export const createComplianceSlice: StateCreator<ComplianceSlice> = (set) => ({
  protocols: INITIAL_RESTRICTIVE_PROTOCOLS,
  logs: INITIAL_RESTRICTIVE_LOGS,
  addProtocol: (protocol: RestrictivePracticeProtocol) =>
    set((state) => ({
      protocols: [protocol, ...state.protocols],
    })),
  updateProtocolFading: (protocolId: string, currentFrequency: number) =>
    set((state) => ({
      protocols: state.protocols.map((p) =>
        p.id === protocolId ? { ...p, currentFrequencyPerWeek: currentFrequency } : p
      ),
    })),
  logRestrictivePractice: async (log: RestrictivePracticeLog) => {
    // If unauthorized, flag priority escalation immediately
    const isEmergency = !log.wasAuthorised;
    const finalLog: RestrictivePracticeLog = {
      ...log,
      isReportableToCommission: true,
      escalationRequired24h: isEmergency || log.escalationRequired24h,
    };

    set((state) => ({
      logs: [finalLog, ...state.logs],
    }));

    await offlineQueue.enqueue('LOG_RESTRICTIVE_PRACTICE', finalLog as unknown as Record<string, unknown>);
  },
  updateRestrictivePracticeLog: (id: string, updates: Partial<RestrictivePracticeLog>) => {
    set((state) => ({
      logs: state.logs.map((log) =>
        log.id === id ? { ...log, ...updates } : log
      ),
    }));
  },
});
