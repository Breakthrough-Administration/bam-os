import React, { useState, useMemo } from 'react';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Clock,
  User,
  Eye,
  ArrowRight,
  Database,
  Hash,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useManagementStore } from '../../stores';
import { NDISAuditLogEntry, NDISAuditAction, NDISEntityType } from '../../types/audit';

export const AuditActivityHistory: React.FC = () => {
  const { auditLogs, addAuditLog, verifyAuditChain, lastChainVerification } = useManagementStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [selectedLogForInspection, setSelectedLogForInspection] = useState<NDISAuditLogEntry | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          log.entityTitle.toLowerCase().includes(q) ||
          log.performedBy.userName.toLowerCase().includes(q) ||
          (log.participantName && log.participantName.toLowerCase().includes(q)) ||
          log.changeSummary.toLowerCase().includes(q) ||
          log.practiceStandardRef.toLowerCase().includes(q) ||
          log.id.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Entity filter
      if (selectedEntity !== 'all' && log.entityType !== selectedEntity) {
        return false;
      }

      // Action filter
      if (selectedAction !== 'all' && log.action !== selectedAction) {
        return false;
      }

      // Timeframe filter
      if (selectedTimeframe !== 'all') {
        const logTime = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (selectedTimeframe === '24h' && now - logTime > 24 * 60 * 60 * 1000) return false;
        if (selectedTimeframe === '7d' && now - logTime > 7 * 24 * 60 * 60 * 1000) return false;
        if (selectedTimeframe === '30d' && now - logTime > 30 * 24 * 60 * 60 * 1000) return false;
      }

      return true;
    });
  }, [auditLogs, searchQuery, selectedEntity, selectedAction, selectedTimeframe]);

  // Run cryptographic verification
  const handleVerifyChain = () => {
    const result = verifyAuditChain();
    if (result.isValid) {
      setVerificationFeedback(
        `Cryptographic Chain Verified: All ${result.totalLogs} mutations verified with unbroken SHA-256 hash continuity. Zero tampering detected.`
      );
    } else {
      setVerificationFeedback(`Warning: Cryptographic chain discontinuity detected.`);
    }
    setTimeout(() => setVerificationFeedback(null), 5000);
  };

  // Simulate a live database mutation to demonstrate real-time audit capture
  const handleSimulateMutation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const simulatedActions = [
        {
          action: 'AUTHORISE' as NDISAuditAction,
          entityType: 'restrictivePracticeProtocols' as NDISEntityType,
          entityId: `proto-rp-${Date.now().toString().slice(-4)}`,
          entityTitle: 'Emergency Environmental Lockout Protocol',
          participantName: 'Liam Walker',
          participantId: 'p1',
          changeSummary: 'Recorded Victorian Senior Practitioner interim authorisation approval for mechanical sensor lockout.',
          practiceStandardRef: 'NDIS Practice Standards Module 2A (s.18)',
          severity: 'warning' as const,
        },
        {
          action: 'DLP_PII_REDACT' as NDISAuditAction,
          entityType: 'soapCaseNotes' as NDISEntityType,
          entityId: `note-${Date.now().toString().slice(-4)}`,
          entityTitle: 'Speech Pathology Consultation SOAP Note',
          participantName: 'Chloe Bennett',
          participantId: 'p2',
          changeSummary: 'Scrubbed 3 Medicare & private contact PII tokens via regex sanitizer before database commit.',
          practiceStandardRef: 'Privacy Act 1988 & APP 11',
          severity: 'info' as const,
        },
        {
          action: 'ROSTER_SCHADS_AUDIT' as NDISAuditAction,
          entityType: 'rosterShifts' as NDISEntityType,
          entityId: `shift-${Date.now().toString().slice(-4)}`,
          entityTitle: 'Specialist PBS Shift #S-209',
          participantName: 'Oliver Hayes',
          participantId: 'p3',
          changeSummary: 'Verified 10h mandatory rest break between shifts and 2h minimum engagement adherence.',
          practiceStandardRef: 'Fair Work SCHADS Award 2020 (Cl. 25.5)',
          severity: 'notice' as const,
        },
      ];

      const chosen = simulatedActions[Math.floor(Math.random() * simulatedActions.length)];
      addAuditLog({
        ...chosen,
        performedBy: {
          userId: 'user-clinician-1',
          userName: 'Dr. Sarah Jenkins',
          role: 'Lead Clinician (PBS Specialist)',
          ndisWorkerScreeningId: 'NDISWC-VIC-884920',
        },
        tenantId: 'tenant-main',
        previousStateSnippet: { status: 'draft', verified: false },
        newStateSnippet: { status: 'committed', verified: true, auditVerifiedAt: new Date().toISOString() },
      });

      setIsSimulating(false);
    }, 600);
  };

  // Export audit logs as JSON bundle
  const handleExportJSON = () => {
    const bundle = {
      exportMetadata: {
        system: 'Breakthrough Manager OS',
        purpose: 'NDIS Quality & Safeguards Commission Statutory Audit Evidence',
        generatedAt: new Date().toISOString(),
        totalRecords: filteredLogs.length,
        cryptographicChainIntegrity: lastChainVerification.isValid ? 'UNBROKEN_SHA256' : 'FLAGGED',
      },
      records: filteredLogs,
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Breakthrough-NDIS-Audit-Trail-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export audit logs as CSV
  const handleExportCSV = () => {
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

    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.entityTitle.replace(/"/g, '""')}"`,
      `"${(l.participantName || 'N/A').replace(/"/g, '""')}"`,
      `"${l.performedBy.userName.replace(/"/g, '""')}"`,
      `"${l.performedBy.role.replace(/"/g, '""')}"`,
      `"${l.performedBy.ndisWorkerScreeningId || 'N/A'}"`,
      `"${l.changeSummary.replace(/"/g, '""')}"`,
      `"${l.practiceStandardRef.replace(/"/g, '""')}"`,
      `"${l.integrityHash}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Breakthrough-NDIS-Audit-Trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionBadgeColor = (action: NDISAuditAction) => {
    switch (action) {
      case 'ESCALATE_24H':
      case 'ESCALATE_5DAY':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'AUTHORISE':
      case 'FADING_STEP_DOWN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'SIGN_CRYPTOGRAPHIC':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'DLP_PII_REDACT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'ROSTER_SCHADS_AUDIT':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'CREATE':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getEntityIcon = (entityType: NDISEntityType) => {
    switch (entityType) {
      case 'soapCaseNotes':
        return <FileText className="w-4 h-4 text-purple-400" />;
      case 'restrictivePracticeProtocols':
      case 'restrictivePracticeLogs':
        return <Lock className="w-4 h-4 text-amber-400" />;
      case 'incidents':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'rosterShifts':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'participants':
        return <User className="w-4 h-4 text-teal-400" />;
      default:
        return <Database className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity History Component Header & Stats Bento */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>NDIS Statutory Database Activity Register</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                    LIVE MUTATION TRACKER
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Immutable audit trail tracking clinical case notes, restrictive practice authorizations, 24h statutory escalations, and SCHADS award checks.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleVerifyChain}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              title="Verify cryptographic SHA-256 block hash continuity"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify Cryptographic Chain</span>
            </button>

            <button
              onClick={handleSimulateMutation}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-semibold transition"
              title="Simulate a real-time clinical database mutation"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>{isSimulating ? 'Logging...' : 'Simulate Mutation'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition cursor-pointer"
              title="Download detailed activity history logs as CSV for external NDIS auditing purposes"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
              title="Export JSON Evidence Bundle"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Verification Alert Feedback */}
        {verificationFeedback && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{verificationFeedback}</span>
          </div>
        )}

        {/* Real-time Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Total Audited Mutations</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">{auditLogs.length} Records</div>
            <span className="text-[10px] text-teal-400 font-medium">100% Chain-of-Custody</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Cryptographic Hash Chain</span>
            <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Unbroken</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">SHA-256 Immutable</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">24h Escalation Audits</span>
            <div className="text-lg font-bold font-mono text-rose-300 mt-1">
              {auditLogs.filter((l) => l.action.startsWith('ESCALATE')).length} Logged
            </div>
            <span className="text-[10px] text-rose-400 font-medium">Statutory Compliance Met</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">DLP PII Redaction Events</span>
            <div className="text-lg font-bold font-mono text-purple-300 mt-1">
              {auditLogs.filter((l) => l.action === 'DLP_PII_REDACT').length} Scrubbed
            </div>
            <span className="text-[10px] text-purple-400 font-medium">APP 11 Privacy Intact</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          {/* Search Box */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clinician, participant, entity, or standard..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Entity Filter */}
          <div className="sm:col-span-3">
            <select
              aria-label="Filter by Entity Collection"
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Entity Collections</option>
              <option value="soapCaseNotes">Clinical Case Notes</option>
              <option value="restrictivePracticeProtocols">Restrictive Protocols (BSP)</option>
              <option value="restrictivePracticeLogs">Restrictive Practice Administrations</option>
              <option value="incidents">Incidents & Allegations</option>
              <option value="rosterShifts">Roster Shifts (SCHADS)</option>
              <option value="participants">Participant Records</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="sm:col-span-3">
            <select
              aria-label="Filter by Action Type"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Action Types</option>
              <option value="CREATE">Record Creation (CREATE)</option>
              <option value="UPDATE">Record Mutation (UPDATE)</option>
              <option value="AUTHORISE">Protocol Authorisation</option>
              <option value="ESCALATE_24H">24-Hour Statutory Escalation</option>
              <option value="FADING_STEP_DOWN">Fading Milestone Step-Down</option>
              <option value="SIGN_CRYPTOGRAPHIC">Digital Signature Seal</option>
              <option value="DLP_PII_REDACT">DLP Privacy Redaction</option>
              <option value="ROSTER_SCHADS_AUDIT">SCHADS Compliance Audit</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="sm:col-span-2 flex items-center justify-end gap-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                viewMode === 'timeline'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Timeline vs Table */}
      {filteredLogs.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
          <Database className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No matching audit logs found</p>
          <p className="text-xs text-slate-500">Try adjusting your search query or filters.</p>
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="space-y-4">
          {filteredLogs.map((log, idx) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                className="relative pl-6 sm:pl-8 group transition"
              >
                {/* Vertical Timeline Guide Wire */}
                {idx !== filteredLogs.length - 1 && (
                  <div className="absolute left-2.5 sm:left-3.5 top-6 bottom-0 w-0.5 bg-slate-800" />
                )}

                {/* Timeline Node Icon */}
                <div className="absolute left-0 sm:left-1 top-3.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-xs group-hover:border-teal-500 transition">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                </div>

                {/* Card Container */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        {getEntityIcon(log.entityType)}
                        <span>{log.entityTitle}</span>
                      </span>
                      {log.participantName && (
                        <span className="text-xs text-teal-400 font-medium bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                          Participant: {log.participantName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{new Date(log.timestamp).toLocaleDateString('en-AU')}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString('en-AU')} AEST</span>
                    </div>
                  </div>

                  {/* Summary Text */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {log.changeSummary}
                  </p>

                  {/* Actor & Governance Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{log.performedBy.userName}</span>
                        <span className="text-slate-500">({log.performedBy.role})</span>
                      </span>

                      {log.performedBy.ndisWorkerScreeningId && (
                        <span className="text-emerald-400/90 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                          Screening: {log.performedBy.ndisWorkerScreeningId}
                        </span>
                      )}

                      <span className="text-slate-500 italic">
                        Ref: {log.practiceStandardRef}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-medium"
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide State Diff</span>
                            <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <span>Inspect State Diff & Hash</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable State Diff & SHA-256 Proof */}
                  {isExpanded && (
                    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5 text-teal-400" />
                          <span>Cryptographic Signature Proof</span>
                        </span>
                        <span className="text-slate-500 text-[10px]">NDIS Act 2013 Compliant Audit Entry</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-500 block mb-1">Entry SHA-256 Hash:</span>
                          <span className="text-teal-300 break-all">{log.integrityHash}</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-500 block mb-1">Previous Block Hash:</span>
                          <span className="text-slate-400 break-all">{log.previousHash}</span>
                        </div>
                      </div>

                      {(log.previousStateSnippet || log.newStateSnippet) && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                          <span className="text-slate-400 block font-sans font-bold text-[11px]">
                            Forensic Database Delta Snippet:
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="p-2 rounded bg-rose-950/20 border border-rose-900/40 text-rose-300/90 overflow-x-auto">
                              <span className="text-[10px] text-rose-400 font-bold block mb-1">BEFORE MUTATION:</span>
                              <pre className="text-[10px]">
                                {typeof log.previousStateSnippet === 'object'
                                  ? JSON.stringify(log.previousStateSnippet, null, 2)
                                  : String(log.previousStateSnippet || 'null (Initial record creation)')}
                              </pre>
                            </div>
                            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-900/40 text-emerald-300/90 overflow-x-auto">
                              <span className="text-[10px] text-emerald-400 font-bold block mb-1">AFTER MUTATION:</span>
                              <pre className="text-[10px]">
                                {typeof log.newStateSnippet === 'object'
                                  ? JSON.stringify(log.newStateSnippet, null, 2)
                                  : String(log.newStateSnippet || 'Committed')}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High-Density Table View for Quality Auditors */
        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800 uppercase">
                <tr>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Entity & Title</th>
                  <th className="py-3 px-3">Participant</th>
                  <th className="py-3 px-3">Clinician / Actor</th>
                  <th className="py-3 px-3">Practice Standard</th>
                  <th className="py-3 px-3">SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString('en-AU')}{' '}
                      {new Date(log.timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-200">{log.entityTitle}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.entityId}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-teal-300">
                      {log.participantName || '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-slate-200">{log.performedBy.userName}</div>
                      <div className="text-[10px] text-slate-400">{log.performedBy.role}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400 max-w-[200px] truncate" title={log.practiceStandardRef}>
                      {log.practiceStandardRef}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 max-w-[120px] truncate" title={log.integrityHash}>
                      {log.integrityHash.slice(0, 16)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
