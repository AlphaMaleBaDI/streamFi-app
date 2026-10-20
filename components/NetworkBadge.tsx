'use client';

import { useState, useEffect } from 'react';

/**
 * NetworkBadge (#735)
 *
 * Shows the active Stellar network (Mainnet / Testnet / Futurenet) with a
 * color-coded warning pill so users never confuse testnet tokens with real
 * mainnet assets.
 */

type Network = 'mainnet' | 'testnet' | 'futurenet' | 'unknown';

function detectNetwork(): Network {
  if (typeof window === 'undefined') return 'unknown';
  const rpc = process.env.NEXT_PUBLIC_HORIZON_URL || process.env.NEXT_PUBLIC_STELLAR_RPC_URL || '';
  if (rpc.includes('testnet')) return 'testnet';
  if (rpc.includes('futurenet')) return 'futurenet';
  if (rpc.includes('mainnet') || rpc.includes('horizon.stellar.org')) return 'mainnet';
  return 'unknown';
}

const STYLES: Record<Network, { label: string; className: string }> = {
  mainnet: {
    label: 'Mainnet',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  testnet: {
    label: 'Testnet',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  futurenet: {
    label: 'Futurenet',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  unknown: {
    label: 'Unknown',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
};

export function NetworkBadge() {
  const [network, setNetwork] = useState<Network>('unknown');

  useEffect(() => {
    setNetwork(detectNetwork());
  }, []);

  const style = STYLES[network];
  const isNonProduction = network === 'testnet' || network === 'futurenet';

  return (
    <span
      role="status"
      aria-label={`Active network: ${style.label}`}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${style.className}`}
    >
      {isNonProduction && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" aria-hidden="true" />
      )}
      {style.label}
      {isNonProduction && (
        <span className="hidden sm:inline font-semibold">
          — not mainnet
        </span>
      )}
    </span>
  );
}
