import { StateCreator } from 'zustand';
import { Participant } from '../../types';
import { INITIAL_PARTICIPANTS } from '../../lib/seedData';

export interface ClientsSlice {
  participants: Participant[];
  selectedParticipantId: string | null;
  selectParticipant: (id: string | null) => void;
  addParticipant: (participant: Participant) => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  archiveParticipants: (ids: string[]) => void;
  restoreParticipants: (ids: string[]) => void;
}

export const createClientsSlice: StateCreator<ClientsSlice> = (set) => ({
  participants: INITIAL_PARTICIPANTS,
  selectedParticipantId: INITIAL_PARTICIPANTS[0]?.id || null,
  selectParticipant: (id: string | null) => set({ selectedParticipantId: id }),
  addParticipant: (participant: Participant) =>
    set((state) => ({
      participants: [participant, ...state.participants],
    })),
  updateParticipant: (id: string, updates: Partial<Participant>) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  archiveParticipants: (ids: string[]) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        ids.includes(p.id)
          ? {
              ...p,
              status: 'legacy_archived',
              isArchived: true,
              archivedAt: new Date().toISOString(),
            }
          : p
      ),
    })),
  restoreParticipants: (ids: string[]) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        ids.includes(p.id)
          ? {
              ...p,
              status: 'active',
              isArchived: false,
              archivedAt: undefined,
            }
          : p
      ),
    })),
});
