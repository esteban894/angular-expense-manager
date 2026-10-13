export enum TypeAmount {
  INCOME = 'income',
  EXPENSE_NECESSARY = 'expense_necessary',
  EXPENSE_UNNECESSARY = 'expense_unnecessary',
}

export interface Transaction {
  id: number;
  description: string;
  typeAmount: TypeAmount;
  /** Signed integer cents. */
  amount: number;
  createdAt: string;
}

export interface TransactionFilters {
  type?: TypeAmount;
  search?: string;
  /** YYYY-MM-DD, inclusive. */
  from?: string;
  /** YYYY-MM-DD, inclusive. */
  to?: string;
}

export interface TransactionSummary {
  balance: number;
  income: number;
  expense: number;
  necessary: number;
  unnecessary: number;
  counts: Record<TypeAmount, number>;
}
