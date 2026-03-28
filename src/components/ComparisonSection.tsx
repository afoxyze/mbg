import { useState, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  COMPARISON_ITEMS,
  type ComparisonCategory,
} from "../data/comparisons";
import { convertToHariMBG } from "../data/calculator";
import { ComparisonCard } from "./ComparisonCard";
import { ComparisonBarChart } from "./ComparisonBarChart";

type FilterTab = "all" | ComparisonCategory;

interface TabDefinition {
  readonly id: FilterTab;
  readonly label: string;
}

const TABS: readonly TabDefinition[] = [
  { id: "all", label: "Semua" },
  { id: "infrastructure", label: "Infrastruktur" },
  { id: "daily-life", label: "Kehidupan Sehari-hari" },
  { id: "global", label: "Skala Global" },
];

export function ComparisonSection() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-50px 0px" });
  const prefersReducedMotion = useReducedMotion();

  // Filter items by category tab
  const filtered =
    activeTab === "all"
      ? COMPARISON_ITEMS
      : COMPARISON_ITEMS.filter((item) => item.category === activeTab);

  // Sort infra and "all" by cost ascending to show scale progression.
  // Other categories keep natural order.
  const sorted =
    activeTab === "infrastructure" || activeTab === "all"
      ? [...filtered].sort((a, b) => a.cost - b.cost)
      : filtered;

  // Max hari MBG in current filtered set — used for relative bar scaling in cards
  const maxHariMBG = sorted.reduce((max, item) => {
    const hari = convertToHariMBG(item.cost);
    return hari > max ? hari : max;
  }, 0);

  // Show bar chart only when infra/global items are visible
  const showBarChart =
    activeTab === "all" ||
    activeTab === "infrastructure" ||
    activeTab === "global";

  return (
    <section aria-label="Perbandingan skala anggaran MBG">
      {/* Section header with scroll-reveal */}
      <motion.div
        ref={headerRef}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-8"
      >
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "var(--color-text-faint)" }}
        >
          Skala Perbandingan
        </p>
        <h2
          className="mb-1 text-lg font-bold leading-snug sm:text-xl"
          style={{ color: "var(--color-text)" }}
        >
          Seberapa besar anggaran MBG dibanding proyek-proyek lain?
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          Berapa hari MBG setara dengan&hellip;
        </p>
      </motion.div>

      {/* Category tab filters */}
      <div
        className="mb-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter kategori perbandingan"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150"
            style={
              activeTab === tab.id
                ? {
                    backgroundColor: "var(--color-accent)",
                    color: "#fff",
                    border: "1px solid transparent",
                  }
                : {
                    backgroundColor: "transparent",
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border)",
                  }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Visual bar chart — only for infra/global scale items */}
      {showBarChart && (
        <div
          className="mb-8 rounded-lg border px-4 py-5"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <p
            className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--color-text-faint)" }}
          >
            Visualisasi Skala Linear
          </p>
          <ComparisonBarChart />
        </div>
      )}

      {/* Cards list */}
      <div
        className="flex flex-col gap-2"
        role="tabpanel"
        aria-label={`Perbandingan kategori: ${TABS.find((t) => t.id === activeTab)?.label ?? activeTab}`}
      >
        {sorted.map((item, index) => (
          <ComparisonCard
            key={item.id}
            item={item}
            maxHariMBG={maxHariMBG}
            index={index}
          />
        ))}
      </div>

      {/* Divider after section */}
      <div
        className="mt-8 h-px"
        style={{
          background:
            "linear-gradient(to right, color-mix(in srgb, var(--color-accent) 20%, transparent), color-mix(in srgb, var(--color-accent) 5%, transparent), transparent)",
        }}
      />
    </section>
  );
}
