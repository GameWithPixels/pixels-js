/**
 * Async delay.
 * @param ms Number of milliseconds to wait.
 * @returns A promise.
 */
export default async function (ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
