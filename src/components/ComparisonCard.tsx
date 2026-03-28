import { motion, useReducedMotion } from "framer-motion";
import type { ComparisonItem } from "../data/comparisons";
import { convertToHariMBG, formatRupiah } from "../data/calculator";

interface ComparisonCardProps {
  readonly item: ComparisonItem;
  readonly maxHariMBG: number; // for relative bar width
  readonly index: number; // for stagger delay
}

type DisplayMode =
  | { kind: "hari"; value: number; label: string }
  | { kind: "inverse"; count: number };

function computeDisplay(item: ComparisonItem): DisplayMode {
  const hari = convertToHariMBG(item.cost);

  if (hari < 0.01) {
    // Flip: show how many of this item fits in 1 hari MBG.
    const count = Math.round(1 / hari);
    return { kind: "inverse", count };
  }

  if (hari >= 365) {
    const tahun = hari / 365;
    return { kind: "hari", value: tahun, label: "tahun MBG" };
  }

  return { kind: "hari", value: hari, label: "hari MBG" };
}

function formatDisplayValue(value: number): string {
  if (value >= 1000) {
    return value.toLocaleString("id-ID", { maximumFractionDigits: 0 });
  }
  if (value >= 10) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}

function getItemLabel(item: ComparisonItem): string {
  const labels: Record<string, string> = {
    starbucks: "cangkir Starbucks",
    "umr-jakarta": "bulan gaji UMR Jakarta",
    "iphone-17-pro-max": "unit iPhone 17 Pro Max",
  };
  return labels[item.id] ?? item.name;
}

export function ComparisonCard({ item, maxHariMBG, index }: ComparisonCardProps) {
  const hari = convertToHariMBG(item.cost);
  const display = computeDisplay(item);
  const prefersReducedMotion = useReducedMotion();

  // Bar width: log scale for the huge range across all categories
  const barPct =
    maxHariMBG > 0
      ? Math.max(
          3,
          Math.min(100, (Math.log1p(hari) / Math.log1p(maxHariMBG)) * 100)
        )
      : 3;

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.015, y: -2 }}
      transition={{
        duration: 0.3,
        delay: index * 0.03,
        ease: [0.25, 0.46, 0.45, 0.94],
        scale: { type: "spring", stiffness: 400, damping: 20 },
        y: { type: "spring", stiffness: 400, damping: 20 },
      }}
      className="group relative flex flex-col gap-3 rounded-lg border px-4 py-4"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
        transition: "border-color 150ms ease, box-shadow 150ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "color-mix(in srgb, var(--color-accent) 40%, transparent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "var(--color-border)";
      }}
      aria-label={item.name}
    >
      {/* Top row: identity + value */}
      <div className="flex items-start justify-between gap-4 sm:items-center">
        {/* Left: emoji + name + description */}
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="mt-0.5 shrink-0 text-2xl leading-none sm:mt-0"
            aria-hidden="true"
          >
            {item.emoji}
          </span>
          <div className="min-w-0">
            <p
              className="truncate text-sm font-semibold leading-tight"
              style={{ color: "var(--color-text)" }}
            >
              {item.name}
            </p>
            <p
              className="mt-0.5 text-xs leading-snug"
              style={{ color: "var(--color-text-muted)" }}
            >
              {item.description}
            </p>
          </div>
        </div>

        {/* Right: MBG value */}
        <div className="shrink-0 text-right">
          {display.kind === "hari" ? (
            <>
              <p
                className="font-mono text-xl font-black leading-none sm:text-2xl"
                style={{
                  color: "var(--color-accent)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ≈ {formatDisplayValue(display.value)}
              </p>
              <p
                className="mt-0.5 text-xs font-semibold"
                style={{
                  color: "color-mix(in srgb, var(--color-accent) 70%, transparent)",
                }}
              >
                {display.label}
              </p>
            </>
          ) : (
            <div
              className="rounded-md px-3 py-2"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-accent) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)",
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "color-mix(in srgb, var(--color-accent) 70%, transparent)" }}
              >
                1 hari MBG =
              </p>
              <p
                className="font-mono text-xl font-black leading-none sm:text-2xl"
                style={{
                  color: "var(--color-accent)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {display.count.toLocaleString("id-ID")}
              </p>
              <p
                className="mt-0.5 text-[10px] font-medium leading-tight"
                style={{
                  color: "color-mix(in srgb, var(--color-accent) 60%, transparent)",
                }}
              >
                {getItemLabel(item)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scale bar — 3px, accent gradient */}
      <div
        className="h-[3px] overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--color-border)" }}
        role="presentation"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${barPct}%`,
            background:
              "linear-gradient(to right, color-mix(in srgb, var(--color-accent) 50%, transparent), var(--color-accent))",
            transition: "width 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        />
      </div>

      {/* Bottom row: cost + source */}
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-xs tabular-nums"
          style={{ color: "var(--color-text-faint)" }}
        >
          {formatRupiah(item.cost)}
        </p>
        <a
          href={item.source}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] underline-offset-2 transition-colors hover:underline"
          style={{ color: "var(--color-text-faint)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color =
              "var(--color-text-muted)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color =
              "var(--color-text-faint)";
          }}
          aria-label={`Sumber data untuk ${item.name}`}
        >
          sumber
        </a>
      </div>
    </motion.article>
  );
}
