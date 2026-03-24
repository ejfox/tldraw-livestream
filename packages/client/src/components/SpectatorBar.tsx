import React from 'react';
import { useLivestreamState } from '../plugin/useLivestreamContext';
import { ROLE_LEVEL } from '../types';

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 14px',
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '13px',
    fontFamily: 'system-ui, sans-serif',
    pointerEvents: 'auto',
    userSelect: 'none',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#ef4444',
    animation: 'livestream-pulse 2s ease-in-out infinite',
  },
  count: {
    fontWeight: 600,
    fontSize: '14px',
  },
  roleBadge: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  avatarRow: {
    display: 'flex',
    gap: '-4px',
  },
  avatar: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: '2px solid rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 700,
    color: '#fff',
    marginLeft: '-4px',
  },
};

const roleColors: Record<string, string> = {
  host: '#f59e0b',
  moderator: '#8b5cf6',
  editor: '#3b82f6',
  viewer: '#6b7280',
};

export function SpectatorBar() {
  const { users, role, frozen } = useLivestreamState();

  const sorted = [...users].sort((a, b) => ROLE_LEVEL[b.role] - ROLE_LEVEL[a.role]);
  const shown = sorted.slice(0, 8);
  const overflow = users.length - shown.length;

  return (
    <>
      <style>{`
        @keyframes livestream-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div style={styles.bar}>
        <div style={styles.liveDot} />
        <span style={styles.count}>{users.length}</span>
        <span style={{ opacity: 0.6 }}>watching</span>

        {frozen && (
          <span style={{ ...styles.roleBadge, background: '#dc2626', color: '#fff' }}>
            FROZEN
          </span>
        )}

        <span style={{ ...styles.roleBadge, background: roleColors[role], color: '#fff' }}>
          {role}
        </span>

        <div style={styles.avatarRow}>
          {shown.map((u) => (
            <div
              key={u.id}
              style={{ ...styles.avatar, background: u.color }}
              title={`${u.name} (${u.role})`}
            >
              {u.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {overflow > 0 && (
            <div style={{ ...styles.avatar, background: '#374151' }}>+{overflow}</div>
          )}
        </div>
      </div>
    </>
  );
}
