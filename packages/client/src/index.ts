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
export { StreamOverlay } from './components/StreamOverlay';

// tldraw overrides (compose with your own)
export { livestreamComponents } from './overrides/livestreamComponents';
export { livestreamOverrides } from './overrides/livestreamActions';

// Snapshot manager
export { SnapshotManager } from './snapshots/SnapshotManager';

// Types — client-specific config
export type { LivestreamConfig } from './types';
export { DEFAULT_CONFIG } from './types';

// Types — re-export shared types so consumers don't need to install @tldraw-livestream/shared
export type {
  Role,
  LivestreamUser,
  ServerMessage,
  ClientMessage,
  ModAction,
  SpotlightBounds,
  ChatMessage,
  SnapshotMeta,
  LivestreamConfigBase,
} from '@tldraw-livestream/shared';

export { ROLE_LEVEL, canEdit, canModerate, isHost, DEFAULT_CONFIG_BASE } from '@tldraw-livestream/shared';
