export interface QueueJob {
  name: string;
  payload: Record<string, unknown>;
}

export interface JobQueue {
  enqueue(job: QueueJob): Promise<{ id: string; status: "queued" | "processing" }>;
}

/** In-process queue ready to swap for BullMQ/Redis later. */
export class InProcessQueue implements JobQueue {
  async enqueue(job: QueueJob) {
    const id = `${job.name}-${Date.now()}`;
    // Fire-and-forget placeholder — workers will consume from Redis/BullMQ in future.
    console.info("[queue]", id, job.name);
    return { id, status: "queued" as const };
  }
}

export const jobQueue: JobQueue = new InProcessQueue();
