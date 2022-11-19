/**
 * Async delay (based on setTimeout()).
 * @param ms Number of milliseconds to wait.
 * @returns A promise that resolves once the delay has elapsed.
 */
export default async function (ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
