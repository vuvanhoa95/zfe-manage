/**
 * Simple in-memory cache for API responses
 * 
 * Note: In-memory cache is shared per serverless function instance.
 * For better performance across multiple instances, consider using:
 * - Vercel KV (recommended for Vercel)
 * - Redis (for other platforms)
 * - Upstash Redis (serverless Redis)
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

class SimpleCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private maxSize = 100; // Maximum number of entries

    set<T>(key: string, data: T, ttl: number = 60000): void {
        // Default TTL: 60 seconds
        // Clean up old entries if cache is full
        if (this.cache.size >= this.maxSize) {
            this.cleanup();
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }

        // Check if entry has expired
        const age = Date.now() - entry.timestamp;
        if (age > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    private cleanup(): void {
        // Remove expired entries
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }

        // If still full, remove oldest entries
        if (this.cache.size >= this.maxSize) {
            const entries = Array.from(this.cache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.2)); // Remove 20% oldest
            for (const [key] of toRemove) {
                this.cache.delete(key);
            }
        }
    }

    size(): number {
        return this.cache.size;
    }

    /**
     * Clear all cache entries matching a pattern
     * @param pattern - String pattern to match (e.g., 'projects:list:')
     */
    clearByPattern(pattern: string): void {
        const keysToDelete: string[] = [];
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            this.cache.delete(key);
        }
    }
}

export const cache = new SimpleCache();

/**
 * Cache key generators
 */
export const cacheKeys = {
    dashboardStats: (statusFilter?: string) => `dashboard:stats:${statusFilter || 'all'}`,
    projectList: (params: string) => `projects:list:${params}`,
    projectDetail: (id: string) => `project:${id}`,
    projectStatusReport: (year?: string) => `projects:status-report:${year || 'all'}`,
    quotationList: (params: string) => `quotations:list:${params}`,
    quotationDetail: (id: string) => `quotation:${id}`,
};
