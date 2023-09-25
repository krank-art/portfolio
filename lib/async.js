export async function getAsyncValue() {
  return Promise.resolve(42);
}

export function debounce(func, delay) {
  let timeoutId;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(function () {
      func.apply(context, args);
    }, delay);
  };
}

export class AsyncQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async enqueue(task) {
    this.queue.push(task);
    if (this.isProcessing) return;
    await this.processQueue();
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const task = this.queue.shift();

    try {
      await task();
    } catch (error) {
      console.error('Error executing task:', error);
    }

    // Process the next task in the queue after a short delay (e.g., 10ms).
    // This allows other tasks to be enqueued in the meantime.
    setTimeout(() => {
      this.processQueue();
    }, 10);
  }

  clear() {
    this.queue = [];
  }
}

/* Example usage:
 *   ```js
 *   const asyncQueue = new AsyncQueue();
 *   
 *   function exampleTask(data) {
 *     return new Promise((resolve) => {
 *       setTimeout(() => {
 *         console.log(`Task completed: ${data}`);
 *         resolve();
 *       }, 1000);
 *     });
 *   }
 *   
 *   // Enqueue tasks based on events
 *   asyncQueue.enqueue(() => exampleTask('Task 1'));
 *   asyncQueue.enqueue(() => exampleTask('Task 2'));
 *   
 *   // Clear the queue asynchronously after some time
 *   setTimeout(() => {
 *     asyncQueue.clear();
 *     console.log('Queue cleared');
 *   }, 2000);
 *   ```
 */

export function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
}

export function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
