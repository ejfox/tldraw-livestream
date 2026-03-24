/** Re-export shared types for server consumers */

export type Role = 'host' | 'moderator' | 'editor' | 'viewer';

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

export interface LivestreamUser {
  id: string;
  name: string;
  color: string;
  role: Role;
  joinedAt: number;
}

export interface LivestreamConfig {
  /** Default role for new joiners */
  defaultRole?: Role;
  /** Max shape operations per rate limit window */
  rateLimitMax?: number;
  /** Rate limit window in ms */
  rateLimitWindow?: number;
  /** Auto-snapshot interval in ms (0 to disable) */
  snapshotInterval?: number;
  /** Max snapshots to keep */
  maxSnapshots?: number;
  /** Secret token that grants host role */
  hostToken?: string;
  /** Called when a user is banned — persist however you like */
  onBan?: (userId: string, ip?: string) => void;
  /** Called to check if a user/IP is banned */
  isBanned?: (userId: string, ip?: string) => boolean;
}

export const DEFAULT_CONFIG: Required<Omit<LivestreamConfig, 'onBan' | 'isBanned' | 'hostToken'>> & Pick<LivestreamConfig, 'onBan' | 'isBanned' | 'hostToken'> = {
  defaultRole: 'editor',
  rateLimitMax: 50,
  rateLimitWindow: 10_000,
  snapshotInterval: 60_000,
  maxSnapshots: 20,
  hostToken: undefined,
  onBan: undefined,
  isBanned: undefined,
};

export type ModAction = 'kick' | 'ban' | 'freeze' | 'unfreeze' | 'rollback' | 'undo-user' | 'snapshot';

export interface SpotlightBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
}

export interface SnapshotMeta {
  id: string;
  timestamp: number;
  userCount: number;
  shapeCount: number;
  triggeredBy: string;
}
