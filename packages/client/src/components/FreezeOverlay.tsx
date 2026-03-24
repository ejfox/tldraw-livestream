import React from 'react';
import { useLivestreamState } from '../plugin/useLivestreamContext';
import { canModerate } from '../types';

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: '80px',
    zIndex: 999,
  },
  banner: {
    padding: '10px 24px',
    background: 'rgba(220, 38, 38, 0.9)',
    backdropFilter: 'blur(8px)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  },
  icon: {
    fontSize: '18px',
  },
};

export function FreezeOverlay() {
  const { frozen, role } = useLivestreamState();

  if (!frozen) return null;

  const message = canModerate(role)
    ? 'Canvas frozen — you can still edit as a moderator'
    : 'Canvas frozen by host — editing disabled';

  return (
    <div style={styles.overlay}>
      <div style={styles.banner}>
        <span style={styles.icon}>&#x2744;&#xFE0F;</span>
        {message}
      </div>
    </div>
  );
}
