import { Component } from '@angular/core';
import { Transaction, TransactionFilters } from 'src/app/models/transaction.model';
import { TransactionService } from 'src/app/services/transaction.service';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
})
export class TransactionListComponent {
  transactions$ = this.transactionService.transactions$;
  loading$ = this.transactionService.loading$;
  error$ = this.transactionService.error$;
  filters$ = this.transactionService.filters$;
  skeletons = [0, 1, 2, 3];

  constructor(private transactionService: TransactionService) {}

  trackById(_: number, t: Transaction): number {
    return t.id;
  }

  hasFilters(f: TransactionFilters): boolean {
    return Object.values(f).some(Boolean);
  }

  clearFilters(): void {
    this.transactionService.clearFilters();
  }

  retry(): void {
    this.transactionService.reload();
  }

  // Seam para Task 12: aquí se agregará el toast de deshacer.
  onDelete(t: Transaction): void {
    this.transactionService.remove(t.id).subscribe();
  }
}
