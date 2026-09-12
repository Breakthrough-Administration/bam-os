import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { INITIAL_USER_PROFILE } from '../seedData';
import { useManagementStore } from '../../stores';

export async function authenticateDefaultUser() {
  const email = 's.jenkins@breakthroughsupport.org.au';
  const password = 'password123';
  
  try {
    let authUser;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      authUser = cred.user;
      console.log("Signed in to Firebase as default clinician.");
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        authUser = cred.user;
        console.log("Created and signed in default clinician.");
      } else {
        throw err;
      }
    }

    // Sync profile to Firestore and local store
    if (authUser) {
      const userRef = doc(db, 'users', authUser.uid);
      const userSnap = await getDoc(userRef);
      let profile;
      if (!userSnap.exists()) {
        profile = { ...INITIAL_USER_PROFILE, id: authUser.uid };
        await setDoc(userRef, profile);
      } else {
        profile = userSnap.data();
      }
      useManagementStore.setState({ currentUser: profile as any });
    }

  } catch (err) {
    console.error("Failed to authenticate:", err);
  }
}
