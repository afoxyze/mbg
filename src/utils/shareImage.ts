// Canvas-based share image generator — 1200×630 (OG ratio, also good for Twitter/WA).
// Canvas cannot load web fonts reliably, so we use system font stack only.

export interface ShareData {
  readonly inputLabel: string;   // e.g. "Rp 25.300.000.000.000"
  readonly resultLabel: string;  // e.g. "27.6 hari MBG"
  readonly contextLabel: string; // e.g. "= 1,8 juta porsi makan bergizi"
  readonly extraLine?: string;   // optional 4th line, triggers compact gaji layout
}

const W = 1200;
const H = 630;

// Color palette — matches the site's warm light theme
const COLOR_BG = "#FFFBF5";
const COLOR_CARD = "#FFF7ED";
const COLOR_ACCENT = "#E54D2E";
const COLOR_TEXT_MUTED = "#78716c";
const COLOR_TEXT_FAINT = "#a8a29e";
const COLOR_BORDER = "#E7E0D8";

// Fonts that are reliably available cross-platform — no web font loading on canvas
const FONT_DISPLAY = '"Segoe UI", "SF Pro Display", "Helvetica Neue", Arial, sans-serif';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function generateShareImage(data: ShareData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    if (ctx === null) {
      reject(new Error("Canvas 2D context unavailable"));
      return;
    }

    // ── Background ──
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, W, H);

    // Subtle warm gradient overlay in top-left
    const grad = ctx.createRadialGradient(200, 0, 0, 200, 0, 600);
    grad.addColorStop(0, "rgba(229,77,46,0.06)");
    grad.addColorStop(1, "rgba(229,77,46,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ── Card ──
    const cardX = 80;
    const cardY = 90;
    const cardW = W - 160;
    const cardH = H - 180;

    ctx.shadowColor = "rgba(0,0,0,0.06)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = COLOR_CARD;
    roundRect(ctx, cardX, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Card border
    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = 1.5;
    roundRect(ctx, cardX, cardY, cardW, cardH, 20);
    ctx.stroke();

    // Left accent bar
    ctx.fillStyle = COLOR_ACCENT;
    roundRect(ctx, cardX, cardY + 20, 5, cardH - 40, 4);
    ctx.fill();

    // ── Top label ──
    ctx.font = `600 18px ${FONT_DISPLAY}`;
    ctx.fillStyle = COLOR_TEXT_FAINT;
    ctx.letterSpacing = "0.15em";
    ctx.fillText("💰  KALKULATOR /HARI MBG", cardX + 48, cardY + 64);
    ctx.letterSpacing = "0";

    // Divider line under label
    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 48, cardY + 84);
    ctx.lineTo(cardX + cardW - 48, cardY + 84);
    ctx.stroke();

    // ── Input amount ──
    ctx.font = `400 22px ${FONT_DISPLAY}`;
    ctx.fillStyle = COLOR_TEXT_MUTED;
    ctx.fillText(data.inputLabel, cardX + 48, cardY + 135);

    // Split resultLabel into numeric part and unit part for different weights
    const resultParts = data.resultLabel.match(/^([\d.,]+)\s+(.+)$/);
    const numericPart = resultParts !== null ? resultParts[1] ?? data.resultLabel : data.resultLabel;
    const unitPart = resultParts !== null ? (resultParts[2] ?? "") : "";

    if (data.extraLine !== undefined) {
      // ── Compact gaji layout ──
      // Sub-heading: "MBG habiskan gajimu dalam"
      ctx.font = `400 20px ${FONT_DISPLAY}`;
      ctx.fillStyle = COLOR_TEXT_MUTED;
      ctx.fillText("MBG habiskan gajimu dalam", cardX + 48, cardY + 188);

      // Primary result at 72px (compact to fit extra lines)
      ctx.font = `900 72px ${FONT_DISPLAY}`;
      ctx.fillStyle = COLOR_ACCENT;
      ctx.fillText(numericPart, cardX + 48, cardY + 272);

      const numericWidth = ctx.measureText(numericPart).width;

      ctx.font = `600 28px ${FONT_DISPLAY}`;
      ctx.fillStyle = `rgba(229,77,46,0.7)`;
      ctx.fillText(unitPart, cardX + 48 + numericWidth + 12, cardY + 272);

      // Context line
      ctx.font = `400 22px ${FONT_DISPLAY}`;
      ctx.fillStyle = COLOR_TEXT_MUTED;
      ctx.fillText(data.contextLabel, cardX + 48, cardY + 328);

      // Extra line — wrap long text at word boundary if needed
      const extraWords = data.extraLine.split(" ");
      const maxLineWidth = cardW - 96;
      let line = "";
      let extraY = cardY + 368;
      for (const word of extraWords) {
        const test = line.length > 0 ? `${line} ${word}` : word;
        ctx.font = `400 22px ${FONT_DISPLAY}`;
        if (ctx.measureText(test).width > maxLineWidth && line.length > 0) {
          ctx.fillStyle = COLOR_TEXT_MUTED;
          ctx.fillText(line, cardX + 48, extraY);
          line = word;
          extraY += 32;
        } else {
          line = test;
        }
      }
      if (line.length > 0) {
        ctx.font = `400 22px ${FONT_DISPLAY}`;
        ctx.fillStyle = COLOR_TEXT_MUTED;
        ctx.fillText(line, cardX + 48, extraY);
      }
    } else {
      // ── Standard konversi layout (unchanged) ──
      // Equals arrow
      ctx.font = `300 28px ${FONT_DISPLAY}`;
      ctx.fillStyle = COLOR_TEXT_FAINT;
      ctx.fillText("↓", cardX + 48, cardY + 188);

      // Primary result — large accent number
      ctx.font = `900 112px ${FONT_DISPLAY}`;
      ctx.fillStyle = COLOR_ACCENT;
      ctx.fillText(numericPart, cardX + 48, cardY + 310);

      const numericWidth = ctx.measureText(numericPart).width;

      ctx.font = `600 40px ${FONT_DISPLAY}`;
      ctx.fillStyle = `rgba(229,77,46,0.7)`;
      ctx.fillText(unitPart, cardX + 48 + numericWidth + 16, cardY + 310);

      // Context line
      ctx.font = `400 24px ${FONT_DISPLAY}`;
      ctx.fillStyle = COLOR_TEXT_MUTED;
      ctx.fillText(data.contextLabel, cardX + 48, cardY + 370);
    }

    // ── Footer ──
    // Divider
    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 48, cardY + cardH - 70);
    ctx.lineTo(cardX + cardW - 48, cardY + cardH - 70);
    ctx.stroke();

    // Brand dot
    ctx.fillStyle = COLOR_ACCENT;
    ctx.beginPath();
    ctx.arc(cardX + 56, cardY + cardH - 35, 5, 0, Math.PI * 2);
    ctx.fill();

    // Brand URL
    ctx.font = `600 20px ${FONT_DISPLAY}`;
    ctx.fillStyle = COLOR_TEXT_MUTED;
    ctx.fillText("mbg.afoxyze.dev", cardX + 72, cardY + cardH - 27);

    // Tagline on right
    ctx.font = `400 18px ${FONT_DISPLAY}`;
    ctx.fillStyle = COLOR_TEXT_FAINT;
    ctx.textAlign = "right";
    ctx.fillText("Visualisasi anggaran MBG", cardX + cardW - 48, cardY + cardH - 27);
    ctx.textAlign = "left";

    canvas.toBlob(
      (blob) => {
        if (blob === null) {
          reject(new Error("Failed to convert canvas to blob"));
          return;
        }
        resolve(blob);
      },
      "image/png",
    );
  });
}

export async function shareResult(data: ShareData): Promise<void> {
  const shareText = `${data.inputLabel} = ${data.resultLabel} — ${data.contextLabel}`;

  // Use navigator.share() IMMEDIATELY (still in user gesture context).
  // Must happen before any async work (canvas generation) or the gesture expires.
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: "Kalkulator /hari MBG",
        text: shareText,
        url: "https://mbg.afoxyze.dev",
      });
      return;
    } catch {
      // User cancelled — that's fine, don't fall through to download
      return;
    }
  }

  // Desktop: generate image and trigger download
  const anchor = document.createElement("a");
  anchor.download = "hasil-mbg.png";
  anchor.style.display = "none";
  document.body.appendChild(anchor);

  try {
    const blob = await generateShareImage(data);

    // Trigger PNG download using the pre-attached anchor
    const url = URL.createObjectURL(blob);
    anchor.href = url;
    anchor.click();

    // Revoke object URL after a short delay to allow download to initiate
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } finally {
    // Always clean up the anchor element from the DOM
    if (anchor.parentNode !== null) {
      anchor.parentNode.removeChild(anchor);
    }
  }
}
