import type { Role, LivestreamConfig, LivestreamUser, ChatMessage, SnapshotMeta } from '../types';
import { canEdit, canModerate, isHost, DEFAULT_CONFIG } from '../types';
import { RateLimiter } from './RateLimiter';
import { RoleStore } from './RoleStore';
import { BanList } from './BanList';

const VALID_ROLES = new Set<string>(['host', 'moderator', 'editor', 'viewer']);
const MAX_ROOMS = 10_000;
const MAX_NAME_LENGTH = 30;

/** Strip HTML tags and control characters from user-provided names */
function sanitizeName(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')         // strip HTML tags
    .replace(/[\x00-\x1f\x7f]/g, '') // strip control chars
    .trim()
    .slice(0, MAX_NAME_LENGTH) || 'Anonymous';
}

/** Validate color is a hex color, fallback to default */
function sanitizeColor(raw: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : '#3b82f6';
}

export interface MiddlewareResult {
  /** Whether to pass the message through to the underlying sync handler */
  allowed: boolean;
  /** Transformed message (if middleware modified it) */
  transformed?: unknown;
  /** Response to send back to the sender only */
  respondToSender?: unknown;
  /** Messages to broadcast to all clients in the room */
  broadcast?: unknown[];
  /** Messages to send to specific clients: [clientId, message][] */
  sendTo?: [string, unknown][];
  /** Client IDs to disconnect */
  disconnect?: string[];
}

export interface SnapshotProvider {
  /** Save a snapshot of the current room state */
  save(roomId: string, triggeredBy: string): SnapshotMeta;
  /** Restore a snapshot — returns the document data to broadcast, or null */
  restore(roomId: string, snapshotId: string): unknown | null;
  /** List available snapshots */
  list(roomId: string): SnapshotMeta[];
}

/**
 * Server-side livestream middleware.
 *
 * Sits between your WebSocket handler and the tldraw sync logic.
 * Intercepts messages, enforces roles, rate limits, freeze, etc.
 *
 * Usage:
 * ```ts
 * const livestream = createLivestreamMiddleware({ hostToken: 'secret123' });
 *
 * // In your WS onMessage handler:
 * const result = livestream.onMessage(roomId, clientId, message);
 * if (!result.allowed) {
 *   if (result.respondToSender) ws.send(JSON.stringify(result.respondToSender));
 *   return; // don't pass to sync
 * }
 * // Broadcast result.broadcast if present
 * // Process result.transformed || message normally
 * ```
 */
export class LivestreamMiddleware {
  private config: Required<Omit<LivestreamConfig, 'onBan' | 'isBanned' | 'hostToken'>> & Pick<LivestreamConfig, 'onBan' | 'isBanned' | 'hostToken'>;
  private rooms: Map<string, {
    roles: RoleStore;
    rateLimiter: RateLimiter;
    chatLimiter: RateLimiter;
    banList: BanList;
    frozen: boolean;
  }> = new Map();

  private _snapshotProvider: SnapshotProvider | null = null;

  /** Set a snapshot provider to enable rollback */
  setSnapshotProvider(provider: SnapshotProvider): void {
    this._snapshotProvider = provider;
  }

  constructor(config?: LivestreamConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getRoom(roomId: string) {
    let room = this.rooms.get(roomId);
    if (!room) {
      if (this.rooms.size >= MAX_ROOMS) return null;
      room = {
        roles: new RoleStore(),
        rateLimiter: new RateLimiter(this.config.rateLimitMax, this.config.rateLimitWindow),
        chatLimiter: new RateLimiter(Math.max(5, Math.floor(this.config.rateLimitMax / 5)), this.config.rateLimitWindow),
        banList: new BanList(this.config.onBan, this.config.isBanned),
        frozen: false,
      };
      this.rooms.set(roomId, room);
    }
    return room;
  }

  /** Call when a client connects */
  onConnect(roomId: string, clientId: string, meta: { name: string; color: string; hostToken?: string; ip?: string }): MiddlewareResult {
    const room = this.getRoom(roomId);
    if (!room) {
      return { allowed: false, respondToSender: { type: 'livestream:kicked', reason: 'Server room limit reached' } };
    }

    // Sanitize inputs (belt-and-suspenders — handleJoin also sanitizes, but onConnect is public API)
    meta.name = sanitizeName(meta.name);
    meta.color = sanitizeColor(meta.color);

    // Check ban
    if (room.banList.isBanned(clientId, meta.ip)) {
      return {
        allowed: false,
        respondToSender: { type: 'livestream:kicked', reason: 'You are banned from this room' },
        disconnect: [clientId],
      };
    }

    // Determine role
    let role: Role = this.config.defaultRole;
    if (this.config.hostToken && meta.hostToken === this.config.hostToken) {
      role = 'host';
    } else if (!room.roles.hasHost()) {
      // First user becomes host if no host token is configured
      if (!this.config.hostToken) {
        role = 'host';
      }
    }

    room.roles.add(clientId, meta.name, meta.color, role);

    const broadcast: unknown[] = [
      { type: 'livestream:users', users: room.roles.getAll() },
    ];

    const sendTo: [string, unknown][] = [
      [clientId, { type: 'livestream:role-assigned', role, userId: clientId }],
    ];

    // Tell new user about frozen state
    if (room.frozen) {
      sendTo.push([clientId, { type: 'livestream:frozen', frozen: true }]);
    }

    return { allowed: true, broadcast, sendTo };
  }

  /** Call when a client disconnects */
  onDisconnect(roomId: string, clientId: string): MiddlewareResult {
    const room = this.rooms.get(roomId);
    if (!room) return { allowed: true };

    room.roles.remove(clientId);
    room.rateLimiter.remove(clientId);

    // Clean up empty rooms
    if (room.roles.count() === 0) {
      this.rooms.delete(roomId);
      return { allowed: true };
    }

    return {
      allowed: true,
      broadcast: [{ type: 'livestream:users', users: room.roles.getAll() }],
    };
  }

  /** Call for every incoming WS message */
  onMessage(roomId: string, clientId: string, message: unknown): MiddlewareResult {
    if (!message || typeof message !== 'object') {
      return { allowed: true };
    }

    const msg = message as Record<string, unknown>;
    const type = msg.type as string;

    // Non-livestream messages: check permissions
    if (!type?.startsWith('livestream:')) {
      return this.handleSyncMessage(roomId, clientId, type, msg);
    }

    // Livestream protocol messages
    switch (type) {
      case 'livestream:join':
        return this.handleJoin(roomId, clientId, msg);
      case 'livestream:mod-action':
        return this.handleModAction(roomId, clientId, msg);
      case 'livestream:set-role':
        return this.handleSetRole(roomId, clientId, msg);
      case 'livestream:spotlight':
        return this.handleSpotlight(roomId, clientId, msg);
      case 'livestream:chat':
        return this.handleChat(roomId, clientId, msg);
      default:
        return { allowed: false };
    }
  }

  private handleSyncMessage(roomId: string, clientId: string, type: string, _msg: Record<string, unknown>): MiddlewareResult {
    const room = this.getRoom(roomId);
    if (!room) return { allowed: false };
    const role = room.roles.getRole(clientId);
    if (!role) return { allowed: false };

    // Allow cursor/selection/ping/pong from everyone
    if (type === 'cursor' || type === 'selection' || type === 'ping' || type === 'pong') {
      return { allowed: true };
    }

    // Update messages (shape changes) need edit permission
    if (type === 'update') {
      if (!canEdit(role)) {
        return { allowed: false };
      }

      // Check freeze
      if (room.frozen && !canModerate(role)) {
        return {
          allowed: false,
          respondToSender: { type: 'livestream:frozen', frozen: true },
        };
      }

      // Rate limit
      if (!room.rateLimiter.check(clientId)) {
        const until = room.rateLimiter.getResetTime(clientId);
        return {
          allowed: false,
          respondToSender: { type: 'livestream:rate-limited', until },
        };
      }

      return { allowed: true };
    }

    // Allow everything else through (init requests, etc.)
    return { allowed: true };
  }

  private handleJoin(roomId: string, clientId: string, msg: Record<string, unknown>): MiddlewareResult {
    const room = this.rooms.get(roomId);
    // Reject re-join if already connected — prevents role re-assertion attacks
    if (room?.roles.get(clientId)) {
      return { allowed: false };
    }
    return this.onConnect(roomId, clientId, {
      name: sanitizeName((msg.name as string) || 'Anonymous'),
      color: sanitizeColor((msg.color as string) || '#3b82f6'),
      hostToken: msg.hostToken as string | undefined,
    });
  }

  private handleModAction(roomId: string, clientId: string, msg: Record<string, unknown>): MiddlewareResult {
    const room = this.getRoom(roomId);
    if (!room) return { allowed: false };
    const role = room.roles.getRole(clientId);
    if (!role || !canModerate(role)) {
      return { allowed: false };
    }

    const action = msg.action as string;
    const target = msg.target as string | undefined;

    switch (action) {
      case 'freeze':
        room.frozen = true;
        return {
          allowed: false, // don't pass to sync
          broadcast: [{ type: 'livestream:frozen', frozen: true }],
        };

      case 'unfreeze':
        room.frozen = false;
        return {
          allowed: false,
          broadcast: [{ type: 'livestream:frozen', frozen: false }],
        };

      case 'kick':
        if (target) {
          const targetRole = room.roles.getRole(target);
          // Can't kick someone of equal or higher role
          if (targetRole && canModerate(targetRole) && !isHost(role)) {
            return { allowed: false };
          }
          room.roles.remove(target);
          return {
            allowed: false,
            sendTo: [[target, { type: 'livestream:kicked', reason: msg.reason }]],
            disconnect: [target],
            broadcast: [{ type: 'livestream:users', users: room.roles.getAll() }],
          };
        }
        return { allowed: false };

      case 'ban':
        if (target) {
          const targetRole = room.roles.getRole(target);
          if (targetRole && canModerate(targetRole) && !isHost(role)) {
            return { allowed: false };
          }
          room.banList.ban(target);
          room.roles.remove(target);
          return {
            allowed: false,
            sendTo: [[target, { type: 'livestream:kicked', reason: 'You have been banned' }]],
            disconnect: [target],
            broadcast: [{ type: 'livestream:users', users: room.roles.getAll() }],
          };
        }
        return { allowed: false };

      case 'snapshot':
        if (this._snapshotProvider) {
          const meta = this._snapshotProvider.save(roomId, clientId);
          return {
            allowed: false,
            broadcast: [{ type: 'livestream:snapshot-created', id: meta.id, timestamp: meta.timestamp }],
          };
        }
        return { allowed: false };

      case 'rollback':
        if (this._snapshotProvider && msg.snapshotId) {
          const data = this._snapshotProvider.restore(roomId, msg.snapshotId as string);
          if (data) {
            return {
              allowed: false,
              broadcast: [{ type: 'full-document', data }],
            };
          }
        }
        return { allowed: false };

      default:
        return { allowed: false };
    }
  }

  private handleSetRole(roomId: string, clientId: string, msg: Record<string, unknown>): MiddlewareResult {
    const room = this.getRoom(roomId);
    if (!room) return { allowed: false };
    const role = room.roles.getRole(clientId);

    // Only host can change roles
    if (!role || !isHost(role)) {
      return { allowed: false };
    }

    const targetId = msg.userId as string;
    const newRole = msg.role as string;

    if (!targetId || !newRole) return { allowed: false };
    if (!VALID_ROLES.has(newRole)) return { allowed: false };

    // Can't make someone else host (for now)
    if (newRole === 'host') return { allowed: false };

    room.roles.setRole(targetId, newRole as Role);

    return {
      allowed: false,
      sendTo: [[targetId, { type: 'livestream:role-assigned', role: newRole as Role, userId: targetId }]],
      broadcast: [{ type: 'livestream:users', users: room.roles.getAll() }],
    };
  }

  private handleSpotlight(roomId: string, clientId: string, msg: Record<string, unknown>): MiddlewareResult {
    const room = this.getRoom(roomId);
    if (!room) return { allowed: false };
    const role = room.roles.getRole(clientId);
    if (!role || !isHost(role)) return { allowed: false };

    return {
      allowed: false,
      broadcast: [{ type: 'livestream:spotlight', bounds: msg.bounds, fromUserId: clientId }],
    };
  }

  private handleChat(roomId: string, clientId: string, msg: Record<string, unknown>): MiddlewareResult {
    const room = this.getRoom(roomId);
    if (!room) return { allowed: false };
    const user = room.roles.get(clientId);
    if (!user) return { allowed: false };

    const text = (msg.text as string || '').trim().slice(0, 500);
    if (!text) return { allowed: false };

    // Separate chat rate limiter so shape edits don't block chat and vice versa
    if (!room.chatLimiter.check(clientId)) {
      return { allowed: false };
    }

    const chatMessage: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: user.id,
      userName: user.name,
      userColor: user.color,
      text,
      timestamp: Date.now(),
    };

    return {
      allowed: false,
      broadcast: [{ type: 'livestream:chat', message: chatMessage }],
    };
  }

  /** Get room state (for debugging / admin endpoints) */
  getRoomState(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return {
      users: room.roles.getAll(),
      frozen: room.frozen,
      userCount: room.roles.count(),
    };
  }
}

/** Factory function */
export function createLivestreamMiddleware(config?: LivestreamConfig): LivestreamMiddleware {
  return new LivestreamMiddleware(config);
}
