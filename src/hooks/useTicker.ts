import { useEffect, useRef, useState } from "react";
import {
  calculateTotalSpent,
  getBurnRatePerSecond,
  getElapsedTime,
  getActivePhase,
} from "../data/calculator";

export interface ElapsedTime {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

export interface BurnRates {
  readonly perSecond: number;
  readonly perMinute: number;
  readonly perHour: number;
  readonly perDay: number;
}

export interface TickerState {
  /** Snapshot of totalSpent captured at the moment the hook first ran — used for count-up animation */
  readonly initialTotalSpent: number;
  readonly elapsed: ElapsedTime;
  readonly burnRates: BurnRates;
  readonly phaseLabel: string;
}

function computeBurnRates(): BurnRates {
  const perSecond = getBurnRatePerSecond();
  return {
    perSecond,
    perMinute: perSecond * 60,
    perHour: perSecond * 3600,
    perDay: perSecond * 86400,
  };
}

function computeElapsed(): ElapsedTime {
  const { days, hours, minutes, seconds } = getElapsedTime();
  return { days, hours, minutes, seconds };
}

export function useTicker(): TickerState {
  const [elapsed, setElapsed] = useState<ElapsedTime>(computeElapsed);

  // Stable references — these don't change after mount
  const burnRates = useRef<BurnRates>(computeBurnRates()).current;
  const phaseLabel = useRef<string>(getActivePhase().label).current;
  // Capture initial value once — used by HeroTicker for count-up animation target
  const initialTotalSpent = useRef<number>(calculateTotalSpent()).current;

  // Update elapsed time every second
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(computeElapsed());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return { initialTotalSpent, elapsed, burnRates, phaseLabel };
}
