import { dispatchPendingValidationJobs, DispatchResult } from "../../lib/services/jobs";

export class OutboxDispatcher {
  private intervalTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private isProcessing = false;
  private pollIntervalMs: number;

  constructor(pollIntervalMs = 3000) {
    this.pollIntervalMs = pollIntervalMs;
  }

  /**
   * Starts the background outbox dispatcher loop.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Trigger immediate pass
    this.tick();

    this.intervalTimer = setInterval(() => {
      this.tick();
    }, this.pollIntervalMs);

    console.log(`[OutboxDispatcher] Started polling every ${this.pollIntervalMs}ms.`);
  }

  /**
   * Executes a single dispatch iteration.
   */
  async tick(): Promise<DispatchResult | null> {
    if (this.isProcessing) return null;
    this.isProcessing = true;

    try {
      const result = await dispatchPendingValidationJobs(10);
      if (result.dispatched > 0) {
        console.log(`[OutboxDispatcher] Dispatched ${result.dispatched} pending job(s) to BullMQ.`);
      }
      return result;
    } catch (err: unknown) {
      console.warn("[OutboxDispatcher] Dispatch tick encountered an error:", err);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Stops the dispatcher loop.
   */
  stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.isRunning = false;
    console.log("[OutboxDispatcher] Stopped.");
  }
}
