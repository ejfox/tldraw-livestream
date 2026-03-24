import React, { useEffect, useRef, useState } from 'react';
import { useLivestreamState } from '../plugin/useLivestreamContext';
import { ROLE_LEVEL } from '../types';

/**
 * Stream-ready spectator bar.
 *
 * Designed for OBS browser source overlays:
 * - Transparent background option for chroma-key
 * - High contrast text readable at 720p stream compression
 * - Animated user join/leave for visual energy
 * - "LIVE" pill that pulses like a broadcast indicator
 */

const ROLE_COLORS: Record<string, string> = {
  host: '#f59e0b',
  moderator: '#a78bfa',
  editor: '#60a5fa',
  viewer: '#9ca3af',
};

const ROLE_GLOW: Record<string, string> = {
  host: 'rgba(245, 158, 11, 0.4)',
  moderator: 'rgba(167, 139, 250, 0.3)',
  editor: 'rgba(96, 165, 250, 0.2)',
  viewer: 'none',
};

export function SpectatorBar() {
  const { users, role, frozen } = useLivestreamState();
  const [recentJoin, setRecentJoin] = useState<string | null>(null);
  const prevCountRef = useRef(users.length);

  // Flash animation when someone joins
  useEffect(() => {
    if (users.length > prevCountRef.current && users.length > 0) {
      const newest = users[users.length - 1];
      setRecentJoin(newest?.name || null);
      const timer = setTimeout(() => setRecentJoin(null), 2500);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = users.length;
  }, [users.length, users]);

  const sorted = [...users].sort((a, b) => ROLE_LEVEL[b.role] - ROLE_LEVEL[a.role]);
  const shown = sorted.slice(0, 10);
  const overflow = users.length - shown.length;

  return (
    <>
      <style>{`
        @keyframes ls-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes ls-glow {
          0%, 100% { box-shadow: 0 0 8px var(--ls-glow-color, rgba(239,68,68,0.5)); }
          50% { box-shadow: 0 0 20px var(--ls-glow-color, rgba(239,68,68,0.7)); }
        }
        @keyframes ls-join-slide {
          0% { opacity: 0; transform: translateY(-8px) scale(0.9); }
          20% { opacity: 1; transform: translateY(0) scale(1); }
          80% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-4px) scale(0.95); }
        }
        @keyframes ls-avatar-pop {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes ls-freeze-scan {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '5px 12px 5px 6px',
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(12px)',
          borderRadius: '20px',
          color: '#fff',
          fontSize: '13px',
          fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
          fontWeight: 500,
          pointerEvents: 'auto',
          userSelect: 'none',
          border: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* LIVE pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px 3px 7px',
            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            borderRadius: '14px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            animation: 'ls-glow 2s ease-in-out infinite',
            // @ts-expect-error CSS custom property
            '--ls-glow-color': 'rgba(239, 68, 68, 0.5)',
          }}
        >
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#fff',
              animation: 'ls-pulse 1.5s ease-in-out infinite',
            }}
          />
          LIVE
        </div>

        {/* User count */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {users.length}
          </span>
          <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 400 }}>
            {users.length === 1 ? 'person' : 'people'}
          </span>
        </div>

        {/* Frozen indicator */}
        {frozen && (
          <div
            style={{
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #1e3a5f, #2563eb, #1e3a5f)',
              backgroundSize: '200% 100%',
              animation: 'ls-freeze-scan 3s linear infinite',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            FROZEN
          </div>
        )}

        {/* Divider */}
        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.12)' }} />

        {/* Your role badge */}
        <div
          style={{
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            background: ROLE_COLORS[role],
            color: role === 'viewer' ? '#fff' : '#000',
            boxShadow: `0 0 8px ${ROLE_GLOW[role]}`,
          }}
        >
          {role}
        </div>

        {/* Avatar stack */}
        <div style={{ display: 'flex', marginLeft: '2px' }}>
          {shown.map((u, i) => (
            <div
              key={u.id}
              title={`${u.name} (${u.role})`}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: u.color,
                border: `2px solid ${u.role === 'host' ? '#f59e0b' : 'rgba(0,0,0,0.8)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 800,
                color: '#fff',
                marginLeft: i === 0 ? '0' : '-6px',
                zIndex: shown.length - i,
                position: 'relative',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                transition: 'transform 0.15s ease',
                cursor: 'default',
              }}
            >
              {u.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {overflow > 0 && (
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#374151',
                border: '2px solid rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: 700,
                color: '#9ca3af',
                marginLeft: '-6px',
                zIndex: 0,
              }}
            >
              +{overflow}
            </div>
          )}
        </div>

        {/* Join notification toast */}
        {recentJoin && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '4px 12px',
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              animation: 'ls-join-slide 2.5s ease forwards',
              border: '1px solid rgba(255,255,255,0.1)',
              pointerEvents: 'none',
            }}
          >
            <span style={{ color: '#60a5fa' }}>{recentJoin}</span>
            <span style={{ opacity: 0.5 }}> joined</span>
          </div>
        )}
      </div>
    </>
  );
}
