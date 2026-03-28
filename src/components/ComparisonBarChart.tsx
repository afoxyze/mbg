import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { COMPARISON_ITEMS } from "../data/comparisons";
import { formatRupiah } from "../data/calculator";

// MBG 2026 annual budget — the reference bar (full width)
const MBG_ANNUAL_BUDGET = 335_000_000_000_000;

interface BarItem {
  readonly id: string;
  readonly name: string;
  readonly cost: number;
  readonly isMBG: boolean;
  readonly emoji: string;
}

// Only infra + global items are meaningful on a linear scale with MBG
const CHART_ITEMS: readonly BarItem[] = [
  ...COMPARISON_ITEMS.filter(
    (item) => item.category === "infrastructure" || item.category === "global"
  )
    .map((item) => ({
      id: item.id,
      name: item.name,
      cost: item.cost,
      isMBG: false,
      emoji: item.emoji,
    }))
    .sort((a, b) => a.cost - b.cost),
  {
    id: "mbg-2026",
    name: "MBG 2026 (1 Tahun)",
    cost: MBG_ANNUAL_BUDGET,
    isMBG: true,
    emoji: "🍽️",
  },
];

const MAX_COST = MBG_ANNUAL_BUDGET;

interface BarRowProps {
  readonly item: BarItem;
  readonly index: number;
  readonly shouldAnimate: boolean;
}

function BarRow({ item, index, shouldAnimate }: BarRowProps) {
  const widthPct = (item.cost / MAX_COST) * 100;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, x: -12 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.03,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="flex items-center gap-3"
    >
      {/* Name label — fixed width on the left */}
      <div className="w-24 shrink-0 sm:w-44">
        <span
          className="flex items-center gap-1.5 text-xs font-medium leading-tight"
          style={{ color: item.isMBG ? "var(--color-accent)" : "var(--color-text-muted)" }}
        >
          <span aria-hidden="true" className="text-sm">
            {item.emoji}
          </span>
          <span className="truncate">{item.name}</span>
        </span>
      </div>

      {/* Bar track */}
      <div
        className="relative h-6 flex-1 overflow-hidden rounded-sm"
        style={{ backgroundColor: "var(--color-border)" }}
        aria-label={`${item.name}: ${formatRupiah(item.cost)}`}
        role="meter"
        aria-valuenow={item.cost}
        aria-valuemin={0}
        aria-valuemax={MAX_COST}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{
            background: item.isMBG
              ? "var(--color-accent)"
              : "color-mix(in srgb, var(--color-secondary) 60%, transparent)",
          }}
          initial={shouldAnimate ? { width: "0%" } : { width: `${widthPct}%` }}
          animate={{ width: `${widthPct}%` }}
          transition={{
            duration: 0.5,
            delay: index * 0.03 + 0.08,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />

        {/* Cost label inside bar when wide enough, outside when narrow */}
        {widthPct > 28 ? (
          <span
            className="absolute inset-y-0 right-2 flex items-center text-[11px] font-semibold tabular-nums"
            style={{
              color: item.isMBG ? "#fff" : "var(--color-text-muted)",
            }}
          >
            {formatRupiah(item.cost)}
          </span>
        ) : null}
      </div>

      {/* Cost label outside bar when narrow */}
      {widthPct <= 28 ? (
        <span
          className="w-24 shrink-0 text-right text-[11px] font-semibold tabular-nums sm:w-36"
          style={{ color: "var(--color-text-muted)" }}
        >
          {formatRupiah(item.cost)}
        </span>
      ) : null}
    </motion.div>
  );
}

export function ComparisonBarChart() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px 0px" });
  const prefersReducedMotion = useReducedMotion();

  const shouldAnimate = isInView && !prefersReducedMotion;

  return (
    <div ref={ref} className="flex flex-col gap-2" aria-label="Grafik perbandingan skala anggaran">
      {CHART_ITEMS.map((item, index) => (
        <BarRow
          key={item.id}
          item={item}
          index={index}
          shouldAnimate={shouldAnimate}
        />
      ))}

      {/* Scale note */}
      <p
        className="mt-1 text-[11px]"
        style={{ color: "var(--color-text-faint)" }}
      >
        Skala linear — panjang bar proporsional terhadap nilai rupiah
      </p>
    </div>
  );
}
