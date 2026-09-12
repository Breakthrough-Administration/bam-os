import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0856176566",
  appId: "1:991581823093:web:6ee3973df5eb17526e583c",
  apiKey: "AIzaSyApRuCl54k2HUbxXfkJXDNviITyePkXCxY",
  authDomain: "gen-lang-client-0856176566.firebaseapp.com",
  storageBucket: "gen-lang-client-0856176566.firebasestorage.app",
  messagingSenderId: "991581823093"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

