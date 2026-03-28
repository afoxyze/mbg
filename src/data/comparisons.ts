export type ComparisonCategory = "infrastructure" | "daily-life" | "global";

export interface ComparisonItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly cost: number; // in Rupiah
  readonly category: ComparisonCategory;
  readonly source: string;
  readonly emoji: string;
}

export const COMPARISON_ITEMS: readonly ComparisonItem[] = [
  // Infrastructure
  {
    id: "suramadu",
    name: "Jembatan Suramadu",
    description: "Jembatan terpanjang di Indonesia (5.4 km), dibangun 6 tahun",
    cost: 4_500_000_000_000,
    category: "infrastructure",
    emoji: "🌉",
    source:
      "https://www.tempo.co/ekonomi/6-fakta-jembatan-suramadu-berbiaya-rp-4-5-triliun-13-tahun-peresmiannya-340668",
  },
  {
    id: "nyia",
    name: "Bandara NYIA Yogyakarta",
    description: "Bandara internasional baru di Kulon Progo",
    cost: 11_300_000_000_000,
    category: "infrastructure",
    emoji: "✈️",
    source:
      "https://regional.kompas.com/read/2020/08/28/14150011/telan-biaya-rp-113-triliun-fasilitas-bandara-international-yogyakarta-tuai?page=all",
  },
  {
    id: "mrt-1",
    name: "MRT Jakarta Fase 1",
    description: "Lebak Bulus — Bundaran HI (15.7 km)",
    cost: 16_000_000_000_000,
    category: "infrastructure",
    emoji: "🚇",
    source:
      "https://www.tempo.co/arsip/investasi-mrt-jakarta-fase-1-sebanyak-rp-16-t-kembali-setelah--757637",
  },
  {
    id: "mrt-2",
    name: "MRT Jakarta Fase 2",
    description: "Bundaran HI — Kota Tua",
    cost: 25_300_000_000_000,
    category: "infrastructure",
    emoji: "🚇",
    source:
      "https://www.kompas.com/properti/read/2022/09/20/200000621/biaya-bangun-mrt-fase-2-membengkak-jadi-rp-25-3-triliun-kenapa-",
  },
  {
    id: "whoosh",
    name: "Kereta Cepat Whoosh",
    description:
      "Jakarta — Bandung (142.3 km), kereta cepat pertama di Asia Tenggara",
    cost: 120_380_000_000_000,
    category: "infrastructure",
    emoji: "🚄",
    source:
      "https://money.kompas.com/read/2025/10/14/133405626/ini-total-utang-dan-bunga-proyek-kereta-cepat-whoosh",
  },
  {
    id: "ikn",
    name: "Ibu Kota Nusantara (IKN)",
    description: "Proyek pemindahan ibu kota ke Kalimantan Timur (2022-2045)",
    cost: 466_000_000_000_000,
    category: "infrastructure",
    emoji: "🏛️",
    source:
      "https://www.tempo.co/ekonomi/kementerian-keuangan-ungkap-anggaran-pembangunan-ikn-tembus-rp-43-4-triliun-pada-2024-1190425",
  },
  // Daily Life
  {
    id: "bensin-pertalite",
    name: "Bensin Pertalite 1 Liter",
    description: "Harga BBM Pertalite per liter (2026)",
    cost: 10_000,
    category: "daily-life",
    emoji: "⛽",
    source:
      "https://www.idxchannel.com/economics/update-harga-bbm-di-spbu-per-16-maret-2026-pertalite-tetap-rp10000-per-liter",
  },
  {
    id: "telur-ayam",
    name: "Telur Ayam 1 kg",
    description: "Rata-rata harga telur ayam per kilogram (Mar 2026)",
    cost: 35_130,
    category: "daily-life",
    emoji: "🥚",
    source:
      "https://databoks.katadata.co.id/datapublish/2026/03/21/harga-telur-ayam-di-10-provinsi-ini-paling-mahal-selasa-17-maret-2026",
  },
  {
    id: "starbucks",
    name: "Kopi Starbucks",
    description: "Caffe Latte Grande",
    cost: 59_000,
    category: "daily-life",
    emoji: "☕",
    source:
      "https://www.tempo.co/gaya-hidup/daftar-menu-starbucks-kopi-dan-non-kopi-serta-harga-terbarunya-103031",
  },
  {
    id: "beras-5kg",
    name: "Beras 5 kg",
    description: "Harga beras medium kualitas menengah per 5 kg (Mar 2026)",
    cost: 75_000,
    category: "daily-life",
    emoji: "🍚",
    source:
      "https://www.marketeers.com/harga-beras-5-maret-2026-kualitas-super-melandai-di-angka-rp-16-000-an/",
  },
  {
    id: "umr-jakarta",
    name: "UMR Jakarta 2026",
    description: "Upah minimum bulanan DKI Jakarta",
    cost: 5_729_876,
    category: "daily-life",
    emoji: "💰",
    source:
      "https://money.kompas.com/read/2025/12/24/183755926/gaji-umr-jakarta-2026-naik-617-persen-ump-jadi-rp-5729876",
  },
  {
    id: "honda-beat",
    name: "Honda Beat (CBS)",
    description: "Harga OTR Honda Beat CBS termurah (Mar 2026)",
    cost: 18_980_000,
    category: "daily-life",
    emoji: "🏍️",
    source: "https://otorider.com/berita/2026/cek-harga-honda-beat-maret-2026-mulai-dari-rp-189-jutaan-cekddjidaan",
  },
  {
    id: "iphone-17-pro-max",
    name: "iPhone 17 Pro Max",
    description: "256GB, harga resmi Indonesia (Mar 2026)",
    cost: 25_749_000,
    category: "daily-life",
    emoji: "📱",
    source:
      "https://www.beritasatu.com/network/aboutsemarang/805647/harga-iphone-terbaru-di-indonesia-maret-2026-penyesuaian-harga-dan-kenaikan-yang-membingungkan",
  },
  // Global
  {
    id: "defense-id",
    name: "Budget Pertahanan Indonesia 2026",
    description: "Anggaran Kementerian Pertahanan",
    cost: 187_100_000_000_000,
    category: "global",
    emoji: "🪖",
    source:
      "https://www.tempo.co/politik/anggaran-kemhan-2026-sebesar-rp-187-1-triliun-jubir-kedaulatan-biayanya-mahal-2070992",
  },
  {
    id: "nasa",
    name: "Budget NASA FY2026",
    description: "Anggaran tahunan badan antariksa AS",
    cost: 402_600_000_000_000, // USD 24.4B × Rp 16,500
    category: "global",
    emoji: "🚀",
    source: "https://www.nasa.gov/fy-2026-budget-request/",
  },
];
