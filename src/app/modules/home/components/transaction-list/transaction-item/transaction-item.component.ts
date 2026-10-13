import { Component, Input } from '@angular/core';
import { Transaction } from 'src/app/models/transaction.model';
import { TransactionService } from 'src/app/services/transaction.service';
import { formatCents } from 'src/app/utils/money';

@Component({
  selector: 'app-transaction-item',
  templateUrl: './transaction-item.component.html',
  styles: [``],
})
export class TransactionItemComponent {
  @Input() transaction!: Transaction;
  formatCents = formatCents;

  constructor(private transactionService: TransactionService) {}

  deleteTransaction(id: number) {
    this.transactionService.remove(id).subscribe();
  }
}
