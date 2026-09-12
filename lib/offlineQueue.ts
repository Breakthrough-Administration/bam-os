/**
 * Breakthrough Manager OS - Offline Mutation Queue
 * Manages background reconciliation of field logs and case notes.
 */

import { indexedDBEngine } from './indexedDBEngineV2';

export interface QueuedMutation {
  id: string;
  action: 'CREATE_CASE_NOTE' | 'UPDATE_CASE_NOTE' | 'LOG_RESTRICTIVE_PRACTICE' | 'ESCALATE_INCIDENT' | 'GPS_CHECK_IN';
  payload: Record<string, unknown>;
  timestamp: string;
  retryCount: number;
}

class OfflineQueueManager {
  private queue: QueuedMutation[] = [];
  private isProcessing = false;
  private listeners: Array<(queueLength: number) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flushQueue());
    }
  }

  public subscribe(listener: (queueLength: number) => void) {
    this.listeners.push(listener);
    listener(this.queue.length);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.queue.length));
  }

  public async enqueue(action: QueuedMutation['action'], payload: Record<string, unknown>): Promise<void> {
    const item: QueuedMutation = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.queue.push(item);
    await indexedDBEngine.setItem('offline_queue', item.id, item);
    this.notify();

    if (navigator.onLine) {
      await this.flushQueue();
    }
  }

  public async flushQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const item = this.queue[0];
        // Simulate network delivery
        await new Promise((res) => setTimeout(res, 300));
        this.queue.shift();
        this.notify();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}

export const offlineQueue = new OfflineQueueManager();
