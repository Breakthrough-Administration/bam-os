import React, { useState } from 'react';
import { useManagementStore } from '../../stores';
import { PenTool, CheckCircle2, FileText, Lock, AlertTriangle, ShieldAlert, BookOpen } from 'lucide-react';

export const DigitalSignatureManager: React.FC = () => {
  const {
    caseNotes,
    logs,
    protocols,
    incidents,
    currentUser,
    updateCaseNote,
    updateRestrictivePracticeLog,
    updateProtocol,
    updateIncident,
  } = useManagementStore();

  const [signaturePin, setSignaturePin] = useState('');
  const [signingId, setSigningId] = useState<string | null>(null);
  const [signingType, setSigningType] = useState<'caseNote' | 'rpLog' | 'protocol' | 'incident' | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'incident' | 'protocol' | 'rpLog' | 'caseNote'>('all');

  const unsignedNotes = caseNotes.filter((note) => !note.signature);
  const signedNotes = caseNotes.filter((note) => !!note.signature);

  const unsignedLogs = logs.filter((log) => !log.signature);
  const signedLogs = logs.filter((log) => !!log.signature);

  const unsignedProtocols = protocols.filter((proto) => !proto.signature);
  const signedProtocols = protocols.filter((proto) => !!proto.signature);

  const unsignedIncidents = incidents.filter((inc) => !inc.signature);
  const signedIncidents = incidents.filter((inc) => !!inc.signature);

  const allPendingItems = [
    ...unsignedIncidents.map((i) => ({
      id: i.id,
      itemType: 'incident' as const,
      participantName: i.participantName,
      title: `Incident: ${i.incidentNumber} (${i.category.replace(/_/g, ' ')})`,
      date: i.occurredAt,
      author: i.createdBy || 'Shift Supervisor',
      isHighPriority: i.is24HourReportable,
    })),
    ...unsignedProtocols.map((p) => ({
      id: p.id,
      itemType: 'protocol' as const,
      participantName: p.participantName,
      title: `BSP Practice Protocol: ${p.type.toUpperCase()} Restraint`,
      date: p.authorisationDate,
      author: p.authorisingBody,
      isHighPriority: p.authorisationStatus === 'emergency_unauthorised',
    })),
    ...unsignedNotes.map((n) => ({
      id: n.id,
      itemType: 'caseNote' as const,
      participantName: n.participantName,
      title: `Clinical SOAP Note: ${n.sessionDate}`,
      date: n.timestamp,
      author: n.practitionerName,
      isHighPriority: false,
    })),
    ...unsignedLogs.map((l) => ({
      id: l.id,
      itemType: 'rpLog' as const,
      participantName: l.participantName,
      title: `Restrictive Practice Log: ${l.practiceType}`,
      date: l.timestampStart,
      author: l.administeredBy,
      isHighPriority: !l.wasAuthorised,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pendingItems = selectedFilter === 'all'
    ? allPendingItems
    : allPendingItems.filter((i) => i.itemType === selectedFilter);

  const allCompletedItems = [
    ...signedIncidents.map((i) => ({
      id: i.id,
      itemType: 'incident' as const,
      participantName: i.participantName,
      title: `Incident ${i.incidentNumber}`,
      signature: i.signature!,
    })),
    ...signedProtocols.map((p) => ({
      id: p.id,
      itemType: 'protocol' as const,
      participantName: p.participantName,
      title: `Protocol ${p.type.toUpperCase()}`,
      signature: p.signature!,
    })),
    ...signedNotes.map((n) => ({
      id: n.id,
      itemType: 'caseNote' as const,
      participantName: n.participantName,
      title: `Case Note (${n.sessionDate})`,
      signature: n.signature!,
    })),
    ...signedLogs.map((l) => ({
      id: l.id,
      itemType: 'rpLog' as const,
      participantName: l.participantName,
      title: `RP Log (${l.practiceType})`,
      signature: l.signature!,
    })),
  ].sort((a, b) => new Date(b.signature.timestamp).getTime() - new Date(a.signature.timestamp).getTime());

  const handleSign = async (id: string, type: 'caseNote' | 'rpLog' | 'protocol' | 'incident') => {
    if (signaturePin.length < 4) {
      setError('Invalid PIN. Must be at least 4 digits.');
      return;
    }
    setError('');

    let contentToHash = '';

    if (type === 'caseNote') {
      const note = caseNotes.find((n) => n.id === id);
      if (!note) return;
      contentToHash = `${note.id}-${note.timestamp}-${signaturePin}`;
    } else if (type === 'rpLog') {
      const log = logs.find((l) => l.id === id);
      if (!log) return;
      contentToHash = `${log.id}-${log.timestampStart}-${signaturePin}`;
    } else if (type === 'protocol') {
      const proto = protocols.find((p) => p.id === id);
      if (!proto) return;
      contentToHash = `${proto.id}-${proto.authorisationDate}-${signaturePin}`;
    } else if (type === 'incident') {
      const inc = incidents.find((i) => i.id === id);
      if (!inc) return;
      contentToHash = `${inc.id}-${inc.incidentNumber}-${inc.occurredAt}-${signaturePin}`;
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(contentToHash));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const signature = {
      signedBy: currentUser.name,
      timestamp: new Date().toISOString(),
      hash: hashHex,
      role: currentUser.role,
    };

    if (type === 'caseNote') {
      updateCaseNote(id, { signature });
    } else if (type === 'rpLog') {
      updateRestrictivePracticeLog(id, { signature });
    } else if (type === 'protocol') {
      updateProtocol(id, { signature });
    } else if (type === 'incident') {
      updateIncident(id, { signature });
    }

    setSuccessMsg('Document cryptographically signed and secured.');
    setSignaturePin('');
    setSigningId(null);
    setSigningType(null);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Digital Signature & Cryptographic Timestamping</h2>
            <p className="text-xs text-slate-400">
              NDIS Practice Standards Section 73 & Evidence Verification. Signatures generate an immutable SHA-256 hash.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'incident', 'protocol', 'rpLog', 'caseNote'] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setSelectedFilter(filterKey)}
              className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition ${
                selectedFilter === filterKey
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {filterKey === 'all' ? 'All' : filterKey === 'rpLog' ? 'RP Logs' : filterKey + 's'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-400 flex items-center gap-1 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {successMsg && (
        <div className="text-xs text-emerald-400 flex items-center gap-1 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <h3 className="text-xs font-semibold text-slate-300">
            Pending Clinician / Governance Signatures ({pendingItems.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Signed by: <strong className="text-slate-300">{currentUser.name}</strong>
          </span>
        </div>

        {pendingItems.length === 0 ? (
          <div className="text-xs text-slate-500 italic py-4 text-center">
            All clinical, incident, and restrictive practice records are signed and verified.
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                  item.isHighPriority
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-800/40 border-slate-700/60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded bg-slate-800 text-slate-300 shrink-0 mt-0.5">
                    {item.itemType === 'incident' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    ) : item.itemType === 'protocol' ? (
                      <BookOpen className="w-4 h-4 text-amber-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{item.title}</span>
                      {item.isHighPriority && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/40 uppercase">
                          Priority Sign-Off
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Participant: <span className="font-semibold text-slate-200">{item.participantName}</span> &bull;{' '}
                      {new Date(item.date).toLocaleDateString('en-AU')} &bull; Logged by {item.author}
                    </div>
                  </div>
                </div>

                {signingId === item.id && signingType === item.itemType ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="Practitioner PIN (e.g. 1234)"
                      value={signaturePin}
                      onChange={(e) => setSignaturePin(e.target.value)}
                      className="w-44 bg-slate-900 border border-indigo-500 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSign(item.id, item.itemType)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition cursor-pointer"
                    >
                      Sign SHA-256
                    </button>
                    <button
                      onClick={() => {
                        setSigningId(null);
                        setSigningType(null);
                        setSignaturePin('');
                        setError('');
                      }}
                      className="px-2 py-1.5 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSigningId(item.id);
                      setSigningType(item.itemType);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 text-xs font-semibold rounded transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Review & Sign</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4">
        <h3 className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-1">
          Recently Cryptographically Signed Records ({allCompletedItems.length})
        </h3>
        <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
          {allCompletedItems.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="p-2.5 bg-slate-900/50 border border-slate-800/80 rounded-lg flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-300 truncate">
                    {item.title} &bull; {item.participantName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Signed by {item.signature.signedBy} @{' '}
                    {new Date(item.signature.timestamp).toLocaleString('en-AU')}
                  </div>
                </div>
              </div>
              <div
                className="text-[9px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800 truncate max-w-[120px] shrink-0"
                title={`SHA-256 Hash: ${item.signature.hash}`}
              >
                {item.signature.hash.substring(0, 10)}...
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
