/**
 * Browser Web Push / Notifications API helper for stream milestones and claims (#754).
 */

export type NotificationPermissionState = NotificationPermission | 'unsupported';

export type NotificationChannel = 'email' | 'telegram' | 'browserPush';

export type NotificationEventKey =
  | 'streamCancel'
  | 'cliffReach'
  | 'streamCompleted'
  | 'fundsWithdrawn';

export interface NotificationChannelConfig {
  email: boolean;
  telegram: boolean;
  browserPush: boolean;
  emailAddress?: string;
  telegramHandle?: string;
}

export interface NotificationMatrix {
  streamCancel: { email: boolean; telegram: boolean; browserPush: boolean };
  cliffReach: { email: boolean; telegram: boolean; browserPush: boolean };
  streamCompleted: { email: boolean; telegram: boolean; browserPush: boolean };
  fundsWithdrawn: { email: boolean; telegram: boolean; browserPush: boolean };
}

export const DEFAULT_NOTIFICATION_CHANNELS: NotificationChannelConfig = {
  email: true,
  telegram: true,
  browserPush: true,
  emailAddress: '',
  telegramHandle: '',
};

export const DEFAULT_NOTIFICATION_MATRIX: NotificationMatrix = {
  streamCancel: { email: true, telegram: true, browserPush: true },
  cliffReach: { email: true, telegram: false, browserPush: true },
  streamCompleted: { email: true, telegram: true, browserPush: true },
  fundsWithdrawn: { email: false, telegram: true, browserPush: true },
};

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEventKey, { title: string; desc: string }> = {
  streamCancel: {
    title: 'Stream Cancelled',
    desc: 'Alert when a sender or recipient halts an active payment stream.',
  },
  cliffReach: {
    title: 'Cliff Reached',
    desc: 'Notice when a cliff vesting period ends and tokens become available.',
  },
  streamCompleted: {
    title: 'Stream Completed',
    desc: 'Confirmation when a stream reaches its full scheduled duration.',
  },
  fundsWithdrawn: {
    title: 'Funds Withdrawn',
    desc: 'Notification when streamed funds are claimed or withdrawn to a wallet.',
  },
};


/**
 * Check if the browser supports the Notifications API.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Request notification permissions from the user.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Dispatch a browser notification when a stream milestone or claim completes.
 */
export function notifyStreamMilestone(title: string, options?: NotificationOptions): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  } catch (error) {
    console.warn('[notifications] Failed to dispatch notification:', error);
    return null;
  }
}

/**
 * Convenience helper to notify user when a stream claim or milestone is confirmed.
 */
export function notifyClaimConfirmed(streamId: string, amount?: string): void {
  notifyStreamMilestone('Stream Claim Confirmed', {
    body: amount
      ? `Your claim of ${amount} for stream ${streamId.slice(0, 8)}... has been confirmed.`
      : `Your stream milestone claim for ${streamId.slice(0, 8)}... has been confirmed.`,
    tag: `claim-${streamId}`,
  });
}
