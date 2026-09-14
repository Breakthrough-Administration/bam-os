import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { useManagementStore } from '../stores';

export function subscribeToFirestore() {
  const onError = (err: any) => {
    console.info('[FirestoreSubscriber] Live sync status:', err?.code || err?.message || 'offline');
  };

  // Subscribe to participants
  onSnapshot(
    collection(db, 'participants'),
    (snap) => {
      const participants = snap.docs.map((d) => d.data() as any);
      if (participants.length > 0) {
        useManagementStore.setState({ participants });
      }
    },
    onError
  );

  // Subscribe to case notes
  onSnapshot(
    collection(db, 'soapCaseNotes'),
    (snap) => {
      const caseNotes = snap.docs.map((d) => d.data() as any);
      if (caseNotes.length > 0) {
        useManagementStore.setState({ caseNotes });
      }
    },
    onError
  );

  // Subscribe to restrictive protocols
  onSnapshot(
    collection(db, 'restrictivePracticeProtocols'),
    (snap) => {
      const protocols = snap.docs.map((d) => d.data() as any);
      if (protocols.length > 0) {
        useManagementStore.setState({ protocols });
      }
    },
    onError
  );

  // Subscribe to restrictive logs
  onSnapshot(
    collection(db, 'restrictivePracticeLogs'),
    (snap) => {
      const logs = snap.docs.map((d) => d.data() as any);
      if (logs.length > 0) {
        useManagementStore.setState({ logs });
      }
    },
    onError
  );

  // Subscribe to incidents
  onSnapshot(
    collection(db, 'incidents'),
    (snap) => {
      const incidents = snap.docs.map((d) => d.data() as any);
      if (incidents.length > 0) {
        useManagementStore.setState({ incidents });
      }
    },
    onError
  );

  // Subscribe to roster shifts
  onSnapshot(
    collection(db, 'rosterShifts'),
    (snap) => {
      const shifts = snap.docs.map((d) => d.data() as any);
      if (shifts.length > 0) {
        useManagementStore.setState({ shifts });
      }
    },
    onError
  );
}
