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
const MAX_CONCURRENT = 50; // Maximum concurrent transformations (Vercel Pro supports 1000)
const QUEUE_ITEM_TTL = 300; // 5 minutes TTL for queue items

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

// Start processing (move from queue to processing set)
export async function startProcessing(queueId: string): Promise<boolean> {
  const redis = getRedis();

  // If Redis is not configured, allow processing
  if (!redis) {
    return true;
  }

  const currentProcessing = await redis.scard(PROCESSING_KEY);

  // Check if we can start processing
  if ((currentProcessing || 0) >= MAX_CONCURRENT) {
    return false;
  }

  // Remove from queue and add to processing set
  await redis.zrem(QUEUE_KEY, queueId);
  await redis.sadd(PROCESSING_KEY, queueId);

  // Set TTL for processing item (auto-cleanup if client disconnects)
  await redis.expire(`processing:${queueId}`, 60); // 60 seconds max processing time

  return true;
}

// Complete processing (remove from processing set)
export async function completeProcessing(queueId: string): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  await redis.srem(PROCESSING_KEY, queueId);
  await redis.del(`queue_item:${queueId}`);
  await redis.del(`processing:${queueId}`);
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
  await redis.del(`processing:${queueId}`);
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
