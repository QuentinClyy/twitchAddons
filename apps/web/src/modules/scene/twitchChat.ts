import { resolveBadges } from './twitchBadges';

export interface TwitchChatMessage {
  id: string;
  from: string;
  color: string;
  messageText: string;
  messageHtml: string;
  badges: string[];
}

export interface TwitchChatListener {
  onMessage(message: TwitchChatMessage): void;
  onDeleteMessage(messageId: string): void;
  onClearUser(username: string): void;
  onClearAll(): void;
}

export interface TwitchChatHandle {
  disconnect(): void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMessageHtml(text: string, emotesTag: string | undefined): string {
  if (!emotesTag) return escapeHtml(text);

  const ranges: Array<{ start: number; end: number; id: string }> = [];
  for (const part of emotesTag.split('/')) {
    const [id, positions] = part.split(':');
    if (!id || !positions) continue;
    for (const range of positions.split(',')) {
      const [start, end] = range.split('-').map(Number);
      if (Number.isFinite(start) && Number.isFinite(end)) ranges.push({ start, end, id });
    }
  }
  ranges.sort((a, b) => a.start - b.start);

  let html = '';
  let cursor = 0;
  for (const { start, end, id } of ranges) {
    if (start < cursor || start > text.length) continue;
    html += escapeHtml(text.slice(cursor, start));
    html += `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0" alt="" />`;
    cursor = end + 1;
  }
  html += escapeHtml(text.slice(cursor));
  return html;
}

function parseTags(raw: string): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const pair of raw.slice(1).split(';')) {
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    tags[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return tags;
}

const PRIVMSG_RE = /^:(\w+)!\S+ PRIVMSG #\w+ :(.*)$/;
const CLEARCHAT_RE = /^:\S+ CLEARCHAT #\w+(?: :(\w+))?$/;

export function connectTwitchChat(channel: string, listener: TwitchChatListener): TwitchChatHandle {
  let socket: WebSocket | null = null;
  let closedByCaller = false;
  let reconnectDelayMs = 1000;
  let reconnectTimer = 0;

  function handleLine(line: string) {
    let tags: Record<string, string> = {};
    let rest = line;
    if (line.startsWith('@')) {
      const spaceIndex = line.indexOf(' ');
      tags = parseTags(line.slice(0, spaceIndex));
      rest = line.slice(spaceIndex + 1);
    }

    if (rest.startsWith('PING')) {
      socket?.send('PONG :tmi.twitch.tv');
      return;
    }

    const privmsg = rest.match(PRIVMSG_RE);
    if (privmsg) {
      const [, fallbackNick, text] = privmsg;
      resolveBadges(tags.badges, tags['room-id']).then((badges) => {
        listener.onMessage({
          id: tags.id || `${Date.now()}-${Math.random()}`,
          from: tags['display-name'] || fallbackNick,
          color: tags.color || '',
          messageText: text,
          messageHtml: renderMessageHtml(text, tags.emotes),
          badges,
        });
      });
      return;
    }

    if (rest.includes('CLEARMSG')) {
      if (tags['target-msg-id']) listener.onDeleteMessage(tags['target-msg-id']);
      return;
    }

    if (rest.includes('CLEARCHAT')) {
      const match = rest.match(CLEARCHAT_RE);
      if (match?.[1]) listener.onClearUser(match[1]);
      else listener.onClearAll();
    }
  }

  function open() {
    socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
    socket.onopen = () => {
      reconnectDelayMs = 1000;
      const anonNick = `justinfan${Math.floor(10000 + Math.random() * 90000)}`;
      socket!.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      socket!.send('PASS SCHMOOPIIE');
      socket!.send(`NICK ${anonNick}`);
      socket!.send(`JOIN #${channel.toLowerCase()}`);
    };
    socket.onmessage = (event) => {
      for (const line of String(event.data).split('\r\n')) {
        if (line) handleLine(line);
      }
    };
    socket.onclose = () => {
      if (closedByCaller) return;
      reconnectTimer = window.setTimeout(open, reconnectDelayMs);
      reconnectDelayMs = Math.min(reconnectDelayMs * 2, 30000);
    };
    socket.onerror = () => socket?.close();
  }

  open();

  return {
    disconnect() {
      closedByCaller = true;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    },
  };
}
