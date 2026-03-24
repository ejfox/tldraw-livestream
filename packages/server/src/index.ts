// Middleware
export { LivestreamMiddleware, createLivestreamMiddleware } from './middleware/LivestreamMiddleware';
export type { MiddlewareResult, SnapshotProvider } from './middleware/LivestreamMiddleware';

// Building blocks (for custom implementations)
export { RateLimiter } from './middleware/RateLimiter';
export { RoleStore } from './middleware/RoleStore';
export { BanList } from './middleware/BanList';

// Types
export type {
  Role,
  LivestreamUser,
  LivestreamConfig,
  ModAction,
  SpotlightBounds,
  ChatMessage,
  SnapshotMeta,
} from './types';

export { ROLE_LEVEL, canEdit, canModerate, isHost, DEFAULT_CONFIG } from './types';
