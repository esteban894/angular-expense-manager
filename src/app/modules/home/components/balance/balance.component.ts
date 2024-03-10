import { Component, OnInit } from '@angular/core';
import { Transaction } from 'src/app/models/transaction.model';
import { TransactionService } from 'src/app/services/transaction.service';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styles: [``],
})
export class BalanceComponent implements OnInit {
  transactions: Transaction[] = [];
  amounts: any[] = [];
  total: any;

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.transactionService.state$.subscribe((data: any) => {
      this.transactions = data.transactions;

      this.amounts = this.transactions.map(
        (transaction: any) => transaction.amount
      );

      this.total = this.amounts
        .reduce((acc, item) => (acc += item), 0)
        .toFixed(2);
    });
  }
}
