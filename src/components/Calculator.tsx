import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useInView,
} from "framer-motion";
import {
  convertToHariMBG,
  formatRupiah,
  getActivePhase,
} from "../data/calculator";
import { COMPARISON_ITEMS } from "../data/comparisons";
import { shareResult } from "../utils/shareImage";

// ─── Constants ────────────────────────────────────────────────────────────────

const PORTION_COST = 15_000;
const MAX_AMOUNT = 10_000_000_000_000_000;
const SECONDS_PER_DAY = 86_400;

// Curated presets for "Konversi Rupiah" mode
const PRESET_IDS = [
  "umr-jakarta",
  "iphone-17-pro-max",
  "suramadu",
  "mrt-2",
  "whoosh",
] as const;

const QUICK_AMOUNTS = [
  { label: "1 Juta", value: 1_000_000 },
  { label: "1 Miliar", value: 1_000_000_000 },
  { label: "1 Triliun", value: 1_000_000_000_000 },
  { label: "10 Triliun", value: 10_000_000_000_000 },
  { label: "100 Triliun", value: 100_000_000_000_000 },
] as const;

const SALARY_PRESETS = [
  { label: "UMR Jakarta", value: 5_729_876 },
  { label: "Rp 10 Juta", value: 10_000_000 },
  { label: "Rp 20 Juta", value: 20_000_000 },
  { label: "Rp 50 Juta", value: 50_000_000 },
] as const;

type TabMode = "konversi" | "gaji";

// ─── Pure utility functions ───────────────────────────────────────────────────

function parseRawDigits(input: string): string {
  return input.replace(/\D/g, "");
}

function formatWithSeparators(digits: string): string {
  if (digits === "") return "";
  const stripped = digits.replace(/^0+(\d)/, "$1");
  return stripped.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function digitsToNumber(digits: string): number {
  if (digits === "") return 0;
  return parseInt(digits, 10);
}

// Smart unit: picks the most human-readable unit for a /hari MBG value
type MbgUnit =
  | { unit: "tahun"; value: number; days: number }
  | { unit: "bulan"; value: number; days: number }
  | { unit: "hari"; value: number }
  | { unit: "jam"; value: number }
  | { unit: "menit"; value: number }
  | { unit: "detik"; value: number };

function toSmartUnit(hari: number): MbgUnit {
  if (hari >= 365) return { unit: "tahun", value: hari / 365, days: Math.round(hari) };
  if (hari >= 30)  return { unit: "bulan", value: hari / 30,  days: Math.round(hari) };
  if (hari >= 1)   return { unit: "hari",  value: hari };
  if (hari >= 1 / 24)   return { unit: "jam",   value: hari * 24 };
  if (hari >= 1 / 1440) return { unit: "menit", value: hari * 24 * 60 };
  return { unit: "detik", value: hari * 24 * 60 * 60 };
}

// Converts a hari MBG value into a cascading time breakdown string.
// Skips zero-value units and returns null if breakdown would just repeat the primary.
function formatTimeBreakdown(hariMbg: number, primaryUnit: MbgUnit["unit"]): string | null {
  if (primaryUnit === "detik") return null;

  const totalSeconds = hariMbg * 24 * 60 * 60;
  const totalMinutes = hariMbg * 24 * 60;
  const totalHours = hariMbg * 24;

  const fmt = (n: number) => Math.floor(n).toLocaleString("id-ID");

  // Convert total into all smaller units as a full breakdown
  // Skip bulan/tahun — their context line already shows "= X hari MBG"
  type Part = readonly [number, string];

  let parts: readonly Part[] = [];

  if (primaryUnit === "menit") {
    parts = [
      [Math.floor(totalSeconds), "detik"],
    ];
  } else if (primaryUnit === "jam") {
    const mins = Math.floor(totalMinutes);
    const secs = Math.floor(totalSeconds % 60);
    parts = [
      [mins, "menit"],
      [secs, "detik"],
    ];
  } else if (primaryUnit === "hari") {
    const hrs = Math.floor(totalHours);
    const mins = Math.floor(totalMinutes % 60);
    const secs = Math.floor(totalSeconds % 60);
    parts = [
      [hrs, "jam"],
      [mins, "menit"],
      [secs, "detik"],
    ];
  }

  // Filter out zero-value units
  const nonZero = parts.filter(([value]) => value > 0);
  if (nonZero.length === 0) return null;

  return `= ${nonZero.map(([value, label]) => `${fmt(value)} ${label}`).join(" ")}`;
}

function formatSmartValue(val: number): string {
  if (val >= 10_000) return val.toLocaleString("id-ID", { maximumFractionDigits: 0 });
  if (val >= 1_000)  return val.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  if (val >= 100)    return val.toFixed(1);
  if (val >= 10)     return val.toFixed(2);
  return val.toFixed(2);
}

function formatPortions(amount: number): string {
  const p = amount / PORTION_COST;
  if (p >= 1_000_000_000) return `${(p / 1_000_000_000).toFixed(1)} miliar porsi`;
  if (p >= 1_000_000)     return `${(p / 1_000_000).toFixed(1)} juta porsi`;
  if (p >= 1_000)         return `${(p / 1_000).toFixed(1)} ribu porsi`;
  return `${Math.round(p).toLocaleString("id-ID")} porsi`;
}

// Salary comparison calculations — all derived, no stored state
function calcSalaryStats(salary: number, dailyBudget: number) {
  const burnPerSecond = dailyBudget / SECONDS_PER_DAY;
  const secondsToConsumeOneSalary = salary / burnPerSecond;
  const timesPerDay = dailyBudget / salary;
  const yearsToEarnOneDay = dailyBudget / (salary * 12);
  return { secondsToConsumeOneSalary, timesPerDay, yearsToEarnOneDay };
}

function formatDuration(seconds: number): string {
  if (seconds < 60)               return `${seconds.toFixed(1)} detik`;
  if (seconds < 3_600)            return `${(seconds / 60).toFixed(1)} menit`;
  if (seconds < SECONDS_PER_DAY)  return `${(seconds / 3_600).toFixed(1)} jam`;
  return `${(seconds / SECONDS_PER_DAY).toFixed(1)} hari`;
}

function formatLargeNumber(n: number): string {
  if (n >= 1_000) return n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
  if (n >= 100)   return n.toFixed(0);
  if (n >= 10)    return n.toFixed(1);
  return n.toFixed(2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface RpInputProps {
  readonly id: string;
  readonly label: string;
  readonly digits: string;
  readonly isOverMax: boolean;
  readonly onChange: (digits: string) => void;
  readonly onClear: () => void;
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
}

function RpInput({ id, label, digits, isOverMax, onChange, onClear, inputRef }: RpInputProps) {
  const displayValue = formatWithSeparators(digits);
  const hasValue = digits !== "";

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(parseRawDigits(e.target.value));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const isControl =
      e.ctrlKey || e.metaKey ||
      ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"].includes(e.key);
    if (!isControl && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }

  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div
        className="flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 transition-colors duration-150"
        style={{
          backgroundColor: "var(--color-card)",
          borderColor: isOverMax ? "#f97316" : "var(--color-border)",
        }}
      >
        <span
          className="shrink-0 select-none font-bold text-base font-mono"
          style={{ color: "var(--color-text-muted)" }}
          aria-hidden="true"
        >
          Rp
        </span>

        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            // On mobile, scroll input into view when keyboard opens
            setTimeout(() => {
              e.target.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 300);
          }}
          placeholder="0"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-lg sm:text-2xl font-bold tracking-tight outline-none placeholder:opacity-25 font-mono"
          style={{
            color: isOverMax ? "#f97316" : "var(--color-text)",
            fontVariantNumeric: "tabular-nums",
          }}
          aria-label={label}
          aria-describedby={isOverMax ? `${id}-max-warning` : undefined}
        />

        <AnimatePresence>
          {hasValue && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
              type="button"
              onClick={onClear}
              className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full transition-colors"
              style={{
                backgroundColor: "var(--color-border)",
                color: "var(--color-text-muted)",
              }}
              aria-label="Hapus input"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                <path d="M1.41 0 5 3.59 8.59 0 10 1.41 6.41 5 10 8.59 8.59 10 5 6.41 1.41 10 0 8.59 3.59 5 0 1.41z" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {isOverMax && (
        <p
          id={`${id}-max-warning`}
          className="mt-2 text-xs"
          style={{ color: "#f97316" }}
          role="alert"
        >
          Nilai melebihi batas maksimum.
        </p>
      )}
    </div>
  );
}

interface PillButtonProps {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}

function PillButton({ active, onClick, children }: PillButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold border transition-all duration-150"
      style={
        active
          ? { backgroundColor: "var(--color-accent)", color: "#fff", borderColor: "transparent" }
          : { backgroundColor: "transparent", color: "var(--color-text-muted)", borderColor: "var(--color-border)" }
      }
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Calculator() {
  const [activeTab, setActiveTab] = useState<TabMode>("konversi");
  const [rawDigits, setRawDigits] = useState("");
  const [salaryDigits, setSalaryDigits] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const salaryInputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });

  const activePhase = getActivePhase();

  // ── Mode 1 derived values ──
  const amount = digitsToNumber(rawDigits);
  const isOverMax = amount > MAX_AMOUNT;
  const hariMBG = amount > 0 && !isOverMax ? convertToHariMBG(amount) : null;
  const smartUnit = hariMBG !== null ? toSmartUnit(hariMBG) : null;

  // ── Mode 2 derived values ──
  const salary = digitsToNumber(salaryDigits);
  const salaryIsOverMax = salary > MAX_AMOUNT;
  const salaryStats =
    salary > 0 && !salaryIsOverMax
      ? calcSalaryStats(salary, activePhase.dailyBudget)
      : null;

  // ── Curated comparison presets ──
  const presetItems = PRESET_IDS.map((id) =>
    COMPARISON_ITEMS.find((item) => item.id === id)
  ).filter((item): item is NonNullable<typeof item> => item !== undefined);

  function handleQuickAmount(value: number) {
    setRawDigits(String(value));
    inputRef.current?.focus();
  }

  function handlePresetItem(cost: number) {
    setRawDigits(String(cost));
    inputRef.current?.focus();
  }

  function handleSalaryPreset(value: number) {
    setSalaryDigits(String(value));
    salaryInputRef.current?.focus();
  }

  function showToast(message: string) {
    setShareToast(message);
    setTimeout(() => setShareToast(null), 2500);
  }

  async function handleShare() {
    if (hariMBG === null || smartUnit === null || isSharing) return;
    setIsSharing(true);
    try {
      const primaryValue = formatSmartValue(smartUnit.value);
      const unitLabel = `${smartUnit.unit} MBG`;
      const portionsText = formatPortions(amount);
      const resultText = `${primaryValue} ${unitLabel}`;
      const outcome = await shareResult({
        inputLabel: formatRupiah(amount),
        resultLabel: resultText,
        contextLabel: `= ${portionsText} makan bergizi`,
        shareText: `🔥 ${formatRupiah(amount)}? Cuma ${primaryValue} ${smartUnit.unit} buat MBG.\nCek → mbg.afoxyze.dev`,
      });
      if (outcome === "downloaded") {
        showToast("Gambar terunduh, teks tersalin!");
      }
    } catch (err) {
      console.warn("Share cancelled or failed:", err);
    } finally {
      setIsSharing(false);
    }
  }

  async function handleShareGaji() {
    if (salaryStats === null || salary <= 0 || isSharing) return;
    setIsSharing(true);
    try {
      const { secondsToConsumeOneSalary, timesPerDay, yearsToEarnOneDay } = salaryStats;
      const durationText = formatDuration(secondsToConsumeOneSalary);
      const timesFormatted = formatLargeNumber(timesPerDay);
      const outcome = await shareResult({
        inputLabel: `Gaji: ${formatRupiah(salary)}`,
        resultLabel: durationText,
        contextLabel: `Setara ${timesFormatted}x gaji bulananmu per hari`,
        extraLine: `Perlu bekerja selama ${formatLargeNumber(yearsToEarnOneDay)} tahun untuk 1 hari MBG`,
        shareText: `Kerja sebulan gaji ${formatRupiah(salary)}.\nMBG? Cuma butuh ${durationText} aja itu udah abis 💸\nCek → mbg.afoxyze.dev`,
      });
      if (outcome === "downloaded") {
        showToast("Gambar terunduh, teks tersalin!");
      }
    } catch (err) {
      console.warn("Share cancelled or failed:", err);
    } finally {
      setIsSharing(false);
    }
  }

  // Unique keys for AnimatePresence — changes when the displayed result changes meaningfully
  const resultKey = hariMBG !== null ? Math.round(hariMBG * 1000) : "empty";
  const salaryResultKey = salary > 0 ? Math.round(salary / 1000) : "empty";

  return (
    <motion.div
      ref={sectionRef}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? undefined : (isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 })}
      transition={shouldReduceMotion ? undefined : { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <section aria-label="Kalkulator hari MBG">
        {/* ── Part 1: Dictionary Definition Card ── */}
        <DictionaryCard dailyBudget={activePhase.dailyBudget} />

        {/* ── Part 2 & 3: Calculator + Result ── */}
        <div className="mt-10">
          {/* Section heading */}
          <div className="mb-6">
            <p
              className="mb-1 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: "var(--color-text-faint)" }}
            >
              Kalkulator MBG
            </p>
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
              Hitung Perbandingan Biaya MBG
            </h2>
          </div>

          {/* Tab switcher */}
          <div
            className="mb-6 flex w-full gap-1 rounded-full p-1 sm:w-auto sm:inline-flex"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
            role="tablist"
            aria-label="Mode kalkulator"
          >
            <button
              role="tab"
              aria-selected={activeTab === "konversi"}
              aria-controls="tab-panel-konversi"
              onClick={() => setActiveTab("konversi")}
              className="flex-1 cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 sm:flex-initial"
              style={
                activeTab === "konversi"
                  ? { backgroundColor: "var(--color-accent)", color: "#fff" }
                  : { color: "var(--color-text-muted)" }
              }
            >
              Konversi Rupiah
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "gaji"}
              aria-controls="tab-panel-gaji"
              onClick={() => setActiveTab("gaji")}
              className="flex-1 cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 sm:flex-initial"
              style={
                activeTab === "gaji"
                  ? { backgroundColor: "var(--color-accent)", color: "#fff" }
                  : { color: "var(--color-text-muted)" }
              }
            >
              Bandingkan Gajimu
            </button>
          </div>

          {/* Tab panels */}
          <AnimatePresence mode="popLayout">
            {activeTab === "konversi" ? (
              <motion.div
                key="konversi"
                id="tab-panel-konversi"
                role="tabpanel"
                aria-label="Konversi Rupiah"
                initial={shouldReduceMotion ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {/* Input */}
                <div className="mb-4">
                  <RpInput
                    id="mbg-calculator-input"
                    label="Jumlah dalam Rupiah"
                    digits={rawDigits}
                    isOverMax={isOverMax}
                    onChange={setRawDigits}
                    onClear={() => setRawDigits("")}
                    inputRef={inputRef}
                  />
                </div>

                {/* Quick amount buttons */}
                <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Jumlah cepat">
                  {QUICK_AMOUNTS.map((qa) => (
                    <PillButton
                      key={qa.value}
                      active={amount === qa.value}
                      onClick={() => handleQuickAmount(qa.value)}
                    >
                      Rp {qa.label}
                    </PillButton>
                  ))}
                </div>

                {/* Real-world presets */}
                <div className="mb-6">
                  <p
                    className="mb-2 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--color-text-faint)" }}
                  >
                    Atau coba perbandingan nyata
                  </p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Perbandingan nyata">
                    {presetItems.map((item) => (
                      <PillButton
                        key={item.id}
                        active={amount === item.cost}
                        onClick={() => handlePresetItem(item.cost)}
                      >
                        {item.emoji} {item.name}
                      </PillButton>
                    ))}
                  </div>
                </div>

                {/* Result */}
                <div aria-live="polite" aria-atomic="true">
                  <AnimatePresence mode="wait">
                    {hariMBG !== null && smartUnit !== null ? (
                      <motion.div
                        key={resultKey}
                        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      >
                        <KonversiResult
                          amount={amount}
                          hariMBG={hariMBG}
                          smartUnit={smartUnit}
                          dailyBudget={activePhase.dailyBudget}
                          phaseLabel={activePhase.label}
                          shouldReduceMotion={shouldReduceMotion ?? false}
                        />
                      </motion.div>
                    ) : amount === 0 ? (
                      <p
                        className="py-4 text-center text-sm"
                        style={{ color: "var(--color-text-faint)" }}
                      >
                        Ketik angka atau pilih salah satu di atas
                      </p>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Share button — visible only when there's a result */}
                <AnimatePresence>
                  {hariMBG !== null && (
                    <motion.div
                      key="share-button"
                      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
                      transition={{ duration: 0.25, ease: "easeOut", delay: 0.15 }}
                      className="mt-3 flex justify-end"
                    >
                      <button
                        type="button"
                        onClick={() => void handleShare()}
                        disabled={isSharing}
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-150"
                        style={{
                          borderColor: "var(--color-border)",
                          color: isSharing ? "var(--color-text-faint)" : "var(--color-text-muted)",
                          backgroundColor: "var(--color-card)",
                          cursor: isSharing ? "default" : "pointer",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSharing) {
                            (e.currentTarget as HTMLButtonElement).style.borderColor =
                              "var(--color-accent)";
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "var(--color-accent)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor =
                            "var(--color-border)";
                          (e.currentTarget as HTMLButtonElement).style.color = isSharing
                            ? "var(--color-text-faint)"
                            : "var(--color-text-muted)";
                        }}
                        aria-label="Bagikan hasil kalkulator sebagai gambar"
                      >
                        {isSharing ? (
                          <>
                            <span aria-hidden="true">⏳</span>
                            Generating…
                          </>
                        ) : (
                          <>
                            <span aria-hidden="true">📤</span>
                            Share
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="gaji"
                id="tab-panel-gaji"
                role="tabpanel"
                aria-label="Bandingkan Gajimu"
                initial={shouldReduceMotion ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {/* Salary input */}
                <div className="mb-4">
                  <RpInput
                    id="mbg-salary-input"
                    label="Gaji bulanan kamu dalam Rupiah"
                    digits={salaryDigits}
                    isOverMax={salaryIsOverMax}
                    onChange={setSalaryDigits}
                    onClear={() => setSalaryDigits("")}
                    inputRef={salaryInputRef}
                  />
                </div>

                {/* Salary presets */}
                <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Preset gaji">
                  {SALARY_PRESETS.map((preset) => (
                    <PillButton
                      key={preset.value}
                      active={salary === preset.value}
                      onClick={() => handleSalaryPreset(preset.value)}
                    >
                      {preset.label}
                    </PillButton>
                  ))}
                </div>

                {/* Result */}
                <div aria-live="polite" aria-atomic="true">
                  <AnimatePresence mode="wait">
                    {salaryStats !== null && salary > 0 ? (
                      <motion.div
                        key={salaryResultKey}
                        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      >
                        <GajiResult
                          salary={salary}
                          stats={salaryStats}
                          dailyBudget={activePhase.dailyBudget}
                          phaseLabel={activePhase.label}
                          shouldReduceMotion={shouldReduceMotion ?? false}
                        />
                      </motion.div>
                    ) : salary === 0 ? (
                      <p
                        className="py-4 text-center text-sm"
                        style={{ color: "var(--color-text-faint)" }}
                      >
                        Masukkan gajimu
                      </p>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Share button — visible only when there's a salary result */}
                <AnimatePresence>
                  {salaryStats !== null && salary > 0 && (
                    <motion.div
                      key="share-button-gaji"
                      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
                      transition={{ duration: 0.25, ease: "easeOut", delay: 0.15 }}
                      className="mt-3 flex justify-end"
                    >
                      <button
                        type="button"
                        onClick={() => void handleShareGaji()}
                        disabled={isSharing}
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-150"
                        style={{
                          borderColor: "var(--color-border)",
                          color: isSharing ? "var(--color-text-faint)" : "var(--color-text-muted)",
                          backgroundColor: "var(--color-card)",
                          cursor: isSharing ? "default" : "pointer",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSharing) {
                            (e.currentTarget as HTMLButtonElement).style.borderColor =
                              "var(--color-accent)";
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "var(--color-accent)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor =
                            "var(--color-border)";
                          (e.currentTarget as HTMLButtonElement).style.color = isSharing
                            ? "var(--color-text-faint)"
                            : "var(--color-text-muted)";
                        }}
                        aria-label="Bagikan hasil perbandingan gaji sebagai gambar"
                      >
                        {isSharing ? (
                          <>
                            <span aria-hidden="true">⏳</span>
                            Generating…
                          </>
                        ) : (
                          <>
                            <span aria-hidden="true">📤</span>
                            Share
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section divider */}
        <div
          className="mt-10 h-px"
          style={{
            background:
              "linear-gradient(to right, color-mix(in srgb, var(--color-accent) 20%, transparent), color-mix(in srgb, var(--color-accent) 5%, transparent), transparent)",
          }}
        />
      </section>

      {/* Toast — shown on desktop after download + clipboard copy */}
      <AnimatePresence>
        {shareToast !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg"
            style={{
              backgroundColor: "var(--color-card)",
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
            }}
          >
            {shareToast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Dictionary Card ──────────────────────────────────────────────────────────

function DictionaryCard({ dailyBudget }: { readonly dailyBudget: number }) {
  const dailyFormatted = formatRupiah(dailyBudget);

  return (
    <div
      className="relative rounded-r-xl pl-4 pr-4 py-5 sm:pl-6 sm:pr-6 sm:py-6"
      style={{
        backgroundColor: "var(--color-card)",
        borderLeft: "4px solid var(--color-accent)",
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--color-accent) 8%, transparent), inset 0 0 0 1px var(--color-border)",
      }}
      aria-label="Definisi istilah hari MBG"
    >
      {/* Badge */}
      <div className="mb-3 inline-flex items-center gap-1.5">
        <span className="text-sm" aria-hidden="true">📖</span>
        <span
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--color-text-faint)" }}
        >
          Penemuan Satuan Ukur Baru
        </span>
      </div>

      {/* Headword */}
      <div className="mb-0.5">
        <span
          className="text-3xl font-black italic leading-none sm:text-4xl"
          style={{ color: "var(--color-text)", fontFamily: "var(--font-sans)" }}
        >
          /hari MBG
        </span>
      </div>

      {/* Pronunciation */}
      <p className="mb-3 text-sm" style={{ color: "var(--color-text-faint)" }}>
        [/ha·ri em·be·ge/]
      </p>

      {/* Part of speech */}
      <p className="mb-1 text-xs font-semibold italic" style={{ color: "var(--color-text-muted)" }}>
        n. satuan ukur
      </p>

      {/* Definition */}
      <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
        Satuan ukur yang digunakan untuk menghitung suatu biaya yang fantastis
        — setara dengan satu hari pengeluaran program Makan Bergizi Gratis.
      </p>

      {/* Example sentence */}
      <div
        className="mb-4 rounded-lg px-4 py-3"
        style={{ backgroundColor: "var(--color-accent-soft)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-1.5"
          style={{ color: "var(--color-text-faint)" }}
        >
          Contoh penggunaan
        </p>
        <p
          className="text-sm leading-relaxed italic"
          style={{ color: "var(--color-text-muted)" }}
        >
          "Proyek pembangunan jembatan itu menelan biaya Rp 4,5 T atau setara{" "}
          <span className="not-italic font-bold" style={{ color: "var(--color-accent)" }}>
            ~4,9 /hari MBG
          </span>
          ."
        </p>
      </div>

      {/* Exchange rate */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="inline-flex items-center gap-2 text-xs font-medium rounded-full px-3 py-1"
          style={{ backgroundColor: "var(--color-border)", color: "var(--color-text-muted)" }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--color-accent)" }}
            aria-hidden="true"
          />
          1 /hari MBG = {dailyFormatted}
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
          berdasarkan anggaran 2026
        </span>
      </div>
    </div>
  );
}

// ─── Konversi Result ──────────────────────────────────────────────────────────

interface KonversiResultProps {
  readonly amount: number;
  readonly hariMBG: number;
  readonly smartUnit: MbgUnit;
  readonly dailyBudget: number;
  readonly phaseLabel: string;
  readonly shouldReduceMotion: boolean;
}

function KonversiResult({
  amount,
  hariMBG,
  smartUnit,
  dailyBudget,
  phaseLabel,
  shouldReduceMotion,
}: KonversiResultProps) {
  const primaryValue = formatSmartValue(smartUnit.value);
  const unitLabel = `${smartUnit.unit} MBG`;

  // For tahun/bulan: also show raw days; for sub-day: also show hari fraction
  const contextLine = (() => {
    if ((smartUnit.unit === "tahun" || smartUnit.unit === "bulan") && "days" in smartUnit) {
      return `= ${smartUnit.days.toLocaleString("id-ID")} hari MBG`;
    }
    if (smartUnit.unit === "jam" || smartUnit.unit === "menit" || smartUnit.unit === "detik") {
      return `= ${hariMBG.toFixed(4)} hari MBG`;
    }
    return null;
  })();

  const breakdownLine = formatTimeBreakdown(hariMBG, smartUnit.unit);
  const portionsText = formatPortions(amount);
  const dailyRateFormatted = formatRupiah(dailyBudget);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}
    >
      {/* Primary result area */}
      <div
        className="px-5 pt-5 pb-4"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 6%, var(--color-card)) 0%, var(--color-card) 100%)",
        }}
      >
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-text-faint)" }}
        >
          Setara dengan
        </p>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className="font-black leading-none font-mono"
            style={{
              color: "var(--color-accent)",
              fontSize: "clamp(2.5rem, 10vw, 4rem)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {primaryValue}
          </span>
          <span
            className="text-xl font-bold"
            style={{
              color: "color-mix(in srgb, var(--color-accent) 65%, var(--color-text-muted))",
            }}
          >
            {unitLabel}
          </span>
        </div>

        {contextLine !== null && (
          <p
            className="mt-1.5 text-sm font-medium"
            style={{ color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}
          >
            {contextLine}
          </p>
        )}

        {breakdownLine !== null && (
          <p
            className="mt-1 text-sm font-mono"
            style={{ color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}
          >
            {breakdownLine}
          </p>
        )}
      </div>

      {/* Context rows */}
      <div
        className="px-5 py-4"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
          className="flex items-center justify-between gap-4 flex-wrap"
        >
          <span
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--color-text-faint)" }}
          >
            <span aria-hidden="true">🍱</span>
            Setara porsi makan bergizi
          </span>
          <span
            className="text-sm font-semibold font-mono"
            style={{ color: "var(--color-text)", fontVariantNumeric: "tabular-nums" }}
          >
            {portionsText}
          </span>
        </motion.div>
      </div>

      {/* Footnote */}
      <div
        className="px-5 py-3 flex flex-wrap gap-x-3 gap-y-1"
        style={{
          borderTop: "1px solid var(--color-border)",
          backgroundColor: "color-mix(in srgb, var(--color-border) 30%, transparent)",
        }}
      >
        <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
          Rate:{" "}
          <span style={{ color: "var(--color-text-muted)" }}>{dailyRateFormatted}/hari</span>
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>·</span>
        <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>{phaseLabel}</span>
        <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>·</span>
        <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>Porsi @Rp 15.000</span>
      </div>
    </div>
  );
}

// ─── Gaji Result ──────────────────────────────────────────────────────────────

type SalaryStats = ReturnType<typeof calcSalaryStats>;

interface GajiResultProps {
  readonly salary: number;
  readonly stats: SalaryStats;
  readonly dailyBudget: number;
  readonly phaseLabel: string;
  readonly shouldReduceMotion: boolean;
}

function GajiResult({ salary, stats, dailyBudget, phaseLabel, shouldReduceMotion }: GajiResultProps) {
  const { secondsToConsumeOneSalary, timesPerDay, yearsToEarnOneDay } = stats;

  const statRows = [
    {
      emoji: "⚡",
      label: "MBG menghabiskan gajimu dalam",
      value: formatDuration(secondsToConsumeOneSalary),
      suffix: null as string | null,
      highlight: true,
    },
    {
      emoji: "🔥",
      label: "Dalam 1 hari, MBG setara dengan",
      value: `${formatLargeNumber(timesPerDay)} gaji bulananmu`,
      suffix: null as string | null,
      highlight: false,
    },
    {
      emoji: "🕰️",
      label: "Kamu perlu bekerja selama",
      value: `${formatLargeNumber(yearsToEarnOneDay)} tahun`,
      suffix: "untuk hasilkan anggaran MBG 1 hari",
      highlight: false,
    },
  ];

  const salaryFormatted = formatRupiah(salary);
  const dailyRateFormatted = formatRupiah(dailyBudget);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}
    >
      {/* Header */}
      <div
        className="px-5 pt-5 pb-3"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-secondary) 6%, var(--color-card)) 0%, var(--color-card) 100%)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--color-text-faint)" }}
        >
          Perspektif pribadi untuk
        </p>
        <p
          className="text-lg font-bold font-mono"
          style={{ color: "var(--color-text)", fontVariantNumeric: "tabular-nums" }}
        >
          {salaryFormatted}
          <span className="ml-1 text-sm font-normal" style={{ color: "var(--color-text-muted)" }}>
            /bulan
          </span>
        </p>
      </div>

      {/* Stats */}
      <div
        className="px-5 py-4 flex flex-col gap-4"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        {statRows.map((row, i) => (
          <motion.div
            key={row.label}
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3, ease: "easeOut" }}
            className="flex flex-col gap-0.5"
          >
            <p
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "var(--color-text-faint)" }}
            >
              <span aria-hidden="true">{row.emoji}</span>
              {row.label}
            </p>
            <p
              className="font-bold text-base font-mono leading-tight"
              style={{
                color: row.highlight ? "var(--color-accent)" : "var(--color-text)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.value}
            </p>
            {row.suffix !== null && (
              <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                {row.suffix}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footnote */}
      <div
        className="px-5 py-3 flex flex-wrap gap-x-3 gap-y-1"
        style={{
          borderTop: "1px solid var(--color-border)",
          backgroundColor: "color-mix(in srgb, var(--color-border) 30%, transparent)",
        }}
      >
        <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
          MBG:{" "}
          <span style={{ color: "var(--color-text-muted)" }}>{dailyRateFormatted}/hari</span>
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>·</span>
        <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>{phaseLabel}</span>
      </div>
    </div>
  );
}
