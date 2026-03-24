import type { Role, LivestreamUser } from '../types';

/**
 * In-memory store for connected users and their roles.
 */
export class RoleStore {
  private users: Map<string, LivestreamUser> = new Map();
  private hostId: string | null = null;

  add(id: string, name: string, color: string, role: Role): LivestreamUser {
    const user: LivestreamUser = { id, name, color, role, joinedAt: Date.now() };
    this.users.set(id, user);
    if (role === 'host') this.hostId = id;
    return user;
  }

  remove(id: string): void {
    this.users.delete(id);
    if (this.hostId === id) this.hostId = null;
  }

  get(id: string): LivestreamUser | undefined {
    return this.users.get(id);
  }

  getRole(id: string): Role | undefined {
    return this.users.get(id)?.role;
  }

  setRole(id: string, role: Role): void {
    const user = this.users.get(id);
    if (user) {
      user.role = role;
      if (role === 'host') this.hostId = id;
    }
  }

  hasHost(): boolean {
    return this.hostId !== null;
  }

  getHostId(): string | null {
    return this.hostId;
  }

  getAll(): LivestreamUser[] {
    return Array.from(this.users.values());
  }

  count(): number {
    return this.users.size;
  }
}
