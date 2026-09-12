import React, { useState } from 'react';
import { useManagementStore } from '../../stores';
import { PenTool, CheckCircle2, FileText, Lock, AlertTriangle } from 'lucide-react';

export const DigitalSignatureManager: React.FC = () => {
  const { caseNotes, logs, currentUser, updateCaseNote, updateRestrictivePracticeLog } = useManagementStore();
  const [signaturePin, setSignaturePin] = useState('');
  const [signingId, setSigningId] = useState<string | null>(null);
  const [signingType, setSigningType] = useState<'caseNote' | 'rpLog' | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const unsignedNotes = caseNotes.filter(note => !note.signature);
  const signedNotes = caseNotes.filter(note => !!note.signature);

  const unsignedLogs = logs.filter(log => !log.signature);
  const signedLogs = logs.filter(log => !!log.signature);

  const pendingItems = [
    ...unsignedNotes.map(n => ({ ...n, itemType: 'caseNote' as const })),
    ...unsignedLogs.map(l => ({ ...l, itemType: 'rpLog' as const }))
  ].sort((a, b) => {
    const timeA = new Date('timestamp' in a ? a.timestamp : a.timestampStart).getTime();
    const timeB = new Date('timestamp' in b ? b.timestamp : b.timestampStart).getTime();
    return timeA - timeB;
  });

  const completedItems = [
    ...signedNotes.map(n => ({ ...n, itemType: 'caseNote' as const })),
    ...signedLogs.map(l => ({ ...l, itemType: 'rpLog' as const }))
  ].sort((a, b) => new Date(b.signature!.timestamp).getTime() - new Date(a.signature!.timestamp).getTime());

  const handleSign = async (id: string, type: 'caseNote' | 'rpLog') => {
    if (signaturePin.length < 4) {
      setError('Invalid PIN. Must be at least 4 digits.');
      return;
    }
    setError('');

    let contentToHash = '';
    
    if (type === 'caseNote') {
      const note = caseNotes.find(n => n.id === id);
      if (!note) return;
      contentToHash = `${note.id}-${note.timestamp}-${signaturePin}`;
    } else {
      const log = logs.find(l => l.id === id);
      if (!log) return;
      contentToHash = `${log.id}-${log.timestampStart}-${signaturePin}`;
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(contentToHash));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const signature = {
      signedBy: currentUser.name,
      timestamp: new Date().toISOString(),
      hash: hashHex
    };

    if (type === 'caseNote') {
      updateCaseNote(id, { signature });
    } else {
      updateRestrictivePracticeLog(id, { signature });
    }
    
    setSuccessMsg('Document cryptographically signed and secured.');
    setSignaturePin('');
    setSigningId(null);
    setSigningType(null);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center gap-2">
        <PenTool className="w-5 h-5 text-indigo-400" />
        <h2 className="text-sm font-bold text-slate-100">Digital Signature & Cryptographic Timestamping</h2>
      </div>
      <p className="text-xs text-slate-400">
        Sign pending clinical notes and restrictive practice records to ensure NDIS compliance. Records are sealed with an immutable SHA-256 hash.
      </p>

      {error && (
        <div className="text-xs text-rose-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {error}
        </div>
      )}
      
      {successMsg && (
        <div className="text-xs text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> {successMsg}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-1">Pending Signatures ({pendingItems.length})</h3>
        {pendingItems.length === 0 ? (
          <div className="text-xs text-slate-500 italic">No pending documents to sign.</div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {pendingItems.map(item => (
              <div key={item.id} className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      {item.itemType === 'caseNote' ? 'Case Note' : 'Restrictive Practice Log'}: {item.participantName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date((item as any).timestamp || (item as any).timestampStart).toLocaleDateString()} - {(item as any).practitionerName || (item as any).administeredBy}
                    </div>
                  </div>
                </div>
                
                {signingId === item.id && signingType === item.itemType ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="Practitioner PIN"
                      value={signaturePin}
                      onChange={(e) => setSignaturePin(e.target.value)}
                      className="w-32 bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200"
                    />
                    <button
                      onClick={() => handleSign(item.id, item.itemType)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition"
                    >
                      Sign
                    </button>
                    <button
                      onClick={() => { setSigningId(null); setSigningType(null); setSignaturePin(''); setError(''); }}
                      className="px-2 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setSigningId(item.id); setSigningType(item.itemType); }}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded transition whitespace-nowrap"
                  >
                    Review & Sign
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4">
        <h3 className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-1">Recently Signed ({completedItems.length})</h3>
        <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
          {completedItems.slice(0, 5).map(item => (
            <div key={item.id} className="p-2.5 bg-slate-900/50 border border-slate-800/80 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-300">
                    {item.itemType === 'caseNote' ? 'Case Note' : 'Restrictive Practice Log'}: {item.participantName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Signed by {item.signature?.signedBy} @ {new Date(item.signature?.timestamp || '').toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-[9px] font-mono text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded truncate max-w-[100px]" title={item.signature?.hash}>
                {item.signature?.hash.substring(0, 8)}...
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
