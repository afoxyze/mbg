import { BUDGET_PHASES, type BudgetPhase } from "./budget";

/**
 * Get the active budget phase for a given date.
 * Falls back to the last phase if the date doesn't match any phase range.
 */
export function getActivePhase(date: Date = new Date()): BudgetPhase {
  const dateStr = date.toISOString().split("T")[0];
  const phase = BUDGET_PHASES.find(
    (p) => dateStr !== undefined && dateStr >= p.startDate && dateStr <= p.endDate
  );
  // Default to last phase if no match
  const lastPhase = BUDGET_PHASES[BUDGET_PHASES.length - 1];
  if (lastPhase === undefined) {
    throw new Error("BUDGET_PHASES must not be empty");
  }
  return phase ?? lastPhase;
}

/**
 * Calculate total budget spent from program start until a given date.
 * Sums across all phases proportionally to elapsed days.
 */
export function calculateTotalSpent(now: Date = new Date()): number {
  let total = 0;
  for (const phase of BUDGET_PHASES) {
    const phaseStart = new Date(phase.startDate);
    const phaseEnd = new Date(phase.endDate);

    if (now < phaseStart) break;

    const effectiveEnd = now < phaseEnd ? now : phaseEnd;
    const msElapsed = effectiveEnd.getTime() - phaseStart.getTime();
    const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);

    total += daysElapsed * phase.dailyBudget;
  }
  return total;
}

/**
 * Calculate per-second burn rate for the current phase.
 */
export function getBurnRatePerSecond(date: Date = new Date()): number {
  const phase = getActivePhase(date);
  return phase.dailyBudget / 24 / 60 / 60;
}

/**
 * Convert a Rupiah amount to "hari MBG" using the current phase daily rate.
 */
export function convertToHariMBG(
  amountRupiah: number,
  date: Date = new Date()
): number {
  const phase = getActivePhase(date);
  return amountRupiah / phase.dailyBudget;
}

/**
 * Calculate elapsed time since program start (2025-01-06).
 */
export function getElapsedTime(now: Date = new Date()): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
} {
  const firstPhase = BUDGET_PHASES[0];
  if (firstPhase === undefined) {
    throw new Error("BUDGET_PHASES must not be empty");
  }
  const start = new Date(firstPhase.startDate);
  const totalMs = now.getTime() - start.getTime();

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalMs };
}

/**
 * Format a Rupiah amount into a human-readable string with appropriate scale suffix.
 */
export function formatRupiah(amount: number): string {
  if (amount >= 1_000_000_000_000_000) {
    return `Rp ${(amount / 1_000_000_000_000_000).toFixed(2)} Kuadriliun`;
  }
  if (amount >= 1_000_000_000_000) {
    return `Rp ${(amount / 1_000_000_000_000).toFixed(2)} Triliun`;
  }
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2)} Miliar`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(2)} Juta`;
  }
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/**
 * Format a number with Indonesian locale thousands separators.
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("id-ID");
}
