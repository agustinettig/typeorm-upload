import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from './CreateTransactionService';

interface TransactionToCreate {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryTitle: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactionsToCreate: TransactionToCreate[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, categoryTitle] = line;

      const transaction = {
        title,
        value,
        type,
        categoryTitle,
      };

      transactionsToCreate.push(transaction);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const createTransactionService = new CreateTransactionService();

    const transactions: Transaction[] = [];

    for (const transactionToCreate of transactionsToCreate) {
      const transaction = await createTransactionService.execute(transactionToCreate);
      transactions.push(transaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
