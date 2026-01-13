// In-memory job store (replace with Redis/BullMQ in production)
interface Job {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  position?: number;
  photoUrl: string;
  transformedPhotoUrl?: string;
  name: string;
  company: string;
  commitment: string;
  createdAt: Date;
  error?: string;
}

const jobs = new Map<string, Job>();

export function createJob(data: Omit<Job, "id" | "status" | "progress" | "createdAt">): string {
  const id = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  jobs.set(id, {
    ...data,
    id,
    status: "pending",
    progress: 0,
    createdAt: new Date(),
  });

  // Simulate processing in background
  simulateProcessing(id);

  return id;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, updates: Partial<Job>): void {
  const job = jobs.get(id);
  if (job) {
    jobs.set(id, { ...job, ...updates });
  }
}

// Simulate AI processing (replace with real API in production)
async function simulateProcessing(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  // Update to processing
  updateJob(jobId, { status: "processing", progress: 10 });
  await delay(1000);

  // Simulate progress
  for (let progress = 20; progress <= 90; progress += 20) {
    updateJob(jobId, { progress });
    await delay(800);
  }

  // In a real implementation, this would call Replicate/Fal.ai API
  // For now, we just use the original photo
  updateJob(jobId, {
    status: "completed",
    progress: 100,
    transformedPhotoUrl: job.photoUrl, // In production: actual AI-transformed image
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Cleanup old jobs (run periodically in production)
export function cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  const now = new Date();
  for (const [id, job] of jobs) {
    if (now.getTime() - job.createdAt.getTime() > maxAgeMs) {
      jobs.delete(id);
    }
  }
}
