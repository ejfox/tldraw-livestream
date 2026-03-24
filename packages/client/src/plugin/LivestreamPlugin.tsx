import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { LivestreamContext, type LivestreamContextValue, type LivestreamState } from './useLivestreamContext';
import { DEFAULT_CONFIG, type LivestreamConfig, type Role, type ChatMessage, type LivestreamUser, type ServerMessage, type SpotlightBounds, type SnapshotMeta } from '../types';

interface LivestreamPluginProps {
  /** WebSocket instance (must already be connected) */
  ws: WebSocket | null;
  /** Current user's ID (from your sync layer) */
  userId: string;
  /** Plugin configuration */
  config?: LivestreamConfig;
  /** Called when the user is kicked */
  onKicked?: (reason?: string) => void;
  children: React.ReactNode;
}

type Action =
  | { type: 'SET_ROLE'; role: Role }
  | { type: 'SET_FROZEN'; frozen: boolean }
  | { type: 'SET_USERS'; users: LivestreamUser[] }
  | { type: 'SET_SPOTLIGHT'; bounds: SpotlightBounds | null }
  | { type: 'ADD_CHAT'; message: ChatMessage }
  | { type: 'ADD_SNAPSHOT'; snapshot: SnapshotMeta }
  | { type: 'SET_RATE_LIMITED'; limited: boolean };

function reducer(state: LivestreamState, action: Action): LivestreamState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.role };
    case 'SET_FROZEN':
      return { ...state, frozen: action.frozen };
    case 'SET_USERS':
      return { ...state, users: action.users };
    case 'SET_SPOTLIGHT':
      return { ...state, spotlight: action.bounds };
    case 'ADD_CHAT':
      return { ...state, chatMessages: [...state.chatMessages.slice(-199), action.message] };
    case 'ADD_SNAPSHOT':
      return {
        ...state,
        snapshots: [...state.snapshots.slice(-(state.config.maxSnapshots - 1)), action.snapshot],
      };
    case 'SET_RATE_LIMITED':
      return { ...state, rateLimited: action.limited };
    default:
      return state;
  }
}

export function LivestreamPlugin({ ws, userId, config: userConfig, onKicked, children }: LivestreamPluginProps) {
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...userConfig }), [userConfig]);

  const [state, dispatch] = useReducer(reducer, {
    userId,
    role: config.defaultRole,
    users: [],
    frozen: false,
    spotlight: null,
    chatMessages: [],
    snapshots: [],
    config,
    rateLimited: false,
  });

  const rateLimitTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Listen for livestream protocol messages on the WebSocket
  useEffect(() => {
    if (!ws) return;

    function handleMessage(event: MessageEvent) {
      let data: ServerMessage;
      try {
        data = JSON.parse(event.data);
      } catch {
        return; // not JSON, ignore
      }

      if (!data.type?.startsWith('livestream:')) return;

      switch (data.type) {
        case 'livestream:role-assigned':
          if (data.userId === userId) {
            dispatch({ type: 'SET_ROLE', role: data.role });
          }
          break;
        case 'livestream:frozen':
          dispatch({ type: 'SET_FROZEN', frozen: data.frozen });
          break;
        case 'livestream:kicked':
          onKicked?.(data.reason);
          break;
        case 'livestream:rate-limited': {
          dispatch({ type: 'SET_RATE_LIMITED', limited: true });
          clearTimeout(rateLimitTimerRef.current);
          rateLimitTimerRef.current = setTimeout(() => {
            dispatch({ type: 'SET_RATE_LIMITED', limited: false });
          }, data.until - Date.now());
          break;
        }
        case 'livestream:users':
          dispatch({ type: 'SET_USERS', users: data.users });
          break;
        case 'livestream:spotlight':
          dispatch({ type: 'SET_SPOTLIGHT', bounds: data.bounds });
          break;
        case 'livestream:snapshot-created':
          dispatch({
            type: 'ADD_SNAPSHOT',
            snapshot: { id: data.id, timestamp: data.timestamp, userCount: 0, shapeCount: 0, triggeredBy: '' },
          });
          break;
        case 'livestream:chat':
          dispatch({ type: 'ADD_CHAT', message: data.message });
          break;
      }
    }

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, userId, onKicked]);

  // Actions
  const send = useCallback(
    (msg: object) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    },
    [ws]
  );

  const actions = useMemo(
    () => ({
      modAction: (action: string, target?: string, snapshotId?: string, reason?: string) => {
        send({ type: 'livestream:mod-action', action, target, snapshotId, reason });
      },
      setRole: (targetUserId: string, role: Role) => {
        send({ type: 'livestream:set-role', userId: targetUserId, role });
      },
      setSpotlight: (bounds: SpotlightBounds | null) => {
        send({ type: 'livestream:spotlight', bounds });
      },
      sendChat: (text: string) => {
        send({ type: 'livestream:chat', text });
      },
    }),
    [send]
  );

  const contextValue: LivestreamContextValue = useMemo(
    () => ({ state, actions }),
    [state, actions]
  );

  return (
    <LivestreamContext.Provider value={contextValue}>
      {children}
    </LivestreamContext.Provider>
  );
}
