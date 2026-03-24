// Plugin core
export { LivestreamPlugin } from './plugin/LivestreamPlugin';
export { useLivestream, useLivestreamState, useLivestreamActions, LivestreamContext } from './plugin/useLivestreamContext';

// Moderation hooks
export { useRoleEnforcement } from './moderation/useRoleEnforcement';
export { useRateLimiter } from './moderation/useRateLimiter';

// Components (individually importable for custom layouts)
export { SpectatorBar } from './components/SpectatorBar';
export { FreezeOverlay } from './components/FreezeOverlay';
export { NamePicker } from './components/NamePicker';
export { ModToolbar } from './components/ModToolbar';
export { ChatOverlay } from './components/ChatOverlay';
export { SpotlightOverlay } from './components/SpotlightOverlay';

// tldraw overrides (compose with your own)
export { livestreamComponents } from './overrides/livestreamComponents';
export { livestreamOverrides } from './overrides/livestreamActions';

// Snapshot manager
export { SnapshotManager } from './snapshots/SnapshotManager';

// Types
export type {
  Role,
  LivestreamUser,
  LivestreamConfig,
  ServerMessage,
  ClientMessage,
  ModAction,
  SpotlightBounds,
  ChatMessage,
  SnapshotMeta,
} from './types';

export { ROLE_LEVEL, canEdit, canModerate, isHost, DEFAULT_CONFIG } from './types';
