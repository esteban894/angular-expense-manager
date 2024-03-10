import { TypeAmount } from './transaction.model';

export interface AddTransactionDto {
  amount: number;
  typeAmount: TypeAmount;
  description: string;
}
