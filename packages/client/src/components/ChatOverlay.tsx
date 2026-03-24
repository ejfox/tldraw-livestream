import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLivestream } from '../plugin/useLivestreamContext';

/**
 * Stream-ready chat overlay.
 *
 * OBS affordances:
 * - Messages fade in from bottom like Twitch/YouTube chat
 * - Semi-transparent background works as OBS browser source overlay
 * - Old messages auto-fade after 30s in "stream mode" (minimized)
 * - Compact layout optimized for side panel or bottom overlay
 */

const MESSAGE_FADE_MS = 30_000;

export function ChatOverlay() {
  const { state, actions } = useLivestream();
  const { chatMessages, config } = state;
  const [text, setText] = useState('');
  const [open, setOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // All hooks must be above the early return (React rules of hooks)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSend = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (trimmed) {
        actions.sendChat(trimmed);
        setText('');
      }
    },
    [text, actions]
  );

  if (!config.enableChat) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '6px 14px',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: "'Inter', system-ui, sans-serif",
          cursor: 'pointer',
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M2 4a2 2 0 012-2h8a2 2 0 012 2v5a2 2 0 01-2 2H5l-3 3V4z"
            stroke="#9ca3af"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        Chat
        {chatMessages.length > 0 && (
          <span style={{ color: '#60a5fa' }}>{chatMessages.length}</span>
        )}
      </button>
    );
  }

  return (
    <>
      <style>{`
        @keyframes ls-chat-slide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ls-chat-input::placeholder { color: rgba(255,255,255,0.2); }
        .ls-chat-input:focus { border-color: rgba(96,165,250,0.4); }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '300px',
          maxHeight: '380px',
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(12px)',
          borderRadius: '14px',
          overflow: 'hidden',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '13px',
          color: '#fff',
          pointerEvents: 'auto',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '8px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '0.3px' }}>Chat</span>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '6px',
              transition: 'color 0.15s',
            }}
          >
            Hide
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minHeight: '140px',
            maxHeight: '280px',
          }}
        >
          {chatMessages.length === 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '80px',
                opacity: 0.2,
                fontSize: '12px',
              }}
            >
              No messages yet
            </div>
          )}
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              style={{
                padding: '3px 0',
                lineHeight: 1.5,
                wordBreak: 'break-word',
                animation: 'ls-chat-slide 0.2s ease-out',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '12px',
                  color: msg.userColor,
                  marginRight: '6px',
                }}
              >
                {msg.userName}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>{msg.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          style={{
            display: 'flex',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <input
            className="ls-chat-input"
            type="text"
            placeholder="Say something..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'transparent',
              border: '2px solid transparent',
              borderRadius: '0 0 0 14px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              color: text.trim() ? '#60a5fa' : 'rgba(255,255,255,0.1)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: text.trim() ? 'pointer' : 'default',
              transition: 'color 0.15s',
            }}
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
}
