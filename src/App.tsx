import { useTicker } from "./hooks/useTicker";
import { useTheme } from "./hooks/useTheme";
import { getActivePhase, getBurnRatePerSecond } from "./data/calculator";
import { Header } from "./components/Header";
import { HeroTicker } from "./components/HeroTicker";
import { BurnRate } from "./components/BurnRate";
import { ComparisonSection } from "./components/ComparisonSection";
import { Calculator } from "./components/Calculator";
import { Methodology } from "./components/Methodology";
import { ThemeToggle } from "./components/ThemeToggle";
import { SessionTracker } from "./components/SessionTracker";

// Stable — only computed once at module level since phase doesn't change during a session
const activePhase = getActivePhase();
const burnRatePerSecond = getBurnRatePerSecond();

function SectionDivider() {
  return (
    <div
      aria-hidden="true"
      style={{
        height: "1px",
        maxWidth: "60%",
        margin: "0 auto",
        backgroundColor: "var(--color-border)",
        opacity: 0.5,
      }}
    />
  );
}

export default function App() {
  const { initialTotalSpent, elapsed, burnRates, phaseLabel } = useTicker();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      className="relative min-h-screen"
      style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
    >
      {/* Top border line accent */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-px z-50"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-accent) 30%, var(--color-accent) 70%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      {/* Ambient top glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-64 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 50% 100% at 20% 0%, var(--color-accent) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Theme toggle — positioned absolute within page flow */}
      <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

      <main className="relative mx-auto flex max-w-3xl flex-col gap-14 px-5 py-12 sm:py-16 md:py-20">
        <Header phaseLabel={phaseLabel} />

        <HeroTicker
          initialTotalSpent={initialTotalSpent}
          elapsed={elapsed}
          dailyBudget={activePhase.dailyBudget}
        />

        <SectionDivider />

        <BurnRate burnRates={burnRates} />

        <SectionDivider />

        <Calculator />

        <SectionDivider />

        <ComparisonSection />

        <SectionDivider />

        <Methodology />

        {/* Footer */}
        <footer
          className="border-t pt-6 pb-20 sm:pb-16"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex flex-col gap-2 items-center text-center">
            <p
              className="text-xs"
              style={{ color: "var(--color-text-faint)" }}
            >
              Visualisasi anggaran MBG · Data terakhir diperbarui: Maret 2026
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
              © 2026 Agung Febryanto ·{" "}
              <a
                href="https://afoxyze.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-150"
                style={{ color: "var(--color-text-muted)", textDecoration: "none" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-muted)";
                }}
              >
                afoxyze.dev
              </a>
            </p>
          </div>
        </footer>
      </main>

      <SessionTracker burnRatePerSecond={burnRatePerSecond} />
    </div>
  );
}
