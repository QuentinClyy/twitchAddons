import * as THREE from 'three';

const VERDIGRIS_HUE_MIN = 150;
const VERDIGRIS_HUE_MAX = 185;
const MIN_LIGHTNESS = 48;
const MAX_LIGHTNESS = 78;
const MIN_SATURATION = 30;
const MAX_SATURATION = 90;
const FALLBACK_COLOR = '#d9b877';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parseColorToRgb(input: string): { r: number; g: number; b: number } | null {
  const hex = input.trim().match(/^#?([0-9a-f]{6})$/i);
  if (hex) {
    return {
      r: parseInt(hex[1].slice(0, 2), 16),
      g: parseInt(hex[1].slice(2, 4), 16),
      b: parseInt(hex[1].slice(4, 6), 16),
    };
  }
  const rgb = input.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  return null;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function verdigrisVariant(color: string): string {
  const rgb = parseColorToRgb(color);
  if (!rgb) return FALLBACK_COLOR;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hue = VERDIGRIS_HUE_MIN + (hsl.h / 360) * (VERDIGRIS_HUE_MAX - VERDIGRIS_HUE_MIN);
  const sat = clamp(hsl.s, MIN_SATURATION, MAX_SATURATION);
  const light = clamp(hsl.l, MIN_LIGHTNESS, MAX_LIGHTNESS);
  return `hsl(${Math.round(hue)}, ${Math.round(sat)}%, ${Math.round(light)}%)`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

interface ChatRow {
  id: string;
  user: string;
  text: string;
  color: string;
  deleted: boolean;
}

export class ChatPanel {
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;

  private readonly ctx: CanvasRenderingContext2D;
  private rows: ChatRow[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1200;
    this.canvas.height = 860;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context not available');
    this.ctx = ctx;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    this.draw();
  }

  addMessage(id: string, user: string, text: string, color: string) {
    this.rows.push({ id, user, text, color, deleted: false });
    if (this.rows.length > 40) this.rows.shift();
    this.draw();
  }

  deleteMessage(id: string) {
    const row = this.rows.find((r) => r.id === id);
    if (!row) return;
    row.deleted = true;
    this.draw();
  }

  clearUser(user: string) {
    let changed = false;
    for (const row of this.rows) {
      if (row.user === user) {
        row.deleted = true;
        changed = true;
      }
    }
    if (changed) this.draw();
  }

  clearAll() {
    this.rows = [];
    this.draw();
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (this.ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  draw() {
    const { ctx } = this;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#070f0b';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#123322';
    ctx.fillRect(0, 0, w, 64);
    ctx.fillStyle = '#9dffce';
    ctx.font = '700 30px "Courier New", monospace';
    ctx.fillText('# chat', 22, 42);
    ctx.fillStyle = '#4dff9e';
    ctx.beginPath();
    ctx.arc(w - 40, 32, 8, 0, Math.PI * 2);
    ctx.fill();

    const pad = 20;
    const maxBubbleWidth = w - pad * 2 - 40;
    ctx.font = '22px "Courier New", monospace';

    const recent = this.rows.slice(-14);
    const built = recent.map((row) => {
      ctx.font = '22px "Courier New", monospace';
      const lines = this.wrapText(row.text, maxBubbleWidth - 20);
      const height = 34 + lines.length * 30 + 16;
      return { row, lines, height, top: 0 };
    });

    let y = h - 14;
    const positioned: typeof built = [];
    for (let i = built.length - 1; i >= 0 && y > 74; i--) {
      const bubble = built[i];
      y -= bubble.height;
      positioned.unshift({ ...bubble, top: y });
      y -= 12;
    }

    for (const bubble of positioned) {
      ctx.globalAlpha = bubble.row.deleted ? 0.35 : 1;
      ctx.fillStyle = 'rgba(255,255,255,0.055)';
      roundRect(ctx, pad, bubble.top, w - pad * 2, bubble.height, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(140,255,190,0.14)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, pad, bubble.top, w - pad * 2, bubble.height, 14);
      ctx.stroke();

      ctx.font = '700 22px "Courier New", monospace';
      ctx.fillStyle = verdigrisVariant(bubble.row.color);
      ctx.fillText(bubble.row.user, pad + 18, bubble.top + 30);

      ctx.font = '22px "Courier New", monospace';
      ctx.fillStyle = '#f0fff6';
      let lineY = bubble.top + 30 + 30;
      for (const line of bubble.lines) {
        ctx.fillText(line, pad + 18, lineY);
        lineY += 30;
      }
      ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#000000';
    for (let sy = 0; sy < h; sy += 4) ctx.fillRect(0, sy, w, 1.5);
    ctx.globalAlpha = 1;

    this.texture.needsUpdate = true;
  }
}
