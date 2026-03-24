import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Pre-join lobby screen.
 *
 * Designed to feel like a "waiting room" before joining a livestream canvas.
 * Dark, minimal, focused. The color picker uses large, satisfying dots.
 * Pressing Enter or clicking Join sends you in.
 *
 * For OBS: this screen has a solid dark background (no transparency)
 * so it works as a "loading" state in browser source.
 */

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6',
  '#6366f1', '#84cc16',
];

interface NamePickerProps {
  onJoin: (name: string, color: string) => void;
  roomName?: string;
  /** Optional message shown below the room name */
  subtitle?: string;
}

export function NamePicker({ onJoin, roomName, subtitle }: NamePickerProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[Math.floor(Math.random() * COLORS.length)]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  const valid = name.trim().length > 0;

  return (
    <>
      <style>{`
        @keyframes ls-name-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ls-color-ring {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .ls-name-input::placeholder { color: rgba(255,255,255,0.25); }
        .ls-name-input:focus { border-color: var(--ls-selected-color, #3b82f6); box-shadow: 0 0 0 3px var(--ls-selected-glow, rgba(59,130,246,0.15)); }
        .ls-join-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,0.4); }
        .ls-join-btn:active:not(:disabled) { transform: translateY(0); }
        .ls-color-dot:hover { transform: scale(1.15) !important; }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0a0a0f',
          color: '#fff',
          fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '360px',
            animation: 'ls-name-fade-in 0.5s ease-out',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            {roomName && (
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  margin: '0 0 6px',
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(135deg, #fff, #94a3b8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {roomName}
              </h1>
            )}
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
              {subtitle || 'Pick a name and color to join the canvas'}
            </p>
          </div>

          {/* Name input */}
          <input
            ref={inputRef}
            className="ls-name-input"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              border: '2px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 500,
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              // @ts-expect-error CSS custom property
              '--ls-selected-color': color,
              '--ls-selected-glow': color + '26',
            }}
          />

          {/* Color picker */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              justifyContent: 'center',
              padding: '4px 0',
            }}
          >
            {COLORS.map((c) => {
              const selected = c === color;
              return (
                <div
                  key={c}
                  className="ls-color-dot"
                  onClick={() => setColor(c)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: c,
                    cursor: 'pointer',
                    border: selected ? '3px solid #fff' : '3px solid transparent',
                    boxShadow: selected ? `0 0 16px ${c}66` : 'none',
                    transform: selected ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }}
                />
              );
            })}
          </div>

          {/* Preview avatar */}
          {valid && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '8px 0',
                animation: 'ls-name-fade-in 0.3s ease-out',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  animation: 'ls-color-ring 1s ease-in-out infinite',
                }}
              >
                {name.trim().charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>{name.trim()}</span>
            </div>
          )}

          {/* Join button */}
          <button
            className="ls-join-btn"
            type="submit"
            disabled={!valid}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: valid
                ? `linear-gradient(135deg, ${color}, ${color}cc)`
                : 'rgba(255,255,255,0.06)',
              color: valid ? '#fff' : 'rgba(255,255,255,0.2)',
              fontSize: '15px',
              fontWeight: 700,
              cursor: valid ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              letterSpacing: '0.3px',
              textShadow: valid ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            Join Canvas
          </button>
        </form>
      </div>
    </>
  );
}
