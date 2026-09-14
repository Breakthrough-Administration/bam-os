/**
 * Breakthrough Manager OS - NDIS Audit & Database Mutation Tracking Types
 * Compliant with NDIS Quality and Safeguards Commission (Governance and Operational Management Rules)
 */

export type NDISAuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'AUTHORISE'
  | 'ESCALATE_24H'
  | 'ESCALATE_5DAY'
  | 'SIGN_CRYPTOGRAPHIC'
  | 'DLP_PII_REDACT'
  | 'FADING_STEP_DOWN'
  | 'ROSTER_SCHADS_AUDIT';

export type NDISEntityType =
  | 'soapCaseNotes'
  | 'restrictivePracticeProtocols'
  | 'restrictivePracticeLogs'
  | 'incidents'
  | 'rosterShifts'
  | 'participants'
  | 'pricingBilling';

export interface AuditActor {
  userId: string;
  userName: string;
  role: string;
  ndisWorkerScreeningId?: string;
  registrationNumber?: string;
}

export interface NDISAuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601 UTC string
  action: NDISAuditAction;
  entityType: NDISEntityType;
  entityId: string;
  entityTitle: string;
  participantId?: string;
  participantName?: string;
  performedBy: AuditActor;
  changeSummary: string;
  previousStateSnippet?: Record<string, unknown> | string;
  newStateSnippet?: Record<string, unknown> | string;
  practiceStandardRef: string; // e.g. "Core Module 2: Governance & Operational Management s.14"
  integrityHash: string; // SHA-256 cryptographic chain-of-custody hash
  previousHash: string; // Previous entry hash for blockchain-like verifiable log integrity
  ipAddress?: string;
  tenantId: string;
  severity: 'info' | 'notice' | 'warning' | 'critical';
}
