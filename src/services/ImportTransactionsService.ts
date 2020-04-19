import parse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';
import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';

interface Request {
  csvFile: string;
}

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  private getTransactionsFromCSV(
    csvFile: string,
  ): Promise<Array<TransactionDTO>> {
    const filePath = path.resolve(uploadConfig.directory, csvFile);

    const csvReadStream = fs.createReadStream(filePath);

    const parsers = parse({ delimiter: ', ', from_line: 2 });

    const parsed = csvReadStream.pipe(parsers);

    fs.unlink(filePath, error => {
      if (error) throw error;
    });

    return new Promise((resolve, reject) => {
      const transactions: Array<TransactionDTO> = [];
      parsed
        .on('data', line => {
          const [title, type, value, category] = line;

          transactions.push({
            title,
            type,
            value,
            category,
          });
        })
        .on('error', () => {
          reject(new AppError('Error to read from csv file', 500));
        })
        .on('end', () => {
          resolve(transactions);
        });
    });
  }

  async execute({ csvFile }: Request): Promise<Transaction[]> {
    try {
      const createTransaction = new CreateTransactionService();

      let transactionsParsed: TransactionDTO[] = [];

      transactionsParsed = await this.getTransactionsFromCSV(csvFile);

      const transactionsPersisted: Transaction[] = [];

      // eslint-disable-next-line no-restricted-syntax
      for (const transaction of transactionsParsed) {
        // eslint-disable-next-line no-await-in-loop
        const transactionSaved = await createTransaction.execute(transaction);
        transactionsPersisted.push(transactionSaved);
      }

      return transactionsPersisted;
    } catch (error) {
      throw new AppError('Error to read and save transactions', 500);
    }
  }
}

export default ImportTransactionsService;
