import React from 'react';
import type { TLComponents } from 'tldraw';
import { SpectatorBar } from '../components/SpectatorBar';
import { FreezeOverlay } from '../components/FreezeOverlay';
import { SpotlightOverlay } from '../components/SpotlightOverlay';
import { ModToolbar } from '../components/ModToolbar';
import { ChatOverlay } from '../components/ChatOverlay';

/**
 * tldraw TLComponents overrides that inject livestream UI.
 *
 * Usage:
 * ```tsx
 * <Tldraw components={{ ...yourComponents, ...livestreamComponents }} />
 * ```
 *
 * These use tldraw's built-in component slots:
 * - TopPanel: SpectatorBar (viewer count, role badge, frozen indicator)
 * - InFrontOfTheCanvas: FreezeOverlay + SpotlightOverlay
 * - SharePanel: ModToolbar + ChatOverlay
 */
export const livestreamComponents: Partial<TLComponents> = {
  TopPanel: () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
      <SpectatorBar />
    </div>
  ),

  InFrontOfTheCanvas: () => (
    <>
      <FreezeOverlay />
      <SpotlightOverlay />
    </>
  ),

  SharePanel: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
        alignItems: 'flex-end',
      }}
    >
      <ModToolbar />
      <ChatOverlay />
    </div>
  ),
};
