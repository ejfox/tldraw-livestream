/** Roles in a livestream room, ordered by privilege level */
export type Role = 'host' | 'moderator' | 'editor' | 'viewer';

/** Privilege checks */
export const ROLE_LEVEL: Record<Role, number> = {
  host: 3,
  moderator: 2,
  editor: 1,
  viewer: 0,
};

export function canEdit(role: Role): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL.editor;
}

export function canModerate(role: Role): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL.moderator;
}

export function isHost(role: Role): boolean {
  return role === 'host';
}

/** Connected user metadata */
export interface LivestreamUser {
  id: string;
  name: string;
  color: string;
  role: Role;
  joinedAt: number;
}

/** Moderation actions available to hosts/mods */
export type ModAction = 'kick' | 'ban' | 'freeze' | 'unfreeze' | 'rollback' | 'undo-user' | 'snapshot';

/** Spotlight highlight bounds */
export interface SpotlightBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Chat message */
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
}

/** Snapshot metadata */
export interface SnapshotMeta {
  id: string;
  timestamp: number;
  userCount: number;
  shapeCount: number;
  triggeredBy: string; // userId or 'auto'
}

// --- WebSocket Protocol Extension ---

/** Messages the server sends to clients */
export type ServerMessage =
  | { type: 'livestream:role-assigned'; role: Role; userId: string }
  | { type: 'livestream:frozen'; frozen: boolean }
  | { type: 'livestream:kicked'; reason?: string }
  | { type: 'livestream:rate-limited'; until: number }
  | { type: 'livestream:users'; users: LivestreamUser[] }
  | { type: 'livestream:spotlight'; bounds: SpotlightBounds | null; fromUserId: string }
  | { type: 'livestream:snapshot-created'; id: string; timestamp: number }
  | { type: 'livestream:chat'; message: ChatMessage };

/** Messages clients send to the server */
export type ClientMessage =
  | { type: 'livestream:join'; name: string; color: string; hostToken?: string }
  | { type: 'livestream:mod-action'; action: ModAction; target?: string; snapshotId?: string; reason?: string }
  | { type: 'livestream:set-role'; userId: string; role: Role }
  | { type: 'livestream:spotlight'; bounds: SpotlightBounds | null }
  | { type: 'livestream:chat'; text: string };

// --- Configuration ---

/** Base config shared between client and server */
export interface LivestreamConfigBase {
  /** Default role for new users joining the room */
  defaultRole?: Role;
  /** Max shape operations per rate limit window */
  rateLimitMax?: number;
  /** Rate limit window in milliseconds */
  rateLimitWindow?: number;
  /** Auto-snapshot interval in ms (0 to disable) */
  snapshotInterval?: number;
  /** Max snapshots to keep */
  maxSnapshots?: number;
}

export const DEFAULT_CONFIG_BASE: Required<LivestreamConfigBase> = {
  defaultRole: 'editor',
  rateLimitMax: 50,
  rateLimitWindow: 10_000,
  snapshotInterval: 60_000,
  maxSnapshots: 20,
};
