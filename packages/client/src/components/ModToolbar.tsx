import React, { useCallback, useState } from 'react';
import { useLivestream } from '../plugin/useLivestreamContext';
import { canModerate, isHost, type LivestreamUser, type Role } from '../types';

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px',
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    borderRadius: '10px',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '13px',
    color: '#fff',
    pointerEvents: 'auto',
    maxWidth: '260px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  section: {
    padding: '4px 0',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    opacity: 0.5,
    padding: '4px 8px',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'background 0.1s',
  },
  btnDanger: {
    color: '#ef4444',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  roleSelect: {
    marginLeft: 'auto',
    background: '#1a1a2e',
    border: '1px solid #333',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '11px',
    padding: '2px 4px',
  },
  kickBtn: {
    marginLeft: '4px',
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '2px 6px',
    borderRadius: '4px',
  },
};

export function ModToolbar() {
  const { state, actions } = useLivestream();
  const { role, frozen, users, snapshots } = state;
  const [expanded, setExpanded] = useState(true);

  const handleFreeze = useCallback(() => {
    actions.modAction(frozen ? 'unfreeze' : 'freeze');
  }, [actions, frozen]);

  const handleKick = useCallback(
    (userId: string) => {
      if (confirm('Kick this user?')) {
        actions.modAction('kick', userId);
      }
    },
    [actions]
  );

  const handleSnapshot = useCallback(() => {
    actions.modAction('snapshot');
  }, [actions]);

  const handleRollback = useCallback(
    (snapshotId: string) => {
      if (confirm('Rollback to this snapshot? This will reset the canvas for everyone.')) {
        actions.modAction('rollback', undefined, snapshotId);
      }
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
      <div style={styles.toolbar}>
        <button
          style={styles.btn}
          onClick={() => setExpanded(true)}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Mod Tools
        </button>
      </div>
    );
  }

  return (
    <div style={styles.toolbar}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
        <span style={{ fontWeight: 700, fontSize: '14px' }}>Mod Tools</span>
        <button
          style={{ ...styles.btn, width: 'auto', padding: '2px 8px', fontSize: '11px' }}
          onClick={() => setExpanded(false)}
        >
          Collapse
        </button>
      </div>

      {/* Quick Actions */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Actions</div>
        <button
          style={{ ...styles.btn, ...(frozen ? styles.btnDanger : {}) }}
          onClick={handleFreeze}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {frozen ? 'Unfreeze Canvas' : 'Freeze Canvas'}
        </button>
        <button
          style={styles.btn}
          onClick={handleSnapshot}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Save Snapshot
        </button>
      </div>

      {/* Users */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Users ({users.length})</div>
        {users.map((u) => (
          <UserRow
            key={u.id}
            user={u}
            isCurrentHost={isHost(role)}
            isSelf={u.id === state.userId}
            onKick={handleKick}
            onRoleChange={handleRoleChange}
          />
        ))}
      </div>

      {/* Snapshots */}
      {snapshots.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Snapshots</div>
          {snapshots
            .slice()
            .reverse()
            .slice(0, 5)
            .map((s) => (
              <button
                key={s.id}
                style={styles.btn}
                onClick={() => handleRollback(s.id)}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {new Date(s.timestamp).toLocaleTimeString()}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  isCurrentHost,
  isSelf,
  onKick,
  onRoleChange,
}: {
  user: LivestreamUser;
  isCurrentHost: boolean;
  isSelf: boolean;
  onKick: (id: string) => void;
  onRoleChange: (id: string, role: Role) => void;
}) {
  return (
    <div style={styles.userRow}>
      <div style={{ ...styles.dot, background: user.color }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {user.name}
        {isSelf && <span style={{ opacity: 0.4 }}> (you)</span>}
      </span>
      {isCurrentHost && !isSelf && (
        <>
          <select
            style={styles.roleSelect}
            value={user.role}
            onChange={(e) => onRoleChange(user.id, e.target.value as Role)}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="moderator">Mod</option>
          </select>
          <button style={styles.kickBtn} onClick={() => onKick(user.id)} title="Kick user">
            ✕
          </button>
        </>
      )}
      {!isCurrentHost && (
        <span style={{ fontSize: '11px', opacity: 0.5 }}>{user.role}</span>
      )}
    </div>
  );
}
