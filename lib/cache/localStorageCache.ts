/**
 * LocalStorage Cache Utility
 * 
 * Provides TTL-based caching for data persistence between sessions
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

/**
 * Get cached data if valid (not expired)
 * @param key Cache key
 * @param ttl Time to live in milliseconds
 * @returns Cached data or null if expired/not found
 */
export function getCached<T>(key: string, ttl: number): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        const entry: CacheEntry<T> = JSON.parse(cached);
        const age = Date.now() - entry.timestamp;
        
        // Check if expired
        if (age > ttl) {
            localStorage.removeItem(key);
            return null;
        }
        
        return entry.data;
    } catch (error) {
        console.error('Failed to read cache:', error);
        // Remove corrupted cache
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignore errors when removing
        }
        return null;
    }
}

/**
 * Save data to cache with TTL
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in milliseconds
 */
export function setCached<T>(key: string, data: T, ttl: number): void {
    if (typeof window === 'undefined') return;
    
    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl,
        };
        localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
        console.error('Failed to save cache:', error);
        // Handle quota exceeded
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.warn('LocalStorage quota exceeded, clearing all cache');
            clearAllCache();
            // Retry once after clearing
            try {
                const entry: CacheEntry<T> = {
                    data,
                    timestamp: Date.now(),
                    ttl,
                };
                localStorage.setItem(key, JSON.stringify(entry));
            } catch (retryError) {
                console.error('Failed to save cache after clearing:', retryError);
            }
        }
    }
}

/**
 * Remove specific cache entry
 * @param key Cache key
 */
export function clearCache(key: string): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Failed to clear cache:', error);
    }
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Failed to clear all cache:', error);
    }
}

/**
 * Check if cache exists and is valid
 * @param key Cache key
 * @param ttl Time to live in milliseconds
 * @returns true if cache exists and is valid
 */
export function hasValidCache(key: string, ttl: number): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return false;
        
        const entry: CacheEntry<unknown> = JSON.parse(cached);
        const age = Date.now() - entry.timestamp;
        
        return age <= ttl;
    } catch {
        return false;
    }
}
