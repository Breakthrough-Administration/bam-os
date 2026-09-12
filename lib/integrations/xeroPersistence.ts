/**
 * Breakthrough Manager OS - Xero State Persistence Engine
 * Manages durable Cloud Firestore storage for Xero Invoices, Bank Feeds, and Payment Sync.
 */

import { db } from '../firebase';
import { doc, setDoc, getDocs, collection, query, orderBy } from 'firebase/firestore';

export interface XeroInvoiceRecord {
  invoiceId: string;
  tenantId: string;
  xeroInvoiceNumber: string;
  contactName: string;
  contactEmail: string;
  totalAmount: number;
  taxAmount: number;
  status: 'DRAFT' | 'AUTHORISED' | 'PAID' | 'VOIDED';
  dueDate: string;
  issueDate: string;
  lineItemsCount: number;
  syncedAt: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
}

const LOCAL_XERO_CACHE_KEY = 'breakthrough_xero_invoices_v2';

export async function saveXeroInvoice(invoice: XeroInvoiceRecord): Promise<void> {
  try {
    if (db) {
      const docRef = doc(db, 'tenants', invoice.tenantId, 'xeroInvoices', invoice.invoiceId);
      await setDoc(docRef, invoice, { merge: true });
    }
  } catch (err) {
    console.warn('[XeroPersistence] Firestore save error:', err);
  }

  try {
    const existingRaw = localStorage.getItem(LOCAL_XERO_CACHE_KEY);
    const list: XeroInvoiceRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
    const idx = list.findIndex((i) => i.invoiceId === invoice.invoiceId);
    if (idx >= 0) {
      list[idx] = invoice;
    } else {
      list.unshift(invoice);
    }
    localStorage.setItem(LOCAL_XERO_CACHE_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.error('[XeroPersistence] Local cache error:', e);
  }
}

export async function getXeroInvoices(tenantId: string): Promise<XeroInvoiceRecord[]> {
  try {
    if (db) {
      const colRef = collection(db, 'tenants', tenantId, 'xeroInvoices');
      const q = query(colRef, orderBy('syncedAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map((d) => d.data() as XeroInvoiceRecord);
      }
    }
  } catch (err) {
    console.warn('[XeroPersistence] Remote fetch error:', err);
  }

  try {
    const cached = localStorage.getItem(LOCAL_XERO_CACHE_KEY);
    if (cached) {
      const list: XeroInvoiceRecord[] = JSON.parse(cached);
      return list.filter((i) => i.tenantId === tenantId);
    }
  } catch (e) {
    console.error('[XeroPersistence] Local cache error:', e);
  }

  return [];
}
