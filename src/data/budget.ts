export interface BudgetPhase {
  readonly id: string;
  readonly label: string;
  readonly startDate: string; // ISO date
  readonly endDate: string; // ISO date
  readonly annualBudget: number; // in Rupiah
  readonly dailyBudget: number; // calculated: annualBudget / days in period
  readonly source: string; // URL
}

export interface PortionBreakdown {
  readonly category: string;
  readonly foodCost: number;
  readonly operationalCost: number;
  readonly facilityCost: number;
  readonly totalPerPortion: number;
  readonly source: string;
}

export interface ProgramStats {
  readonly startDate: string;
  readonly targetRecipients2025: number;
  readonly actualRecipients2025: number;
  readonly targetRecipients2026: number;
  readonly totalKitchens2025: number;
  readonly targetKitchens: number;
  readonly sources: readonly string[];
}

export const BUDGET_PHASES: readonly BudgetPhase[] = [
  {
    id: "phase-1",
    label: "2025 (APBN)",
    startDate: "2025-01-06",
    endDate: "2025-12-31",
    annualBudget: 71_000_000_000_000, // Rp 71 Triliun
    dailyBudget: 71_000_000_000_000 / 360, // ~Rp 197.2M/hari
    source:
      "https://mediakeuangan.kemenkeu.go.id/article/show/menilik-eksistensi-program-mbg-atau-makan-bergizi-gratis",
  },
  {
    id: "phase-2",
    label: "2026",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    annualBudget: 335_000_000_000_000, // Rp 335 Triliun
    dailyBudget: 335_000_000_000_000 / 365, // ~Rp 917.8M/hari
    source:
      "https://infopublik.id/kategori/hut-ri/933402/pemerintah-alokasikan-rp335-triliun-untuk-makan-bergizi-gratis-2026",
  },
];

export const PORTION_BREAKDOWN: readonly PortionBreakdown[] = [
  {
    category: "Balita - SD Kelas 3",
    foodCost: 8_000,
    operationalCost: 3_000,
    facilityCost: 2_000,
    totalPerPortion: 13_000,
    source:
      "https://en.tempo.co/read/2089100/bgn-free-nutritious-meal-program-budget-set-at-rp8000-10000",
  },
  {
    category: "SD Kelas 4+ / Ibu Menyusui",
    foodCost: 10_000,
    operationalCost: 3_000,
    facilityCost: 2_000,
    totalPerPortion: 15_000,
    source:
      "https://en.tempo.co/read/2089100/bgn-free-nutritious-meal-program-budget-set-at-rp8000-10000",
  },
];

export const PROGRAM_STATS: ProgramStats = {
  startDate: "2025-01-06",
  targetRecipients2025: 19_470_000,
  actualRecipients2025: 55_100_000,
  targetRecipients2026: 82_900_000,
  totalKitchens2025: 19_188,
  targetKitchens: 30_000,
  sources: [
    "https://mediakeuangan.kemenkeu.go.id/article/show/menilik-eksistensi-program-mbg-atau-makan-bergizi-gratis",
    "https://www.kompas.id/artikel/en-mbg-sasar-829-juta-penerima-pada-2026-prioritas-pada-ibu-hamil-dan-balita",
  ],
};
