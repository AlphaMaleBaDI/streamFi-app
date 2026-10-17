export function isUserRejection(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /user\s*(rejected|denied|declined)|transaction\s*cancelled|request\s*rejected|denied by user/i.test(message);
}

export interface ErrorTracker { captureException: (error: unknown, context?: Record<string, unknown>) => void; }

/** Capture unexpected failures while keeping wallet cancellations out of Sentry. */
export function captureException(tracker: ErrorTracker, error: unknown, context?: Record<string, unknown>): void {
  if (!isUserRejection(error)) tracker.captureException(error, context);
}

