import { Component } from '@angular/core';
import { TransactionService } from 'src/app/services/transaction.service';
import { formatCents } from 'src/app/utils/money';

@Component({
  selector: 'app-income-expense',
  templateUrl: './income-expense.component.html',
  styles: [``],
})
export class IncomeExpenseComponent {
  summary$ = this.transactionService.summary$;
  formatCents = formatCents;

  constructor(private transactionService: TransactionService) {}
}
