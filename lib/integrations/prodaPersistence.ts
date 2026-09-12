/**
 * Breakthrough Manager OS - PRODA (Provider Digital Access) State Persistence Engine
 * Replaces ephemeral in-memory Maps with durable Cloud Firestore persistence.
 * Prevents loss of statutory batch tracking, PACE reference numbers, and claim statuses
 * across cloud container restarts and serverless life-cycles.
 */

import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export interface ProdaBatchRecord {
  batchId: string;
  tenantId: string;
  submissionTimestamp: string;
  status: 'QUEUED' | 'TRANSMITTING' | 'PROCESSED' | 'REJECTED' | 'PARTIALLY_PAID';
  paceReferenceNumber: string;
  totalClaimAmount: number;
  totalItemsCount: number;
  successfulItemsCount: number;
  rejectedItemsCount: number;
  submittedBy: string;
  ndisRegistrationNumber: string;
  claimLineItems: Array<{
    lineItemId: string;
    participantNdisNumber: string;
    supportItemNumber: string;
    claimedHours: number;
    hourlyRate: number;
    totalAmount: number;
    status: 'ACCEPTED' | 'REJECTED' | 'PENDING';
    rejectionReason?: string;
  }>;
  prodaEnvironment: 'SANDBOX' | 'PRODUCTION_PACE';
}

const LOCAL_PRODA_CACHE_KEY = 'breakthrough_proda_batches_v2';

/**
 * Stores a PRODA batch record into Cloud Firestore with fallback to LocalStorage/IndexedDB
 */
export async function saveProdaBatch(batch: ProdaBatchRecord): Promise<void> {
  try {
    if (db) {
      const batchDocRef = doc(db, 'tenants', batch.tenantId, 'prodaBatches', batch.batchId);
      await setDoc(batchDocRef, batch, { merge: true });
    }
  } catch (err) {
    console.warn('[ProdaPersistence] Firestore save failed, caching locally:', err);
  }

  // Always sync to resilient local cache
  try {
    const existingRaw = localStorage.getItem(LOCAL_PRODA_CACHE_KEY);
    const existingList: ProdaBatchRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
    const index = existingList.findIndex((b) => b.batchId === batch.batchId);
    if (index >= 0) {
      existingList[index] = batch;
    } else {
      existingList.unshift(batch);
    }
    localStorage.setItem(LOCAL_PRODA_CACHE_KEY, JSON.stringify(existingList.slice(0, 100)));
  } catch (e) {
    console.error('[ProdaPersistence] Local storage write error:', e);
  }
}

/**
 * Retrieves all PRODA batch records for a given tenant
 */
export async function getProdaBatches(tenantId: string): Promise<ProdaBatchRecord[]> {
  try {
    if (db) {
      const colRef = collection(db, 'tenants', tenantId, 'prodaBatches');
      const q = query(colRef, orderBy('submissionTimestamp', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map((d) => d.data() as ProdaBatchRecord);
      }
    }
  } catch (err) {
    console.warn('[ProdaPersistence] Remote fetch failed, using local cache:', err);
  }

  // Fallback to local cache
  try {
    const cached = localStorage.getItem(LOCAL_PRODA_CACHE_KEY);
    if (cached) {
      const list: ProdaBatchRecord[] = JSON.parse(cached);
      return list.filter((b) => b.tenantId === tenantId);
    }
  } catch (e) {
    console.error('[ProdaPersistence] Local cache read error:', e);
  }

  return [];
}
