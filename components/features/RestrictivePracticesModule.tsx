import React, { useState } from 'react';
import {
  Lock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Plus,
  TrendingDown,
  Info,
  Clock,
  Bell,
  ChevronRight,
  Filter,
  Check,
  History,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { useManagementStore } from '../../stores';
import {
  RestrictivePracticeType,
  RestrictivePracticeLog,
  RestrictivePracticeProtocol,
  AuthorisationStatus,
} from '../../types';

export const RestrictivePracticesModule: React.FC = () => {
  const {
    protocols,
    logs,
    participants,
    logRestrictivePractice,
    updateProtocolFading,
    updateProtocol,
  } = useManagementStore();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedPracticeType, setSelectedPracticeType] = useState<RestrictivePracticeType>('environmental');
  const [selectedParticipantId, setSelectedParticipantId] = useState(participants[0]?.id || '');
  const [wasAuthorised, setWasAuthorised] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [precursors, setPrecursors] = useState('');
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [administrator, setAdministrator] = useState('Dr. Sarah Jenkins');
  const [witness, setWitness] = useState('Elena Rossi');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');

  // Fading detail modal
  const [fadingModalProtocol, setFadingModalProtocol] = useState<RestrictivePracticeProtocol | null>(null);
  const [newFadingFrequency, setNewFadingFrequency] = useState<number>(0);
  const [fadingClinicianNotes, setFadingClinicianNotes] = useState('');

  // Renewal modal
  const [renewalModalProtocol, setRenewalModalProtocol] = useState<RestrictivePracticeProtocol | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [renewalAuthorisingBody, setRenewalAuthorisingBody] = useState('');

  // Filter state
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'expired' | 'critical' | 'upcoming'>('all');

  const alternativeOptions = [
    'Offered quiet sensory withdrawal room',
    'Provided noise-cancelling headphones',
    'Utilized weighted lap blanket & tactile grounding items',
    'Engaged low-arousal de-escalation vocal tone',
    'Redirected to preferred visual communication schedule (PECS)',
    'Allowed independent pacing in safe outdoor garden courtyard',
  ];

  const handleToggleAlternative = (alt: string) => {
    setAlternatives((prev) =>
      prev.includes(alt) ? prev.filter((a) => a !== alt) : [...prev, alt]
    );
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const participant = participants.find((p) => p.id === selectedParticipantId);
    if (!participant) return;

    const newLog: RestrictivePracticeLog = {
      id: `rp-log-${Date.now()}`,
      tenantId: participant.tenantId,
      participantId: participant.id,
      participantName: participant.fullName,
      practiceType: selectedPracticeType,
      wasAuthorised,
      isReportableToCommission: true,
      escalationRequired24h: !wasAuthorised,
      timestampStart: new Date(Date.now() - durationMinutes * 60000).toISOString(),
      timestampEnd: new Date().toISOString(),
      durationMinutes,
      administeredBy: administrator,
      witnessedBy: witness,
      immediatePrecursors: precursors,
      lessRestrictiveAlternativesAttempted: alternatives,
      participantOutcome: outcome,
      postIncidentDebriefCompleted: true,
      notes,
    };

    await logRestrictivePractice(newLog);
    setIsLogModalOpen(false);

    // Reset form
    setPrecursors('');
    setOutcome('');
    setNotes('');
  };

  /**
   * Calculates expiry and renewal urgency for a protocol
   */
  const getExpiryBreakdown = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        level: 'expired' as const,
        days: Math.abs(diffDays),
        label: `EXPIRED (${Math.abs(diffDays)}d overdue)`,
        badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse',
        cardBorder: 'border-red-500/50 bg-red-950/20',
      };
    } else if (diffDays <= 30) {
      return {
        level: 'critical' as const,
        days: diffDays,
        label: `CRITICAL (${diffDays} days left)`,
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
        cardBorder: 'border-rose-500/40 bg-rose-950/10',
      };
    } else if (diffDays <= 60) {
      return {
        level: 'warning' as const,
        days: diffDays,
        label: `URGENT (60-Day: ${diffDays}d)`,
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        cardBorder: 'border-amber-500/30 bg-amber-950/10',
      };
    } else if (diffDays <= 90) {
      return {
        level: 'notice' as const,
        days: diffDays,
        label: `UPCOMING (90-Day: ${diffDays}d)`,
        badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        cardBorder: 'border-slate-700/80 bg-slate-800/60',
      };
    } else {
      return {
        level: 'valid' as const,
        days: diffDays,
        label: `Compliant (${diffDays}d)`,
        badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        cardBorder: 'border-slate-700/80 bg-slate-800/60',
      };
    }
  };

  // Protocols requiring renewal attention (90 days or less, or expired)
  const alertProtocols = protocols.map((p) => ({
    protocol: p,
    expiryStats: getExpiryBreakdown(p.expiryDate),
  }));

  const expiredCount = alertProtocols.filter((a) => a.expiryStats.level === 'expired').length;
  const criticalCount = alertProtocols.filter((a) => a.expiryStats.level === 'critical').length;
  const sixtyDayCount = alertProtocols.filter((a) => a.expiryStats.level === 'warning').length;
  const ninetyDayCount = alertProtocols.filter((a) => a.expiryStats.level === 'notice').length;

  const handleApplyFadingStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fadingModalProtocol) return;

    updateProtocolFading(
      fadingModalProtocol.id,
      newFadingFrequency,
      fadingClinicianNotes,
      administrator
    );

    setFadingModalProtocol(null);
    setFadingClinicianNotes('');
  };

  const handleApplyRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalModalProtocol || !newExpiryDate) return;

    updateProtocol(renewalModalProtocol.id, {
      expiryDate: newExpiryDate,
      authorisingBody: renewalAuthorisingBody || renewalModalProtocol.authorisingBody,
      authorisationStatus: 'authorised',
      reviewDate: new Date(new Date(newExpiryDate).getTime() - 90 * 86400000).toISOString().split('T')[0],
    });

    setRenewalModalProtocol(null);
    setNewExpiryDate('');
    setRenewalAuthorisingBody('');
  };

  const filteredAlertProtocols = alertProtocols.filter((item) => {
    if (urgencyFilter === 'expired') return item.expiryStats.level === 'expired';
    if (urgencyFilter === 'critical') return item.expiryStats.level === 'critical';
    if (urgencyFilter === 'upcoming')
      return item.expiryStats.level === 'warning' || item.expiryStats.level === 'notice';
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">
              Restrictive Practices & Positive Behaviour Support Governance
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compliant with NDIS (Restrictive Practices and Behaviour Support) Rules 2018. Automated BSP authorization expiry monitoring, 90/60/30-day renewal alerts, and elimination fading schedules.
          </p>
        </div>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Restrictive Intervention</span>
        </button>
      </div>

      {/* Automated BSP Expiry & Renewal Alerts Bar */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Automated BSP & State Authorisation Renewal Alerts
            </h2>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {(['all', 'expired', 'critical', 'upcoming'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setUrgencyFilter(filter)}
                className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition cursor-pointer ${
                  urgencyFilter === filter
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter === 'all'
                  ? `All (${alertProtocols.length})`
                  : filter === 'expired'
                  ? `Expired (${expiredCount})`
                  : filter === 'critical'
                  ? `≤30 Days (${criticalCount})`
                  : `60-90 Days (${sixtyDayCount + ninetyDayCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Stat Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Protocols</div>
              <div className="text-xl font-bold text-slate-100 mt-0.5">{protocols.length}</div>
            </div>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>

          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              expiredCount > 0
                ? 'bg-red-950/30 border-red-500/40 text-red-300'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
            }`}
          >
            <div>
              <div className="text-[10px] uppercase font-bold">Expired Authorisations</div>
              <div className="text-xl font-bold mt-0.5">{expiredCount}</div>
            </div>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>

          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              criticalCount > 0
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
            }`}
          >
            <div>
              <div className="text-[10px] uppercase font-bold">&le;30 Days Critical</div>
              <div className="text-xl font-bold mt-0.5">{criticalCount}</div>
            </div>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>

          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-amber-300">
            <div>
              <div className="text-[10px] uppercase font-bold">60 &ndash; 90 Day Notice</div>
              <div className="text-xl font-bold mt-0.5">{sixtyDayCount + ninetyDayCount}</div>
            </div>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {/* Actionable Renewal Alert Notifications */}
        {(expiredCount > 0 || criticalCount > 0) && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-rose-200">NDIS Regulatory Compliance Warning:</span>
              <p className="text-rose-300/90 leading-relaxed">
                {expiredCount > 0
                  ? `There are ${expiredCount} expired restrictive practice protocol(s). Use of these practices without an active Senior Practitioner authorization constitutes an unauthorised restrictive practice, triggering a mandatory 24-hour NDIS Commission reportable incident.`
                  : `There are ${criticalCount} protocol(s) with authorisation expiring within 30 days. Formal lodgement with your State/Territory Senior Practitioner panel is required to prevent unapproved continuation.`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Authorised Protocols Register with Fading Schedules & Expiry Tracker */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Authorised Restrictive Protocols Register</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fading schedules, elimination milestones, and state authorization expiry dates
            </p>
          </div>
          <span className="text-xs text-slate-400">{filteredAlertProtocols.length} Protocols Displayed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlertProtocols.map(({ protocol, expiryStats }) => {
            const percentFaded = Math.round(
              ((protocol.baselineFrequencyPerWeek - protocol.currentFrequencyPerWeek) /
                (protocol.baselineFrequencyPerWeek || 1)) *
                100
            );

            return (
              <div
                key={protocol.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition shadow-sm ${expiryStats.cardBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {protocol.type}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${expiryStats.badgeBg}`}
                    >
                      <Clock className="w-3 h-3" />
                      {expiryStats.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm">{protocol.participantName}</h3>
                  <p className="text-xs text-slate-300 mt-1 font-medium">{protocol.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1 italic leading-relaxed">
                    Rationale: {protocol.rationale}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-700/60 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Authorising Authority:</span>
                    <span className="text-slate-200 font-semibold truncate max-w-[170px]" title={protocol.authorisingBody}>
                      {protocol.authorisingBody}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Authorisation Expiry:</span>
                    <span className="text-slate-200 font-medium font-mono">
                      {new Date(protocol.expiryDate).toLocaleDateString('en-AU')}
                    </span>
                  </div>

                  {/* Fading Track */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-300 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-emerald-400" />
                        Fading Schedule:
                      </span>
                      <span className="text-emerald-400 font-bold">{Math.max(0, percentFaded)}% Reduction</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, Math.min(100, percentFaded))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Baseline: {protocol.baselineFrequencyPerWeek}/wk</span>
                      <span className="font-semibold text-slate-200">Current: {protocol.currentFrequencyPerWeek}/wk</span>
                      <span>Target: 0 by {new Date(protocol.targetDateForElimination).toLocaleDateString('en-AU')}</span>
                    </div>
                  </div>

                  {/* Fading Milestones History Counter */}
                  {protocol.fadingMilestones && protocol.fadingMilestones.length > 0 && (
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <History className="w-3 h-3" />
                      <span>{protocol.fadingMilestones.length} fading milestone(s) documented</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setFadingModalProtocol(protocol);
                        setNewFadingFrequency(Math.max(0, protocol.currentFrequencyPerWeek - 1));
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Step Down Fading</span>
                    </button>

                    <button
                      onClick={() => {
                        setRenewalModalProtocol(protocol);
                        setNewExpiryDate(
                          new Date(new Date(protocol.expiryDate).getTime() + 365 * 86400000)
                            .toISOString()
                            .split('T')[0]
                        );
                        setRenewalAuthorisingBody(protocol.authorisingBody);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition cursor-pointer"
                    >
                      Renew
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Interventions Log Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100">Live Restrictive Intervention Audit Register</h2>
          <span className="text-xs text-slate-400">{logs.length} Total Events Logged</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-700/80">
              <tr>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Participant</th>
                <th className="py-2.5 px-3">Practice Type</th>
                <th className="py-2.5 px-3">Authorised</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Administered By</th>
                <th className="py-2.5 px-3">Less Restrictive Alternatives</th>
                <th className="py-2.5 px-3">Commission Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 text-slate-400 font-mono">
                    {new Date(l.timestampStart).toLocaleString('en-AU', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-200">{l.participantName}</td>
                  <td className="py-3 px-3">
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                      {l.practiceType}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {l.wasAuthorised ? (
                      <span className="text-emerald-400 font-semibold">Authorised</span>
                    ) : (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Unauthorised (24h Alert)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-semibold">{l.durationMinutes} mins</td>
                  <td className="py-3 px-3">{l.administeredBy}</td>
                  <td className="py-3 px-3 text-slate-400">
                    {l.lessRestrictiveAlternativesAttempted.length} strategies attempted
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                      Lodged To Commission
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Restrictive Intervention Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Log Restrictive Practice Intervention</h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Select Participant</label>
                  <select
                    aria-label="Select Participant"
                    value={selectedParticipantId}
                    onChange={(e) => setSelectedParticipantId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-emerald-500"
                    required
                  >
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} (NDIS: {p.ndisNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Legislative Practice Type</label>
                  <select
                    aria-label="Legislative Practice Type"
                    value={selectedPracticeType}
                    onChange={(e) => setSelectedPracticeType(e.target.value as RestrictivePracticeType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-emerald-500"
                  >
                    <option value="chemical">Chemical Restraint (PRN Medication)</option>
                    <option value="mechanical">Mechanical Restraint (Harness/Straps)</option>
                    <option value="physical">Physical Restraint</option>
                    <option value="environmental">Environmental Restraint (Locks/Barriers)</option>
                    <option value="seclusion">Seclusion (Solitary Isolation)</option>
                  </select>
                </div>
              </div>

              {/* Authorisation Validation Radio */}
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 space-y-2">
                <label className="block font-bold text-slate-200">Authorisation Status in Approved BSP:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="authorisation"
                      checked={wasAuthorised}
                      onChange={() => setWasAuthorised(true)}
                      className="accent-emerald-500"
                    />
                    <span>Approved in current NDIS Behaviour Support Plan</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-rose-400 font-semibold">
                    <input
                      type="radio"
                      name="authorisation"
                      checked={!wasAuthorised}
                      onChange={() => setWasAuthorised(false)}
                      className="accent-rose-500"
                    />
                    <span>Unauthorised Emergency Action (Flags 24h Escalation)</span>
                  </label>
                </div>
              </div>

              {/* Duration & Precursors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="480"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Administered By</label>
                  <input
                    type="text"
                    value={administrator}
                    onChange={(e) => setAdministrator(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Witnessed By</label>
                  <input
                    type="text"
                    value={witness}
                    onChange={(e) => setWitness(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              {/* Mandatory Less-Restrictive Alternatives Checklist */}
              <div>
                <label className="block font-bold text-slate-200 mb-1.5">
                  Mandatory Less-Restrictive Alternatives Attempted Prior to Intervention:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-800/40 rounded-lg border border-slate-700/60">
                  {alternativeOptions.map((alt) => (
                    <label key={alt} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alternatives.includes(alt)}
                        onChange={() => handleToggleAlternative(alt)}
                        className="accent-emerald-500"
                      />
                      <span className="text-[11px]">{alt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Immediate Precursors & Outcome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Immediate Precursors & Triggers</label>
                  <textarea
                    rows={2}
                    value={precursors}
                    onChange={(e) => setPrecursors(e.target.value)}
                    placeholder="Document environmental, sensory, or communicative triggers..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Participant Outcome & Debrief</label>
                  <textarea
                    rows={2}
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="Participant state post-intervention, de-escalation time..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition cursor-pointer"
                >
                  Record & Commit To Audit Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fading Schedule Step-Down Modal */}
      {fadingModalProtocol && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-emerald-400" />
                  <span>Update Practice Reduction Fading Schedule</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Participant: {fadingModalProtocol.participantName} &bull; {fadingModalProtocol.type.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setFadingModalProtocol(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyFadingStep} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/80 space-y-1.5">
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>Baseline Frequency:</span>
                  <span className="font-bold text-slate-100">{fadingModalProtocol.baselineFrequencyPerWeek} times/week</span>
                </div>
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>Current Frequency:</span>
                  <span className="font-bold text-emerald-400">{fadingModalProtocol.currentFrequencyPerWeek} times/week</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  New Step-Down Weekly Frequency Target
                </label>
                <input
                  type="number"
                  min="0"
                  max={fadingModalProtocol.baselineFrequencyPerWeek}
                  value={newFadingFrequency}
                  onChange={(e) => setNewFadingFrequency(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-bold"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Setting to 0 marks the restrictive protocol as successfully faded/eliminated.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Clinician Fading Progress Justification & Observational Notes
                </label>
                <textarea
                  rows={3}
                  value={fadingClinicianNotes}
                  onChange={(e) => setFadingClinicianNotes(e.target.value)}
                  placeholder="Document functional replacement skills acquired and reduced behavioral intensity..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFadingModalProtocol(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Commit Fading Milestone</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BSP & Authorisation Renewal Modal */}
      {renewalModalProtocol && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>Renew State Authorisation & BSP Validity</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Protocol: {renewalModalProtocol.participantName} &bull; {renewalModalProtocol.type}
                </p>
              </div>
              <button
                onClick={() => setRenewalModalProtocol(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyRenewal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  New State / Territory Expiry Date
                </label>
                <input
                  type="date"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Usually 12 months from Senior Practitioner clinical panel approval date.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Authorising Authority / Clinical Panel Mechanism
                </label>
                <input
                  type="text"
                  value={renewalAuthorisingBody}
                  onChange={(e) => setRenewalAuthorisingBody(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  This updates the protocol status to Authorised and recalculates the 90-day review timeline.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewalModalProtocol(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Authorisation Renewal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
