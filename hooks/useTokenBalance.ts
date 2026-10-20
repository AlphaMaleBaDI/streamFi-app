'use client';

import { useQuery, type QueryClient } from '@tanstack/react-query';

export const BALANCE_DEBOUNCE_MS = 2000;

export const tokenBalanceKey = (address: string, token: string) =>
  ['tokenBalance', address, token] as const;

interface BalanceCacheEntry {
  timestamp: number;
  promise: Promise<bigint>;
}

const balanceDebounceCache = new Map<string, BalanceCacheEntry>();

/**
 * Deduplicate and debounce rapid token balance queries within a 2000ms window (#812).
 * Prevents redundant parallel RPC queries when multiple components mount simultaneously.
 */
export function getCachedTokenBalanceFetch(
  address: string,
  token: string,
  fetchFn: () => Promise<bigint>,
  ttlMs = BALANCE_DEBOUNCE_MS,
): Promise<bigint> {
  const key = `${address}:${token}`;
  const now = Date.now();
  const existing = balanceDebounceCache.get(key);

  if (existing && now - existing.timestamp < ttlMs) {
    return existing.promise;
  }

  const promise = fetchFn().catch((err) => {
    // If the request fails, remove from cache so subsequent attempts can retry
    if (balanceDebounceCache.get(key)?.promise === promise) {
      balanceDebounceCache.delete(key);
    }
    throw err;
  });

  balanceDebounceCache.set(key, { timestamp: now, promise });
  return promise;
}

/** Test-only or on-invalidation cache clearance */
export function clearTokenBalanceCache(
  address?: string | null,
  token?: string | null,
): void {
  if (address && token) {
    balanceDebounceCache.delete(`${address}:${token}`);
  } else {
    balanceDebounceCache.clear();
  }
}

/**
 * Invalidate a token balance after a deposit (create stream / top-up) so the
 * displayed balance reflects the deducted funds immediately (#756, #812).
 */
export function invalidateTokenBalance(
  qc: QueryClient,
  address: string | null | undefined,
  token: string | null | undefined,
): Promise<void> {
  if (!address || !token) return Promise.resolve();
  clearTokenBalanceCache(address, token);
  return qc.invalidateQueries({ queryKey: tokenBalanceKey(address, token) });
}

export function useTokenBalance(
  address: string | null | undefined,
  token: string | null | undefined,
  fetchBalance: (address: string, token: string) => Promise<bigint>,
) {
  return useQuery({
    queryKey: tokenBalanceKey(address ?? '', token ?? ''),
    queryFn: () =>
      getCachedTokenBalanceFetch(address as string, token as string, () =>
        fetchBalance(address as string, token as string),
      ),
    enabled: !!address && !!token,
    staleTime: BALANCE_DEBOUNCE_MS,
  });
}

