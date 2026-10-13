import { Component } from '@angular/core';
import { Transaction, TransactionFilters } from 'src/app/models/transaction.model';
import { ToastService } from 'src/app/services/toast.service';
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

  constructor(private transactionService: TransactionService,
    private toast: ToastService,
  ) {}

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

  onDelete(t: Transaction): void {
    this.transactionService.remove(t.id).subscribe({
      next: () =>
        this.toast.show(`Se eliminó "${t.description}"`, {
          label: 'Deshacer',
          run: () =>
            this.transactionService
              .restore(t.id)
              .subscribe({ error: () => this.toast.show('No pudimos restaurar la transacción') }),
        }),
      error: () => this.toast.show('No pudimos eliminar la transacción. Intenta de nuevo.'),
    });
  }
}
