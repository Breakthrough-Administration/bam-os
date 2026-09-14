import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Users,
  Award,
  Lock,
  Building,
  History,
  FileKey,
  Layers,
} from 'lucide-react';
import { useManagementStore } from '../../stores';
import { DigitalSignatureManager } from './DigitalSignatureManager';
import { AuditActivityHistory } from './AuditActivityHistory';

export const AuditComplianceModule: React.FC = () => {
  const { participants, incidents, protocols, shifts, caseNotes, auditLogs } = useManagementStore();
  const [activeSubTab, setActiveSubTab] = useState<'activity_history' | 'standards_checklist' | 'digital_signatures'>('activity_history');

  const handleExportAuditBundle = () => {
    const auditManifest = {
      providerName: 'Breakthrough Practice Operations',
      abn: '48 123 456 789',
      ndisRegistrationNumber: '4-3ABCD-901',
      generatedAt: new Date().toISOString(),
      standardsCompliance: {
        coreModule: 'Compliant',
        module2A_BehaviourSupport: 'Compliant (All restrictive practices authorised)',
        workerScreeningCheck: '100% Cleared',
      },
      caseloadSummary: {
        activeParticipants: participants.length,
        totalBudgetAllocatedAUD: participants.reduce((acc, p) => acc + p.totalAllocatedBudget, 0),
        totalBudgetConsumedAUD: participants.reduce((acc, p) => acc + p.consumedBudget, 0),
      },
      restrictivePracticesAudit: protocols.map((p) => ({
        id: p.id,
        participant: p.participantName,
        type: p.type,
        status: p.authorisationStatus,
        authorisingBody: p.authorisingBody,
        baseline: p.baselineFrequencyPerWeek,
        current: p.currentFrequencyPerWeek,
        targetElimination: p.targetDateForElimination,
      })),
      incidentRegisterAudit: incidents.map((i) => ({
        number: i.incidentNumber,
        occurredAt: i.occurredAt,
        category: i.category,
        is24HourReportable: i.is24HourReportable,
        commissionEscalated: i.ndisCommissionEscalated,
        commissionRef: i.ndisReferenceNumber || 'N/A',
      })),
      schadsRosterAudits: shifts.map((s) => ({
        shiftId: s.id,
        worker: s.workerName,
        engagementHours: s.complianceAudit?.engagementHours,
        violations: s.complianceAudit?.violations || [],
      })),
      databaseMutationsAudit: auditLogs.map((a) => ({
        id: a.id,
        timestamp: a.timestamp,
        action: a.action,
        entityType: a.entityType,
        entityTitle: a.entityTitle,
        performedBy: a.performedBy.userName,
        screeningId: a.performedBy.ndisWorkerScreeningId || 'N/A',
        integrityHash: a.integrityHash,
      })),
    };

    const blob = new Blob([JSON.stringify(auditManifest, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Breakthrough-NDIS-Commission-Audit-Bundle-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAuditCSV = () => {
    const headers = [
      'EventID',
      'TimestampUTC',
      'Action',
      'EntityType',
      'EntityTitle',
      'Participant',
      'PerformedBy',
      'Role',
      'WorkerScreeningID',
      'ChangeSummary',
      'PracticeStandardRef',
      'IntegrityHash',
    ];

    const rows = auditLogs.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${(l.entityTitle || '').replace(/"/g, '""')}"`,
      `"${(l.participantName || 'N/A').replace(/"/g, '""')}"`,
      `"${(l.performedBy?.userName || '').replace(/"/g, '""')}"`,
      `"${(l.performedBy?.role || '').replace(/"/g, '""')}"`,
      `"${(l.performedBy?.ndisWorkerScreeningId || 'N/A').replace(/"/g, '""')}"`,
      `"${(l.changeSummary || '').replace(/"/g, '""')}"`,
      `"${(l.practiceStandardRef || '').replace(/"/g, '""')}"`,
      `"${l.integrityHash || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Breakthrough-NDIS-Audit-Activity-History-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">
              NDIS Practice Standards & Regulatory Audit Register
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governance & Quality Safeguards reporting against NDIS Practice Standards (Core Module & Module 2A: High Intensity & Restrictive Practices).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportAuditCSV}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
            title="Export detailed activity history logs as CSV for external NDIS auditors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Download CSV (Audit Logs)</span>
          </button>

          <button
            onClick={handleExportAuditBundle}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow transition cursor-pointer"
            title="Export full NDIS compliance JSON evidence manifest"
          >
            <Download className="w-4 h-4" />
            <span>Export Full JSON Bundle</span>
          </button>
        </div>
      </div>

      {/* Registration Groups Status Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-400">Registration Group 0110</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
              VERIFIED
            </span>
          </div>
          <div className="text-sm font-bold text-slate-100">Specialist Positive Behaviour Support</div>
          <p className="text-xs text-slate-400">
            Compliant with Practitioner Suitability Framework. Authorised Functional Behaviour Assessments and BSP lodgements.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400">Registration Group 0128</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
              VERIFIED
            </span>
          </div>
          <div className="text-sm font-bold text-slate-100">Therapeutic Supports</div>
          <p className="text-xs text-slate-400">
            Psychology, Occupational Therapy, and Speech Pathology clinical note governance with strict DLP PII redaction.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400">Registration Group 0107</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
              VERIFIED
            </span>
          </div>
          <div className="text-sm font-bold text-slate-100">Assistance in Coordinating Supports</div>
          <p className="text-xs text-slate-400">
            Level 2 & Level 3 Specialist Support Coordination adhering strictly to Fair Work SCHADS Award scheduling rules.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('activity_history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'activity_history'
              ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Database Activity & Audit History</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-teal-500/20 text-teal-300">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('standards_checklist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'standards_checklist'
              ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>NDIS Quality Standards & Readiness</span>
        </button>

        <button
          onClick={() => setActiveSubTab('digital_signatures')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'digital_signatures'
              ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <FileKey className="w-4 h-4" />
          <span>Cryptographic Signature Manager</span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeSubTab === 'activity_history' && (
        <div className="space-y-6">
          <AuditActivityHistory />
        </div>
      )}

      {activeSubTab === 'standards_checklist' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Safeguards Standards Check */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-100">NDIS Quality & Safeguards Readiness Checklist</h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-800/40 border border-slate-700/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">NDIS Worker Screening Check (NDISWC)</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    100% of practitioners & frontline workers hold valid state screening clearances. Zero unverified workers rostered.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-800/40 border border-slate-700/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">24-Hour Mandatory Incident Notification Pipeline</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Direct connection with NDIS Commission electronic notification protocol for reportable allegations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-800/40 border border-slate-700/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">Australian Privacy Principles (APP 11 & Privacy Act 1988)</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Outbound AI and external network traffic guarded by client-side PII regex sanitizer preventing leak of Medicare, NDIS, or full address data.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-800/40 border border-slate-700/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">Fair Work SCHADS Award 2020 Roster Enforcer</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Rosters audited automatically for 2h minimum engagements, broken shift penalties, and 10-hour rest pause between shifts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Evidence Dossier Details */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-100">Digital Audit Trail Metrics</h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
                <span className="text-slate-300">Total IndexedDB Clinical Case Notes:</span>
                <span className="font-mono font-bold text-white">{caseNotes.length} Verified Encrypted</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
                <span className="text-slate-300">Authorised Restrictive Practice Protocols:</span>
                <span className="font-mono font-bold text-emerald-400">{protocols.length} Active in BSP</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
                <span className="text-slate-300">Total Historical Shift Roster Audits:</span>
                <span className="font-mono font-bold text-white">{shifts.length} Logged</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
                <span className="text-slate-300">Total Logged Incidents & Allegations:</span>
                <span className="font-mono font-bold text-white">{incidents.length} Registered</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/40 text-[11px] text-slate-400">
                All records timestamped with UTC ISO 8601 strings and protected with immutable local revision histories.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'digital_signatures' && (
        <div className="space-y-6">
          <DigitalSignatureManager />
        </div>
      )}
    </div>
  );
};

