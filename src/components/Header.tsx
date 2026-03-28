interface HeaderProps {
  readonly phaseLabel: string;
}

export function Header({ phaseLabel }: HeaderProps) {
  // Derive phase number and year from label: "2025 (APBN)" -> phase 1, "2026" -> phase 2
  const phaseNumber = phaseLabel.startsWith("2025") ? "1" : "2";
  const year = phaseLabel.slice(0, 4);

  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-center gap-2 sm:gap-3">
        <h1
          className="text-2xl sm:text-3xl font-black tracking-tight uppercase"
          style={{ color: "var(--color-text)" }}
        >
          Biaya MBG
        </h1>
        <span
          className="flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-bold uppercase tracking-widest"
          style={{
            backgroundColor: "var(--color-accent-soft)",
            borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)",
            color: "var(--color-accent)",
          }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              backgroundColor: "var(--color-accent)",
              animation: "pulse-live 1.2s ease-in-out infinite",
            }}
            aria-hidden="true"
          />
          Live
        </span>
      </div>

      {/* One-liner context */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--color-text-muted)" }}
      >
        Program Makan Bergizi Gratis —{" "}
        <span style={{ color: "var(--color-text-faint)" }}>
          anggaran terbesar dalam sejarah Indonesia
        </span>
      </p>

      {/* Phase indicator */}
      <p
        className="text-xs font-medium tracking-[0.2em] uppercase mt-0.5"
        style={{ color: "var(--color-text-faint)" }}
      >
        FASE {phaseNumber}&nbsp;·&nbsp;{year}
      </p>
    </header>
  );
}
