/** Tiny TTL cache with in-flight de-duplication to avoid redundant provider calls. */
export class TtlCache<T> {
  private store = new Map<string, { value: T; expires: number }>();
  private inflight = new Map<string, Promise<T>>();
  constructor(private readonly ttlMs: number, private readonly now: () => number = Date.now, private readonly maxEntries = 200) {}
  async get(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.store.get(key);
    if (hit && hit.expires > this.now()) return hit.value;
    const pending = this.inflight.get(key);
    if (pending) return pending;
    const p = load().then((value) => {
      if (this.store.size >= this.maxEntries) this.store.delete(this.store.keys().next().value as string);
      this.store.set(key, { value, expires: this.now() + this.ttlMs });
      return value;
    }).finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }
}
