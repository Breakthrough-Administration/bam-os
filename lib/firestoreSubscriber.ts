import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { useManagementStore } from '../stores';

export function subscribeToFirestore() {
  // Subscribe to participants
  onSnapshot(collection(db, 'participants'), (snap) => {
    const participants = snap.docs.map(d => d.data() as any);
    useManagementStore.setState({ participants });
  });

  // Subscribe to case notes
  onSnapshot(collection(db, 'soapCaseNotes'), (snap) => {
    const caseNotes = snap.docs.map(d => d.data() as any);
    useManagementStore.setState({ caseNotes });
  });

  // Subscribe to restrictive protocols
  onSnapshot(collection(db, 'restrictivePracticeProtocols'), (snap) => {
    const protocols = snap.docs.map(d => d.data() as any);
    useManagementStore.setState({ protocols });
  });

  // Subscribe to restrictive logs
  onSnapshot(collection(db, 'restrictivePracticeLogs'), (snap) => {
    const logs = snap.docs.map(d => d.data() as any);
    useManagementStore.setState({ logs });
  });

  // Subscribe to incidents
  onSnapshot(collection(db, 'incidents'), (snap) => {
    const incidents = snap.docs.map(d => d.data() as any);
    useManagementStore.setState({ incidents });
  });

  // Subscribe to roster shifts
  onSnapshot(collection(db, 'rosterShifts'), (snap) => {
    const shifts = snap.docs.map(d => d.data() as any);
    useManagementStore.setState({ shifts });
  });
}
