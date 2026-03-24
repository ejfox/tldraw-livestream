// Re-export everything from shared — single source of truth
export {
  type Role,
  ROLE_LEVEL,
  canEdit,
  canModerate,
  isHost,
  type LivestreamUser,
  type ModAction,
  type SpotlightBounds,
  type ChatMessage,
  type SnapshotMeta,
  type ServerMessage,
  type ClientMessage,
  type LivestreamConfigBase,
  DEFAULT_CONFIG_BASE,
} from '@tldraw-livestream/shared';

import type { LivestreamConfigBase } from '@tldraw-livestream/shared';

// --- Server-specific config extensions ---

/** Server middleware configuration */
export interface LivestreamConfig extends LivestreamConfigBase {
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
