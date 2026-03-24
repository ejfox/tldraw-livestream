import { createContext, useContext } from 'react';
import type { Role, LivestreamUser, LivestreamConfig, ChatMessage, SnapshotMeta, SpotlightBounds } from '../types';

export interface LivestreamState {
  /** Current user's ID */
  userId: string;
  /** Current user's role */
  role: Role;
  /** All connected users */
  users: LivestreamUser[];
  /** Whether the canvas is frozen */
  frozen: boolean;
  /** Active spotlight bounds (null if none) */
  spotlight: SpotlightBounds | null;
  /** Chat messages */
  chatMessages: ChatMessage[];
  /** Available snapshots for rollback */
  snapshots: SnapshotMeta[];
  /** Plugin config */
  config: Required<LivestreamConfig>;
  /** Whether currently rate-limited */
  rateLimited: boolean;
}

export interface LivestreamActions {
  /** Send a mod action (host/mod only) */
  modAction: (action: string, target?: string, snapshotId?: string, reason?: string) => void;
  /** Change a user's role (host only) */
  setRole: (userId: string, role: Role) => void;
  /** Set spotlight bounds (host only) */
  setSpotlight: (bounds: SpotlightBounds | null) => void;
  /** Send a chat message */
  sendChat: (text: string) => void;
}

export interface LivestreamContextValue {
  state: LivestreamState;
  actions: LivestreamActions;
}

export const LivestreamContext = createContext<LivestreamContextValue | null>(null);

export function useLivestream(): LivestreamContextValue {
  const ctx = useContext(LivestreamContext);
  if (!ctx) {
    throw new Error('useLivestream must be used within a <LivestreamPlugin>');
  }
  return ctx;
}

export function useLivestreamState(): LivestreamState {
  return useLivestream().state;
}

export function useLivestreamActions(): LivestreamActions {
  return useLivestream().actions;
}
