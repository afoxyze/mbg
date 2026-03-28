import { useState, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
} from "framer-motion";

interface FaqItem {
  readonly id: string;
  readonly question: string;
  readonly answer: React.ReactNode;
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: "sumber-data",
    question: "Dari mana data anggaran ini?",
    answer: (
      <>
        <p>
          Data anggaran MBG bersumber dari dokumen resmi APBN 2025 dan RAPBN
          2026 yang dipublikasikan oleh Kementerian Keuangan Republik Indonesia,
          serta laporan resmi dari Badan Gizi Nasional (BGN).
        </p>
        <ul className="mt-3 flex flex-col gap-1.5">
          <li>
            <a
              href="https://mediakeuangan.kemenkeu.go.id/article/show/menilik-eksistensi-program-mbg-atau-makan-bergizi-gratis"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              Kementerian Keuangan — mediakeuangan.kemenkeu.go.id
            </a>
          </li>
          <li>
            <a
              href="https://infopublik.id/kategori/hut-ri/933402/pemerintah-alokasikan-rp335-triliun-untuk-makan-bergizi-gratis-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              InfoPublik — infopublik.id
            </a>
          </li>
          <li>
            <a
              href="https://en.tempo.co/read/2089100/bgn-free-nutritious-meal-program-budget-set-at-rp8000-10000"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              Tempo.co — verifikasi data porsi
            </a>
          </li>
          <li>
            <a
              href="https://www.kompas.id/artikel/en-mbg-sasar-829-juta-penerima-pada-2026-prioritas-pada-ibu-hamil-dan-balita"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              Kompas.id — data penerima 2026
            </a>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "cara-hitung",
    question: "Bagaimana cara menghitungnya?",
    answer: (
      <>
        <p>
          Total anggaran tahunan dibagi rata per hari, kemudian diturunkan ke
          per jam, menit, dan detik.
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          <li className="calc-row">
            <span className="calc-label">Fase 1 (2025)</span>
            <span>Rp 71 Triliun ÷ 360 hari = ~Rp 197 Miliar/hari</span>
          </li>
          <li className="calc-row">
            <span className="calc-label">Fase 2 (2026)</span>
            <span>Rp 335 Triliun ÷ 365 hari = ~Rp 918 Miliar/hari</span>
          </li>
        </ul>
        <p className="mt-3">
          Ticker menghitung total akumulasi sejak program dimulai pada 6 Januari
          2025, dengan laju yang menyesuaikan fase aktif yang berlaku.
        </p>
      </>
    ),
  },
  {
    id: "pengeluaran-aktual",
    question: "Apakah ini pengeluaran aktual?",
    answer: (
      <p>
        Tidak. Angka yang ditampilkan adalah pembagian merata dari anggaran yang
        dialokasikan (<em>budget allocation</em>), bukan pengeluaran aktual yang
        sudah terverifikasi. Realisasi anggaran bisa berbeda dari alokasi — bisa
        lebih rendah (jika program terlambat) atau lebih tinggi (jika ada
        tambahan alokasi).
      </p>
    ),
  },
  {
    id: "hari-mbg",
    question: 'Apa itu "/hari MBG"?',
    answer: (
      <p>
        Satuan ukur buatan untuk membantu memvisualisasikan skala anggaran MBG.
        Satu /hari MBG setara dengan anggaran harian program MBG pada fase yang
        berlaku. Saat ini (2026): sekitar Rp 918 Miliar per hari. Satuan ini
        digunakan pada kartu perbandingan agar skala proyek lain lebih mudah
        dirasakan.
      </p>
    ),
  },
  {
    id: "data-perbandingan",
    question: "Data perbandingan dari mana?",
    answer: (
      <p>
        Setiap kartu perbandingan mencantumkan sumber datanya masing-masing.
        Data dikumpulkan dari laporan media terpercaya seperti Kompas, Tempo,
        dan sumber resmi terkait — termasuk PUPR, Kemenhub, dan laporan proyek
        pemerintah. Angka yang digunakan adalah estimasi resmi atau nilai
        kontrak yang dipublikasikan.
      </p>
    ),
  },
];

interface AccordionItemProps {
  readonly item: FaqItem;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly index: number;
  readonly isLast: boolean;
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
  index,
  isLast,
}: AccordionItemProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      custom={index}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.45,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: prefersReducedMotion ? 0 : index * 0.06,
      }}
      className={isLast ? "" : "border-b"}
      style={isLast ? undefined : { borderColor: "var(--color-border)" }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${item.id}`}
        id={`faq-question-${item.id}`}
        className="flex w-full cursor-pointer items-start justify-between gap-4 py-4 text-left"
      >
        <span
          className="text-sm font-semibold leading-snug sm:text-base"
          style={{ color: "var(--color-text)" }}
        >
          {item.question}
        </span>

        {/* Chevron icon — rotates when open */}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-0.5 shrink-0"
          aria-hidden="true"
          style={{ color: "var(--color-text-faint)" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 6L8 11L13 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.span>
      </button>

      {/* Animated answer panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-answer-${item.id}`}
            role="region"
            aria-labelledby={`faq-question-${item.id}`}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? {} : { opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div
              className="pb-5 text-sm leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Methodology() {
  const [openId, setOpenId] = useState<string | null>("cara-hitung");

  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, {
    once: true,
    margin: "-50px 0px",
  });
  const prefersReducedMotion = useReducedMotion();

  function handleToggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <section aria-label="Metodologi dan sumber data">
      {/* Section header */}
      <motion.div
        ref={headerRef}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-7"
      >
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "var(--color-text-faint)" }}
        >
          Transparansi Data
        </p>
        <h2
          className="mb-1 text-lg font-bold leading-snug sm:text-xl"
          style={{ color: "var(--color-text)" }}
        >
          Metodologi &amp; Sumber Data
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          Bagaimana angka-angka ini dihitung, dan dari mana asalnya.
        </p>
      </motion.div>

      {/* Accordion container */}
      <div
        className="rounded-xl border"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
        }}
      >
        <div className="px-4 pt-1 pb-1 sm:px-5">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => handleToggle(item.id)}
              index={index}
              isLast={index === FAQ_ITEMS.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Inline styles for answer content elements */}
      <style>{`
        .source-link {
          color: var(--color-accent);
          text-decoration: none;
          font-size: 0.8125rem;
          transition: opacity 0.15s ease;
        }
        .source-link:hover {
          opacity: 0.75;
          text-decoration: underline;
        }
        .calc-row {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          padding: 0.625rem 0.875rem;
          border-radius: 0.5rem;
          background-color: color-mix(in srgb, var(--color-accent) 6%, transparent);
          border: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
          font-size: 0.8125rem;
        }
        .calc-label {
          font-weight: 700;
          color: var(--color-accent);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
      `}</style>
    </section>
  );
}
