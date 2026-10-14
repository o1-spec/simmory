import {
  dispatchPendingValidationJobs,
  dispatchPendingAiAnalysisJobs,
  DispatchResult,
} from "../../lib/services/jobs";
import { logger } from "../../lib/logger";

export class OutboxDispatcher {
  private intervalTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private isProcessing = false;
  private pollIntervalMs: number;

  constructor(pollIntervalMs = 3000) {
    this.pollIntervalMs = pollIntervalMs;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.tick();

    this.intervalTimer = setInterval(() => {
      this.tick();
    }, this.pollIntervalMs);

    logger.info(`[OutboxDispatcher] Started polling every ${this.pollIntervalMs}ms.`);
  }

  async tick(): Promise<DispatchResult | null> {
    if (this.isProcessing) return null;
    this.isProcessing = true;

    try {
      const [validationResult, aiResult] = await Promise.all([
        dispatchPendingValidationJobs(10),
        dispatchPendingAiAnalysisJobs(10),
      ]);

      const totalDispatched = validationResult.dispatched + aiResult.dispatched;
      if (totalDispatched > 0) {
        logger.info(
          `[OutboxDispatcher] Dispatched ${totalDispatched} job(s) (Validation: ${validationResult.dispatched}, AI: ${aiResult.dispatched}) to BullMQ.`
        );
      }

      return {
        dispatched: totalDispatched,
        failed: validationResult.failed + aiResult.failed,
        errors: [...validationResult.errors, ...aiResult.errors],
      };
    } catch (err: unknown) {
      logger.warn("[OutboxDispatcher] Dispatch tick encountered an error", { error: err });
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.isRunning = false;
    logger.info("[OutboxDispatcher] Stopped.");
  }
}
