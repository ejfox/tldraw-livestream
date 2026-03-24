import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLivestream } from '../plugin/useLivestreamContext';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '280px',
    maxHeight: '360px',
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(8px)',
    borderRadius: '10px',
    overflow: 'hidden',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '13px',
    color: '#fff',
    pointerEvents: 'auto',
  },
  header: {
    padding: '8px 12px',
    fontWeight: 700,
    fontSize: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minHeight: '120px',
    maxHeight: '260px',
  },
  message: {
    padding: '2px 0',
    lineHeight: 1.4,
    wordBreak: 'break-word' as const,
  },
  name: {
    fontWeight: 700,
    fontSize: '12px',
    marginRight: '6px',
  },
  inputRow: {
    display: 'flex',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
  },
  sendBtn: {
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};

export function ChatOverlay() {
  const { state, actions } = useLivestream();
  const { chatMessages, config } = state;
  const [text, setText] = useState('');
  const [open, setOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!config.enableChat) return null;

  // Auto-scroll to bottom on new messages
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

  if (!open) {
    return (
      <div
        style={{
          ...styles.container,
          width: 'auto',
          maxHeight: 'none',
          padding: '6px 12px',
          cursor: 'pointer',
        }}
        onClick={() => setOpen(true)}
      >
        Chat ({chatMessages.length})
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>Chat</span>
        <button
          style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer', fontSize: '12px' }}
          onClick={() => setOpen(false)}
        >
          Hide
        </button>
      </div>

      <div style={styles.messages}>
        {chatMessages.length === 0 && (
          <div style={{ opacity: 0.3, textAlign: 'center', padding: '20px 0' }}>No messages yet</div>
        )}
        {chatMessages.map((msg) => (
          <div key={msg.id} style={styles.message}>
            <span style={{ ...styles.name, color: msg.userColor }}>{msg.userName}</span>
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form style={styles.inputRow} onSubmit={handleSend}>
        <input
          style={styles.input}
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        <button type="submit" style={styles.sendBtn} disabled={!text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
