import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

describe('TransactionController', () => {
  let controller: TransactionController;
  let transactionService: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: {
            submitTransaction: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    transactionService = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should accept a transaction and return status', async () => {
    const dto = { amount: 50, accountId: '123' };
    const result = await controller.createTransaction(dto);

    const spy = jest.spyOn(transactionService, 'submitTransaction');

    expect(spy).toHaveBeenCalled();
    expect(result).toMatchObject({
      status: 'Accepted',
      id: expect.any(String) as unknown as string,
    });
  });
});
