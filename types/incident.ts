/**
 * Breakthrough Manager OS - NDIS Incident & Governance Types
 * Defined in accordance with NDIS Quality and Safeguards Commission (Incident Management
 * and Reportable Incidents) Rules 2018 under Section 73Z of the NDIS Act 2013.
 */

export type ReportableAllegationType =
  | 'death'
  | 'serious_injury'
  | 'sexual_misconduct'
  | 'abuse_neglect'
  | 'unauthorised_restrictive_practice';

export type IncidentCategory =
  | 'allegation_death'
  | 'allegation_serious_injury'
  | 'allegation_sexual_misconduct'
  | 'allegation_abuse_neglect'
  | 'unauthorised_restrictive_practice'
  | 'medication_error'
  | 'worker_injury'
  | 'property_damage'
  | 'challenging_behaviour'
  | 'near_miss';

export type IncidentSeverity = 'critical_24h' | 'high_5day' | 'standard' | 'minor';

export type IncidentStatus =
  | 'draft'
  | 'under_investigation'
  | 'escalated_to_commission'
  | 'notified_commission'
  | 'closed';

export type IncidentLocationType =
  | 'participant_residence'
  | 'supported_independent_living'
  | 'day_program'
  | 'community_access'
  | 'transit_vehicle'
  | 'clinic_facility'
  | 'other';

export type PersonRole =
  | 'participant'
  | 'support_worker'
  | 'clinician'
  | 'family_nominee'
  | 'witness'
  | 'alleged_perpetrator'
  | 'first_responder'
  | 'manager';

export interface InvolvedPerson {
  id: string;
  name: string;
  role: PersonRole;
  isParticipant?: boolean;
  contactPhone?: string;
  contactEmail?: string;
  statementTaken: boolean;
  statementSummary?: string;
  injuriesSustained?: string;
}

export interface RestrictivePracticeIncidentDetail {
  applied: boolean;
  type?: 'chemical' | 'mechanical' | 'physical' | 'environmental' | 'seclusion';
  wasAuthorisedInBSP: boolean;
  bspProtocolReference?: string;
  durationMinutes?: number;
  emergencyCircumstancesRationale?: string;
  lessRestrictiveAlternativesAttempted?: string[];
}

export interface NDISCommissionEscalation {
  is24HourReportable: boolean;
  escalationRequired: boolean;
  escalatedToCommission: boolean;
  commissionReferenceNumber?: string;
  notifiedAt?: string;
  notifiedBy?: string;
  statutoryDeadline24h: string; // ISO 8601
  statutoryDeadline5Day: string; // ISO 8601
  remainingHours24h?: number;
  isDeadlineBreached?: boolean;
  commissionPortalSubmissionNotes?: string;
  notificationStatus: 'pending_submission' | 'notified_within_24h' | 'overdue' | 'not_applicable';
}

export interface IncidentReport {
  id: string;
  tenantId: string;
  incidentNumber: string;
  participantId: string;
  participantName: string;
  participantNdisNumber?: string;
  occurredAt: string; // ISO 8601
  reportedAt: string; // ISO 8601
  locationType?: IncidentLocationType;
  locationAddress?: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  is24HourReportable: boolean;
  summary: string;
  detailedDescription: string;
  immediateActionsTaken: string;
  involvedPersons?: InvolvedPerson[];
  restrictivePracticeApplied: boolean;
  restrictivePracticeType?: 'chemical' | 'mechanical' | 'physical' | 'environmental' | 'seclusion';
  wasRestrictivePracticeApproved: boolean;
  restrictivePracticeDetails?: RestrictivePracticeIncidentDetail;
  medicalAttentionRequired?: boolean;
  medicalTreatmentDetails?: string;
  policeContacted: boolean;
  policeEventNumber?: string;
  ambulanceContacted: boolean;
  escalation?: NDISCommissionEscalation;
  ndisCommissionEscalated: boolean;
  ndisReferenceNumber?: string;
  investigatorNotes?: string;
  rootCauseAnalysis?: string;
  correctiveActions?: string[];
  status: IncidentStatus;
  riskRating?: 'extreme' | 'high' | 'medium' | 'low';
  createdBy?: string;
  updatedAt?: string;
}

export interface IncidentSubmissionPayload {
  tenantId: string;
  participantId: string;
  participantName?: string;
  participantNdisNumber?: string;
  occurredAt: string;
  locationType: IncidentLocationType;
  locationAddress: string;
  category: IncidentCategory;
  summary: string;
  detailedDescription: string;
  immediateActionsTaken: string;
  involvedPersons: InvolvedPerson[];
  priority24hFlag?: boolean;
  restrictivePracticeApplied?: boolean;
  restrictivePracticeDetails?: RestrictivePracticeIncidentDetail;
  medicalAttentionRequired?: boolean;
  medicalTreatmentDetails?: string;
  policeContacted?: boolean;
  policeEventNumber?: string;
  ambulanceContacted?: boolean;
  createdBy?: string;
}

export interface IncidentEscalationPayload {
  incidentId: string;
  tenantId: string;
  commissionReferenceNumber: string;
  reportedBy: string;
  commissionPortalSubmissionNotes?: string;
  investigatorNotes?: string;
}
