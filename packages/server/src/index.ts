// Middleware
export { LivestreamMiddleware, createLivestreamMiddleware } from './middleware/LivestreamMiddleware';
export type { MiddlewareResult, SnapshotProvider } from './middleware/LivestreamMiddleware';

// Building blocks (for custom implementations)
export { RateLimiter } from './middleware/RateLimiter';
export { RoleStore } from './middleware/RoleStore';
export { BanList } from './middleware/BanList';

// Types — server-specific config
export type { LivestreamConfig } from './types';
export { DEFAULT_CONFIG } from './types';

// Types — re-export shared types so consumers don't need to install @tldraw-livestream/shared
export type {
  Role,
  LivestreamUser,
  ModAction,
  SpotlightBounds,
  ChatMessage,
  SnapshotMeta,
  ServerMessage,
  ClientMessage,
  LivestreamConfigBase,
} from '@tldraw-livestream/shared';

export { ROLE_LEVEL, canEdit, canModerate, isHost, DEFAULT_CONFIG_BASE } from '@tldraw-livestream/shared';
