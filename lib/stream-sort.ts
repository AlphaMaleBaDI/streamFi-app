export type StreamStatus = 'active' | 'paused' | 'cancelled' | 'completed' | string;

export interface SortCriterion<T> {
  key?: string;
  compare?: (left: T, right: T) => number;
  direction?: 'asc' | 'desc';
}

export type StreamSortCriterion<T> = SortCriterion<T> & { key: keyof T };

/** Stable, multi-criteria sorting for stream rows (criteria are applied in order). */
export function sortStreams<T extends object>(
  streams: readonly T[],
  criteria: readonly StreamSortCriterion<T>[],
): T[] {
  return streams.map((value, index) => ({ value, index })).sort((a, b) => {
    for (const criterion of criteria) {
      const direction = criterion.direction === 'desc' ? -1 : 1;
      const left = (a.value as Record<keyof T, unknown>)[criterion.key];
      const right = (b.value as Record<keyof T, unknown>)[criterion.key];
      if (left === right) continue;
      if (left == null) return -1 * direction;
      if (right == null) return 1 * direction;
      const result = typeof left === 'string' && typeof right === 'string'
        ? left.localeCompare(right)
        : left < right ? -1 : 1;
      if (result !== 0) return result * direction;
    }
    return a.index - b.index;
  }).map(({ value }) => value);
}

