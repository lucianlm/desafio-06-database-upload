import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const incomes = await this.find({
      where: { type: 'income' },
    });
    const ins = incomes.reduce((acc, curr) => {
      return acc + curr.value;
    }, 0);
    const outcomes = await this.find({
      where: { type: 'outcome' },
    });
    const outs = outcomes.reduce((acc, curr) => {
      return acc + curr.value;
    }, 0);

    const balance = {
      income: ins,
      outcome: outs,
      total: ins - outs,
    };

    return balance;
  }
}

export default TransactionsRepository;
