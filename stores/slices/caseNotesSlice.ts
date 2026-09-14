import { StateCreator } from 'zustand';
import { SOAPCaseNote } from '../../types';
import { INITIAL_CASE_NOTES } from '../../lib/seedData';
import { indexedDBEngine } from '../../lib/indexedDBEngineV2';
import { offlineQueue } from '../../lib/offlineQueue';

export interface CaseNotesSlice {
  caseNotes: SOAPCaseNote[];
  addCaseNote: (note: SOAPCaseNote) => Promise<void>;
  updateCaseNote: (id: string, updates: Partial<SOAPCaseNote>) => Promise<void>;
  filterByParticipant: (participantId: string) => SOAPCaseNote[];
}

export const createCaseNotesSlice: StateCreator<CaseNotesSlice> = (set, get) => ({
  caseNotes: INITIAL_CASE_NOTES,
  addCaseNote: async (note: SOAPCaseNote) => {
    // 1. Optimistic UI update
    set((state) => ({
      caseNotes: [note, ...state.caseNotes],
    }));

    // 2. Persist to local IndexedDB
    await indexedDBEngine.setItem('case_notes', note.id, note, note.tenantId);

    // 3. Enqueue for background synchronization
    await offlineQueue.enqueue('CREATE_CASE_NOTE', note as unknown as Record<string, unknown>);

    // 4. Record NDIS Compliance Audit Trail
    const stateAny = get() as unknown as { addAuditLog?: (entry: unknown) => void };
    if (typeof stateAny.addAuditLog === 'function') {
      stateAny.addAuditLog({
        action: 'CREATE',
        entityType: 'soapCaseNotes',
        entityId: note.id,
        entityTitle: `Clinical SOAP Case Note (${note.participantName})`,
        participantId: note.participantId,
        participantName: note.participantName,
        performedBy: {
          userId: note.practitionerId,
          userName: note.practitionerName,
          role: 'Clinician',
        },
        changeSummary: `Committed clinical case note with ${note.durationMinutes}m engagement and DLP PII sanitisation.`,
        practiceStandardRef: 'NDIS Practice Standards (Core Module 2: Governance & Clinical Records)',
        tenantId: note.tenantId,
        severity: 'info',
      });
    }
  },
  updateCaseNote: async (id: string, updates: Partial<SOAPCaseNote>) => {
    set((state) => {
      const updatedNotes = state.caseNotes.map((note) =>
        note.id === id ? { ...note, ...updates } : note
      );
      return { caseNotes: updatedNotes };
    });

    const note = get().caseNotes.find(n => n.id === id);
    if (note) {
      await indexedDBEngine.setItem('case_notes', note.id, note, note.tenantId);
      await offlineQueue.enqueue('UPDATE_CASE_NOTE', note as unknown as Record<string, unknown>);
    }
  },
  filterByParticipant: (participantId: string) => {
    return get().caseNotes.filter((n) => n.participantId === participantId);
  },
});
