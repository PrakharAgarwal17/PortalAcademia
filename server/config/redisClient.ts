import { Redis } from "ioredis";

// In-Memory Fallback Cache Store
interface MemoryCacheEntry {
    value: any;
    expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();

let redisClient: Redis | null = null;
let isRedisConnected = false;
let hasLoggedDisconnectWarning = false;

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

try {
    redisClient = new Redis(REDIS_URL, {
        lazyConnect: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        enableOfflineQueue: false,
        retryStrategy(times: number) {
            if (times > 2) {
                // Redis is not running locally; gracefully discontinue reconnect loops and use in-memory cache
                return null;
            }
            if (times === 1 && !hasLoggedDisconnectWarning) {
                console.log("ℹ️  Redis server not reachable locally — seamless in-memory cache active.");
                hasLoggedDisconnectWarning = true;
            }
            return 2000;
        },
    });

    redisClient.on("connect", () => {
        isRedisConnected = true;
        hasLoggedDisconnectWarning = false;
        console.log("⚡ Connected to Redis Cache successfully.");
    });

    redisClient.on("ready", () => {
        isRedisConnected = true;
        hasLoggedDisconnectWarning = false;
        console.log("⚡ Redis Cache is READY and ACTIVE.");
    });

    redisClient.on("error", (err: any) => {
        isRedisConnected = false;
        if (!hasLoggedDisconnectWarning) {
            console.warn(`⚠️  Redis connection standby (${err.code || err.message}). Fallback to in-memory cache active.`);
            hasLoggedDisconnectWarning = true;
        }
    });

    redisClient.on("close", () => {
        isRedisConnected = false;
    });
} catch (err) {
    redisClient = null;
    isRedisConnected = false;
    console.warn("⚠️  Could not initialize Redis client, falling back to in-memory caching.");
}

/**
 * Clean expired in-memory cache entries periodically (every 5 minutes)
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryCache.entries()) {
        if (entry.expiresAt && entry.expiresAt <= now) {
            memoryCache.delete(key);
        }
    }
}, 5 * 60 * 1000).unref();

/**
 * Retrieve cached JSON value by key
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
    try {
        if (isRedisConnected && redisClient) {
            const raw = await redisClient.get(key);
            if (raw) {
                return JSON.parse(raw) as T;
            }
            return null;
        }
    } catch (err) {
        // Fall back to memory cache on any redis failure
    }

    // In-memory fallback
    const mem = memoryCache.get(key);
    if (!mem) return null;
    if (mem.expiresAt && mem.expiresAt <= Date.now()) {
        memoryCache.delete(key);
        return null;
    }
    return mem.value as T;
}

/**
 * Set cached JSON value with TTL in seconds (default: 300 seconds / 5 minutes)
 */
export async function setCache(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
        if (isRedisConnected && redisClient) {
            const serialized = JSON.stringify(value);
            if (ttlSeconds > 0) {
                await redisClient.set(key, serialized, "EX", ttlSeconds);
            } else {
                await redisClient.set(key, serialized);
            }
            return;
        }
    } catch (err) {
        // Fall back to memory cache
    }

    // In-memory fallback
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
    memoryCache.set(key, { value, expiresAt });
}

/**
 * Delete cache key or keys matching pattern/prefix
 */
export async function deleteCache(keyOrPrefix: string): Promise<void> {
    try {
        if (isRedisConnected && redisClient) {
            if (keyOrPrefix.includes("*")) {
                const keys = await redisClient.keys(keyOrPrefix);
                if (keys.length > 0) {
                    await redisClient.del(...keys);
                }
            } else {
                await redisClient.del(keyOrPrefix);
            }
        }
    } catch (err) {
        // Continue to memory cache cleanup
    }

    // In-memory cleanup
    if (keyOrPrefix.includes("*")) {
        const prefix = keyOrPrefix.replace("*", "");
        for (const key of memoryCache.keys()) {
            if (key.startsWith(prefix)) {
                memoryCache.delete(key);
            }
        }
    } else {
        memoryCache.delete(keyOrPrefix);
    }
}

/**
 * Check if Redis is currently connected
 */
export function isRedisAvailable(): boolean {
    return isRedisConnected;
}

export default redisClient;
