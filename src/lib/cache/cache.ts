interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  defaultTTL: number; // Default time to live in milliseconds
  maxSize: number; // Maximum number of entries
  cleanupInterval: number; // Cleanup interval in milliseconds
}

class Cache {
  private store: Map<string, CacheEntry<any>>;
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      cleanupInterval: 60 * 1000, // 1 minute
      ...config
    };

    this.store = new Map();
    this.startCleanup();
  }

  set<T>(key: string, value: T, ttl?: number): void {
    if (!key) {
      throw new Error('Cache key cannot be empty');
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    // Remove oldest entries if cache is full
    if (this.store.size >= this.config.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T>;
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Create cache instances for different purposes
export const productCache = new Cache({ defaultTTL: 10 * 60 * 1000 }); // 10 minutes
export const categoryCache = new Cache({ defaultTTL: 30 * 60 * 1000 }); // 30 minutes
export const orderCache = new Cache({ defaultTTL: 2 * 60 * 1000 }); // 2 minutes
export const userCache = new Cache({ defaultTTL: 15 * 60 * 1000 }); // 15 minutes

// Cache decorator for functions
export function cacheable<T extends (...args: any[]) => any>(
  cache: Cache,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>): Promise<ReturnType<T>> {
      const key = keyGenerator(...args);
      const cached = cache.get<ReturnType<T>>(key);
      
      if (cached !== null) {
        return cached;
      }

      const result = await method.apply(this, args);
      cache.set(key, result, ttl);
      return result;
    };
  };
}

// Cache key generators
export const cacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (categoryId?: string) => `products:${categoryId || 'all'}`,
  category: (id: string) => `category:${id}`,
  categories: () => 'categories:all',
  order: (id: string) => `order:${id}`,
  orders: (filters: any) => `orders:${JSON.stringify(filters)}`,
  user: (id: string) => `user:${id}`,
};
