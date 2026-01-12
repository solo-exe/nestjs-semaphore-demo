import { Controller, Post, Body } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import * as crypto from 'crypto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly bufferService: TransactionService) {}

  @Post()
  async createTransaction(@Body() body: { amount: number; accountId: string }) {
    const id = crypto.randomUUID();
    const tx = {
      id,
      amount: body.amount,
      accountId: body.accountId,
      timestamp: new Date(),
    };

    // This call might wait if the buffer is full!
    // In a real API, you might want to wrap this in a timeout
    // to return a 503 Service Unavailable if the buffer is full for too long.
    await this.bufferService.submitTransaction(tx);

    return { status: 'Accepted', id: tx.id };
  }
}
