import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  INITIAL_PARTICIPANTS,
  INITIAL_RESTRICTIVE_PROTOCOLS,
  INITIAL_RESTRICTIVE_LOGS,
  INITIAL_CASE_NOTES,
  INITIAL_INCIDENTS,
  INITIAL_SHIFTS
} from './seedData';

export async function seedFirestoreIfEmpty() {
  try {
    const participantsSnap = await getDocs(collection(db, 'participants'));
    if (participantsSnap.empty) {
      console.log('Seeding initial data to Firestore...');
      
      // Seed participants
      for (const p of INITIAL_PARTICIPANTS) {
        await setDoc(doc(db, 'participants', p.id), p);
      }
      
      // Seed protocols
      for (const proto of INITIAL_RESTRICTIVE_PROTOCOLS) {
        await setDoc(doc(db, 'restrictivePracticeProtocols', proto.id), proto);
      }
      
      // Seed logs
      for (const log of INITIAL_RESTRICTIVE_LOGS) {
        await setDoc(doc(db, 'restrictivePracticeLogs', log.id), log);
      }

      // Seed case notes
      for (const note of INITIAL_CASE_NOTES) {
        await setDoc(doc(db, 'soapCaseNotes', note.id), note);
      }

      // Seed incidents
      for (const incident of INITIAL_INCIDENTS) {
        await setDoc(doc(db, 'incidents', incident.id), incident);
      }

      // Seed roster shifts
      for (const shift of INITIAL_SHIFTS) {
        await setDoc(doc(db, 'rosterShifts', shift.id), shift);
      }
      
      console.log('Seeding complete.');
    }
  } catch (err) {
    console.warn('Firestore seeding notice (offline or permission check):', err);
  }
}
