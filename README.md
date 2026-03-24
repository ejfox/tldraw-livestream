# tldraw-livestream

A plugin for [tldraw](https://tldraw.dev) that adds collaborative livestream canvas features with moderation — let your audience draw together with you.

## Features

- **Easy join** — viewers get a link, pick a name and color, start drawing
- **Role-based permissions** — Host, Moderator, Editor, Viewer
- **Canvas freeze** — instantly lock editing for non-moderators
- **Kick/ban** — remove disruptive users
- **Rate limiting** — prevent shape spam (server-authoritative)
- **Snapshots & rollback** — save/restore canvas state
- **Spotlight** — host can highlight areas for viewers to see
- **Chat overlay** — built-in chat on the canvas
- **Spectator bar** — live viewer count, role badges, user avatars

## Architecture

Two packages that work together:

| Package | Purpose |
|---------|---------|
| `@tldraw-livestream/client` | React components + tldraw hooks for the frontend |
| `@tldraw-livestream/server` | WebSocket middleware for server-authoritative moderation |

The **client** provides UX and optimistic enforcement (disables tools for viewers, shows overlays). The **server** is the authoritative enforcer — a malicious client can't bypass role checks.

## Quick Start

### Install

```bash
npm install @tldraw-livestream/client @tldraw-livestream/server
```

### Client Setup

Wrap your `<Tldraw>` component:

```tsx
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
    <LivestreamPlugin ws={ws} userId={userId}>
      <Tldraw
        components={livestreamComponents}
        overrides={[livestreamOverrides]}
        onMount={(editor) => {
          // Role enforcement and rate limiting are handled by hooks
          // inside LivestreamPlugin context
        }}
      />
    </LivestreamPlugin>
  );
}

// Inside your tldraw onMount or a component inside <Tldraw>:
function LivestreamEnforcement() {
  useRoleEnforcement(); // enforces readonly for viewers, freeze, etc.
  useRateLimiter();     // client-side rate limit warnings
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
});
// Send connectResult.sendTo messages, broadcast connectResult.broadcast

// When a message arrives:
const result = livestream.onMessage(roomId, clientId, parsedMessage);

if (!result.allowed) {
  // Send result.respondToSender back to the client
  // Broadcast result.broadcast to all room clients
  // Disconnect result.disconnect clients
  return; // don't pass to your sync handler
}

// Process result.transformed || parsedMessage through your normal sync
// Also handle result.broadcast / result.sendTo if present

// When a client disconnects:
const disconnectResult = livestream.onDisconnect(roomId, clientId);
// Broadcast disconnectResult.broadcast
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
  SpectatorBar,    // Viewer count, role badge, avatars
  ModToolbar,      // Host/mod panel: freeze, kick, snapshots
  ChatOverlay,     // Chat panel
  FreezeOverlay,   // "Canvas frozen" banner
  SpotlightOverlay,// Host highlight rectangle
  NamePicker,      // Pre-join name/color picker
} from '@tldraw-livestream/client';
```

Or use the pre-composed `livestreamComponents` which maps them to tldraw's `TopPanel`, `InFrontOfTheCanvas`, and `SharePanel` slots.

## Protocol

The plugin extends whatever WebSocket protocol you use with `livestream:*` message types. See [types.ts](packages/client/src/types.ts) for the full protocol definition.

## Configuration

```ts
interface LivestreamConfig {
  defaultRole?: Role;          // Default: 'editor'
  rateLimitMax?: number;       // Default: 50
  rateLimitWindow?: number;    // Default: 10000 (ms)
  enableChat?: boolean;        // Default: true
  enableSpotlight?: boolean;   // Default: true
  snapshotInterval?: number;   // Default: 60000 (ms, 0 to disable)
  maxSnapshots?: number;       // Default: 20
  hostToken?: string;          // Server only — secret for host auth
}
```

## License

MIT
