import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  CheckCircle2,
  ShieldCheck,
  User,
  MapPin,
  Target,
  DollarSign,
  AlertCircle,
  FileCheck,
  Users,
} from 'lucide-react';
import { Participant } from '../../../types';
import { useManagementStore } from '../../../stores';
import {
  downloadParticipantPdf,
  downloadCaseloadPdf,
  printParticipantCarePlan,
} from '../../../lib/participantPdfService';

interface ParticipantAuditPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
}

export const ParticipantAuditPdfModal: React.FC<ParticipantAuditPdfModalProps> = ({
  isOpen,
  onClose,
  participant,
}) => {
  const { protocols, participants } = useManagementStore();
  const [auditorName, setAuditorName] = useState('Dr. Sarah Jenkins');
  const [auditorRole, setAuditorRole] = useState('Lead PBS Specialist & Clinical Auditor');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !participant) return null;

  const linkedProtocols = protocols.filter((proto) => proto.participantId === participant.id);
  const burnPercent = Math.round((participant.consumedBudget / participant.totalAllocatedBudget) * 100);

  const handleDownloadSinglePdf = () => {
    setIsExporting(true);
    try {
      downloadParticipantPdf(participant, {
        protocols,
        auditorName,
        auditorRole,
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    printParticipantCarePlan(participant, protocols);
  };

  const handleDownloadCaseloadPdf = () => {
    downloadCaseloadPdf(participants);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  NDIS Quality & Safeguards Commission Audit Record
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Print & PDF Export
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official clinical audit report for {participant.fullName} (NDIS: {participant.ndisNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auditor Settings Strip */}
        <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Auditor / Clinician:</span>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 w-44 focus:outline-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Role:</span>
              <input
                type="text"
                value={auditorRole}
                onChange={(e) => setAuditorRole(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 w-56 focus:outline-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCaseloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg font-medium transition text-xs"
              title="Export all registered participants as a compliance summary PDF"
            >
              <Users className="w-3.5 h-3.5 text-teal-400" />
              <span>Caseload Summary PDF</span>
            </button>
          </div>
        </div>

        {/* Document Preview (A4 styled card) */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950/30">
          <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 text-xs text-slate-300">
            {/* Document Top Banner */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between">
              <div>
                <div className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
                  Breakthrough Support Services
                </div>
                <div className="text-base font-bold text-white mt-0.5">
                  Participant Profile & Positive Behaviour Support Care Plan Audit
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  NDIS Registered Provider #4050019283 | Quality & Safeguards Rules 2018
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] tracking-wider uppercase">
                  NDIS Compliant
                </span>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Ref: AUD-{participant.id}-{Date.now().toString(36).toUpperCase()}
                </div>
              </div>
            </div>

            {/* 1. Demographics & Identification */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Participant Identification & Demographics</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-800/80">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">Full Name</div>
                  <div className="font-bold text-white text-sm">{participant.fullName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">NDIS Participant No</div>
                  <div className="font-mono font-bold text-emerald-400 text-sm">{participant.ndisNumber}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">Date of Birth & Gender</div>
                  <div className="font-semibold text-slate-200">{participant.dateOfBirth} ({participant.gender})</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-[10px] text-slate-400 font-medium uppercase">Residential Location</div>
                  <div className="font-semibold text-slate-200">{participant.suburb}, {participant.state} {participant.postcode}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">Geographic Classification</div>
                  <div className="font-bold text-teal-300">
                    MMM {participant.mmmZone} {participant.mmmZone >= 6 ? '(Remote Loading)' : '(Base Rates)'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Clinical Diagnoses */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Clinical Diagnoses & Impairment Profile</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800/80 space-y-2">
                <div>
                  <strong className="text-emerald-400">Primary Diagnosis: </strong>
                  <span className="text-slate-100 font-medium">{participant.primaryDiagnosis}</span>
                </div>
                {participant.secondaryDiagnoses && participant.secondaryDiagnoses.length > 0 && (
                  <div>
                    <strong className="text-teal-400">Secondary Diagnoses / Comorbidities: </strong>
                    <span className="text-slate-300">{participant.secondaryDiagnoses.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. NDIS Plan Financial Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. NDIS Plan Financial Allocation & Utilisation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-800/80">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">Plan Term</div>
                  <div className="font-medium text-slate-200">
                    {new Date(participant.planStartDate).toLocaleDateString('en-AU')} to {new Date(participant.planEndDate).toLocaleDateString('en-AU')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">Allocated Budget</div>
                  <div className="font-mono font-bold text-white text-sm">
                    ${participant.totalAllocatedBudget.toLocaleString('en-AU')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">Consumed Budget</div>
                  <div className="font-mono font-bold text-emerald-400 text-sm">
                    ${participant.consumedBudget.toLocaleString('en-AU')} ({burnPercent}%)
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Behaviour Support Plan & Restrictive Practices */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>4. Positive Behaviour Support (PBS) & Restrictive Practices</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase">PBS Status</div>
                    <div className="font-semibold text-emerald-400">
                      {participant.activeBSP ? 'Lodged & Active' : 'No Active Plan'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase">Mandatory Review Due</div>
                    <div className="font-semibold text-amber-300">
                      {participant.bspReviewDueDate
                        ? new Date(participant.bspReviewDueDate).toLocaleDateString('en-AU')
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase">Authorised Restraints</div>
                    <div className="font-semibold text-slate-200">
                      {participant.activeRestrictivePracticesCount} Protocol(s) Authorised
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Registered PBS Practitioner: </span>
                    <strong className="text-slate-200">{participant.behaviourSupportPractitioner}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Allied Health Key Worker: </span>
                    <strong className="text-slate-200">{participant.alliedHealthKeyWorker}</strong>
                  </div>
                </div>

                {linkedProtocols.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                      Authorised Restrictive Practice Protocols ({linkedProtocols.length}):
                    </div>
                    {linkedProtocols.map((proto) => (
                      <div key={proto.id} className="p-2.5 rounded bg-slate-900 border border-rose-500/20 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-300 uppercase">{proto.type} Restraint</span>
                          <span className="text-[10px] font-mono text-slate-400">Expiry: {proto.expiryDate}</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{proto.description}</p>
                        <div className="text-[10px] text-slate-400">
                          Authorising Body: {proto.authorisingBody}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 5. NDIS Goals & Capacity Building */}
            {participant.goals && participant.goals.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>5. NDIS Participant Goals & Outcomes</span>
                </div>
                <div className="space-y-2">
                  {participant.goals.map((g) => (
                    <div key={g.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{g.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            g.status === 'achieved'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {g.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{g.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span className="uppercase">Category: {g.category.replace('_', ' ')}</span>
                        <span>Target: {new Date(g.targetDate).toLocaleDateString('en-AU')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Care Circle & Nominee Contacts */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>6. Nominee & Emergency Contacts</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{participant.contactEmergencyName}</div>
                  <div className="text-[11px] text-slate-400">Emergency Contact & Nominee</div>
                </div>
                <div className="text-right font-mono text-emerald-400 font-bold">
                  {participant.contactEmergencyPhone}
                </div>
              </div>
            </div>

            {/* Compliance Declaration Sign-off */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
              <div className="font-bold text-slate-200 uppercase text-[11px]">
                NDIS Quality and Safeguards Commission Compliance Declaration
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                I certify that this record accurately represents the approved participant profile, current Behaviour Support Plan, and financial parameters registered under the National Disability Insurance Scheme Act 2013.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800 text-slate-400 text-[11px]">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Clinician Auditor</div>
                  <div className="text-white font-medium mt-0.5">{auditorName}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Designation</div>
                  <div className="text-slate-300 mt-0.5">{auditorRole}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Audit Date</div>
                  <div className="text-emerald-400 font-mono mt-0.5">{new Date().toLocaleDateString('en-AU')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Print Document</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSinglePdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating PDF...' : 'Download Official PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
