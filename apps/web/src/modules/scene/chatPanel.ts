import * as THREE from 'three';

export interface ChatMessage {
  user: string;
  text: string;
}

const NAME_PALETTE = ['#ff5c8a', '#5cc9ff', '#9dff5c', '#ffb85c', '#c05cff', '#5cffd6', '#ff8f5c'];

function nameColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return NAME_PALETTE[Math.abs(hash) % NAME_PALETTE.length];
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

interface BuiltBubble {
  message: ChatMessage;
  lines: string[];
  height: number;
  top: number;
}

/** Renders the in-screen Twitch-style chat onto a canvas used as the curved screen's texture. */
export class ChatPanel {
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  messages: ChatMessage[] = [];
  draft = '';
  cursorOn = true;

  private readonly ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1200;
    this.canvas.height = 860;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D canvas context not available');
    }
    this.ctx = ctx;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.draw();
  }

  addMessage(user: string, text: string) {
    this.messages.push({ user, text });
    if (this.messages.length > 40) this.messages.shift();
    this.draw();
  }

  setDraft(text: string) {
    this.draft = text;
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
    ctx.fillText('# mossy-woods chat', 22, 42);
    ctx.fillStyle = '#4dff9e';
    ctx.beginPath();
    ctx.arc(w - 40, 32, 8, 0, Math.PI * 2);
    ctx.fill();

    const inputTop = h - 76;
    const pad = 20;
    const maxBubbleWidth = w - pad * 2 - 40;
    ctx.font = '22px "Courier New", monospace';

    const recent = this.messages.slice(-14);
    const built: BuiltBubble[] = [];
    for (const message of recent) {
      ctx.font = '22px "Courier New", monospace';
      const lines = this.wrapText(message.text, maxBubbleWidth - 20);
      const height = 34 + lines.length * 30 + 16;
      built.push({ message, lines, height, top: 0 });
    }

    // measure bottom-up so the newest message anchors just above the input bar
    let y = inputTop - 14;
    const positioned: BuiltBubble[] = [];
    for (let i = built.length - 1; i >= 0 && y > 74; i--) {
      const bubble = built[i];
      y -= bubble.height;
      positioned.unshift({ ...bubble, top: y });
      y -= 12;
    }

    for (const bubble of positioned) {
      ctx.fillStyle = 'rgba(255,255,255,0.055)';
      roundRect(ctx, pad, bubble.top, w - pad * 2, bubble.height, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(140,255,190,0.14)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, pad, bubble.top, w - pad * 2, bubble.height, 14);
      ctx.stroke();

      ctx.font = '700 22px "Courier New", monospace';
      ctx.fillStyle = nameColor(bubble.message.user);
      ctx.fillText(bubble.message.user, pad + 18, bubble.top + 30);

      ctx.font = '22px "Courier New", monospace';
      ctx.fillStyle = '#f0fff6';
      let lineY = bubble.top + 30 + 30;
      for (const line of bubble.lines) {
        ctx.fillText(line, pad + 18, lineY);
        lineY += 30;
      }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, pad, inputTop, w - pad * 2, 56, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,255,190,0.4)';
    ctx.lineWidth = 2;
    roundRect(ctx, pad, inputTop, w - pad * 2, 56, 16);
    ctx.stroke();

    ctx.font = '24px "Courier New", monospace';
    ctx.fillStyle = '#f0fff6';
    ctx.fillText(this.draft, pad + 20, inputTop + 36);
    if (!this.draft.length) {
      ctx.fillStyle = 'rgba(210,255,225,0.45)';
      ctx.fillText('Send a message', pad + 20, inputTop + 36);
    }
    if (this.cursorOn && this.draft.length) {
      const cursorWidth = ctx.measureText(this.draft).width;
      ctx.fillStyle = '#9dffce';
      ctx.fillRect(pad + 20 + cursorWidth + 3, inputTop + 14, 3, 28);
    }

    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#000000';
    for (let sy = 0; sy < h; sy += 4) ctx.fillRect(0, sy, w, 1.5);
    ctx.globalAlpha = 1;

    this.texture.needsUpdate = true;
  }
}
