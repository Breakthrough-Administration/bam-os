import React, { useState, lazy, Suspense } from 'react';
import { useManagementStore } from '../stores';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { CommandPalette } from '../components/CommandPalette';
import { QuickActionModal } from '../components/QuickActionModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineIndicator } from '../components/OfflineIndicator';

// Lazy loaded clinical modules for initial bundle optimization
const ClinicalSupervisorDashboard = lazy(() => import('../components/features/ClinicalSupervisorDashboard').then(m => ({ default: m.ClinicalSupervisorDashboard })));
const ClientsModule = lazy(() => import('../components/features/ClientsModule').then(m => ({ default: m.ClientsModule })));
const SOAPVoiceScribeModule = lazy(() => import('../components/features/SOAPVoiceScribeModule').then(m => ({ default: m.SOAPVoiceScribeModule })));
const RestrictivePracticesModule = lazy(() => import('../components/features/RestrictivePracticesModule').then(m => ({ default: m.RestrictivePracticesModule })));
const IncidentsModule = lazy(() => import('../components/features/IncidentsModule').then(m => ({ default: m.IncidentsModule })));
const ClinicalOutcomesModule = lazy(() => import('../components/features/ClinicalOutcomesModule').then(m => ({ default: m.ClinicalOutcomesModule })));
const BillingModule = lazy(() => import('../components/features/BillingModule').then(m => ({ default: m.BillingModule })));
const SCHADSRosterModule = lazy(() => import('../components/features/SCHADSRosterModule').then(m => ({ default: m.SCHADSRosterModule })));
const AuditComplianceModule = lazy(() => import('../components/features/AuditComplianceModule').then(m => ({ default: m.AuditComplianceModule })));
const GoogleWorkspaceHub = lazy(() => import('../components/features/GoogleWorkspaceHub').then(m => ({ default: m.GoogleWorkspaceHub })));
const SecurityRolloutModule = lazy(() => import('../components/features/SecurityRolloutModule').then(m => ({ default: m.SecurityRolloutModule })));

export default function App() {
  const { activeTab } = useManagementStore();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ClinicalSupervisorDashboard />;
      case 'participants':
        return <ClientsModule />;
      case 'case_notes':
        return <SOAPVoiceScribeModule />;
      case 'restrictive_practices':
        return <RestrictivePracticesModule />;
      case 'incident_escalation':
        return <IncidentsModule />;
      case 'clinical_outcomes':
        return <ClinicalOutcomesModule />;
      case 'billing_papl':
        return <BillingModule />;
      case 'schads_roster':
        return <SCHADSRosterModule />;
      case 'audit_compliance':
        return <AuditComplianceModule />;
      case 'workspace_hub':
        return <GoogleWorkspaceHub />;
      case 'security_rollout':
        return <SecurityRolloutModule />;
      default:
        return <ClinicalSupervisorDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Global Clinical Header */}
      <Header onOpenQuickAction={() => setIsQuickActionOpen(true)} />

      {/* Main Structural Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Clinical Work Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950/70 relative">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-50">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <div className="text-slate-400 font-semibold text-sm animate-pulse">Loading Clinical Workspace...</div>
              </div>
            }>
              {renderActiveModule()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Quick Action Clinical Launchpad */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />

      <OfflineIndicator />
    </div>
  );
}
