import React, { useCallback, useState } from 'react';
import { useLivestream } from '../plugin/useLivestreamContext';
import { canModerate, isHost, type LivestreamUser, type Role } from '../types';

/**
 * Host/moderator toolbar panel.
 *
 * Compact, collapsible, dark. Designed to sit in the right panel
 * without overwhelming the canvas. Collapsible to a single icon
 * for when you're on stream and want minimal chrome.
 */

export function ModToolbar() {
  const { state, actions } = useLivestream();
  const { role, frozen, users, snapshots } = state;
  const [expanded, setExpanded] = useState(true);

  const handleFreeze = useCallback(() => {
    actions.modAction(frozen ? 'unfreeze' : 'freeze');
  }, [actions, frozen]);

  const handleKick = useCallback(
    (userId: string) => {
      actions.modAction('kick', userId);
    },
    [actions]
  );

  const handleBan = useCallback(
    (userId: string) => {
      actions.modAction('ban', userId, undefined, 'Banned by moderator');
    },
    [actions]
  );

  const handleSnapshot = useCallback(() => {
    actions.modAction('snapshot');
  }, [actions]);

  const handleRollback = useCallback(
    (snapshotId: string) => {
      actions.modAction('rollback', undefined, snapshotId);
    },
    [actions]
  );

  const handleRoleChange = useCallback(
    (userId: string, newRole: Role) => {
      actions.setRole(userId, newRole);
    },
    [actions]
  );

  if (!canModerate(role)) return null;

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        title="Mod Tools"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#f59e0b',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1l2.4 1.2L13 3.5v3.7c0 3.1-2.1 5.8-5 6.8-2.9-1-5-3.7-5-6.8V3.5l2.6-1.3L8 1z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    );
  }

  return (
    <>
      <style>{`
        .ls-mod-btn { transition: background 0.1s, color 0.1s; }
        .ls-mod-btn:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          padding: '8px',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '14px',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '13px',
          color: '#fff',
          pointerEvents: 'auto',
          width: '260px',
          maxHeight: '420px',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '2px 6px 6px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: '2px',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '12px', color: '#f59e0b', letterSpacing: '0.3px' }}>
            Mod Tools
          </span>
          <button
            onClick={() => setExpanded(false)}
            className="ls-mod-btn"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '6px',
            }}
          >
            Collapse
          </button>
        </div>

        {/* Quick Actions */}
        <SectionLabel>Actions</SectionLabel>

        <ModButton
          onClick={handleFreeze}
          icon={frozen ? 'unfreeze' : 'freeze'}
          danger={frozen}
        >
          {frozen ? 'Unfreeze Canvas' : 'Freeze Canvas'}
        </ModButton>

        <ModButton onClick={handleSnapshot} icon="snapshot">
          Save Snapshot
        </ModButton>

        {/* Users */}
        <SectionLabel>Users ({users.length})</SectionLabel>
        {users.map((u) => (
          <UserRow
            key={u.id}
            user={u}
            isCurrentHost={isHost(role)}
            isSelf={u.id === state.userId}
            onKick={handleKick}
            onBan={handleBan}
            onRoleChange={handleRoleChange}
          />
        ))}

        {/* Snapshots */}
        {snapshots.length > 0 && (
          <>
            <SectionLabel>Rollback</SectionLabel>
            {snapshots
              .slice()
              .reverse()
              .slice(0, 5)
              .map((s) => (
                <ModButton key={s.id} onClick={() => handleRollback(s.id)} icon="rollback">
                  {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </ModButton>
              ))}
          </>
        )}
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: 'rgba(255,255,255,0.25)',
        padding: '8px 6px 4px',
      }}
    >
      {children}
    </div>
  );
}

function ModButton({
  children,
  onClick,
  icon,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: string;
  danger?: boolean;
}) {
  return (
    <button
      className="ls-mod-btn"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 10px',
        borderRadius: '8px',
        border: 'none',
        background: 'transparent',
        color: danger ? '#f87171' : 'rgba(255,255,255,0.8)',
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0, opacity: 0.6 }}>
        {icon === 'freeze' && '\u2744'}
        {icon === 'unfreeze' && '\u2600'}
        {icon === 'snapshot' && '\u{1F4F7}'}
        {icon === 'rollback' && '\u23EA'}
      </span>
      {children}
    </button>
  );
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  host: '#f59e0b',
  moderator: '#a78bfa',
  editor: '#60a5fa',
  viewer: '#6b7280',
};

function UserRow({
  user,
  isCurrentHost,
  isSelf,
  onKick,
  onBan,
  onRoleChange,
}: {
  user: LivestreamUser;
  isCurrentHost: boolean;
  isSelf: boolean;
  onKick: (id: string) => void;
  onBan: (id: string) => void;
  onRoleChange: (id: string, role: Role) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 8px',
        borderRadius: '8px',
        fontSize: '12px',
        position: 'relative',
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: user.color,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '9px',
          fontWeight: 800,
          color: '#fff',
        }}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>

      <span
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: 500,
        }}
      >
        {user.name}
        {isSelf && <span style={{ opacity: 0.3, fontSize: '10px' }}> (you)</span>}
      </span>

      {isCurrentHost && !isSelf && showActions ? (
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          <select
            value={user.role}
            onChange={(e) => onRoleChange(user.id, e.target.value as Role)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '10px',
              padding: '2px 4px',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="moderator">Mod</option>
          </select>
          <button
            onClick={() => onKick(user.id)}
            title="Kick"
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '2px 4px',
              borderRadius: '4px',
            }}
          >
            Kick
          </button>
        </div>
      ) : (
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: ROLE_BADGE_COLORS[user.role],
            opacity: 0.7,
          }}
        >
          {user.role}
        </span>
      )}
    </div>
  );
}
