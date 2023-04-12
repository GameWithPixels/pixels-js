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
 * @param onResolved Called with the value returned by the resolved promise.
 * @param onRejected Called when all retries have failed.
 * @param onWillRetry Called before scheduling a retry.
 */
export async function exponentialBackOff(
  retries: number,
  delayMs: number,
  executor: () => Promise<unknown>,
  onResolved?: (result: unknown) => void,
  onRejected?: (error: unknown) => void,
  onWillRetry?: (delay: number, retriesLeft: number) => void
): Promise<void> {
  try {
    const result = await executor();
    onResolved?.(result);
  } catch (error) {
    if (retries !== 0) {
      onWillRetry?.(delayMs, retries);
      await delay(delayMs);
      await exponentialBackOff(
        retries - 1,
        delayMs * 2,
        executor,
        onResolved,
        onRejected
      );
    } else {
      onRejected?.(error);
      throw error;
    }
  }
}
