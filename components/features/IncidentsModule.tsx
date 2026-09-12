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
} from 'lucide-react';
import { useManagementStore } from '../../stores';
import { IncidentReport } from '../../types';
import {
  IncidentForm,
  IncidentDetailModal,
  IncidentEscalationModal,
} from './incidents';

export const IncidentsModule: React.FC = () => {
  const { incidents, participants, addIncident, escalateToNDISCommission24h } = useManagementStore();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedIncidentForDetail, setSelectedIncidentForDetail] = useState<IncidentReport | null>(null);
  const [selectedIncidentForEscalation, setSelectedIncidentForEscalation] = useState<IncidentReport | null>(null);

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

  /**
   * Calculates remaining hours until the 24-hour statutory reporting deadline.
   */
  const getRemainingHours = (occurredAt: string) => {
    const occurred = new Date(occurredAt).getTime();
    const deadline = occurred + 24 * 60 * 60 * 1000;
    const now = Date.now();
    const remainingMs = deadline - now;
    const remainingHours = Math.round(remainingMs / (1000 * 60 * 60));
    return remainingHours;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">
              NDIS Commission 24-Hour Priority Incident Escalator
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforces Section 73Z of the NDIS Act 2013. Mandatory notification within 24 hours for all reportable allegations.
          </p>
        </div>

        <button
          onClick={() => setIsFormModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lodge New Incident Report</span>
        </button>
      </div>

      {/* 24-Hour Mandatory Countdown Trackers */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <span>Priority 24-Hour Reportable Incidents Register</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
            LEGISLATED DEADLINES
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incidents
            .filter((i) => i.is24HourReportable)
            .map((inc) => {
              const hoursLeft = getRemainingHours(inc.occurredAt);
              const isOverdue = hoursLeft <= 0;

              return (
                <div
                  key={inc.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 shadow-sm ${
                    inc.ndisCommissionEscalated
                      ? 'bg-slate-900 border-slate-700/80'
                      : 'bg-rose-950/20 border-rose-500/40'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {inc.incidentNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-200">{inc.participantName}</span>
                      </div>

                      {/* Escalation Pill */}
                      {inc.ndisCommissionEscalated ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Lodged: {inc.ndisReferenceNumber}
                        </span>
                      ) : (
                        <span
                          className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border animate-pulse ${
                            isOverdue
                              ? 'bg-red-600 text-white border-red-500'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {isOverdue ? 'DEADLINE BREACHED' : `${hoursLeft}h Remaining`}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-white uppercase tracking-tight">
                      {inc.category.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">{inc.summary}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{inc.detailedDescription}</p>

                    <div className="p-2.5 rounded bg-slate-800/60 border border-slate-700 text-[11px] text-slate-300">
                      <span className="font-semibold text-slate-200">Immediate Action Taken: </span>
                      {inc.immediateActionsTaken}
                    </div>

                    {inc.locationAddress && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{inc.locationAddress}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="text-[11px] text-slate-400">
                      Occurred: {new Date(inc.occurredAt).toLocaleString('en-AU')}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedIncidentForDetail(inc)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Dossier</span>
                      </button>

                      {!inc.ndisCommissionEscalated && (
                        <button
                          onClick={() => setSelectedIncidentForEscalation(inc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Escalate</span>
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>All Logged Incidents & Allegations (Audit Trail)</span>
          </h2>
          <span className="text-xs text-slate-400">{incidents.length} Records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-700/80">
              <tr>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Occurred At</th>
                <th className="py-2.5 px-3">Participant</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">24h Priority Flag</th>
                <th className="py-2.5 px-3">Involved</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono text-slate-400">{inc.incidentNumber}</td>
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        24h Mandated
                      </span>
                    ) : (
                      <span className="text-slate-500">Standard</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-400">
                      {inc.involvedPersons?.length ? `${inc.involvedPersons.length} recorded` : '1 staff'}
                    </span>
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
                          Escalate
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

      {/* Modal: Official NDIS Commission Lodgement Escalation */}
      <IncidentEscalationModal
        incident={selectedIncidentForEscalation}
        onClose={() => setSelectedIncidentForEscalation(null)}
        onSuccess={handleEscalationSuccess}
      />
    </div>
  );
};
