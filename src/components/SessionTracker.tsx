import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatRupiah } from "../data/calculator";

interface SessionTrackerProps {
  readonly burnRatePerSecond: number;
}

// Capture session start once at module level so it survives StrictMode double-mount
const SESSION_START_MS = Date.now();
const SHOW_DELAY_MS = 3000;
const TICK_INTERVAL_MS = 100;

export function SessionTracker({ burnRatePerSecond }: SessionTrackerProps) {
  const [sessionSpent, setSessionSpent] = useState<number>(0);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);

  // Show after 3 s delay
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Tick every 100 ms — calculate elapsed since session start
  useEffect(() => {
    const id = setInterval(() => {
      const elapsedSeconds = (Date.now() - SESSION_START_MS) / 1000;
      setSessionSpent(elapsedSeconds * burnRatePerSecond);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [burnRatePerSecond]);

  const shouldShow = visible && !dismissed;

  // Format sessionSpent into a readable amount
  // We want a compact form since it will be small (seconds × ~10.6M/s = millions range quickly)
  const formattedAmount = formatSessionAmount(sessionSpent);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="session-tracker"
          role="status"
          aria-live="polite"
          aria-label="Penghitung anggaran MBG selama halaman dibuka"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 backdrop-blur-md"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-card) 90%, transparent)",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <div className="relative mx-auto flex max-w-3xl items-center justify-center gap-3 px-5 py-3.5 sm:px-10 sm:py-4">
            {/* Pulse dot */}
            <span
              className="hidden shrink-0 sm:block"
              aria-hidden="true"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "var(--color-accent)",
                animation: "pulse-live 2s ease-in-out infinite",
              }}
            />

            <p
              className="text-center text-sm leading-snug sm:text-base"
              style={{ color: "var(--color-text-muted)" }}
            >
              Selama kamu di halaman ini, anggaran MBG terpakai{" "}
              <span
                className="inline-block whitespace-nowrap font-mono font-bold tabular-nums"
                style={{ color: "var(--color-accent)" }}
              >
                {formattedAmount}
              </span>
            </p>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="absolute right-3 top-1/2 flex h-7 w-7 cursor-pointer shrink-0 -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-150"
              style={{
                color: "var(--color-text-faint)",
                backgroundColor: "transparent",
              }}
              aria-label="Tutup notifikasi"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "var(--color-border)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "transparent";
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M1.41 0 5 3.59 8.59 0 10 1.41 6.41 5 10 8.59 8.59 10 5 6.41 1.41 10 0 8.59 3.59 5 0 1.41z" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact format for session amounts — always shows Miliar/Juta with 2 decimal places
// so the number is readable even when small (first few seconds) or large (long sessions)
function formatSessionAmount(amount: number): string {
  if (amount >= 1_000_000_000_000) {
    return `Rp ${(amount / 1_000_000_000_000).toFixed(2)} Triliun`;
  }
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2)} Miliar`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(2)} Juta`;
  }
  // Sub-million (first ~0.1 seconds) — use the generic formatter
  return formatRupiah(amount);
}
