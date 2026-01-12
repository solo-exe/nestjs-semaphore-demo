import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Transaction } from './transaction.model';
import { Semaphore } from '../util/semaphore.util';

@Injectable()
export class TransactionService implements OnModuleInit {
  private readonly logger = new Logger(TransactionService.name);

  /**
   * Number of transactions that can be in the buffer at once
   * Could be populated sequentially from a queue == Redis and BullMQ
   */
  private readonly BUFFER_CAPACITY = 10;
  private readonly buffer: Transaction[] = [];

  // Semaphores
  private readonly items = new Semaphore(0); // Starts with 0 items
  private readonly spaces = new Semaphore(this.BUFFER_CAPACITY); // Starts with full capacity
  private readonly mutex = new Semaphore(1); // Mutual exclusion for buffer operations

  // Initialize the Consumer loop when the module starts.
  onModuleInit() {
    this.startConsumerLoop();
  }

  /**
   * PRODUCER: Called by the Controller.
   * This will PAUSE (await) if the buffer is full.
   */
  async submitTransaction(transaction: Transaction): Promise<void> {
    this.logger.log(`Attempting to submit tx: ${transaction.id}`);

    // Wait for space. If buffer is full (10), this await holds here.
    await this.spaces.acquire();

    // Critical Section: Add to buffer
    await this.mutex.acquire();
    try {
      this.buffer.push(transaction);
      this.logger.log(`Transaction Added. Buffer size: ${this.buffer.length}`);
    } finally {
      this.mutex.release();
    }

    // Signal that a new transaction is available for the consumer
    this.items.release();
  }

  /**
   * CONSUMER: Runs continuously in the background.
   */
  private startConsumerLoop() {
    // We start a non-blocking loop
    process.nextTick(async () => {
      while (true) {
        try {
          await this.processNextTransaction();
        } catch (error) {
          this.logger.error('Error in consumer loop', error);
        }
      }
    });
  }

  private async processNextTransaction() {
    // Wait for transaction. If buffer is empty, this await holds here.
    await this.items.acquire();

    let transaction: Transaction | undefined;

    // Critical Section: Remove from buffer
    await this.mutex.acquire();
    try {
      transaction = this.buffer.shift();
    } finally {
      this.mutex.release();
    }

    // Signal that a space has opened up
    this.spaces.release();

    if (transaction) {
      await this.executeBusinessLogic(transaction);
    }
  }

  // Run Business Logic
  protected async executeBusinessLogic(transaction: Transaction) {
    this.logger.log(`PROCESSING tx: ${transaction.id}...`);

    // Simulate latency (500ms processing time)
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.logger.log(`COMPLETED tx: ${transaction.id}`);
  }
}
