/**
 * Simple queue of promises, which are run one after the other.
 */
export default class SequentialPromiseQueue {
  private readonly _queue: (() => Promise<void>)[] = [];

  /**
   * Run the given promise once any other promise given to previous
   * calls of this function have settled.
   * Another promise is returned with its state matching the state of
   * the given promise. This can be used to wait on the given promise
   * to be settled.
   * @param promise The promise to run.
   * @returns A promise matching the state of the promise given to be run.
   */
  run(promise: () => Promise<void>): Promise<void> {
    // Create a new promise to be returned
    return new Promise<void>((resolve, reject) => {
      // The task to run, it will be queued
      const task = async () => {
        // First run the given promise
        try {
          await promise();
          resolve();
        } catch (err) {
          reject(err);
        }
        // Remove ourselves from the queue
        //assert(this._queue.indexOf(task) === 0, "Running wrong promise");
        this._queue.shift();
        // Run next task if any
        this._queue[0]?.();
      };
      // Queue our task
      this._queue.push(task);
      if (this._queue.length === 1) {
        // And run it if it's the only one if the queue
        // (if not, the currently running task will take care of running
        // the next one once it completes)
        this._queue[0]?.();
      }
    });
  }
}
