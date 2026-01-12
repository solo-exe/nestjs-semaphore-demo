export class Semaphore {
  private tasks: (() => void)[] = [];

  constructor(private count: number) {}

  /**
   * Acquires a permit. If no permits are available,
   * returns a Promise that resolves when a permit is released.
   */
  async acquire(): Promise<void> {
    if (this.count > 0) {
      this.count--;
      return Promise.resolve();
    }

    // If no permits, we push the `resolve` function to a queue
    // and wait for someone to call release()
    return new Promise<void>((resolve) => {
      this.tasks.push(resolve);
    });
  }

  /**
   * Releases a permit. If there are waiting tasks,
   * wakes up the next task instead of incrementing the counter.
   */
  release(): void {
    if (this.tasks.length > 0) {
      const nextTask = this.tasks.shift();
      if (nextTask) nextTask(); // Wake up the waiting thread
    } else {
      this.count++;
    }
  }
}
