import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  Plus,
  Send,
  Eye,
  MapPin,
  X,
  FileCheck,
  AlertTriangle,
  Calendar,
  Building,
  FileText,
  Filter,
  Check,
  Printer,
} from 'lucide-react';
import { useManagementStore } from '../../stores';
import { IncidentReport, NDISCommissionEscalation } from '../../types';
import {
  IncidentForm,
  IncidentDetailModal,
  IncidentEscalationModal,
} from './incidents';

export const IncidentsModule: React.FC = () => {
  const { incidents, participants, addIncident, updateIncident, escalateToNDISCommission24h } =
    useManagementStore();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedIncidentForDetail, setSelectedIncidentForDetail] = useState<IncidentReport | null>(null);
  const [selectedIncidentForEscalation, setSelectedIncidentForEscalation] = useState<IncidentReport | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'priority_24h' | 'five_day' | 'lodged'>('all');

  // Modal for logging 5-day comprehensive report lodgement
  const [fiveDayModalIncident, setFiveDayModalIncident] = useState<IncidentReport | null>(null);
  const [fiveDayRefNumber, setFiveDayRefNumber] = useState('');
  const [fiveDayNotes, setFiveDayNotes] = useState('');

  const handleIncidentCreated = async (incident: IncidentReport) => {
    await addIncident(incident);
    setIsFormModalOpen(false);
  };

  const handleEscalationSuccess = async (updated: IncidentReport) => {
    await escalateToNDISCommission24h(
      updated.id,
      updated.ndisReferenceNumber || '',
      updated.investigatorNotes
    );
    setSelectedIncidentForEscalation(null);
  };

  const handleFiveDayLodged = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiveDayModalIncident) return;

    const ref = fiveDayRefNumber.trim() || `5DAY-NDIS-${Math.floor(100000 + Math.random() * 900000)}`;
    const currentEsc: NDISCommissionEscalation = fiveDayModalIncident.escalation || {
      is24HourReportable: true,
      escalationRequired: true,
      escalatedToCommission: true,
      statutoryDeadline24h: new Date(new Date(fiveDayModalIncident.occurredAt).getTime() + 86400000).toISOString(),
      statutoryDeadline5Day: new Date(new Date(fiveDayModalIncident.occurredAt).getTime() + 5 * 86400000).toISOString(),
      notificationStatus: 'notified_within_24h',
    };

    updateIncident(fiveDayModalIncident.id, {
      escalation: {
        ...currentEsc,
        fiveDayReportLodged: true,
        fiveDayReportLodgedAt: new Date().toISOString(),
        fiveDayCommissionReferenceNumber: ref,
        fiveDayReportNotes: fiveDayNotes,
      },
      investigatorNotes: fiveDayNotes
        ? `${fiveDayModalIncident.investigatorNotes || ''} | 5-Day report lodged (${ref}): ${fiveDayNotes}`
        : fiveDayModalIncident.investigatorNotes,
    });

    setFiveDayModalIncident(null);
    setFiveDayRefNumber('');
    setFiveDayNotes('');
  };

  /**
   * Calculates remaining time breakdown (hours, minutes, overdue)
   */
  const getDeadlineStats = (timestamp: string, durationHours: number) => {
    const start = new Date(timestamp).getTime();
    const deadline = start + durationHours * 60 * 60 * 1000;
    const now = Date.now();
    const diffMs = deadline - now;
    const isOverdue = diffMs <= 0;
    const totalHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    const totalDays = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;

    return {
      isOverdue,
      totalHours,
      totalDays,
      remHours,
      deadlineDate: new Date(deadline),
    };
  };

  const renderPriorityBadge = (severity: string) => {
    switch (severity) {
      case 'critical_24h':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            Critical
          </span>
        );
      case 'high_5day':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            High
          </span>
        );
      case 'standard':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Medium
          </span>
        );
      case 'minor':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Low
          </span>
        );
    }
  };

  const priority24hCount = incidents.filter((i) => i.is24HourReportable).length;
  const pending24hEscalationCount = incidents.filter(
    (i) => i.is24HourReportable && !i.ndisCommissionEscalated
  ).length;
  const pending5DayCount = incidents.filter(
    (i) => i.is24HourReportable && !i.escalation?.fiveDayReportLodged
  ).length;

  const filteredIncidents = incidents.filter((inc) => {
    if (filterMode === 'priority_24h') return inc.is24HourReportable;
    if (filterMode === 'five_day') return inc.is24HourReportable && !inc.escalation?.fiveDayReportLodged;
    if (filterMode === 'lodged') return inc.ndisCommissionEscalated;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Print-Only Register Header */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">BREAKTHROUGH PRACTICE MANAGEMENT</h1>
            <p className="text-xs font-semibold text-slate-700 uppercase mt-0.5">
              NDIS Section 73Z Reportable Incident Management Register
            </p>
            <p className="text-[11px] text-slate-600 mt-1">
              Provider Registration ID: 4050019283 • Quality & Safeguards Commission Compliance Active
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900 font-mono">CONFIDENTIAL CLINICAL REGISTER</div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              Generated: {new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Total Incidents: {incidents.length}</div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">
              NDIS Commission Statutory Incident Governance & Escalation
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforcing Section 73Z of the NDIS Act 2013: Mandatory 24-hour initial notification & 5-day comprehensive incident investigation reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Print Official Incident Register to Paper or PDF"
          >
            <Printer className="w-4 h-4 text-rose-400" />
            <span>Print Register</span>
          </button>

          <button
            onClick={() => setIsFormModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lodge New Incident Report</span>
          </button>
        </div>
      </div>

      {/* Statutory Escalation Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              24h Priority Incidents
            </div>
            <div className="text-2xl font-black text-slate-100 mt-1">{priority24hCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Section 73Z reportable events</div>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              24h Initial Lodgements Pending
            </div>
            <div className={`text-2xl font-black mt-1 ${pending24hEscalationCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              {pending24hEscalationCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {pending24hEscalationCount > 0 ? 'Urgent action required' : 'All 24h reports lodged'}
            </div>
          </div>
          <div className={`p-3 rounded-lg border ${pending24hEscalationCount > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              5-Day Comprehensive Reports
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {pending5DayCount} Pending
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Mandatory investigation dossiers</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Dual Statutory Countdown Trackers (24h & 5-Day) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>Legislated Escalation Timers (24-Hour & 5-Day Dual Countdown)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
              NDIS ACT SEC 73Z
            </span>
          </h2>
          <span className="text-xs text-slate-400">
            Real-time tracking of statutory deadlines for registered providers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incidents
            .filter((i) => i.is24HourReportable)
            .map((inc) => {
              const timer24h = getDeadlineStats(inc.occurredAt, 24);
              const timer5d = getDeadlineStats(inc.occurredAt, 24 * 5);
              const is24hLodged = inc.ndisCommissionEscalated;
              const is5dLodged = !!inc.escalation?.fiveDayReportLodged;

              return (
                <div
                  key={inc.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 shadow-sm transition ${
                    is24hLodged && is5dLodged
                      ? 'bg-slate-900 border-slate-700/80'
                      : !is24hLodged && timer24h.isOverdue
                      ? 'bg-red-950/30 border-red-500/60 ring-1 ring-red-500/30'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header bar of card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {inc.incidentNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-200">{inc.participantName}</span>
                        {renderPriorityBadge(inc.severity)}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(inc.occurredAt).toLocaleDateString('en-AU')}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-tight">
                        {inc.category.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-xs text-slate-300 font-medium mt-1">{inc.summary}</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
                        {inc.detailedDescription}
                      </p>
                    </div>

                    {/* Dual Timers Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {/* 24-Hour statutory timer */}
                      <div
                        className={`p-2.5 rounded-lg border flex flex-col justify-between space-y-1 ${
                          is24hLodged
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : timer24h.isOverdue
                            ? 'bg-red-500/20 border-red-500/40 animate-pulse'
                            : 'bg-rose-500/10 border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                            24h Priority Notice
                          </span>
                          {is24hLodged ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-rose-400" />
                          )}
                        </div>
                        {is24hLodged ? (
                          <div>
                            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                              <span>Lodged to Commission</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 truncate">
                              Ref: {inc.ndisReferenceNumber}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div
                              className={`text-[12px] font-black ${
                                timer24h.isOverdue ? 'text-rose-400' : 'text-amber-300'
                              }`}
                            >
                              {timer24h.isOverdue
                                ? `BREACHED (${timer24h.totalHours}h ago)`
                                : `${timer24h.totalHours}h remaining`}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Due: {timer24h.deadlineDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 5-Day detailed report timer */}
                      <div
                        className={`p-2.5 rounded-lg border flex flex-col justify-between space-y-1 ${
                          is5dLodged
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : timer5d.isOverdue
                            ? 'bg-red-500/20 border-red-500/40 animate-pulse'
                            : 'bg-amber-500/10 border-amber-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                            5-Day Detailed Report
                          </span>
                          {is5dLodged ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </div>
                        {is5dLodged ? (
                          <div>
                            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                              <span>Dossier Submitted</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 truncate">
                              Ref: {inc.escalation?.fiveDayCommissionReferenceNumber || 'Submitted'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div
                              className={`text-[12px] font-black ${
                                timer5d.isOverdue ? 'text-rose-400' : 'text-amber-300'
                              }`}
                            >
                              {timer5d.isOverdue
                                ? `5-DAY OVERDUE (${timer5d.totalDays}d)`
                                : `${timer5d.totalDays}d ${timer5d.remHours}h remaining`}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Due: {timer5d.deadlineDate.toLocaleDateString('en-AU')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded bg-slate-800/60 border border-slate-700/70 text-[11px] text-slate-300">
                      <span className="font-semibold text-slate-200">Immediate Action: </span>
                      <span className="truncate">{inc.immediateActionsTaken}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs gap-2 flex-wrap">
                    <div className="text-[11px] text-slate-400">
                      Occurred: {new Date(inc.occurredAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedIncidentForDetail(inc)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Dossier</span>
                      </button>

                      {!is24hLodged && (
                        <button
                          onClick={() => setSelectedIncidentForEscalation(inc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Lodge 24h</span>
                        </button>
                      )}

                      {is24hLodged && !is5dLodged && (
                        <button
                          onClick={() => setFiveDayModalIncident(inc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Lodge 5-Day</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Comprehensive Incident Log Register */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100">
              All Logged Incidents & Allegations (NDIS Practice Standards Register)
            </h2>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {(['all', 'priority_24h', 'five_day', 'lodged'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition cursor-pointer ${
                  filterMode === mode
                    ? 'bg-slate-700 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'all'
                  ? `All (${incidents.length})`
                  : mode === 'priority_24h'
                  ? `24h Priority (${priority24hCount})`
                  : mode === 'five_day'
                  ? `5-Day Due (${pending5DayCount})`
                  : `Lodged (${incidents.filter((i) => i.ndisCommissionEscalated).length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-700/80">
              <tr>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Severity / Priority</th>
                <th className="py-2.5 px-3">Occurred At</th>
                <th className="py-2.5 px-3">Participant</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">24h Priority</th>
                <th className="py-2.5 px-3">5-Day Dossier</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredIncidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono text-slate-400">{inc.incidentNumber}</td>
                  <td className="py-3 px-3">
                    {renderPriorityBadge(inc.severity)}
                  </td>
                  <td className="py-3 px-3">
                    {new Date(inc.occurredAt).toLocaleString('en-AU', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-200">{inc.participantName}</td>
                  <td className="py-3 px-3">
                    <span className="capitalize">{inc.category.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="py-3 px-3">
                    {inc.is24HourReportable ? (
                      inc.ndisCommissionEscalated ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
                          <Check className="w-3 h-3" /> 24h Lodged
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-max animate-pulse">
                          <Clock className="w-3 h-3" /> 24h Pending
                        </span>
                      )
                    ) : (
                      <span className="text-slate-500">Standard</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {inc.is24HourReportable ? (
                      inc.escalation?.fiveDayReportLodged ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Lodged
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Due
                        </span>
                      )
                    ) : (
                      <span className="text-slate-500">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {inc.ndisCommissionEscalated ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Commission Notified
                      </span>
                    ) : (
                      <span className="text-amber-400 capitalize">{inc.status.replace(/_/g, ' ')}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedIncidentForDetail(inc)}
                        className="text-xs text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
                        title="View Full Incident Dossier"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {inc.is24HourReportable && !inc.ndisCommissionEscalated && (
                        <button
                          onClick={() => setSelectedIncidentForEscalation(inc)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                        >
                          Escalate 24h
                        </button>
                      )}
                      {inc.is24HourReportable && inc.ndisCommissionEscalated && !inc.escalation?.fiveDayReportLodged && (
                        <button
                          onClick={() => setFiveDayModalIncident(inc)}
                          className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                        >
                          Lodge 5-Day
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Comprehensive Log Incident Form */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h2 className="text-base font-bold text-slate-100">
                  Lodge NDIS Reportable Incident / Allegation
                </h2>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <IncidentForm
              participants={participants}
              currentTenantId="tenant-breakthrough-vic"
              onSuccess={handleIncidentCreated}
              onCancel={() => setIsFormModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Modal: Full Incident Detail Dossier */}
      <IncidentDetailModal
        incident={selectedIncidentForDetail}
        onClose={() => setSelectedIncidentForDetail(null)}
        onOpenEscalation={(inc) => {
          setSelectedIncidentForDetail(null);
          setSelectedIncidentForEscalation(inc);
        }}
      />

      {/* Modal: Official NDIS Commission Lodgement Escalation (24h) */}
      <IncidentEscalationModal
        incident={selectedIncidentForEscalation}
        onClose={() => setSelectedIncidentForEscalation(null)}
        onSuccess={handleEscalationSuccess}
      />

      {/* Modal: 5-Day Comprehensive Investigation Report Lodgement */}
      {fiveDayModalIncident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>Record 5-Day Detailed Report Lodgement</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Section 73Z Investigation Dossier for {fiveDayModalIncident.incidentNumber}
                </p>
              </div>
              <button
                onClick={() => setFiveDayModalIncident(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFiveDayLodged} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Commission Portal 5-Day Lodgement Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5DAY-NDIS-2026-88192"
                  value={fiveDayRefNumber}
                  onChange={(e) => setFiveDayRefNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono focus:outline-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Investigation & Corrective Actions Summary
                </label>
                <textarea
                  rows={4}
                  placeholder="Summarise root-cause analysis, worker re-training, participant debrief, and BSP modifications submitted to Commission..."
                  value={fiveDayNotes}
                  onChange={(e) => setFiveDayNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-emerald-500"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Mandated under NDIS (Incident Management and Reportable Incidents) Rules 2018. Confirming will close the statutory notification countdown.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFiveDayModalIncident(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm 5-Day Submission</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
