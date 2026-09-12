import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  PhoneCall,
  Search,
  Filter,
  Eye,
  Send,
  Building,
  MapPin,
  Calendar,
  Users,
  FileCheck,
} from 'lucide-react';
import { IncidentReport, IncidentCategory } from '../../../types/incident';

interface IncidentListProps {
  incidents: IncidentReport[];
  onSelectIncident: (incident: IncidentReport) => void;
  onOpenEscalation: (incident: IncidentReport) => void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  onSelectIncident,
  onOpenEscalation,
}) => {
  const [filterType, setFilterType] = useState<'all' | '24h_only' | 'pending_escalation' | 'notified'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Format human-readable incident category.
   */
  const formatCategoryLabel = (category: IncidentCategory): string => {
    switch (category) {
      case 'allegation_death':
        return 'Death of Participant';
      case 'allegation_serious_injury':
        return 'Serious Injury';
      case 'allegation_sexual_misconduct':
        return 'Sexual Misconduct / Assault';
      case 'allegation_abuse_neglect':
        return 'Abuse or Neglect';
      case 'unauthorised_restrictive_practice':
        return 'Unauthorised Restrictive Practice';
      case 'medication_error':
        return 'Medication Error';
      case 'worker_injury':
        return 'Worker Injury';
      case 'property_damage':
        return 'Property Damage';
      case 'challenging_behaviour':
        return 'Challenging Behaviour';
      case 'near_miss':
        return 'Near Miss';
      default:
        return String(category).replace(/_/g, ' ');
    }
  };

  /**
   * Calculates remaining hours until statutory 24-hour deadline.
   */
  const calculateCountdown = (occurredAt: string) => {
    const occurred = new Date(occurredAt).getTime();
    const deadline = occurred + 24 * 60 * 60 * 1000;
    const now = Date.now();
    const remainingMs = deadline - now;

    if (remainingMs <= 0) {
      return { text: '24h Deadline Expired', isExpired: true, hours: 0 };
    }

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      text: `${hours}h ${minutes}m remaining`,
      isExpired: false,
      hours,
      minutes,
    };
  };

  // Filter and search incidents
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.incidentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.locationAddress && inc.locationAddress.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === '24h_only') return inc.is24HourReportable;
    if (filterType === 'pending_escalation') return inc.is24HourReportable && !inc.ndisCommissionEscalated;
    if (filterType === 'notified') return inc.ndisCommissionEscalated;

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by participant, ID, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({incidents.length})
          </button>
          <button
            onClick={() => setFilterType('24h_only')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filterType === '24h_only'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800/80 text-rose-400 hover:text-rose-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>24h Reportable ({incidents.filter((i) => i.is24HourReportable).length})</span>
          </button>
          <button
            onClick={() => setFilterType('pending_escalation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filterType === 'pending_escalation'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800/80 text-amber-400 hover:text-amber-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Action Required ({incidents.filter((i) => i.is24HourReportable && !i.ndisCommissionEscalated).length})</span>
          </button>
          <button
            onClick={() => setFilterType('notified')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filterType === 'notified'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800/80 text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Commission Notified</span>
          </button>
        </div>
      </div>

      {/* Incident List */}
      {filteredIncidents.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <FileCheck className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-medium">No incident reports found matching the selected criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => {
            const countdown = calculateCountdown(incident.occurredAt);
            const is24h = incident.is24HourReportable;
            const isEscalated = incident.ndisCommissionEscalated;

            return (
              <div
                key={incident.id}
                className={`p-4 rounded-xl border transition-all duration-150 ${
                  is24h && !isEscalated
                    ? 'bg-rose-950/20 border-rose-500/50 hover:border-rose-400 shadow-sm'
                    : isEscalated
                    ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/40'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left Column: ID, Category, Participant, Summary */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {incident.incidentNumber}
                      </span>

                      {/* Category Badge */}
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          is24h
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {is24h && <ShieldAlert className="w-3 h-3 text-rose-400" />}
                        {formatCategoryLabel(incident.category)}
                      </span>

                      {/* 24-Hour Statutory Countdown or Status */}
                      {is24h && (
                        isEscalated ? (
                          <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Commission Notified ({incident.ndisReferenceNumber || 'Logged'})</span>
                          </span>
                        ) : (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              countdown.isExpired
                                ? 'bg-rose-600 text-white animate-pulse'
                                : countdown.hours < 6
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>24h Countdown: {countdown.text}</span>
                          </span>
                        )
                      )}

                      {/* Restrictive practice flag */}
                      {incident.restrictivePracticeApplied && (
                        <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                          Restrictive Practice: {incident.restrictivePracticeType || 'Applied'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{incident.participantName}</span>
                      {incident.participantNdisNumber && (
                        <span className="text-xs font-normal text-slate-400">
                          (NDIS: {incident.participantNdisNumber})
                        </span>
                      )}
                    </h4>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {incident.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(incident.occurredAt).toLocaleString('en-AU', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>

                      {incident.locationAddress && (
                        <span className="flex items-center gap-1 max-w-xs truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{incident.locationAddress}</span>
                        </span>
                      )}

                      {incident.involvedPersons && incident.involvedPersons.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>{incident.involvedPersons.length} Persons Recorded</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    {is24h && !isEscalated && (
                      <button
                        onClick={() => onOpenEscalation(incident)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Escalate to Commission</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectIncident(incident)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Dossier</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
