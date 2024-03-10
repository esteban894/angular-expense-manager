import { Component, OnInit } from '@angular/core';
import { TransactionService } from 'src/app/services/transaction.service';

@Component({
  selector: 'app-income-expense',
  templateUrl: './income-expense.component.html',
  styles: [``],
})
export class IncomeExpenseComponent implements OnInit {
  transactions: any[] = [];
  amounts: number[] = [];
  income: number = 0;
  expense: number = 0;

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.transactionService.state$.subscribe((data) => {
      this.transactions = data.transactions;

      this.amounts = this.transactions.map((transaction) => transaction.amount);

      this.income = parseInt(
        this.amounts
          .filter((item) => item > 0)
          .reduce((acc, item) => (acc += item), 0)
          .toFixed(2)
      );

      this.expense =
        parseInt(
          this.amounts
            .filter((item) => item < 0)
            .reduce((acc, item) => (acc += item), 0)
            .toFixed(2)
        ) * -1;
    });
  }
}
