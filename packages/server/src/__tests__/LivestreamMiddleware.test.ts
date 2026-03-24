import { describe, it, expect, beforeEach } from 'vitest';
import { LivestreamMiddleware, createLivestreamMiddleware } from '../middleware/LivestreamMiddleware';

describe('LivestreamMiddleware', () => {
  let mw: LivestreamMiddleware;

  beforeEach(() => {
    mw = createLivestreamMiddleware({
      defaultRole: 'editor',
      hostToken: 'secret123',
      rateLimitMax: 5,
      rateLimitWindow: 1000,
    });
  });

  describe('onConnect', () => {
    it('assigns host role when correct hostToken is provided', () => {
      const result = mw.onConnect('room1', 'user1', {
        name: 'Host User',
        color: '#ff0000',
        hostToken: 'secret123',
      });

      expect(result.allowed).toBe(true);
      expect(result.sendTo).toContainEqual([
        'user1',
        { type: 'livestream:role-assigned', role: 'host', userId: 'user1' },
      ]);
    });

    it('assigns default role when no hostToken', () => {
      const result = mw.onConnect('room1', 'user1', {
        name: 'Regular User',
        color: '#0000ff',
      });

      expect(result.allowed).toBe(true);
      expect(result.sendTo).toContainEqual([
        'user1',
        { type: 'livestream:role-assigned', role: 'editor', userId: 'user1' },
      ]);
    });

    it('assigns default role when wrong hostToken', () => {
      const result = mw.onConnect('room1', 'user1', {
        name: 'Imposter',
        color: '#00ff00',
        hostToken: 'wrong',
      });

      expect(result.sendTo).toContainEqual([
        'user1',
        { type: 'livestream:role-assigned', role: 'editor', userId: 'user1' },
      ]);
    });

    it('rejects banned users', () => {
      // First connect a host
      mw.onConnect('room1', 'host', { name: 'Host', color: '#f00', hostToken: 'secret123' });
      // Connect the target
      mw.onConnect('room1', 'bad-user', { name: 'Bad', color: '#0f0' });

      // Ban them
      mw.onMessage('room1', 'host', {
        type: 'livestream:mod-action',
        action: 'ban',
        target: 'bad-user',
      });

      // Try reconnecting
      const result = mw.onConnect('room1', 'bad-user', { name: 'Bad Again', color: '#0f0' });
      expect(result.allowed).toBe(false);
      expect(result.disconnect).toContain('bad-user');
    });

    it('broadcasts user list to all clients', () => {
      mw.onConnect('room1', 'user1', { name: 'Alice', color: '#f00', hostToken: 'secret123' });
      const result = mw.onConnect('room1', 'user2', { name: 'Bob', color: '#0f0' });

      const usersBroadcast = result.broadcast?.find(
        (m: any) => m.type === 'livestream:users'
      ) as any;
      expect(usersBroadcast).toBeDefined();
      expect(usersBroadcast.users).toHaveLength(2);
    });

    it('tells new user about frozen state', () => {
      mw.onConnect('room1', 'host', { name: 'Host', color: '#f00', hostToken: 'secret123' });
      mw.onMessage('room1', 'host', { type: 'livestream:mod-action', action: 'freeze' });

      const result = mw.onConnect('room1', 'user2', { name: 'Late Joiner', color: '#0f0' });
      const frozenMsg = result.sendTo?.find(
        ([_, m]: any) => m.type === 'livestream:frozen'
      );
      expect(frozenMsg).toBeDefined();
    });
  });

  describe('onDisconnect', () => {
    it('removes user and broadcasts updated list', () => {
      mw.onConnect('room1', 'user1', { name: 'Alice', color: '#f00', hostToken: 'secret123' });
      mw.onConnect('room1', 'user2', { name: 'Bob', color: '#0f0' });

      const result = mw.onDisconnect('room1', 'user2');
      const usersBroadcast = result.broadcast?.find(
        (m: any) => m.type === 'livestream:users'
      ) as any;
      expect(usersBroadcast.users).toHaveLength(1);
      expect(usersBroadcast.users[0].name).toBe('Alice');
    });

    it('cleans up empty rooms', () => {
      mw.onConnect('room1', 'user1', { name: 'Alone', color: '#f00' });
      mw.onDisconnect('room1', 'user1');

      expect(mw.getRoomState('room1')).toBeNull();
    });
  });

  describe('sync message enforcement', () => {
    beforeEach(() => {
      mw.onConnect('room1', 'host', { name: 'Host', color: '#f00', hostToken: 'secret123' });
      mw.onConnect('room1', 'editor', { name: 'Editor', color: '#0f0' });
      mw.onConnect('room1', 'viewer', { name: 'Viewer', color: '#00f' });
      // Make viewer a viewer
      mw.onMessage('room1', 'host', {
        type: 'livestream:set-role',
        userId: 'viewer',
        role: 'viewer',
      });
    });

    it('allows cursor messages from viewers', () => {
      const result = mw.onMessage('room1', 'viewer', { type: 'cursor', x: 100, y: 200 });
      expect(result.allowed).toBe(true);
    });

    it('blocks update messages from viewers', () => {
      const result = mw.onMessage('room1', 'viewer', { type: 'update', shapes: {} });
      expect(result.allowed).toBe(false);
    });

    it('allows update messages from editors', () => {
      const result = mw.onMessage('room1', 'editor', { type: 'update', shapes: {} });
      expect(result.allowed).toBe(true);
    });

    it('allows update messages from host', () => {
      const result = mw.onMessage('room1', 'host', { type: 'update', shapes: {} });
      expect(result.allowed).toBe(true);
    });
  });

  describe('freeze', () => {
    beforeEach(() => {
      mw.onConnect('room1', 'host', { name: 'Host', color: '#f00', hostToken: 'secret123' });
      mw.onConnect('room1', 'editor', { name: 'Editor', color: '#0f0' });
    });

    it('freezes canvas and broadcasts', () => {
      const result = mw.onMessage('room1', 'host', {
        type: 'livestream:mod-action',
        action: 'freeze',
      });

      const frozenMsg = result.broadcast?.find((m: any) => m.type === 'livestream:frozen') as any;
      expect(frozenMsg.frozen).toBe(true);
    });

    it('blocks editor updates when frozen', () => {
      mw.onMessage('room1', 'host', { type: 'livestream:mod-action', action: 'freeze' });

      const result = mw.onMessage('room1', 'editor', { type: 'update', shapes: {} });
      expect(result.allowed).toBe(false);
    });

    it('allows host updates when frozen', () => {
      mw.onMessage('room1', 'host', { type: 'livestream:mod-action', action: 'freeze' });

      const result = mw.onMessage('room1', 'host', { type: 'update', shapes: {} });
      expect(result.allowed).toBe(true);
    });

    it('unfreezes and allows editor updates again', () => {
      mw.onMessage('room1', 'host', { type: 'livestream:mod-action', action: 'freeze' });
      mw.onMessage('room1', 'host', { type: 'livestream:mod-action', action: 'unfreeze' });

      const result = mw.onMessage('room1', 'editor', { type: 'update', shapes: {} });
      expect(result.allowed).toBe(true);
    });
  });

  describe('rate limiting', () => {
    beforeEach(() => {
      mw.onConnect('room1', 'editor', { name: 'Spammer', color: '#f00' });
    });

    it('allows messages within rate limit', () => {
      for (let i = 0; i < 5; i++) {
        const result = mw.onMessage('room1', 'editor', { type: 'update', shapes: {} });
        expect(result.allowed).toBe(true);
      }
    });

    it('blocks messages exceeding rate limit', () => {
      for (let i = 0; i < 5; i++) {
        mw.onMessage('room1', 'editor', { type: 'update', shapes: {} });
      }

      const result = mw.onMessage('room1', 'editor', { type: 'update', shapes: {} });
      expect(result.allowed).toBe(false);
      expect(result.respondToSender).toHaveProperty('type', 'livestream:rate-limited');
    });
  });

  describe('kick', () => {
    beforeEach(() => {
      mw.onConnect('room1', 'host', { name: 'Host', color: '#f00', hostToken: 'secret123' });
      mw.onConnect('room1', 'editor', { name: 'Editor', color: '#0f0' });
    });

    it('host can kick editors', () => {
      const result = mw.onMessage('room1', 'host', {
        type: 'livestream:mod-action',
        action: 'kick',
        target: 'editor',
      });

      expect(result.disconnect).toContain('editor');
      expect(result.sendTo).toContainEqual([
        'editor',
        expect.objectContaining({ type: 'livestream:kicked' }),
      ]);
    });

    it('editors cannot kick', () => {
      const result = mw.onMessage('room1', 'editor', {
        type: 'livestream:mod-action',
        action: 'kick',
        target: 'host',
      });

      expect(result.allowed).toBe(false);
      expect(result.disconnect).toBeUndefined();
    });
  });

  describe('role management', () => {
    beforeEach(() => {
      mw.onConnect('room1', 'host', { name: 'Host', color: '#f00', hostToken: 'secret123' });
      mw.onConnect('room1', 'user1', { name: 'User', color: '#0f0' });
    });

    it('host can promote to moderator', () => {
      const result = mw.onMessage('room1', 'host', {
        type: 'livestream:set-role',
        userId: 'user1',
        role: 'moderator',
      });

      expect(result.sendTo).toContainEqual([
        'user1',
        { type: 'livestream:role-assigned', role: 'moderator', userId: 'user1' },
      ]);
    });

    it('host can demote to viewer', () => {
      const result = mw.onMessage('room1', 'host', {
        type: 'livestream:set-role',
        userId: 'user1',
        role: 'viewer',
      });

      expect(result.sendTo).toContainEqual([
        'user1',
        { type: 'livestream:role-assigned', role: 'viewer', userId: 'user1' },
      ]);
    });

    it('non-host cannot change roles', () => {
      const result = mw.onMessage('room1', 'user1', {
        type: 'livestream:set-role',
        userId: 'host',
        role: 'viewer',
      });

      expect(result.allowed).toBe(false);
    });

    it('cannot promote to host', () => {
      const result = mw.onMessage('room1', 'host', {
        type: 'livestream:set-role',
        userId: 'user1',
        role: 'host',
      });

      expect(result.allowed).toBe(false);
    });
  });

  describe('chat', () => {
    beforeEach(() => {
      mw.onConnect('room1', 'user1', { name: 'Alice', color: '#f00' });
    });

    it('broadcasts chat messages', () => {
      const result = mw.onMessage('room1', 'user1', {
        type: 'livestream:chat',
        text: 'hello world',
      });

      const chatMsg = result.broadcast?.find((m: any) => m.type === 'livestream:chat') as any;
      expect(chatMsg).toBeDefined();
      expect(chatMsg.message.text).toBe('hello world');
      expect(chatMsg.message.userName).toBe('Alice');
    });

    it('rejects empty chat messages', () => {
      const result = mw.onMessage('room1', 'user1', {
        type: 'livestream:chat',
        text: '   ',
      });

      expect(result.allowed).toBe(false);
      expect(result.broadcast).toBeUndefined();
    });

    it('truncates long messages to 500 chars', () => {
      const longText = 'a'.repeat(600);
      const result = mw.onMessage('room1', 'user1', {
        type: 'livestream:chat',
        text: longText,
      });

      const chatMsg = result.broadcast?.find((m: any) => m.type === 'livestream:chat') as any;
      expect(chatMsg.message.text).toHaveLength(500);
    });
  });

  describe('spotlight', () => {
    beforeEach(() => {
      mw.onConnect('room1', 'host', { name: 'Host', color: '#f00', hostToken: 'secret123' });
      mw.onConnect('room1', 'user1', { name: 'User', color: '#0f0' });
    });

    it('host can set spotlight', () => {
      const result = mw.onMessage('room1', 'host', {
        type: 'livestream:spotlight',
        bounds: { x: 100, y: 200, w: 300, h: 400 },
      });

      const spotlightMsg = result.broadcast?.find(
        (m: any) => m.type === 'livestream:spotlight'
      ) as any;
      expect(spotlightMsg.bounds).toEqual({ x: 100, y: 200, w: 300, h: 400 });
    });

    it('non-host cannot set spotlight', () => {
      const result = mw.onMessage('room1', 'user1', {
        type: 'livestream:spotlight',
        bounds: { x: 0, y: 0, w: 100, h: 100 },
      });

      expect(result.allowed).toBe(false);
    });
  });

  describe('getRoomState', () => {
    it('returns null for unknown rooms', () => {
      expect(mw.getRoomState('nonexistent')).toBeNull();
    });

    it('returns room state', () => {
      mw.onConnect('room1', 'user1', { name: 'Alice', color: '#f00', hostToken: 'secret123' });
      mw.onConnect('room1', 'user2', { name: 'Bob', color: '#0f0' });

      const state = mw.getRoomState('room1');
      expect(state).not.toBeNull();
      expect(state!.userCount).toBe(2);
      expect(state!.frozen).toBe(false);
    });
  });

  describe('input sanitization', () => {
    it('strips HTML from names', () => {
      mw.onConnect('room1', 'user1', { name: '<script>alert(1)</script>Bob', color: '#ff0000' });
      const state = mw.getRoomState('room1');
      expect(state!.users[0].name).toBe('alert(1)Bob');
    });

    it('strips control characters from names', () => {
      mw.onConnect('room1', 'user1', { name: 'Evil\x00\x01Name', color: '#ff0000' });
      const state = mw.getRoomState('room1');
      expect(state!.users[0].name).toBe('EvilName');
    });

    it('truncates long names to 30 chars', () => {
      mw.onConnect('room1', 'user1', { name: 'A'.repeat(100), color: '#ff0000' });
      const state = mw.getRoomState('room1');
      expect(state!.users[0].name.length).toBeLessThanOrEqual(30);
    });

    it('falls back to Anonymous for empty names', () => {
      mw.onConnect('room1', 'user1', { name: '   ', color: '#ff0000' });
      const state = mw.getRoomState('room1');
      expect(state!.users[0].name).toBe('Anonymous');
    });

    it('rejects invalid color formats', () => {
      mw.onConnect('room1', 'user1', { name: 'Test', color: 'not-a-color' });
      const state = mw.getRoomState('room1');
      expect(state!.users[0].color).toBe('#3b82f6'); // default
    });

    it('accepts valid hex colors', () => {
      mw.onConnect('room1', 'user1', { name: 'Test', color: '#abcdef' });
      const state = mw.getRoomState('room1');
      expect(state!.users[0].color).toBe('#abcdef');
    });
  });

  describe('re-join protection', () => {
    it('rejects livestream:join from already-connected client', () => {
      mw.onConnect('room1', 'user1', { name: 'Alice', color: '#ff0000' });
      const result = mw.onMessage('room1', 'user1', {
        type: 'livestream:join',
        name: 'Impersonator',
        color: '#00ff00',
        hostToken: 'secret123', // try to re-assert host
      });
      expect(result.allowed).toBe(false);
    });
  });

  describe('role validation', () => {
    beforeEach(() => {
      mw.onConnect('room1', 'host', { name: 'Host', color: '#f00', hostToken: 'secret123' });
      mw.onConnect('room1', 'user1', { name: 'User', color: '#0f0' });
    });

    it('rejects invalid role values', () => {
      const result = mw.onMessage('room1', 'host', {
        type: 'livestream:set-role',
        userId: 'user1',
        role: 'superadmin',
      });
      expect(result.allowed).toBe(false);
    });

    it('rejects empty role', () => {
      const result = mw.onMessage('room1', 'host', {
        type: 'livestream:set-role',
        userId: 'user1',
        role: '',
      });
      expect(result.allowed).toBe(false);
    });
  });

  describe('chat uses separate rate limiter', () => {
    it('chat is not blocked by shape rate limit', () => {
      mw.onConnect('room1', 'editor', { name: 'Editor', color: '#f00' });
      // Exhaust shape rate limit
      for (let i = 0; i < 5; i++) {
        mw.onMessage('room1', 'editor', { type: 'update', shapes: {} });
      }
      expect(mw.onMessage('room1', 'editor', { type: 'update', shapes: {} }).allowed).toBe(false);
      // Chat should still work
      const chatResult = mw.onMessage('room1', 'editor', { type: 'livestream:chat', text: 'hi' });
      expect(chatResult.broadcast).toBeDefined();
    });
  });

  describe('auto-host without hostToken', () => {
    it('first user becomes host when no hostToken configured', () => {
      const noTokenMw = createLivestreamMiddleware({ defaultRole: 'editor' });

      const result = noTokenMw.onConnect('room1', 'first', { name: 'First', color: '#f00' });
      expect(result.sendTo).toContainEqual([
        'first',
        { type: 'livestream:role-assigned', role: 'host', userId: 'first' },
      ]);
    });

    it('subsequent users get default role', () => {
      const noTokenMw = createLivestreamMiddleware({ defaultRole: 'viewer' });

      noTokenMw.onConnect('room1', 'first', { name: 'First', color: '#f00' });
      const result = noTokenMw.onConnect('room1', 'second', { name: 'Second', color: '#0f0' });
      expect(result.sendTo).toContainEqual([
        'second',
        { type: 'livestream:role-assigned', role: 'viewer', userId: 'second' },
      ]);
    });
  });
});
