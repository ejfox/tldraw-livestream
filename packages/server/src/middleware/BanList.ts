/**
 * In-memory ban list. Optionally delegates to external persistence
 * via the onBan/isBanned callbacks in config.
 */
export class BanList {
  private banned: Set<string> = new Set();
  private onBan?: (userId: string, ip?: string) => void;
  private externalCheck?: (userId: string, ip?: string) => boolean;

  constructor(
    onBan?: (userId: string, ip?: string) => void,
    isBanned?: (userId: string, ip?: string) => boolean
  ) {
    this.onBan = onBan;
    this.externalCheck = isBanned;
  }

  ban(userId: string, ip?: string): void {
    this.banned.add(userId);
    if (ip) this.banned.add(`ip:${ip}`);
    this.onBan?.(userId, ip);
  }

  isBanned(userId: string, ip?: string): boolean {
    if (this.banned.has(userId)) return true;
    if (ip && this.banned.has(`ip:${ip}`)) return true;
    if (this.externalCheck?.(userId, ip)) return true;
    return false;
  }

  unban(userId: string): void {
    this.banned.delete(userId);
  }
}
