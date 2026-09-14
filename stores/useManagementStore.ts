import { create } from 'zustand';
import { AuthSlice, createAuthSlice } from './slices/authSlice';
import { ClientsSlice, createClientsSlice } from './slices/clientsSlice';
import { CaseNotesSlice, createCaseNotesSlice } from './slices/caseNotesSlice';
import { IncidentsSlice, createIncidentsSlice } from './slices/incidentsSlice';
import { ComplianceSlice, createComplianceSlice } from './slices/complianceSlice';
import { BillingSlice, createBillingSlice } from './slices/billingSlice';
import { HRSlice, createHRSlice } from './slices/hrSlice';
import { SyncSlice, createSyncSlice } from './slices/syncSlice';
import { UISlice, createUISlice } from './slices/uiSlice';
import { AuditSlice, createAuditSlice } from './slices/auditSlice';

export type ManagementStore = AuthSlice &
  ClientsSlice &
  CaseNotesSlice &
  IncidentsSlice &
  ComplianceSlice &
  BillingSlice &
  HRSlice &
  SyncSlice &
  UISlice &
  AuditSlice;

export const useManagementStore = create<ManagementStore>()((...args) => ({
  ...createAuthSlice(...args),
  ...createClientsSlice(...args),
  ...createCaseNotesSlice(...args),
  ...createIncidentsSlice(...args),
  ...createComplianceSlice(...args),
  ...createBillingSlice(...args),
  ...createHRSlice(...args),
  ...createSyncSlice(...args),
  ...createUISlice(...args),
  ...createAuditSlice(...args),
}));
