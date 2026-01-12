import { Semaphore } from './semaphore.util';

describe('Semaphore', () => {
  let semaphore: Semaphore;

  beforeEach(() => {
    semaphore = new Semaphore(1);
  });

  it('should be defined', () => {
    expect(semaphore).toBeDefined();
  });

  it('should allow acquiring a permit immediately if available', async () => {
    // Initial count is 1
    const spy = jest.fn();
    await semaphore.acquire().then(spy);
    expect(spy).toHaveBeenCalled();
  });

  it('should block if no permits are available', async () => {
    // Acquire the only permit
    await semaphore.acquire();

    let acquired = false;
    const promise = semaphore.acquire().then(() => {
      acquired = true;
    });

    // Check immediately; it should not be acquired yet
    await new Promise((resolve) => setTimeout(resolve, 10)); // tiny wait
    expect(acquired).toBe(false);

    // Release one
    semaphore.release();

    // Now it should resolve
    await promise;
    expect(acquired).toBe(true);
  });

  it('should handle multiple waiters in order (FIFO)', async () => {
    semaphore = new Semaphore(0); // Start with 0

    const order: number[] = [];
    const p1 = semaphore.acquire().then(() => order.push(1));
    const p2 = semaphore.acquire().then(() => order.push(2));
    const p3 = semaphore.acquire().then(() => order.push(3));

    semaphore.release();
    await new Promise((r) => setTimeout(r, 0)); // tick
    expect(order).toEqual([1]);

    semaphore.release();
    await new Promise((r) => setTimeout(r, 0)); // tick
    expect(order).toEqual([1, 2]);

    semaphore.release();
    await new Promise((r) => setTimeout(r, 0)); // tick
    expect(order).toEqual([1, 2, 3]);

    await Promise.all([p1, p2, p3]);
  });
});
