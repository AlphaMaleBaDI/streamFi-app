'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { flushQueuedTransactions, queuedTransactions } from '@/lib/offline-transactions';

/**
 * #739 — Queue failed transactions and prompt retry upon reconnect.
 *
 * When a transaction fails due to network issues, it's queued and the user
 * is prompted to retry when the connection is restored. Also tracks queued
 * count and shows a notification when transactions are flushed.
 */
export function OfflineTransactionSync() {
  const { publicKey, signTx } = useWallet();
  const [queuedCount, setQueuedCount] = useState(0);
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);

  useEffect(() => {
    if (!publicKey) return;

    const updateCount = () => setQueuedCount(queuedTransactions().length);

    const flush = async () => {
      const pending = queuedTransactions().length;
      if (pending > 0) {
        setShowRetryPrompt(true);
      }
      await flushQueuedTransactions(signTx);
      updateCount();
      // Hide prompt after successful flush
      setTimeout(() => setShowRetryPrompt(false), 3000);
    };

    window.addEventListener('online', flush);
    window.addEventListener('offline-transactions-changed', updateCount);
    updateCount();

    return () => {
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
