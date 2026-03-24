# tldraw-livestream

A plugin for [tldraw](https://tldraw.dev) that adds collaborative livestream canvas features with moderation — let your audience draw together with you.

## Features

- **Easy join** — viewers get a link, pick a name and color, start drawing
- **Role-based permissions** — Host, Moderator, Editor, Viewer
- **Canvas freeze** — instantly lock editing for non-moderators
- **Kick/ban** — remove disruptive users
- **Rate limiting** — prevent shape spam (server-authoritative, separate limits for shapes and chat)
- **Snapshots & rollback** — save/restore canvas state
- **Spotlight** — host can highlight areas for viewers to see
- **Chat overlay** — built-in chat on the canvas
- **Spectator bar** — live viewer count, role badges, user avatars
- **OBS stream overlay** — standalone transparent overlay component for OBS browser source

## Architecture

Three packages in a monorepo:

| Package | Purpose |
|---------|---------|
| `@tldraw-livestream/shared` | Shared types, role utilities, and WS protocol definitions |
| `@tldraw-livestream/client` | React components + tldraw hooks for the frontend |
| `@tldraw-livestream/server` | WebSocket middleware for server-authoritative moderation |

The **client** provides UX and optimistic enforcement (disables tools for viewers, shows overlays). The **server** is the authoritative enforcer — a malicious client can't bypass role checks. Both import types from **shared** so protocol definitions are always in sync.

## Quick Start

### Install

```bash
npm install @tldraw-livestream/client @tldraw-livestream/server
```

### Client Setup

The plugin has two layers:

1. `<LivestreamPlugin>` — wraps your app, provides context and handles WS messages
2. `useRoleEnforcement()` / `useRateLimiter()` — must be called **inside** the `<Tldraw>` component tree (they need `useEditor()`)

```tsx
import { useState } from 'react';
import { Tldraw } from 'tldraw';
import {
  LivestreamPlugin,
  livestreamComponents,
  livestreamOverrides,
  useRoleEnforcement,
  useRateLimiter,
  NamePicker,
} from '@tldraw-livestream/client';

function App() {
  const [joined, setJoined] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [userId] = useState(() => crypto.randomUUID());

  const handleJoin = (name: string, color: string) => {
    const socket = new WebSocket(`wss://your-server.com/ws/my-room?name=${name}`);
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'livestream:join', name, color }));
      setWs(socket);
      setJoined(true);
    };
  };

  if (!joined) return <NamePicker onJoin={handleJoin} roomName="My Livestream" />;

  return (
    <LivestreamPlugin ws={ws} userId={userId} onKicked={() => setJoined(false)}>
      <Tldraw
        components={livestreamComponents}
        overrides={[livestreamOverrides]}
      >
        {/* This component MUST be a child of <Tldraw> — it calls useEditor() */}
        <LivestreamEnforcement />
      </Tldraw>
    </LivestreamPlugin>
  );
}

/**
 * Mounts inside <Tldraw> to enforce roles on the editor instance.
 * Without this, role checks only happen server-side (which is still safe,
 * but the client UX won't reflect the restrictions).
 */
function LivestreamEnforcement() {
  useRoleEnforcement(); // sets readonly for viewers, blocks edits when frozen
  useRateLimiter();     // warns when approaching server-side rate limit
  return null;
}
```

### Server Setup

Wrap your WebSocket message handler:

```ts
import { createLivestreamMiddleware } from '@tldraw-livestream/server';

const livestream = createLivestreamMiddleware({
  defaultRole: 'editor',       // new users can draw by default
  hostToken: 'my-secret-123',  // pass this token to become host
  rateLimitMax: 50,             // max 50 shape ops per 10 seconds
  rateLimitWindow: 10_000,
});

// When a client connects:
const connectResult = livestream.onConnect(roomId, clientId, {
  name: userName,
  color: userColor,
  hostToken: queryParams.hostToken,
  ip: request.ip, // optional, used for IP bans
});
// Send connectResult.sendTo messages, broadcast connectResult.broadcast

// When a message arrives:
const result = livestream.onMessage(roomId, clientId, parsedMessage);

if (!result.allowed) {
  // Send result.respondToSender back to the client if present
  // Broadcast result.broadcast to all room clients if present
  // Disconnect result.disconnect clients if present
  return; // don't pass to your sync handler
}

// Process result.transformed || parsedMessage through your normal sync
// Also handle result.broadcast / result.sendTo if present

// When a client disconnects:
const disconnectResult = livestream.onDisconnect(roomId, clientId);
// Broadcast disconnectResult.broadcast
```

### OBS Stream Overlay

For streamers, `StreamOverlay` is designed as a standalone OBS browser source. It renders on a transparent background with just the LIVE badge, viewer count, and join/leave toasts:

```tsx
import { LivestreamPlugin, StreamOverlay } from '@tldraw-livestream/client';

// Mount this on a separate route (e.g., /stream-overlay) and add as OBS browser source
function StreamOverlayPage() {
  return (
    <LivestreamPlugin ws={ws} userId="overlay">
      <StreamOverlay position="top-right" showActivity showJoinLeave />
    </LivestreamPlugin>
  );
}
```

## Roles

| Role | Can draw | Can moderate | Can change roles |
|------|----------|-------------|-----------------|
| **Host** | Yes | Yes | Yes |
| **Moderator** | Yes | Yes (can't kick mods) | No |
| **Editor** | Yes | No | No |
| **Viewer** | No (readonly) | No | No |

The first user to connect with the correct `hostToken` becomes host. If no `hostToken` is configured, the first user is automatically host.

## Components

All components are individually importable for custom layouts:

```tsx
import {
  SpectatorBar,     // Viewer count, role badge, avatars, join toasts
  ModToolbar,       // Host/mod panel: freeze, kick, snapshots, role management
  ChatOverlay,      // Chat panel with slide-in messages
  FreezeOverlay,    // Scan line + "canvas frozen" banner
  SpotlightOverlay, // Host highlight rectangle
  NamePicker,       // Pre-join lobby: name + color picker
  StreamOverlay,    // OBS-ready transparent overlay (LIVE badge + count)
} from '@tldraw-livestream/client';
```

Or use the pre-composed `livestreamComponents` which maps them to tldraw's `TopPanel`, `InFrontOfTheCanvas`, and `SharePanel` slots.

## Keyboard Shortcuts

| Shortcut | Action | Requires |
|----------|--------|----------|
| `Ctrl+Shift+F` | Toggle canvas freeze | Host or Moderator |
| `Ctrl+Shift+S` | Save snapshot | Host or Moderator |

## Protocol

The plugin extends whatever WebSocket protocol you use with `livestream:*` message types. See [shared/src/index.ts](packages/shared/src/index.ts) for the full protocol definition.

## Configuration

Client and server have separate config interfaces that share a common base:

```ts
// Client config (@tldraw-livestream/client)
interface LivestreamConfig {
  defaultRole?: Role;          // Default: 'editor'
  rateLimitMax?: number;       // Default: 50
  rateLimitWindow?: number;    // Default: 10000 (ms)
  snapshotInterval?: number;   // Default: 60000 (ms, 0 to disable)
  maxSnapshots?: number;       // Default: 20
  enableChat?: boolean;        // Default: true (client only)
  enableSpotlight?: boolean;   // Default: true (client only)
}

// Server config (@tldraw-livestream/server)
interface LivestreamConfig {
  defaultRole?: Role;          // Default: 'editor'
  rateLimitMax?: number;       // Default: 50
  rateLimitWindow?: number;    // Default: 10000 (ms)
  snapshotInterval?: number;   // Default: 60000 (ms, 0 to disable)
  maxSnapshots?: number;       // Default: 20
  hostToken?: string;          // Secret for host authentication (server only)
  onBan?: (userId, ip?) => void;   // Ban persistence callback (server only)
  isBanned?: (userId, ip?) => boolean; // Ban check callback (server only)
}
```

## Security

- **Server-authoritative**: All role checks, rate limiting, and freeze enforcement happen server-side. Client enforcement is UX sugar.
- **Input sanitization**: Names are stripped of HTML tags and control characters. Colors are validated as hex format. Role values are validated against an enum.
- **Rate limiting**: Shape edits and chat messages have separate rate limit pools so chat spam can't block drawing.
- **Timing-safe token comparison**: `hostToken` is compared using constant-time comparison to prevent timing attacks.
- **Room limits**: Server caps at 10,000 concurrent rooms to prevent memory exhaustion.
- **Re-join protection**: Already-connected clients can't re-send `livestream:join` to re-assert a host role.

## Known Limitations

- **Bans are in-memory by default.** They don't survive server restarts and are scoped per room instance. Use the `onBan`/`isBanned` callbacks to persist bans to your own storage (database, Redis, etc.).
- **No per-room config.** All rooms share the same middleware config. If you need different rate limits per room, create multiple middleware instances.

## License

MIT
