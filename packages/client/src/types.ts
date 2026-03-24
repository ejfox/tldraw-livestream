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

// --- Client-specific config extensions ---

/** Client plugin configuration */
export interface LivestreamConfig extends LivestreamConfigBase {
  /** Enable chat overlay */
  enableChat?: boolean;
  /** Enable spotlight feature for host */
  enableSpotlight?: boolean;
}

export const DEFAULT_CONFIG: Required<LivestreamConfig> = {
  defaultRole: 'editor',
  rateLimitMax: 50,
  rateLimitWindow: 10_000,
  snapshotInterval: 60_000,
  maxSnapshots: 20,
  enableChat: true,
  enableSpotlight: true,
};
