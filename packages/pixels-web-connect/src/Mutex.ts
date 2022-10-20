/**
 * A Mutex class using Promises.
 *
 * See https://spin.atomicobject.com/2018/09/10/javascript-concurrency/
 */
export default class Mutex {
  private mutex = Promise.resolve();

  // Lock the mutex and return the function to unlock it
  lock(): Promise<() => void> {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let executor = (_resolve: () => void) => {};

    // Update the mutex (note: the fulfillment handler will be called asynchronously)
    this.mutex = this.mutex.then(() => {
      // This is called asynchronously, once the promise below has run
      // so "executor" has already been updated to the resolution handler
      // of the promised returned by lock()
      // This promise will resolve only once the function returned by the lock()
      // promise is run
      return new Promise(executor);
    });

    // The returned promise set the above mutex promise executor to it's resolution function,
    // meaning that the result of this promise will be the mutex promise's own resolution function
    return new Promise((resolve) => {
      executor = resolve;
    });
  }

  // Call the given function or promise while holding the mutex' lock
  async dispatch<T>(fn: (() => T) | (() => PromiseLike<T>)): Promise<T> {
    const unlock = await this.lock();
    try {
      return await Promise.resolve(fn());
    } finally {
      unlock();
    }
  }
}
