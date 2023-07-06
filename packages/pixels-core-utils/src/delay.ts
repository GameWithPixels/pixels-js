/**
 * Async delay.
 * @param ms Number of milliseconds to wait.
 * @param abortSignal Optional AbortSignal to interrupt the wait.
 * @returns A promise.
 */
export async function delay(
  ms: number,
  abortSignal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (abortSignal?.aborted) {
      reject(new Error(`Call to delay(${ms}) aborted on start`));
    } else {
      const abort = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Call to delay(${ms}) aborted before timeout`));
      };
      abortSignal?.addEventListener("abort", abort);
      const timeoutId = setTimeout(() => {
        abortSignal?.removeEventListener("abort", abort);
        resolve();
      }, ms);
    }
  });
}
