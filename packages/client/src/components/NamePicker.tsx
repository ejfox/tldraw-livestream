import React, { useCallback, useState } from 'react';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6',
];

interface NamePickerProps {
  onJoin: (name: string, color: string) => void;
  roomName?: string;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#111',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    background: '#1a1a2e',
    borderRadius: '16px',
    padding: '32px',
    width: '340px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    textAlign: 'center' as const,
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    opacity: 0.6,
    textAlign: 'center' as const,
    margin: 0,
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #333',
    background: '#0d0d1a',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  colorGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    justifyContent: 'center',
  },
  colorDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    border: '3px solid transparent',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  button: {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
};

export function NamePicker({ onJoin, roomName }: NamePickerProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[Math.floor(Math.random() * COLORS.length)]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (trimmed.length > 0 && trimmed.length <= 30) {
        onJoin(trimmed, color);
      }
    },
    [name, color, onJoin]
  );

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h2 style={styles.title}>Join Canvas</h2>
        {roomName && <p style={styles.subtitle}>{roomName}</p>}

        <input
          style={styles.input}
          type="text"
          placeholder="Your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          autoFocus
        />

        <div style={styles.colorGrid}>
          {COLORS.map((c) => (
            <div
              key={c}
              style={{
                ...styles.colorDot,
                background: c,
                borderColor: c === color ? '#fff' : 'transparent',
                transform: c === color ? 'scale(1.15)' : 'scale(1)',
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <button
          type="submit"
          style={{
            ...styles.button,
            opacity: name.trim().length === 0 ? 0.5 : 1,
          }}
          disabled={name.trim().length === 0}
        >
          Join
        </button>
      </form>
    </div>
  );
}
