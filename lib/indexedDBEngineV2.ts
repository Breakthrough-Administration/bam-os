/**
 * Breakthrough Manager OS - Firestore Engine
 * Replaces IndexedDB with Cloud Firestore, maintaining offline support automatically.
 */

import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface OfflineRecord<T = unknown> {
  id: string;
  storeName: string;
  data: T;
  timestamp: string;
  synced: boolean;
  tenantId: string;
}

class IndexedDBEngine {
  public async setItem<T>(storeName: string, id: string, data: T, tenantId: string = 'tenant-main'): Promise<void> {
    try {
      // Map standard store names to Firestore collections if needed, or use as is
      const collectionName = this.mapStoreToCollection(storeName);
      await setDoc(doc(db, collectionName, id), data as any);
    } catch (e) {
      console.error("Failed to write to Firestore:", e);
    }
  }

  public async getItem<T>(storeName: string, id: string): Promise<T | null> {
    try {
      const collectionName = this.mapStoreToCollection(storeName);
      const docSnap = await getDoc(doc(db, collectionName, id));
      if (docSnap.exists()) {
        return docSnap.data() as T;
      }
      return null;
    } catch (e) {
      console.error("Failed to read from Firestore:", e);
      return null;
    }
  }

  public async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const collectionName = this.mapStoreToCollection(storeName);
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => doc.data() as T);
    } catch (e) {
      console.error("Failed to get all from Firestore:", e);
      return [];
    }
  }

  private mapStoreToCollection(storeName: string): string {
    // Map existing indexedDB stores to the new Firebase collections
    if (storeName === 'case_notes') return 'soapCaseNotes';
    if (storeName === 'restrictive_logs') return 'restrictivePracticeLogs';
    return storeName;
  }
}

export const indexedDBEngine = new IndexedDBEngine();
