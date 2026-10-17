export interface OfflineTransaction {
  id: string;
  xdr: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

export const MAX_SYNC_ATTEMPTS = 3;
const QUEUE_KEY = 'conduit:offline-transactions';
const DEAD_LETTER_KEY = 'conduit:offline-transactions:dead-letter';

function read(key: string): OfflineTransaction[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') as OfflineTransaction[]; } catch { return []; }
}
function write(key: string, value: OfflineTransaction[]): void { localStorage.setItem(key, JSON.stringify(value)); }

export function enqueueOfflineTransaction(xdr: string, id = crypto.randomUUID()): OfflineTransaction {
  const item = { id, xdr, createdAt: Date.now(), attempts: 0 };
  write(QUEUE_KEY, [...read(QUEUE_KEY), item]);
  return item;
}
export function getPendingTransactions(): OfflineTransaction[] { return read(QUEUE_KEY); }
export function getDeadLetterTransactions(): OfflineTransaction[] { return read(DEAD_LETTER_KEY); }
export function clearDeadLetterTransaction(id: string): void { write(DEAD_LETTER_KEY, read(DEAD_LETTER_KEY).filter((item) => item.id !== id)); }

/** Sync pending transactions; exhausted entries are retained for manual recovery. */
export async function syncOfflineTransactions(submit: (xdr: string) => Promise<void>): Promise<{ synced: number; failed: number }> {
  const pending = read(QUEUE_KEY);
  const remaining: OfflineTransaction[] = [];
  let synced = 0;
  let failed = 0;
  for (const item of pending) {
    try { await submit(item.xdr); synced++; }
    catch (error) {
      const next = { ...item, attempts: item.attempts + 1, lastError: error instanceof Error ? error.message : String(error) };
      failed++;
      if (next.attempts >= MAX_SYNC_ATTEMPTS) write(DEAD_LETTER_KEY, [...read(DEAD_LETTER_KEY), next]);
      else remaining.push(next);
    }
  }
  write(QUEUE_KEY, remaining);
  return { synced, failed };
}

