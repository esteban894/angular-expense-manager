export enum TypeAmount {
  INCOME = 'income',
  EXPENSE_NECESSARY = 'expense_necessary',
  EXPENSE_UNNECESSARY = 'expense_unnecessary',
}

export interface Transaction {
  id: number;
  description: string;
  typeAmount: TypeAmount;
  amount: number;
}
