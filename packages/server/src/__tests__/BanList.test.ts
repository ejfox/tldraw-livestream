import { describe, it, expect, vi } from 'vitest';
import { BanList } from '../middleware/BanList';

describe('BanList', () => {
  it('bans and checks users by ID', () => {
    const banList = new BanList();
    expect(banList.isBanned('user1')).toBe(false);
    banList.ban('user1');
    expect(banList.isBanned('user1')).toBe(true);
  });

  it('bans and checks by IP', () => {
    const banList = new BanList();
    banList.ban('user1', '1.2.3.4');
    expect(banList.isBanned('different-user', '1.2.3.4')).toBe(true);
  });

  it('calls onBan callback', () => {
    const onBan = vi.fn();
    const banList = new BanList(onBan);
    banList.ban('user1', '1.2.3.4');
    expect(onBan).toHaveBeenCalledWith('user1', '1.2.3.4');
  });

  it('checks external isBanned callback', () => {
    const externalCheck = vi.fn().mockReturnValue(true);
    const banList = new BanList(undefined, externalCheck);
    expect(banList.isBanned('unknown-user')).toBe(true);
    expect(externalCheck).toHaveBeenCalledWith('unknown-user', undefined);
  });

  it('unbans users', () => {
    const banList = new BanList();
    banList.ban('user1');
    expect(banList.isBanned('user1')).toBe(true);
    banList.unban('user1');
    expect(banList.isBanned('user1')).toBe(false);
  });
});
