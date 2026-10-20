'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
  flushQueuedTransactions,
  queuedTransactions,
  startOnlineSync,
  stopOnlineSync,
} from '@/lib/offline-transactions';

/**
 * #739, #809 — Queue failed transactions, retry on reconnect, and notify user.
 */
export function OfflineTransactionSync() {
  const { publicKey, signTx } = useWallet();
  const [queuedCount, setQueuedCount] = useState(0);
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);

  useEffect(() => {
    if (!publicKey) return;

    startOnlineSync(signTx);
    void flushQueuedTransactions(signTx);

    const updateCount = () => {
      if (typeof queuedTransactions === 'function') {
        setQueuedCount(queuedTransactions()?.length ?? 0);
      }
    };

    const flush = async () => {
      const pending = typeof queuedTransactions === 'function' ? queuedTransactions()?.length ?? 0 : 0;
      if (pending > 0) {
        setShowRetryPrompt(true);
      }
      await flushQueuedTransactions(signTx);
      updateCount();
      setTimeout(() => setShowRetryPrompt(false), 3000);
    };

    window.addEventListener('online', flush);
    window.addEventListener('offline-transactions-changed', updateCount);
    updateCount();

    return () => {
      stopOnlineSync();
      window.removeEventListener('online', flush);
      window.removeEventListener('offline-transactions-changed', updateCount);
    };
  }, [publicKey, signTx]);

  if (queuedCount === 0 && !showRetryPrompt) return null;

  return (
    <div
      className="fixed top-4 right-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs px-3 py-2 rounded shadow-lg z-50"
      role="status"
      aria-live="polite"
    >
      {showRetryPrompt ? (
        <span>Connection restored. Retrying {queuedCount} queued transaction{queuedCount === 1 ? '' : 's'}…</span>
      ) : (
        <span>{queuedCount} transaction{queuedCount === 1 ? '' : 's'} queued for retry</span>
      )}
    </div>
  );
}
