import './chatWidget.css';

const TYPE_SPEED = 14;
const MAX_ROWS = 40;

const VERDIGRIS_HUE_MIN = 150;
const VERDIGRIS_HUE_MAX = 185;
const MIN_LIGHTNESS = 48;
const MAX_LIGHTNESS = 78;
const MIN_SATURATION = 30;
const MAX_SATURATION = 90;

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

function toVerdigrisVariant(originalColor: string): string | null {
  const rgb = parseColorToRgb(originalColor);
  if (!rgb) return null;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hue = VERDIGRIS_HUE_MIN + (hsl.h / 360) * (VERDIGRIS_HUE_MAX - VERDIGRIS_HUE_MIN);
  const sat = clamp(hsl.s, MIN_SATURATION, MAX_SATURATION);
  const light = clamp(hsl.l, MIN_LIGHTNESS, MAX_LIGHTNESS);
  return `hsl(${Math.round(hue)}, ${Math.round(sat)}%, ${Math.round(light)}%)`;
}

function colorizeName(row: HTMLElement) {
  const nameEl = row.querySelector<HTMLElement>('.name');
  if (!nameEl) return;
  const original = nameEl.style.color || getComputedStyle(nameEl).color;
  const shade = toVerdigrisVariant(original);
  if (!shade) return;
  nameEl.style.color = shade;
  nameEl.style.textShadow = `0 0 6px ${shade}, 0 0 1px rgba(6,15,17,0.8)`;
}

function typeWriter(el: HTMLElement) {
  const full = el.textContent ?? '';
  el.textContent = '';
  el.classList.add('typing');
  let i = 0;
  function step() {
    if (i < full.length) {
      el.textContent += full.charAt(i);
      i++;
      setTimeout(step, TYPE_SPEED);
    } else {
      el.classList.remove('typing');
    }
  }
  step();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export class ChatPanel {
  readonly element: HTMLDivElement;
  private readonly log: HTMLDivElement;
  private readonly badgeCache = new Set<string>();

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'chat-widget-root';
    this.log = document.createElement('div');
    this.log.id = 'log';
    this.element.appendChild(this.log);
  }

  /** `html` must already be safe to insert (escaped text + trusted emote `<img>` tags), see twitchChat.ts's renderMessageHtml. */
  addMessage(id: string, user: string, html: string, color: string, badges: string[] = []) {
    const row = document.createElement('div');
    row.className = 'row';
    row.dataset.from = user;
    row.dataset.id = id;

    const badgesHtml = badges.map((url) => `<img src="${url}" alt="" />`).join('');

    row.innerHTML = `
      <span class="meta">
        <span class="prompt">&gt;</span>
        <span class="badges">${badgesHtml}</span>
        <span class="name" style="color:${color}">${escapeHtml(user)}</span><span class="colon">:</span>
      </span>
      <span class="message">${html}</span>
    `;

    this.log.appendChild(row);
    colorizeName(row);
    const msg = row.querySelector<HTMLElement>('.message');
    if (msg) typeWriter(msg);

    while (this.log.children.length > MAX_ROWS) {
      this.log.removeChild(this.log.firstElementChild as Node);
    }

    for (const url of badges) this.badgeCache.add(url);
  }

  deleteMessage(id: string) {
    const row = this.log.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`);
    row?.classList.add('deleted');
  }

  clearUser(user: string) {
    const rows = this.log.querySelectorAll<HTMLElement>(`[data-from="${CSS.escape(user)}"]`);
    rows.forEach((row) => row.classList.add('deleted'));
  }

  clearAll() {
    this.log.innerHTML = '';
  }
}
