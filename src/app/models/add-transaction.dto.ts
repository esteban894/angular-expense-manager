import { TypeAmount } from './transaction.model';

export interface AddTransactionDto {
  /** Positive integer cents. */
  amount: number;
  typeAmount: TypeAmount;
  description: string;
}
