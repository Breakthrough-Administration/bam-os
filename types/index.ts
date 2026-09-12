export type UserRole =
  | 'lead_clinician'
  | 'pbs_practitioner'
  | 'allied_health'
  | 'support_worker'
  | 'practice_manager'
  | 'compliance_officer'
  | 'auditor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  branchId: string;
  organisationName: string;
  ndisWorkerScreeningId?: string;
  ndisWorkerScreeningExpiry?: string;
  workingWithChildrenCheckExpiry?: string;
  firstAidExpiry?: string;
  pbsPractitionerLevel?: 'provisional' | 'proficient' | 'advanced' | 'specialist';
  schadsLevel?: number;
  schadsPayPoint?: number;
}

export type RestrictivePracticeType =
  | 'chemical'
  | 'mechanical'
  | 'physical'
  | 'environmental'
  | 'seclusion';

export type AuthorisationStatus =
  | 'authorised'
  | 'emergency_unauthorised'
  | 'pending_panel_review'
  | 'fading_in_progress'
  | 'expired';

export interface RestrictivePracticeProtocol {
  id: string;
  tenantId: string;
  participantId: string;
  participantName: string;
  type: RestrictivePracticeType;
  description: string;
  rationale: string;
  authorisationStatus: AuthorisationStatus;
  authorisingBody: string; // e.g., "Victorian Senior Practitioner", "NSW Authorisation Mechanism"
  authorisationDate: string;
  expiryDate: string;
  reviewDate: string;
  approvedByPanel: boolean;
  ndisCommissionReportable: boolean;
  fadingScheduleDescription: string;
  baselineFrequencyPerWeek: number;
  currentFrequencyPerWeek: number;
  targetDateForElimination: string;
  deEscalationPrerequisites: string[];
}

export interface RestrictivePracticeLog {
  id: string;
  tenantId: string;
  protocolId?: string;
  participantId: string;
  participantName: string;
  practiceType: RestrictivePracticeType;
  wasAuthorised: boolean;
  isReportableToCommission: boolean;
  escalationRequired24h: boolean;
  timestampStart: string;
  timestampEnd: string;
  durationMinutes: number;
  administeredBy: string;
  witnessedBy?: string;
  immediatePrecursors: string;
  lessRestrictiveAlternativesAttempted: string[];
  participantOutcome: string;
  postIncidentDebriefCompleted: boolean;
  reportedToCommissionAt?: string;
  notes: string;
  signature?: {
    signedBy: string;
    timestamp: string;
    hash: string;
  };
}

export * from './pricing';
export * from './incident';

export interface Participant {
  id: string;
  tenantId: string;
  ndisNumber: string;
  fullName: string;
  preferredName?: string;
  dateOfBirth: string;
  gender: string;
  primaryDiagnosis: string;
  secondaryDiagnoses?: string[];
  mmmZone: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  suburb: string;
  postcode: string;
  state: 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';
  planStartDate: string;
  planEndDate: string;
  totalAllocatedBudget: number;
  consumedBudget: number;
  activeBSP: boolean;
  bspReviewDueDate?: string;
  activeRestrictivePracticesCount: number;
  contactEmergencyName: string;
  contactEmergencyPhone: string;
  behaviourSupportPractitioner: string;
  alliedHealthKeyWorker: string;
}

export interface RosterShift {
  id: string;
  tenantId: string;
  workerId: string;
  workerName: string;
  participantId: string;
  participantName: string;
  startTime: string; // ISO
  endTime: string; // ISO
  schadsLevel: number;
  schadsPayPoint: number;
  isBrokenShift: boolean;
  brokenShiftPart?: 1 | 2;
  travelAllowanceEligible: boolean;
  distanceKm?: number;
  notes?: string;
  complianceAudit?: ShiftComplianceAudit;
}

export interface ShiftComplianceAudit {
  minimumEngagementMet: boolean;
  engagementHours: number;
  restBreakBetweenShiftsHours: number;
  restBreakCompliant: boolean;
  overtimeHours: number;
  brokenShiftAllowanceApplicable: boolean;
  violations: string[];
}

export interface SOAPCaseNote {
  id: string;
  tenantId: string;
  participantId: string;
  participantName: string;
  practitionerId: string;
  practitionerName: string;
  sessionDate: string;
  durationMinutes: number;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  goalsAddressed: Array<{ goalId: string; goalTitle: string; progressRating: 1 | 2 | 3 | 4 | 5 }>;
  restrictivePracticeObserved: boolean;
  rawVoiceTranscript?: string;
  isPiiMasked: boolean;
  syncedToCloud: boolean;
  offlineCreated: boolean;
  timestamp: string;
  signature?: {
    signedBy: string;
    timestamp: string;
    hash: string;
  };
}
