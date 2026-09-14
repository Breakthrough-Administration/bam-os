import { StateCreator } from 'zustand';
import { NDISAuditLogEntry } from '../../types/audit';
import { INITIAL_AUDIT_LOGS, computeSyncHash } from '../../lib/auditLogger';

export interface AuditSlice {
  auditLogs: NDISAuditLogEntry[];
  lastChainVerification: {
    isValid: boolean;
    totalLogs: number;
    verifiedAt: string | null;
  };
  addAuditLog: (
    entry: Omit<NDISAuditLogEntry, 'id' | 'timestamp' | 'integrityHash' | 'previousHash'>
  ) => NDISAuditLogEntry;
  verifyAuditChain: () => {
    isValid: boolean;
    totalLogs: number;
    verifiedAt: string;
  };
  resetAuditLogsToSeed: () => void;
}

export const createAuditSlice: StateCreator<AuditSlice> = (set, get) => ({
  auditLogs: INITIAL_AUDIT_LOGS,
  lastChainVerification: {
    isValid: true,
    totalLogs: INITIAL_AUDIT_LOGS.length,
    verifiedAt: new Date().toISOString(),
  },
  addAuditLog: (entryData) => {
    const currentLogs = get().auditLogs;
    const latestLog = currentLogs[0];
    const previousHash = latestLog
      ? latestLog.integrityHash
      : '0000000000000000000000000000000000000000000000000000000000000000';

    const timestamp = new Date().toISOString();
    const id = `audit-ndis-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const payload = JSON.stringify({
      id,
      timestamp,
      action: entryData.action,
      entityType: entryData.entityType,
      entityId: entryData.entityId,
      performedBy: entryData.performedBy,
    });

    const integrityHash = computeSyncHash(payload, previousHash);

    const newLog: NDISAuditLogEntry = {
      ...entryData,
      id,
      timestamp,
      previousHash,
      integrityHash,
    };

    set((state) => ({
      auditLogs: [newLog, ...state.auditLogs],
      lastChainVerification: {
        isValid: true,
        totalLogs: state.auditLogs.length + 1,
        verifiedAt: new Date().toISOString(),
      },
    }));

    return newLog;
  },
  verifyAuditChain: () => {
    const logs = get().auditLogs;
    let isValid = true;

    // Verify hash continuity in reverse chronological order
    for (let i = 0; i < logs.length - 1; i++) {
      const current = logs[i];
      const previous = logs[i + 1];
      if (current.previousHash !== previous.integrityHash) {
        isValid = false;
        break;
      }
    }

    const verificationResult = {
      isValid,
      totalLogs: logs.length,
      verifiedAt: new Date().toISOString(),
    };

    set({ lastChainVerification: verificationResult });
    return verificationResult;
  },
  resetAuditLogsToSeed: () => {
    set({
      auditLogs: INITIAL_AUDIT_LOGS,
      lastChainVerification: {
        isValid: true,
        totalLogs: INITIAL_AUDIT_LOGS.length,
        verifiedAt: new Date().toISOString(),
      },
    });
  },
});
