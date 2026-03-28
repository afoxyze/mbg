import { useRef, useEffect, memo } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { formatRupiah, calculateTotalSpent } from "../data/calculator";
import type { ElapsedTime } from "../hooks/useTicker";
import { useExchangeRate } from "../hooks/useExchangeRate";

interface HeroTickerProps {
  readonly totalSpent: number;
  readonly initialTotalSpent: number;
  readonly elapsed: ElapsedTime;
  readonly dailyBudget: number;
}

/**
 * Format a raw number as full Indonesian Rupiah digits with dot separators.
 * e.g. 123456789012 -> "123.456.789.012"
 */
function formatFull(amount: number): string {
  return Math.floor(amount).toLocaleString("id-ID");
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Seeded pseudo-random so particles are stable between renders
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// Ember particle config — defined at module level to avoid recreation per render
const EMBER_COUNT = 17;

// Vary ember color — gold, amber, orange-red
const EMBER_COLORS = ["#F59E0B", "#FBBF24", "#FB923C", "#F97316", "#FBBF24"] as const;

interface EmberConfig {
  readonly id: number;
  readonly left: string;
  readonly size: number;
  readonly duration: number;
  readonly delay: number;
  // Two-stage horizontal drift for natural wobble: mid-point and end
  readonly driftXMid: number;
  readonly driftXEnd: number;
  readonly color: string;
  readonly peakOpacity: number;
}

const EMBERS: readonly EmberConfig[] = Array.from({ length: EMBER_COUNT }, (_, i) => {
  const colorIndex = Math.floor(seededRandom(i * 23) * EMBER_COLORS.length);
  const color = EMBER_COLORS[colorIndex] ?? "#F59E0B";
  return {
    id: i,
    // Cluster embers toward the bottom-center of the ticker
    left: `${15 + seededRandom(i * 3) * 70}%`,
    size: 2 + seededRandom(i * 7) * 4,   // 2–6px
    duration: 2.5 + seededRandom(i * 11) * 3,
    delay: seededRandom(i * 13) * 3.5,
    // Wobble: each stage drifts in a potentially different direction
    driftXMid: (seededRandom(i * 17) - 0.5) * 40,
    driftXEnd: (seededRandom(i * 19) - 0.5) * 60,
    color,
    // Brighter embers are more opaque at peak
    peakOpacity: 0.5 + seededRandom(i * 29) * 0.5,
  };
});

const FireBackground = memo(function FireBackground({ reduced }: { readonly reduced: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    >
      {/*
       * Static base glow — centered on the number area, always visible.
       * Provides warmth in both light and dark themes.
       */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: 0,
          right: 0,
          height: "70%",
          transform: "translateY(-50%)",
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 70%)",
          opacity: 0.15,
        }}
      />

      {/* Pulsing animated glow layer — gentle breathe, no shimmer filter */}
      {!reduced && (
        <motion.div
          style={{
            position: "absolute",
            top: "38%",
            left: 0,
            right: 0,
            height: "70%",
            transform: "translateY(-50%)",
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, color-mix(in srgb, var(--color-accent) 15%, transparent), transparent 70%)",
          }}
          animate={{
            opacity: [0.2, 0.38, 0.2],
            scaleX: [1, 1.03, 1],
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />
      )}

      {/* Ember particles — only when motion is allowed */}
      {!reduced &&
        EMBERS.map((ember) => (
          <motion.div
            key={ember.id}
            className="absolute rounded-full"
            style={{
              left: ember.left,
              bottom: "2%",
              width: ember.size,
              height: ember.size,
              backgroundColor: ember.color,
              boxShadow: `0 0 ${ember.size + 2}px ${ember.color}`,
            }}
            animate={{
              y: [0, -140, -230],
              x: [0, ember.driftXMid, ember.driftXEnd],
              opacity: [0, ember.peakOpacity, 0],
              scale: [0.5, 1, 0.15],
            }}
            transition={{
              duration: ember.duration,
              delay: ember.delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
    </div>
  );
});

export function HeroTicker({
  totalSpent: _totalSpent,
  initialTotalSpent,
  elapsed,
  dailyBudget,
}: HeroTickerProps) {
  const { rate: usdRate, isLive: usdIsLive } = useExchangeRate();

  // DOM refs — these elements' text is written directly, bypassing React state
  const numberRef = useRef<HTMLSpanElement>(null);
  const abbreviatedRef = useRef<HTMLSpanElement>(null);

  // MotionValue drives the count-up phase
  const displayValue = useMotionValue(0);

  // Check reduced motion preference once — stable reference
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // One-time external sync on mount: runs count-up then hands off to rAF loop
  useEffect(() => {
    let rafId: number | undefined;

    function writeToDOM(value: number): void {
      if (numberRef.current !== null) {
        numberRef.current.textContent = formatFull(value);
      }
      if (abbreviatedRef.current !== null) {
        abbreviatedRef.current.textContent = `≈ ${formatRupiah(value)}`;
      }
    }

    function startLiveTick(): void {
      function tick(): void {
        writeToDOM(calculateTotalSpent());
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    }

    if (prefersReducedMotion) {
      // Skip animation — write current value and start live loop immediately
      writeToDOM(initialTotalSpent);
      startLiveTick();
      return () => {
        if (rafId !== undefined) cancelAnimationFrame(rafId);
      };
    }

    // Write initial value before animation starts to avoid empty flash
    writeToDOM(0);

    const controls = animate(displayValue, initialTotalSpent, {
      duration: 2.5,
      ease: [0.16, 1, 0.3, 1], // expo-out easing
      onUpdate: (v) => writeToDOM(v),
      onComplete: () => {
        // Count-up done — hand off to live rAF loop
        startLiveTick();
      },
    });

    return () => {
      controls.stop();
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // USD per day derived from dailyBudget prop — computed, not stored
  const usdPerDay = dailyBudget / usdRate;
  const usdFormatted = usdPerDay >= 1_000_000
    ? `$${(usdPerDay / 1_000_000).toFixed(1)} juta`
    : `$${Math.round(usdPerDay).toLocaleString("en-US")}`;
  const usdRateLabel = usdIsLive
    ? `(1 USD = Rp ${usdRate.toLocaleString("id-ID")} · live)`
    : "(1 USD = Rp 16.500)";

  return (
    <section
      aria-label="Total anggaran MBG terpakai"
      className="relative flex flex-col gap-4 rounded-2xl border p-6 sm:p-8"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Fire + Number container */}
      <div className="relative">
        <FireBackground reduced={prefersReducedMotion} />

        {/* Number content */}
        <div className="relative flex flex-col gap-2 py-8 px-2">
          {/* Label */}
          <p
            className="text-base font-extrabold uppercase tracking-[0.25em]"
            style={{ color: "var(--color-text)" }}
          >
            Anggaran terpakai
          </p>

          {/* "Rp" prefix line */}
          <span
            className="text-sm font-bold tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Rp
          </span>

          {/* Main ticker — HUGE number. Text written via ref to avoid re-render on every frame */}
          <p
            className="font-mono font-black leading-none tracking-tight"
            style={{
              color: "var(--color-text)",
              fontVariantNumeric: "tabular-nums",
              fontSize: "clamp(2rem, 7vw, 4rem)",
              textShadow:
                "0 0 40px color-mix(in srgb, var(--color-accent) 30%, transparent), 0 0 80px color-mix(in srgb, var(--color-accent) 12%, transparent)",
            }}
            aria-live="off"
          >
            <span ref={numberRef} />
          </p>

          {/* Abbreviated trillion label. Text written via ref to avoid re-render on every frame */}
          <p
            className="text-lg font-bold sm:text-xl"
            style={{
              color: "var(--color-accent)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span ref={abbreviatedRef} />
          </p>
        </div>
      </div>

      {/* Separator */}
      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(to right, color-mix(in srgb, var(--color-accent) 40%, transparent), color-mix(in srgb, var(--color-accent) 10%, transparent), transparent)",
        }}
        aria-hidden="true"
      />

      {/* Elapsed time — sentence form */}
      <div className="flex flex-col gap-1.5">
        <p
          className="text-base leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          Berjalan sejak 6 Januari 2025 —{" "}
          <span
            className="font-mono font-black text-2xl"
            style={{ color: "var(--color-text)" }}
          >
            {elapsed.days}
          </span>{" "}
          hari{" "}
          <span className="font-mono font-semibold text-lg" style={{ color: "var(--color-text-muted)" }}>
            {pad(elapsed.hours)}
          </span>{" "}
          jam{" "}
          <span className="font-mono font-semibold text-lg" style={{ color: "var(--color-text-muted)" }}>
            {pad(elapsed.minutes)}
          </span>{" "}
          menit{" "}
          <span className="font-mono font-semibold text-lg" style={{ color: "var(--color-text-muted)" }}>
            {pad(elapsed.seconds)}
          </span>{" "}
          detik yang lalu
        </p>

        {/* USD conversion */}
        <p
          className="text-xs font-medium"
          style={{ color: "var(--color-text-faint)" }}
        >
          🇺🇸 ≈ {usdFormatted} per hari
          <span className="ml-1.5 opacity-60">{usdRateLabel}</span>
        </p>
      </div>
    </section>
  );
}
