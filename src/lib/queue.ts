import { Redis } from "@upstash/redis";

// Initialize Redis client (will use env vars UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)
const getRedis = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
};

const QUEUE_KEY = "transform_queue";
const PROCESSING_KEY = "transform_processing";
const MAX_CONCURRENT = 100; // Maximum concurrent transformations (Vercel Pro supports 1000)
const QUEUE_ITEM_TTL = 300; // 5 minutes TTL for queue items

// Lua script for atomic startProcessing operation
// This prevents race condition where multiple requests pass the MAX_CONCURRENT check simultaneously
const START_PROCESSING_SCRIPT = `
local processingKey = KEYS[1]
local queueKey = KEYS[2]
local maxConcurrent = tonumber(ARGV[1])
local queueId = ARGV[2]

local currentCount = redis.call('SCARD', processingKey)
if currentCount >= maxConcurrent then
  return 0
end

redis.call('ZREM', queueKey, queueId)
redis.call('SADD', processingKey, queueId)
return 1
`;

export interface QueueItem {
  id: string;
  timestamp: number;
  status: "waiting" | "processing" | "completed" | "failed";
}

export interface QueueStatus {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number; // in seconds
  status: "waiting" | "processing" | "ready" | "disabled";
  currentProcessing: number;
}

// Generate unique queue ID
export function generateQueueId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Join the queue
export async function joinQueue(queueId: string): Promise<QueueStatus> {
  const redis = getRedis();

  // If Redis is not configured, return "disabled" status (allow immediate processing)
  if (!redis) {
    return {
      position: 0,
      totalInQueue: 0,
      estimatedWaitTime: 0,
      status: "disabled",
      currentProcessing: 0,
    };
  }

  const now = Date.now();

  // Add to queue with timestamp as score
  await redis.zadd(QUEUE_KEY, { score: now, member: queueId });

  // Set TTL for this item (auto-cleanup)
  await redis.set(`queue_item:${queueId}`, { id: queueId, timestamp: now, status: "waiting" }, { ex: QUEUE_ITEM_TTL });

  return getQueueStatus(queueId);
}

// Get current queue status for a specific ID
export async function getQueueStatus(queueId: string): Promise<QueueStatus> {
  const redis = getRedis();

  // If Redis is not configured, return "disabled" status
  if (!redis) {
    return {
      position: 0,
      totalInQueue: 0,
      estimatedWaitTime: 0,
      status: "disabled",
      currentProcessing: 0,
    };
  }

  // Get position in queue (0-indexed)
  const position = await redis.zrank(QUEUE_KEY, queueId);

  // Get total queue size
  const totalInQueue = await redis.zcard(QUEUE_KEY);

  // Get current processing count
  const currentProcessing = await redis.scard(PROCESSING_KEY);

  // If not in queue, might be already processing or completed
  if (position === null) {
    const isProcessing = await redis.sismember(PROCESSING_KEY, queueId);
    if (isProcessing) {
      return {
        position: 0,
        totalInQueue: totalInQueue || 0,
        estimatedWaitTime: 0,
        status: "processing",
        currentProcessing: currentProcessing || 0,
      };
    }

    // Not found anywhere - might be completed or expired
    return {
      position: 0,
      totalInQueue: totalInQueue || 0,
      estimatedWaitTime: 0,
      status: "ready",
      currentProcessing: currentProcessing || 0,
    };
  }

  // Calculate estimated wait time (assume ~10 seconds per transformation)
  const effectivePosition = Math.max(0, position - MAX_CONCURRENT + (currentProcessing || 0));
  const estimatedWaitTime = Math.ceil(effectivePosition * 10);

  // Check if ready to process
  const canProcess = position < MAX_CONCURRENT && (currentProcessing || 0) < MAX_CONCURRENT;

  return {
    position: position + 1, // 1-indexed for display
    totalInQueue: totalInQueue || 0,
    estimatedWaitTime,
    status: canProcess ? "ready" : "waiting",
    currentProcessing: currentProcessing || 0,
  };
}

// Start processing (move from queue to processing set) - ATOMIC VERSION
// Uses Lua script to prevent race condition
export async function startProcessing(queueId: string): Promise<boolean> {
  const redis = getRedis();

  // If Redis is not configured, allow processing
  if (!redis) {
    return true;
  }

  try {
    // Execute Lua script for atomic operation
    const result = await redis.eval(
      START_PROCESSING_SCRIPT,
      [PROCESSING_KEY, QUEUE_KEY],
      [MAX_CONCURRENT.toString(), queueId]
    ) as number;

    if (result === 1) {
      // Successfully added to processing, set TTL for auto-cleanup
      await redis.set(`processing_time:${queueId}`, Date.now(), { ex: 120 }); // 2 min max processing time
    }

    return result === 1;
  } catch (error) {
    console.error("Error in startProcessing:", error);
    // Fallback to non-atomic version if Lua script fails
    const currentProcessing = await redis.scard(PROCESSING_KEY);
    if ((currentProcessing || 0) >= MAX_CONCURRENT) {
      return false;
    }
    await redis.zrem(QUEUE_KEY, queueId);
    await redis.sadd(PROCESSING_KEY, queueId);
    return true;
  }
}

// Complete processing (remove from processing set)
export async function completeProcessing(queueId: string): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  await redis.srem(PROCESSING_KEY, queueId);
  await redis.del(`queue_item:${queueId}`);
  await redis.del(`processing_time:${queueId}`);
}

// Leave queue (cleanup if user navigates away)
export async function leaveQueue(queueId: string): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  await redis.zrem(QUEUE_KEY, queueId);
  await redis.srem(PROCESSING_KEY, queueId);
  await redis.del(`queue_item:${queueId}`);
  await redis.del(`processing_time:${queueId}`);
}

// Get overall queue stats (for admin/monitoring)
export async function getQueueStats(): Promise<{ queueSize: number; processing: number }> {
  const redis = getRedis();

  if (!redis) {
    return { queueSize: 0, processing: 0 };
  }

  const queueSize = await redis.zcard(QUEUE_KEY);
  const processing = await redis.scard(PROCESSING_KEY);

  return {
    queueSize: queueSize || 0,
    processing: processing || 0,
  };
}

// Cleanup zombie processing items (items that have been processing for too long)
// Call this before events or periodically to clean up stale items
export async function cleanupZombieProcessing(): Promise<number> {
  const redis = getRedis();

  if (!redis) {
    return 0;
  }

  let cleanedCount = 0;

  try {
    // Get all items in processing set
    const processingItems = await redis.smembers(PROCESSING_KEY);

    for (const queueId of processingItems) {
      // Check if this item has a valid processing_time key
      const processingTime = await redis.get(`processing_time:${queueId}`);

      if (!processingTime) {
        // No processing time recorded - this is a zombie
        await redis.srem(PROCESSING_KEY, queueId);
        cleanedCount++;
        console.log(`Cleaned up zombie processing item: ${queueId}`);
      }
    }

    return cleanedCount;
  } catch (error) {
    console.error("Error cleaning up zombie processing:", error);
    return cleanedCount;
  }
}

// Reset all queue data (use before events to ensure clean state)
export async function resetQueue(): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  await redis.del(QUEUE_KEY);
  await redis.del(PROCESSING_KEY);
  console.log("Queue reset complete");
}
