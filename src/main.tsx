import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { authenticateDefaultUser } from '../lib/auth/firebaseAuth';
import { seedFirestoreIfEmpty } from '../lib/syncData';
import { subscribeToFirestore } from '../lib/firestoreSubscriber';

// Initialize Firebase Auth and Seed DB asynchronously without blocking render
authenticateDefaultUser().then(() => {
  seedFirestoreIfEmpty().then(() => {
    // Start listening to live updates after initial seed check
    subscribeToFirestore();
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
