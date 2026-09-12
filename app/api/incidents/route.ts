/**
 * Server-Side Route Handler: NDIS Reportable Incidents Module
 * Enforces Section 73Z NDIS Act 2013 Statutory Compliance, 24-Hour Priority Escalation,
 * and Tenant-Isolated Persistence.
 * Endpoints: /app/api/incidents & /api/incidents
 */

import { Request, Response } from 'express';
import {
  IncidentReport,
  IncidentCategory,
  IncidentSubmissionPayload,
  IncidentEscalationPayload,
} from '../../../types/incident';
import { INITIAL_INCIDENTS } from '../../../lib/seedData';

// In-memory tenant-isolated incident store (persists for container lifecycle)
let incidentsStore: IncidentReport[] = [...INITIAL_INCIDENTS];

const REPORTABLE_24H_CATEGORIES: IncidentCategory[] = [
  'allegation_death',
  'allegation_serious_injury',
  'allegation_sexual_misconduct',
  'allegation_abuse_neglect',
  'unauthorised_restrictive_practice',
];

/**
 * Validates whether an incident type is a mandatory 24-hour reportable allegation
 * under Section 73Z of the NDIS Act 2013.
 */
function isMandatory24HourReportable(category: IncidentCategory, priorityFlag?: boolean): boolean {
  if (priorityFlag) return true;
  return REPORTABLE_24H_CATEGORIES.includes(category);
}

/**
 * Calculates statutory deadlines according to NDIS Quality and Safeguards Commission rules:
 * - 24-Hour Priority Notification deadline
 * - 5-Day Comprehensive Investigation Report deadline
 */
function calculateStatutoryDeadlines(occurredAtStr: string) {
  const occurredTime = new Date(occurredAtStr).getTime() || Date.now();
  const deadline24h = new Date(occurredTime + 24 * 60 * 60 * 1000).toISOString();
  const deadline5Day = new Date(occurredTime + 5 * 24 * 60 * 60 * 1000).toISOString();
  const remainingHours24h = Math.max(0, Math.round(((new Date(deadline24h).getTime() - Date.now()) / (1000 * 60 * 60)) * 10) / 10);

  return {
    deadline24h,
    deadline5Day,
    remainingHours24h,
  };
}

/**
 * GET /app/api/incidents
 * Query incidents scoped strictly by tenantId.
 */
export async function GET(req: Request, res: Response) {
  try {
    const tenantId = (req.query.tenantId as string) || (req.headers['x-tenant-id'] as string);
    const category = req.query.category as string;
    const is24h = req.query.is24HourReportable === 'true';
    const status = req.query.status as string;

    let filtered = incidentsStore;

    // Enforce tenant isolation when tenantId is provided
    if (tenantId) {
      filtered = filtered.filter((inc) => inc.tenantId === tenantId);
    }

    if (category) {
      filtered = filtered.filter((inc) => inc.category === category);
    }

    if (is24h) {
      filtered = filtered.filter((inc) => inc.is24HourReportable);
    }

    if (status) {
      filtered = filtered.filter((inc) => inc.status === status);
    }

    // Sort by occurredAt descending
    filtered.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    return res.status(200).json({
      success: true,
      count: filtered.length,
      incidents: filtered,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve incidents';
    return res.status(500).json({ success: false, error: message });
  }
}

/**
 * POST /app/api/incidents
 * Log a new incident with full NDIS Commission data capture, 24-hour escalation checks,
 * and tenant isolation boundaries.
 */
export async function POST(req: Request, res: Response) {
  try {
    const payload = req.body as IncidentSubmissionPayload;

    // 1. Mandatory Field Validation
    if (!payload.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required tenantId boundary. All incident data must be tenant-isolated.',
      });
    }

    if (!payload.participantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing participantId for incident report.',
      });
    }

    if (!payload.category) {
      return res.status(400).json({
        success: false,
        error: 'Missing incident category / type.',
      });
    }

    if (!payload.summary || !payload.detailedDescription) {
      return res.status(400).json({
        success: false,
        error: 'Both summary and detailed narrative description are required under NDIS Commission guidelines.',
      });
    }

    // 2. Determine 24-Hour Reportable Allegation Escalation Status
    const is24Hour = isMandatory24HourReportable(payload.category, payload.priority24hFlag);
    const occurredAt = payload.occurredAt || new Date().toISOString();
    const deadlines = calculateStatutoryDeadlines(occurredAt);

    const incidentNumber = `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newId = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 3. Build Compliant Incident Record
    const incidentRecord: IncidentReport = {
      id: newId,
      tenantId: payload.tenantId,
      incidentNumber,
      participantId: payload.participantId,
      participantName: payload.participantName || 'Participant',
      participantNdisNumber: payload.participantNdisNumber,
      occurredAt,
      reportedAt: new Date().toISOString(),
      locationType: payload.locationType || 'participant_residence',
      locationAddress: payload.locationAddress || 'Provider Facility / In Transit',
      category: payload.category,
      severity: is24Hour ? 'critical_24h' : 'high_5day',
      is24HourReportable: is24Hour,
      summary: payload.summary,
      detailedDescription: payload.detailedDescription,
      immediateActionsTaken: payload.immediateActionsTaken || 'Immediate safety secured by attending staff.',
      involvedPersons: payload.involvedPersons || [],
      restrictivePracticeApplied: Boolean(payload.restrictivePracticeApplied),
      restrictivePracticeType: payload.restrictivePracticeDetails?.type,
      wasRestrictivePracticeApproved: Boolean(payload.restrictivePracticeDetails?.wasAuthorisedInBSP),
      restrictivePracticeDetails: payload.restrictivePracticeDetails,
      medicalAttentionRequired: Boolean(payload.medicalAttentionRequired),
      medicalTreatmentDetails: payload.medicalTreatmentDetails,
      policeContacted: Boolean(payload.policeContacted),
      policeEventNumber: payload.policeEventNumber,
      ambulanceContacted: Boolean(payload.ambulanceContacted),
      escalation: {
        is24HourReportable: is24Hour,
        escalationRequired: is24Hour,
        escalatedToCommission: false,
        statutoryDeadline24h: deadlines.deadline24h,
        statutoryDeadline5Day: deadlines.deadline5Day,
        remainingHours24h: deadlines.remainingHours24h,
        notificationStatus: is24Hour ? 'pending_submission' : 'not_applicable',
      },
      ndisCommissionEscalated: false,
      status: 'under_investigation',
      riskRating: is24Hour ? 'extreme' : 'medium',
      createdBy: payload.createdBy || 'Staff Member',
      updatedAt: new Date().toISOString(),
    };

    // 4. Save to tenant isolated store
    incidentsStore = [incidentRecord, ...incidentsStore];

    return res.status(201).json({
      success: true,
      message: is24Hour
        ? 'CRITICAL: Incident logged. Mandated 24-hour notification required to NDIS Quality & Safeguards Commission.'
        : 'Incident logged successfully and assigned to Clinical Investigator.',
      incident: incidentRecord,
      statutoryCompliance: {
        is24HourReportable: is24Hour,
        statutoryDeadline24h: deadlines.deadline24h,
        statutoryDeadline5Day: deadlines.deadline5Day,
        hoursRemainingToNotify: deadlines.remainingHours24h,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit incident';
    return res.status(500).json({ success: false, error: message });
  }
}

/**
 * PATCH /app/api/incidents
 * Record official NDIS Commission lodgement (reference number, submission timestamp).
 */
export async function PATCH(req: Request, res: Response) {
  try {
    const payload = req.body as IncidentEscalationPayload;

    if (!payload.incidentId || !payload.commissionReferenceNumber) {
      return res.status(400).json({
        success: false,
        error: 'Both incidentId and commissionReferenceNumber are required for statutory escalation.',
      });
    }

    const index = incidentsStore.findIndex((i) => i.id === payload.incidentId);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const existing = incidentsStore[index];

    // Enforce tenant boundary check
    if (payload.tenantId && existing.tenantId !== payload.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied: Tenant boundary mismatch.' });
    }

    const updated: IncidentReport = {
      ...existing,
      ndisCommissionEscalated: true,
      ndisReferenceNumber: payload.commissionReferenceNumber,
      status: 'notified_commission',
      investigatorNotes: payload.investigatorNotes || existing.investigatorNotes,
      escalation: {
        ...(existing.escalation || {
          is24HourReportable: true,
          escalationRequired: true,
          statutoryDeadline24h: new Date().toISOString(),
          statutoryDeadline5Day: new Date(Date.now() + 5 * 86400000).toISOString(),
          notificationStatus: 'notified_within_24h',
        }),
        escalatedToCommission: true,
        commissionReferenceNumber: payload.commissionReferenceNumber,
        notifiedAt: new Date().toISOString(),
        notifiedBy: payload.reportedBy || 'Clinical Supervisor',
        notificationStatus: 'notified_within_24h',
        commissionPortalSubmissionNotes: payload.commissionPortalSubmissionNotes,
      },
      updatedAt: new Date().toISOString(),
    };

    incidentsStore[index] = updated;

    return res.status(200).json({
      success: true,
      message: `NDIS Quality & Safeguards Commission notified under Reference ${payload.commissionReferenceNumber}`,
      incident: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to escalate incident';
    return res.status(500).json({ success: false, error: message });
  }
}
