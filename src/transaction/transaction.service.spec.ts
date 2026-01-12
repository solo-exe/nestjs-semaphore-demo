import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { Transaction } from './transaction.model';

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionService],
    }).compile();

    service = module.get<TransactionService>(TransactionService);

    // We want to control the consumption speed for some tests,
    // or at least know it's running.
    // The service starts the loop in onModuleInit usually,
    // but in tests we might need to manually trigger it if we don't call init.
    // However, `Test.createTestingModule(...).compile()` does NOT call onModuleInit automatically.
    // We usually need `await module.init()` or call it manually.

    // Mock the actual business logic to speed up tests and avoid real timeouts
    (service as any).executeBusinessLogic = jest.fn(async () => {
      // Fast execution for tests
      return Promise.resolve();
    });

    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process a single transaction', async () => {
    const tx: Transaction = {
      id: '1',
      amount: 100,
      accountId: 'acc1',
      timestamp: new Date(),
    };

    const spy = jest.spyOn(service as any, 'executeBusinessLogic');

    await service.submitTransaction(tx);

    // Give consumer loop a tick to pick it up
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(spy).toHaveBeenCalledWith(tx);
  });

  it('should handle bulk requests respecting buffer capacity', async () => {
    // Restore the slow original logic or specific mock logic if needed?
    // Let's keep the fast mock but maybe add a tiny delay to simulate "processing"
    // so we can test concurrency if needed.
    // For this test, fast processing is fine, we just want to ensure all go through.

    const totalTransactions = 50;
    const transactions: Transaction[] = Array.from({
      length: totalTransactions,
    }).map((_, i) => ({
      id: `tx-${i}`,
      amount: i,
      accountId: `acc-${i}`,
      timestamp: new Date(),
    }));

    const processedIds: string[] = [];

    // Mock the actual business logic to speed up tests and avoid real timeouts
    (service as any).executeBusinessLogic = jest.fn(async (tx: Transaction) => {
      processedIds.push(tx.id);
      // minimal delay to allow context switching
      await new Promise((r) => setTimeout(r, 1));
    });

    // Fire all submissions in parallel
    // Since buffer is 10, the first 10 will await space immediately?
    // No, the first 10 fill the buffer. The 11th will await at `this.spaces.acquire()`.
    await Promise.all(transactions.map((tx) => service.submitTransaction(tx)));

    // Verify all were processed
    // We might need to wait a bit for the consumer loop to finish the last items
    // since submitTransaction returns as soon as it's *in the buffer*, not when processed.

    // Wait for the consumer to catch up
    let retries = 0;
    while (processedIds.length < totalTransactions && retries < 20) {
      await new Promise((r) => setTimeout(r, 100));
      retries++;
    }

    expect(processedIds.length).toBe(totalTransactions);

    // Ensure order is roughly preserved (Semaphore is FIFO, Array push/shift is FIFO)
    expect(processedIds[0]).toBe('tx-0');
    expect(processedIds[totalTransactions - 1]).toBe(
      `tx-${totalTransactions - 1}`,
    );
  });
});
