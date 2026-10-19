'use client';

import { useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
  flushQueuedTransactions,
  startOnlineSync,
  stopOnlineSync,
} from '@/lib/offline-transactions';

/**
 * Flushes queued offline transactions once on mount and again whenever the
 * browser fires `online` (#809). The listener itself lives in
 * `lib/offline-transactions.ts` so it can be unit-tested without rendering.
 */
export function OfflineTransactionSync() {
  const { publicKey, signTx } = useWallet();
  useEffect(() => {
    if (!publicKey) return;
    startOnlineSync(signTx);
    void flushQueuedTransactions(signTx);
    return () => stopOnlineSync();
  }, [publicKey, signTx]);
  return null;
}
