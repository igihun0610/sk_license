import { Redis } from "@upstash/redis";

const API_KEY_COUNTER = "api_key_counter";
const FAILED_KEYS_SET = "failed_api_keys";
const FAILED_KEY_TTL = 60; // 60 seconds cooldown for failed keys

// Get Redis client
const getRedis = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
};

// Parse API keys from environment variable
export function getApiKeys(): string[] {
  // Try comma-separated keys first
  const keysString = process.env.GOOGLE_API_KEYS;
  if (keysString) {
    return keysString.split(",").map(k => k.trim()).filter(k => k.length > 0);
  }

  // Fallback to single key
  const singleKey = process.env.GOOGLE_API_KEY;
  if (singleKey) {
    return [singleKey.trim()];
  }

  return [];
}

// Get next API key using Round-Robin with Redis
export async function getNextKey(): Promise<string | null> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    console.error("No API keys configured");
    return null;
  }

  const redis = getRedis();

  // If Redis is not available, use random selection
  if (!redis) {
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
  }

  try {
    // Atomic increment counter
    const counter = await redis.incr(API_KEY_COUNTER);
    const index = (counter - 1) % keys.length;

    // Check if key is in failed state
    const failedKeys = await redis.smembers(FAILED_KEYS_SET);

    // Try to find a non-failed key
    for (let i = 0; i < keys.length; i++) {
      const tryIndex = (index + i) % keys.length;
      const key = keys[tryIndex];

      if (!failedKeys.includes(key)) {
        return key;
      }
    }

    // All keys failed, return the original one anyway (might have recovered)
    return keys[index];
  } catch (error) {
    console.error("Redis error in getNextKey:", error);
    // Fallback to random selection
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
  }
}

// Mark a key as temporarily failed
export async function markKeyFailed(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.sadd(FAILED_KEYS_SET, key);
    // Set expiry on the key entry (auto-recovery after TTL)
    await redis.expire(FAILED_KEYS_SET, FAILED_KEY_TTL);
    console.log(`Marked API key as failed (cooldown ${FAILED_KEY_TTL}s): ${key.substring(0, 10)}...`);
  } catch (error) {
    console.error("Failed to mark key as failed:", error);
  }
}

// Get a different key (for retry after failure)
export async function getAlternativeKey(excludeKey: string): Promise<string | null> {
  const keys = getApiKeys();
  if (keys.length <= 1) {
    return null; // No alternative available
  }

  const redis = getRedis();

  // Filter out the excluded key
  const availableKeys = keys.filter(k => k !== excludeKey);

  if (!redis) {
    // Random selection from remaining keys
    const randomIndex = Math.floor(Math.random() * availableKeys.length);
    return availableKeys[randomIndex];
  }

  try {
    const failedKeys = await redis.smembers(FAILED_KEYS_SET);

    // Find first non-failed alternative key
    for (const key of availableKeys) {
      if (!failedKeys.includes(key)) {
        return key;
      }
    }

    // All alternatives failed, return any alternative
    return availableKeys[0];
  } catch (error) {
    console.error("Redis error in getAlternativeKey:", error);
    const randomIndex = Math.floor(Math.random() * availableKeys.length);
    return availableKeys[randomIndex];
  }
}

// Get API key stats (for monitoring)
export async function getKeyStats(): Promise<{
  totalKeys: number;
  failedKeys: number;
  counter: number;
}> {
  const keys = getApiKeys();
  const redis = getRedis();

  if (!redis) {
    return { totalKeys: keys.length, failedKeys: 0, counter: 0 };
  }

  try {
    const failedKeys = await redis.scard(FAILED_KEYS_SET);
    const counter = await redis.get(API_KEY_COUNTER) as number || 0;

    return {
      totalKeys: keys.length,
      failedKeys: failedKeys || 0,
      counter,
    };
  } catch (error) {
    console.error("Failed to get key stats:", error);
    return { totalKeys: keys.length, failedKeys: 0, counter: 0 };
  }
}
