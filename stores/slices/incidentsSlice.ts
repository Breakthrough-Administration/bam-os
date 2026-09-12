import { StateCreator } from 'zustand';
import { IncidentReport } from '../../types';
import { INITIAL_INCIDENTS } from '../../lib/seedData';
import { offlineQueue } from '../../lib/offlineQueue';

export interface IncidentsSlice {
  incidents: IncidentReport[];
  addIncident: (incident: IncidentReport) => Promise<void>;
  escalateToNDISCommission24h: (id: string, referenceNumber: string, investigatorNotes?: string) => Promise<void>;
}

export const createIncidentsSlice: StateCreator<IncidentsSlice> = (set) => ({
  incidents: INITIAL_INCIDENTS,
  addIncident: async (incident: IncidentReport) => {
    // 24h escalation check for reportable categories
    const isReportableCategory =
      incident.category === 'allegation_death' ||
      incident.category === 'allegation_serious_injury' ||
      incident.category === 'allegation_sexual_misconduct' ||
      incident.category === 'allegation_abuse_neglect' ||
      incident.category === 'unauthorised_restrictive_practice';

    const enhanced: IncidentReport = {
      ...incident,
      is24HourReportable: isReportableCategory || incident.is24HourReportable,
      severity: isReportableCategory ? 'critical_24h' : incident.severity,
    };

    set((state) => ({
      incidents: [enhanced, ...state.incidents],
    }));

    await offlineQueue.enqueue('ESCALATE_INCIDENT', enhanced as unknown as Record<string, unknown>);
  },
  escalateToNDISCommission24h: async (id: string, referenceNumber: string, investigatorNotes?: string) => {
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              ndisCommissionEscalated: true,
              ndisReferenceNumber: referenceNumber,
              status: 'notified_commission',
              investigatorNotes: investigatorNotes || inc.investigatorNotes,
              escalation: {
                ...(inc.escalation || {
                  is24HourReportable: true,
                  escalationRequired: true,
                  statutoryDeadline24h: new Date().toISOString(),
                  statutoryDeadline5Day: new Date(Date.now() + 5 * 86400000).toISOString(),
                  notificationStatus: 'notified_within_24h',
                }),
                escalatedToCommission: true,
                commissionReferenceNumber: referenceNumber,
                notifiedAt: new Date().toISOString(),
                notificationStatus: 'notified_within_24h',
              },
            }
          : inc
      ),
    }));
  },
});
