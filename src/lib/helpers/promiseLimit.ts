class Semaphore {
  private maxConcurrency: number;
  private currentConcurrency: number;
  private queue: (() => void)[];

  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency;
    this.currentConcurrency = 0;
    this.queue = [];
  }

  async acquire() {
    return new Promise<void>((resolve) => {
      if (this.currentConcurrency < this.maxConcurrency) {
        this.currentConcurrency++;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    const resolve = this.queue.shift();
    if (resolve) {
      resolve();
    } else {
      this.currentConcurrency--;
    }
  }
}

const promiseLimit = async <T>(
  n: number,
  list: (() => Promise<T>)[]
): Promise<T[]> => {
  const semaphore = new Semaphore(n);
  const results: T[] = [];

  const limitedFn = async (
    fn: () => Promise<T>,
    index: number
  ): Promise<void> => {
    await semaphore.acquire();
    try {
      const result = await fn();
      results[index] = result;
    } finally {
      semaphore.release();
    }
  };

  const promises = list.map(limitedFn);
  await Promise.all(promises);

  return results;
};

export default promiseLimit;
