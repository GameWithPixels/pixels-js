/**
 * This function keeps calling the executor until the promise it returns has resolved
 * or it has reached the maximum number or retries.
 * A retry is attempted after getting an exception from the executor and once past the given
 * delay (starting at the time of the exception).
 *
 * See auto-reconnect code from Google:
 * https://googlechrome.github.io/samples/web-bluetooth/automatic-reconnect-async-await.html
 *
 * @param retries Maximum number of retries.
 * @param delayMs Delay in milliseconds between getting an exception and attempting a retry.
 * @param executor The function to run. It should return a promise and raise an exception
 *                 if there unsuccessful.
 * @param resolved Called with the value returned by the resolved promise.
 * @param failed Called all retries have failed.
 */
export default async function exponentialBackOff(
  retries: number,
  delayMs: number,
  executor: () => Promise<unknown>,
  resolved?: (_result: unknown) => void,
  failed?: (_error: unknown) => void
): Promise<void> {
  try {
    const result = await executor();
    if (resolved) {
      resolved(result);
    }
  } catch (error) {
    if (retries !== 0) {
      //console.log(`Retrying in ${delay}ms... (${retries} tries left)`);
      await delay(delayMs);
      await exponentialBackOff(
        retries - 1,
        delayMs * 2,
        executor,
        resolved,
        failed
      );
    } else if (failed) {
      //console.log(`Got error ${error}`);
      failed(error);
    }
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
