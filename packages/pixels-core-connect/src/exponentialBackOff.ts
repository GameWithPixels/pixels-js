import { delay } from "@systemic-games/pixels-core-utils";

/**
 * Repeatedly calls the executor until the later returns a resolved promise
 * or it has reached the maximum number or retries.
 * A retry is attempted after getting an exception from the executor and once
 * past the given delay (starting at the time of the exception).
 *
 * @param retries Maximum number of retries.
 * @param delayMs Delay in milliseconds between getting an exception and attempting a retry.
 * @param executor The function to run. It should return a promise and raise an exception
 *                 if there unsuccessful.
 * @param opt.onResolved Called with the value returned by the resolved promise.
 * @param opt.onRejected Called when all retries have failed.
 * @param opt.onWillRetry Called before scheduling a retry.
 */
export async function exponentialBackOff(
  retries: number,
  delayMs: number,
  executor: () => Promise<unknown>,
  opt?: {
    onResolved?: (result: unknown) => void;
    onRejected?: (error: unknown) => void;
    onWillRetry?: (delay: number, retriesLeft: number, error: unknown) => void;
  }
): Promise<void> {
  try {
    const result = await executor();
    opt?.onResolved?.(result);
  } catch (error) {
    if (retries !== 0) {
      opt?.onWillRetry?.(delayMs, retries, error);
      await delay(delayMs);
      await exponentialBackOff(retries - 1, delayMs * 2, executor, opt);
    } else {
      opt?.onRejected?.(error);
      throw error;
    }
  }
}
