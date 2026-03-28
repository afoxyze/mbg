import type { ReactNode } from "react";
import { useReducedMotion, motion } from "framer-motion";
import type { BurnRates } from "../hooks/useTicker";
import { formatRupiah } from "../data/calculator";

interface BurnRateProps {
  readonly burnRates: BurnRates;
}

interface RateCard {
  readonly icon: string;
  readonly label: string;
  readonly value: number;
  readonly prominent: boolean;
}

interface HumanContext {
  readonly emoji: string;
  readonly template: string;
  readonly unitCost: number;
  readonly note: string;
}

const HUMAN_CONTEXTS: readonly HumanContext[] = [
  {
    emoji: "👩‍🏫",
    template: "Setara gaji {count} guru honorer selama 1 bulan",
    unitCost: 1_500_000,
    note: "Rata-rata gaji guru honorer ~Rp 1,5 juta/bulan (2026)",
  },
  {
    emoji: "🏫",
    template: "Bisa membangun {count} sekolah rakyat",
    unitCost: 100_000_000_000,
    note: "Biaya pembangunan 1 Sekolah Rakyat ~Rp 100 miliar (Mar 2026)",
  },
  {
    emoji: "🎓",
    template: "Setara {count} beasiswa kuliah penuh 4 tahun",
    unitCost: 40_000_000,
    note: "Estimasi biaya kuliah penuh S1 selama 4 tahun ~Rp 40 juta",
  },
  {
    emoji: "🚑",
    template: "Bisa membeli {count} unit ambulans",
    unitCost: 300_000_000,
    note: "Harga 1 unit ambulans ~Rp 300 juta (2026)",
  },
];

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} juta`;
  if (n >= 1_000) return n.toLocaleString("id-ID");
  return String(Math.floor(n));
}

function renderTemplate(template: string, count: number): ReactNode {
  const formatted = formatCount(count);
  const parts = template.split("{count}");
  return (
    <>
      {parts[0]}
      <strong style={{ color: "var(--color-accent)" }}>{formatted}</strong>
      {parts[1]}
    </>
  );
}

export function BurnRate({ burnRates }: BurnRateProps) {
  const shouldReduceMotion = useReducedMotion();

  const cards: readonly RateCard[] = [
    {
      icon: "⚡",
      label: "per detik",
      value: burnRates.perSecond,
      prominent: false,
    },
    {
      icon: "⏱️",
      label: "per menit",
      value: burnRates.perMinute,
      prominent: false,
    },
    {
      icon: "🕐",
      label: "per jam",
      value: burnRates.perHour,
      prominent: false,
    },
    { icon: "📅", label: "per hari", value: burnRates.perDay, prominent: true },
  ];

  const EASE = [0.25, 0.46, 0.45, 0.94] as const;

  const cardVariants = {
    hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: EASE,
        delay: shouldReduceMotion ? 0 : i * 0.06,
      },
    }),
  };

  const contextVariants = {
    hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: EASE,
        delay: shouldReduceMotion ? 0 : i * 0.06,
      },
    }),
  };

  return (
    <section aria-label="Kecepatan pengeluaran anggaran">
      {/* Section header */}
      <p
        className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: "var(--color-text-muted)" }}
      >
        Pengeluaran
      </p>
      <p className="mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>
        Secepat apa uangnya mengalir?
      </p>

      {/* Burn rate cards — 2x2 on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={cardVariants}
            className="flex flex-col gap-2 rounded-xl px-4 py-5"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              // "per hari" card gets slightly more top padding to add visual weight
              ...(card.prominent
                ? { paddingTop: "1.5rem", paddingBottom: "1.5rem" }
                : {}),
            }}
            aria-label={`${card.label}: ${formatRupiah(card.value)}`}
          >
            <span
              className="text-xl leading-none"
              role="img"
              aria-hidden="true"
            >
              {card.icon}
            </span>

            <p
              className="font-mono text-lg font-bold leading-tight sm:text-xl"
              style={{
                color: "var(--color-accent)",
                fontVariantNumeric: "tabular-nums",
                // "per hari" number is slightly larger
                ...(card.prominent
                  ? { fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)" }
                  : {}),
              }}
            >
              {formatRupiah(card.value)}
            </p>

            <span
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-text-muted)" }}
            >
              {card.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Human-scale context section */}
      <div className="mt-10">
        <p
          className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--color-text-muted)" }}
        >
          Perspektif
        </p>
        <p
          className="mb-6 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          Setiap hari, anggaran MBG setara dengan...
        </p>

        <ul className="flex flex-col gap-0" role="list">
          {HUMAN_CONTEXTS.map((ctx, i) => {
            const count = burnRates.perDay / ctx.unitCost;
            return (
              <motion.li
                key={ctx.template}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={contextVariants}
                className="flex items-start gap-4 py-4"
                style={{
                  borderBottom:
                    i < HUMAN_CONTEXTS.length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                }}
              >
                <span
                  className="mt-0.5 text-2xl leading-none shrink-0"
                  role="img"
                  aria-hidden="true"
                >
                  {ctx.emoji}
                </span>

                <div className="flex flex-col gap-0.5 min-w-0">
                  <p
                    className="text-sm leading-snug sm:text-base"
                    style={{ color: "var(--color-text)" }}
                  >
                    {renderTemplate(ctx.template, count)}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {ctx.note}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
