import { StateCreator } from 'zustand';
import { RestrictivePracticeProtocol, RestrictivePracticeLog } from '../../types';
import { INITIAL_RESTRICTIVE_PROTOCOLS, INITIAL_RESTRICTIVE_LOGS } from '../../lib/seedData';
import { offlineQueue } from '../../lib/offlineQueue';

export interface ComplianceSlice {
  protocols: RestrictivePracticeProtocol[];
  logs: RestrictivePracticeLog[];
  addProtocol: (protocol: RestrictivePracticeProtocol) => void;
  updateProtocol: (protocolId: string, updates: Partial<RestrictivePracticeProtocol>) => void;
  updateProtocolFading: (protocolId: string, currentFrequency: number, clinicianNotes?: string, recordedBy?: string) => void;
  logRestrictivePractice: (log: RestrictivePracticeLog) => Promise<void>;
  updateRestrictivePracticeLog: (id: string, updates: Partial<RestrictivePracticeLog>) => void;
}

export const createComplianceSlice: StateCreator<ComplianceSlice> = (set, get) => ({
  protocols: INITIAL_RESTRICTIVE_PROTOCOLS,
  logs: INITIAL_RESTRICTIVE_LOGS,
  addProtocol: (protocol: RestrictivePracticeProtocol) => {
    set((state) => ({
      protocols: [protocol, ...state.protocols],
    }));
    const stateAny = get() as unknown as { addAuditLog?: (entry: unknown) => void };
    if (typeof stateAny.addAuditLog === 'function') {
      stateAny.addAuditLog({
        action: 'AUTHORISE',
        entityType: 'restrictivePracticeProtocols',
        entityId: protocol.id,
        entityTitle: `BSP Restrictive Protocol: ${protocol.type}`,
        participantId: protocol.participantId,
        participantName: protocol.participantName,
        performedBy: {
          userId: 'lead-clinician',
          userName: 'Dr. Sarah Jenkins',
          role: 'Lead Clinician (PBS Specialist)',
          registrationNumber: 'PBS-ADV-00489',
        },
        changeSummary: `Registered new ${protocol.type} restrictive practice protocol authorised by ${protocol.authorisingBody}. Target elimination: ${protocol.targetDateForElimination}.`,
        practiceStandardRef: 'NDIS Practice Standards Module 2A: High Intensity & Restrictive Practices',
        tenantId: protocol.tenantId,
        severity: 'warning',
      });
    }
  },
  updateProtocol: (protocolId: string, updates: Partial<RestrictivePracticeProtocol>) =>
    set((state) => ({
      protocols: state.protocols.map((p) =>
        p.id === protocolId ? { ...p, ...updates } : p
      ),
    })),
  updateProtocolFading: (protocolId: string, currentFrequency: number, clinicianNotes?: string, recordedBy?: string) => {
    let targetParticipant = '';
    let targetType = '';
    set((state) => ({
      protocols: state.protocols.map((p) => {
        if (p.id !== protocolId) return p;
        targetParticipant = p.participantName;
        targetType = p.type;
        const prevFreq = p.currentFrequencyPerWeek;
        const baseline = p.baselineFrequencyPerWeek || 1;
        const reductionPct = Math.round(((baseline - currentFrequency) / baseline) * 100);
        const milestone = {
          date: new Date().toISOString(),
          previousFrequencyPerWeek: prevFreq,
          newFrequencyPerWeek: currentFrequency,
          fadingPercentage: Math.max(0, reductionPct),
          clinicianNotes: clinicianNotes || 'Fading step down reviewed and verified.',
          recordedBy: recordedBy || 'Dr. Sarah Jenkins',
        };
        return {
          ...p,
          currentFrequencyPerWeek: currentFrequency,
          authorisationStatus: currentFrequency === 0 ? 'fading_in_progress' : p.authorisationStatus,
          fadingMilestones: [milestone, ...(p.fadingMilestones || [])],
        };
      }),
    }));

    const stateAny = get() as unknown as { addAuditLog?: (entry: unknown) => void };
    if (typeof stateAny.addAuditLog === 'function') {
      stateAny.addAuditLog({
        action: 'FADING_STEP_DOWN',
        entityType: 'restrictivePracticeProtocols',
        entityId: protocolId,
        entityTitle: `Restrictive Practice Fading: ${targetType}`,
        participantName: targetParticipant,
        performedBy: {
          userId: 'lead-clinician',
          userName: recordedBy || 'Dr. Sarah Jenkins',
          role: 'Lead Clinician',
          registrationNumber: 'PBS-ADV-00489',
        },
        changeSummary: `Verified clinical fading milestone: adjusted protocol frequency to ${currentFrequency}x/week. ${clinicianNotes || ''}`,
        practiceStandardRef: 'NDIS Commission Rules 2018 - Reduction and Elimination of Restrictive Practices',
        tenantId: 'tenant-main',
        severity: 'notice',
      });
    }
  },
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

    const stateAny = get() as unknown as { addAuditLog?: (entry: unknown) => void };
    if (typeof stateAny.addAuditLog === 'function') {
      stateAny.addAuditLog({
        action: isEmergency ? 'ESCALATE_24H' : 'CREATE',
        entityType: 'restrictivePracticeLogs',
        entityId: finalLog.id,
        entityTitle: `${isEmergency ? 'UNAUTHORISED ' : ''}Restrictive Practice Administration (${finalLog.practiceType})`,
        participantId: finalLog.participantId,
        participantName: finalLog.participantName,
        performedBy: {
          userId: finalLog.administeredBy,
          userName: finalLog.administeredBy,
          role: 'Administering Clinician / Practitioner',
        },
        changeSummary: `${isEmergency ? 'EMERGENCY UNAUTHORISED: ' : 'Authorised '}use of ${finalLog.practiceType} restraint for ${finalLog.durationMinutes}m. 24h Commission escalation triggered: ${finalLog.escalationRequired24h}.`,
        practiceStandardRef: 'NDIS (Restrictive Practices and Behaviour Support) Rules 2018',
        tenantId: finalLog.tenantId,
        severity: isEmergency ? 'critical' : 'warning',
      });
    }
  },
  updateRestrictivePracticeLog: (id: string, updates: Partial<RestrictivePracticeLog>) => {
    set((state) => ({
      logs: state.logs.map((log) =>
        log.id === id ? { ...log, ...updates } : log
      ),
    }));
  },
});
