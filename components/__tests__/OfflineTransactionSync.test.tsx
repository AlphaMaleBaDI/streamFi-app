import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockSignTx = vi.fn();
let currentPublicKey: string | null = 'GTESTPUBLICKEY';

vi.mock('@/contexts/WalletContext', () => ({
  useWallet: () => ({ publicKey: currentPublicKey, signTx: mockSignTx }),
}));

vi.mock('@/lib/offline-transactions', () => ({
  startOnlineSync: vi.fn(),
  stopOnlineSync: vi.fn(),
  flushQueuedTransactions: vi.fn().mockResolvedValue(undefined),
}));

import { OfflineTransactionSync } from '../OfflineTransactionSync';
import {
  startOnlineSync,
  stopOnlineSync,
  flushQueuedTransactions,
} from '@/lib/offline-transactions';

function render() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(OfflineTransactionSync));
  });
  return { container, root };
}

function cleanup(root: ReturnType<typeof createRoot>, container: HTMLElement) {
  act(() => {
    root.unmount();
  });
  document.body.removeChild(container);
}

describe('OfflineTransactionSync (#809)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentPublicKey = 'GTESTPUBLICKEY';
  });

  it('binds the online listener and flushes once when a wallet is connected', async () => {
    const { container, root } = render();
    await act(async () => { await Promise.resolve(); });

    expect(startOnlineSync).toHaveBeenCalledWith(mockSignTx);
    expect(flushQueuedTransactions).toHaveBeenCalledWith(mockSignTx);

    cleanup(root, container);
  });

  it('detaches the listener on unmount', () => {
    const { container, root } = render();
    cleanup(root, container);
    expect(stopOnlineSync).toHaveBeenCalledTimes(1);
  });

  it('does nothing for a disconnected wallet', () => {
    currentPublicKey = null;
    const { container, root } = render();

    expect(startOnlineSync).not.toHaveBeenCalled();
    expect(flushQueuedTransactions).not.toHaveBeenCalled();

    cleanup(root, container);
  });
});
