import React from 'react';
import { useLivestreamState } from '../plugin/useLivestreamContext';
import { canModerate } from '../types';

/**
 * Full-canvas freeze overlay.
 *
 * When the host freezes the canvas, non-moderators see a frosted-glass
 * effect with a scan line animation — makes it obvious on stream that
 * the canvas is locked, without obscuring the artwork.
 */
export function FreezeOverlay() {
  const { frozen, role } = useLivestreamState();

  if (!frozen) return null;

  const isMod = canModerate(role);

  return (
    <>
      <style>{`
        @keyframes ls-scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes ls-border-pulse {
          0%, 100% { border-color: rgba(59, 130, 246, 0.2); }
          50% { border-color: rgba(59, 130, 246, 0.6); }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 999,
          border: isMod ? '2px solid rgba(59, 130, 246, 0.3)' : '3px solid rgba(59, 130, 246, 0.4)',
          animation: 'ls-border-pulse 2s ease-in-out infinite',
          borderRadius: '0',
          overflow: 'hidden',
        }}
      >
        {/* Scan line — subtle for mods, prominent for others */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, transparent, rgba(59, 130, 246, ${isMod ? 0.15 : 0.4}), transparent)`,
            animation: 'ls-scanline 4s linear infinite',
          }}
        />

        {/* Bottom banner */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            borderRadius: '20px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '13px',
            fontWeight: 600,
            color: '#93c5fd',
            letterSpacing: '0.3px',
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path
              d="M4 7V5a4 4 0 118 0v2m-9 0h10a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z"
              stroke="#93c5fd"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isMod ? 'Canvas frozen — you can still edit' : 'Canvas frozen by host'}
        </div>
      </div>
    </>
  );
}
