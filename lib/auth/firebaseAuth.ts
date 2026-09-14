import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  User,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { INITIAL_USER_PROFILE } from '../seedData';
import { useManagementStore } from '../../stores';

export async function authenticateDefaultUser() {
  const email = 's.jenkins@breakthroughsupport.org.au';
  const password = 'password123';
  let authUser: User | null = null;
  
  try {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      authUser = cred.user;
      console.log('Signed in to Firebase as default clinician.');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          authUser = cred.user;
          console.log('Created and signed in default clinician.');
        } catch (createErr: any) {
          if (createErr.code === 'auth/operation-not-allowed') {
            console.info('[FirebaseAuth] Email/Password provider not enabled; attempting anonymous authentication.');
            try {
              const anonCred = await signInAnonymously(auth);
              authUser = anonCred.user;
              console.log('Signed in to Firebase anonymously.');
            } catch {
              console.info('[FirebaseAuth] Anonymous provider also not active; continuing in local clinician mode.');
            }
          } else {
            console.info('[FirebaseAuth] User creation notice:', createErr.code || createErr.message);
          }
        }
      } else if (err.code === 'auth/operation-not-allowed') {
        console.info('[FirebaseAuth] Email/Password provider not enabled; attempting anonymous authentication.');
        try {
          const anonCred = await signInAnonymously(auth);
          authUser = anonCred.user;
          console.log('Signed in to Firebase anonymously.');
        } catch {
          console.info('[FirebaseAuth] Anonymous provider also not active; continuing in local clinician mode.');
        }
      } else {
        console.info('[FirebaseAuth] Sign-in note:', err.code || err.message);
      }
    }

    // Sync profile to Firestore and local store if authUser exists
    if (authUser) {
      try {
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
      } catch (docErr) {
        console.info('[FirebaseAuth] Local user state initialized (offline Firestore).');
        useManagementStore.setState({ currentUser: INITIAL_USER_PROFILE as any });
      }
    } else {
      // Local clinician session fallback
      useManagementStore.setState({ currentUser: INITIAL_USER_PROFILE as any });
    }

  } catch (err: any) {
    console.info('[FirebaseAuth] Initialized in local clinician mode (Test Mode active).');
    useManagementStore.setState({ currentUser: INITIAL_USER_PROFILE as any });
  }
}
