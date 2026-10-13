import { Component } from '@angular/core';
import { TransactionService } from 'src/app/services/transaction.service';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styles: [``],
})
export class TransactionListComponent {
  transactions$ = this.transactionService.transactions$;

  constructor(private transactionService: TransactionService) {}
}
