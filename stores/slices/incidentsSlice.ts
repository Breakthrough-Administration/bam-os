import { StateCreator } from 'zustand';
import { IncidentReport } from '../../types';
import { INITIAL_INCIDENTS } from '../../lib/seedData';
import { offlineQueue } from '../../lib/offlineQueue';

export interface IncidentsSlice {
  incidents: IncidentReport[];
  addIncident: (incident: IncidentReport) => Promise<void>;
  updateIncident: (id: string, updates: Partial<IncidentReport>) => void;
  escalateToNDISCommission24h: (id: string, referenceNumber: string, investigatorNotes?: string) => Promise<void>;
}

export const createIncidentsSlice: StateCreator<IncidentsSlice> = (set, get) => ({
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

    const stateAny = get() as unknown as { addAuditLog?: (entry: unknown) => void };
    if (typeof stateAny.addAuditLog === 'function') {
      stateAny.addAuditLog({
        action: enhanced.is24HourReportable ? 'ESCALATE_24H' : 'CREATE',
        entityType: 'incidents',
        entityId: enhanced.id,
        entityTitle: `Incident Report #${enhanced.incidentNumber}`,
        participantId: enhanced.participantId,
        participantName: enhanced.participantName,
        performedBy: {
          userId: enhanced.createdBy || enhanced.signature?.signedBy || 'investigator',
          userName: enhanced.createdBy || enhanced.signature?.signedBy || 'Investigating Officer',
          role: 'Quality & Safeguards Officer',
        },
        changeSummary: `Registered ${enhanced.severity} incident. Category: ${enhanced.category}. 24h statutory escalation: ${enhanced.is24HourReportable ? 'REQUIRED' : 'NO'}.`,
        practiceStandardRef: 'NDIS (Incident Management & Reportable Incidents) Rules 2018',
        tenantId: enhanced.tenantId,
        severity: enhanced.is24HourReportable ? 'critical' : 'warning',
      });
    }
  },
  updateIncident: (id: string, updates: Partial<IncidentReport>) => {
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === id ? { ...inc, ...updates, updatedAt: new Date().toISOString() } : inc
      ),
    }));
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

    const incident = get().incidents.find((i) => i.id === id);
    const stateAny = get() as unknown as { addAuditLog?: (entry: unknown) => void };
    if (incident && typeof stateAny.addAuditLog === 'function') {
      stateAny.addAuditLog({
        action: 'ESCALATE_24H',
        entityType: 'incidents',
        entityId: incident.id,
        entityTitle: `Statutory 24h Commission Lodgement #${incident.incidentNumber}`,
        participantId: incident.participantId,
        participantName: incident.participantName,
        performedBy: {
          userId: 'compliance-lead',
          userName: 'Dr. Sarah Jenkins',
          role: 'Lead Clinician',
          registrationNumber: 'PBS-ADV-00489',
        },
        changeSummary: `Lodged formal 24-Hour statutory escalation with NDIS Quality and Safeguards Commission (Ref: ${referenceNumber}).`,
        practiceStandardRef: 'NDIS Act 2013 s.73Z & Reportable Incidents Rules 2018',
        tenantId: incident.tenantId,
        severity: 'critical',
      });
    }
  },
});
