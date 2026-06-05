/**
 * Performance timing utility for benchmarking pipeline stages.
 */

interface TimingEntry {
  label: string;
  startMs: number;
  endMs: number;
  durationMs: number;
}

export class PerformanceTimer {
  private entries: TimingEntry[] = [];
  private activeTimers: Map<string, number> = new Map();

  start(label: string): void {
    this.activeTimers.set(label, performance.now());
  }

  stop(label: string): number {
    const startMs = this.activeTimers.get(label);
    if (startMs === undefined) {
      console.warn(`[Timer] No active timer for "${label}"`);
      return 0;
    }

    const endMs = performance.now();
    const durationMs = endMs - startMs;

    this.entries.push({ label, startMs, endMs, durationMs });
    this.activeTimers.delete(label);

    return durationMs;
  }

  getEntry(label: string): TimingEntry | undefined {
    return this.entries.find(e => e.label === label);
  }

  getSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const entry of this.entries) {
      summary[entry.label] = Math.round(entry.durationMs * 10) / 10;
    }
    return summary;
  }

  getTotalMs(): number {
    if (this.entries.length === 0) return 0;
    const first = Math.min(...this.entries.map(e => e.startMs));
    const last = Math.max(...this.entries.map(e => e.endMs));
    return last - first;
  }

  reset(): void {
    this.entries = [];
    this.activeTimers.clear();
  }

  toString(): string {
    const lines = this.entries.map(
      e => `  ${e.label}: ${e.durationMs.toFixed(1)}ms`,
    );
    lines.push(`  TOTAL: ${this.getTotalMs().toFixed(1)}ms`);
    return lines.join('\n');
  }
}

export function formatMs(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function groupByDate<T extends { timestamp: string }>(
  items: T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const dateKey = item.timestamp.split('T')[0];
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(item);
  }
  return groups;
}
