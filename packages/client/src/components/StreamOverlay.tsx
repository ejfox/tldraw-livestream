import React, { useEffect, useState } from 'react';
import { useLivestreamState } from '../plugin/useLivestreamContext';
import { ROLE_LEVEL } from '../types';

/**
 * OBS-optimized stream overlay.
 *
 * This is meant to be rendered as a standalone OBS browser source
 * OVER a window/display capture of the tldraw canvas. It only shows:
 * - LIVE badge + viewer count (top-left or top-right)
 * - User join/leave toasts
 * - Activity pulse (shows when edits are happening)
 * - Freeze indicator
 *
 * All on a transparent background so OBS can composite it cleanly.
 *
 * Usage:
 * ```tsx
 * // In a separate route/page loaded as OBS browser source:
 * <LivestreamPlugin ws={ws} userId={userId}>
 *   <StreamOverlay position="top-right" showActivity />
 * </LivestreamPlugin>
 * ```
 */

interface StreamOverlayProps {
  /** Position of the overlay elements */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Show activity pulse when edits are happening */
  showActivity?: boolean;
  /** Show join/leave notifications */
  showJoinLeave?: boolean;
  /** Custom CSS class for the container */
  className?: string;
}

export function StreamOverlay({
  position = 'top-right',
  showActivity = true,
  showJoinLeave = true,
  className,
}: StreamOverlayProps) {
  const { users, frozen, role } = useLivestreamState();
  const [recentEvents, setRecentEvents] = useState<Array<{ id: string; text: string; color: string }>>([]);
  const [prevUserIds, setPrevUserIds] = useState<Set<string>>(new Set());

  // Track joins and leaves
  useEffect(() => {
    if (!showJoinLeave) return;

    const currentIds = new Set(users.map((u) => u.id));

    // Detect joins
    for (const user of users) {
      if (!prevUserIds.has(user.id)) {
        const event = {
          id: `join-${user.id}-${Date.now()}`,
          text: `${user.name} joined`,
          color: user.color,
        };
        setRecentEvents((prev) => [...prev.slice(-4), event]);
        setTimeout(() => {
          setRecentEvents((prev) => prev.filter((e) => e.id !== event.id));
        }, 3000);
      }
    }

    // Detect leaves
    for (const prevId of prevUserIds) {
      if (!currentIds.has(prevId)) {
        const event = {
          id: `leave-${prevId}-${Date.now()}`,
          text: 'someone left',
          color: '#6b7280',
        };
        setRecentEvents((prev) => [...prev.slice(-4), event]);
        setTimeout(() => {
          setRecentEvents((prev) => prev.filter((e) => e.id !== event.id));
        }, 3000);
      }
    }

    setPrevUserIds(currentIds);
  }, [users, showJoinLeave]); // eslint-disable-line react-hooks/exhaustive-deps

  const isRight = position.includes('right');
  const isBottom = position.includes('bottom');

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    [isBottom ? 'bottom' : 'top']: '20px',
    [isRight ? 'right' : 'left']: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: isRight ? 'flex-end' : 'flex-start',
    gap: '8px',
    fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
    zIndex: 9999,
    pointerEvents: 'none',
  };

  return (
    <>
      <style>{`
        @keyframes lso-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes lso-glow { 0%,100% { box-shadow: 0 0 6px rgba(239,68,68,0.4); } 50% { box-shadow: 0 0 18px rgba(239,68,68,0.6); } }
        @keyframes lso-slide-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lso-slide-out { from { opacity: 1; } to { opacity: 0; transform: translateY(-4px); } }
      `}</style>

      <div style={containerStyle} className={className}>
        {/* LIVE + count badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px 6px 8px',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            borderRadius: '20px',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.06)',
            animation: 'lso-glow 3s ease-in-out infinite',
          }}
        >
          {/* LIVE pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px 2px 6px',
              background: '#dc2626',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '1px',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#fff',
                animation: 'lso-pulse 1.5s ease-in-out infinite',
              }}
            />
            LIVE
          </div>

          {/* Count */}
          <span style={{ fontSize: '14px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {users.length}
          </span>

          {/* Frozen */}
          {frozen && (
            <div
              style={{
                padding: '1px 6px',
                background: '#2563eb',
                borderRadius: '8px',
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.8px',
              }}
            >
              FROZEN
            </div>
          )}
        </div>

        {/* Activity avatars — show the most recent active users */}
        {showActivity && users.length > 0 && (
          <div style={{ display: 'flex', gap: '0px' }}>
            {[...users]
              .sort((a, b) => ROLE_LEVEL[b.role] - ROLE_LEVEL[a.role])
              .slice(0, 6)
              .map((u, i) => (
                <div
                  key={u.id}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: u.color,
                    border: '2px solid rgba(0,0,0,0.6)',
                    marginLeft: i === 0 ? 0 : '-5px',
                    zIndex: 10 - i,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 800,
                    color: '#fff',
                    textShadow: '0 1px 1px rgba(0,0,0,0.5)',
                  }}
                >
                  {u.name.charAt(0).toUpperCase()}
                </div>
              ))}
          </div>
        )}

        {/* Event toasts */}
        {recentEvents.map((event) => (
          <div
            key={event.id}
            style={{
              padding: '4px 10px',
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(6px)',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.8)',
              animation: 'lso-slide-in 0.3s ease-out',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: event.color,
              }}
            />
            {event.text}
          </div>
        ))}
      </div>
    </>
  );
}
