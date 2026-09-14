import React from 'react';
import {
  X,
  ShieldAlert,
  Clock,
  CheckCircle2,
  PhoneCall,
  MapPin,
  Calendar,
  Users,
  FileText,
  Ambulance,
  Shield,
  Building,
  Printer,
} from 'lucide-react';
import { IncidentReport } from '../../../types/incident';

interface IncidentDetailModalProps {
  incident: IncidentReport | null;
  onClose: () => void;
  onOpenEscalation: (incident: IncidentReport) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onOpenEscalation,
}) => {
  if (!incident) return null;

  const is24h = incident.is24HourReportable;
  const isEscalated = incident.ndisCommissionEscalated;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 print-report incident-card incident-print-area">
        {/* Print-Only Official NDIS Quality and Safeguards Commission Dossier Header */}
        <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                COMMONWEALTH OF AUSTRALIA — NDIS QUALITY AND SAFEGUARDS COMMISSION
              </h1>
              <p className="text-xs font-semibold text-slate-700 uppercase mt-0.5">
                Statutory Incident Notification & Investigation Dossier (Section 73Z Reportable Incidents)
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                Registered Provider: Breakthrough Practice Management OS • Provider Reg #: 4050019283 • Tenant: {incident.tenantId}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900 font-mono">INCIDENT: {incident.incidentNumber}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Printed: {new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              {incident.ndisReferenceNumber && (
                <div className="text-xs text-emerald-700 font-bold font-mono mt-0.5">Commission Ref: {incident.ndisReferenceNumber}</div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                {incident.incidentNumber}
              </span>
              {is24h && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Section 73Z 24-Hour Mandatory Reportable</span>
                </span>
              )}
              {isEscalated ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Commission Notified</span>
                </span>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Status: {incident.status.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-100">{incident.summary}</h2>
            <p className="text-xs text-slate-400">
              Participant: <strong className="text-slate-200">{incident.participantName}</strong>
              {incident.participantNdisNumber && ` (NDIS: ${incident.participantNdisNumber})`} • Tenant:{' '}
              <span className="font-mono">{incident.tenantId}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
              title="Print Clean Incident Dossier to Paper or PDF"
            >
              <Printer className="w-3.5 h-3.5 text-rose-400" />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statutory Notification Banner */}
        {is24h && (
          <div className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
            isEscalated
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          }`}>
            <div className="space-y-1">
              <h4 className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Statutory Compliance Timeline (Section 73Z NDIS Act)</span>
              </h4>
              <p className="text-xs leading-relaxed opacity-90">
                {isEscalated ? (
                  <>
                    Reported to the NDIS Quality & Safeguards Commission. Reference Number:{' '}
                    <strong className="font-mono underline">{incident.ndisReferenceNumber}</strong>
                  </>
                ) : (
                  <>
                    Mandatory 24-hour notification to the NDIS Quality & Safeguards Commission is{' '}
                    <strong>pending submission</strong>. Immediate lodgement via the Commission Provider Portal is required.
                  </>
                )}
              </p>
            </div>

            {is24h && !isEscalated && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEscalation(incident);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shrink-0 shadow-sm"
              >
                Log Portal Lodgement
              </button>
            )}
          </div>
        )}

        {/* Date, Time & Location Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Date & Time Occurred</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(incident.occurredAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Setting</span>
            <span className="font-semibold text-slate-200 capitalize">
              {incident.locationType ? incident.locationType.replace(/_/g, ' ') : 'Community / In Transit'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Physical Address / Landmark</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{incident.locationAddress || 'Not specified'}</span>
            </span>
          </div>
        </div>

        {/* Detailed Narrative */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Factual Narrative Account</span>
          </h3>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-line">
            {incident.detailedDescription}
          </div>
        </div>

        {/* Immediate Actions Taken */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Immediate Actions Taken to Ensure Safety</span>
          </h3>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-line">
            {incident.immediateActionsTaken}
          </div>
        </div>

        {/* Involved Persons & Statements */}
        {incident.involvedPersons && incident.involvedPersons.length > 0 && (
          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Involved Persons & Statements ({incident.involvedPersons.length})</span>
            </h3>
            <div className="space-y-2">
              {incident.involvedPersons.map((p) => (
                <div key={p.id} className="p-3 bg-slate-800/50 border border-slate-700/70 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      {p.name} <span className="text-slate-400 font-normal">({p.role.replace(/_/g, ' ')})</span>
                    </span>
                    {p.contactPhone && <span className="text-slate-400">{p.contactPhone}</span>}
                  </div>
                  {p.statementSummary && (
                    <p className="text-slate-300 text-[11px]">
                      <strong>Statement:</strong> {p.statementSummary}
                    </p>
                  )}
                  {p.injuriesSustained && (
                    <p className="text-rose-300 text-[11px]">
                      <strong>Injuries:</strong> {p.injuriesSustained}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Restrictive Practice & Emergency Disclosure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Restrictive Practice Disclosure</span>
            </h4>
            <p className="text-slate-300">
              Applied: <strong>{incident.restrictivePracticeApplied ? 'Yes' : 'No'}</strong>
              {incident.restrictivePracticeType && ` (${incident.restrictivePracticeType} restraint)`}
            </p>
            {incident.restrictivePracticeDetails && (
              <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-700/60">
                <p>Authorised in BSP: {incident.restrictivePracticeDetails.wasAuthorisedInBSP ? 'Yes' : 'No (Unauthorised)'}</p>
                {incident.restrictivePracticeDetails.durationMinutes && (
                  <p>Duration: {incident.restrictivePracticeDetails.durationMinutes} minutes</p>
                )}
                {incident.restrictivePracticeDetails.emergencyCircumstancesRationale && (
                  <p>Rationale: {incident.restrictivePracticeDetails.emergencyCircumstancesRationale}</p>
                )}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
              <Ambulance className="w-4 h-4 text-blue-400" />
              <span>Emergency & Medical Contact</span>
            </h4>
            <p className="text-slate-300">
              Police Contacted: <strong>{incident.policeContacted ? 'Yes' : 'No'}</strong>
              {incident.policeEventNumber && ` (Event #: ${incident.policeEventNumber})`}
            </p>
            <p className="text-slate-300">
              Ambulance Contacted: <strong>{incident.ambulanceContacted ? 'Yes' : 'No'}</strong>
            </p>
            {incident.medicalTreatmentDetails && (
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
                Medical Treatment: {incident.medicalTreatmentDetails}
              </p>
            )}
          </div>
        </div>

        {/* Investigator Notes */}
        {incident.investigatorNotes && (
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/60 text-xs space-y-1">
            <span className="font-semibold text-slate-300 block">Clinical Investigator & Escalation Notes:</span>
            <p className="text-slate-400 leading-relaxed">{incident.investigatorNotes}</p>
          </div>
        )}

        {/* Print-Only Statutory Sign-off block */}
        <div className="hidden print:block mt-8 pt-4 border-t-2 border-slate-800 text-[10px] text-slate-700">
          <p className="font-bold text-slate-900 uppercase">Provider Investigation & Mandatory Sign-Off Certification:</p>
          <p className="mt-0.5">
            I certify that the information contained in this incident notification dossier is accurate, factual, and compliant with the National Disability Insurance Scheme (Incident Management and Reportable Incidents) Rules 2018 and Section 73Z of the NDIS Act 2013.
          </p>
          <div className="grid grid-cols-2 gap-8 mt-6 pt-4 border-t border-dashed border-slate-400">
            <div>
              <p>Investigating Clinician / Officer: __________________________________</p>
              <p className="mt-2 text-[10px]">Position: Lead Clinical Practice Auditor</p>
            </div>
            <div>
              <p>Signature: __________________________________</p>
              <p className="mt-2 text-[10px]">Date of Certification: ____ / ____ / ________</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-rose-400" />
            <span>Print Dossier</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
