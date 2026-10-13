import { Component, ElementRef, ViewChild } from '@angular/core';
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
  @ViewChild('heading') heading?: ElementRef<HTMLElement>;

  constructor(
    private transactionService: TransactionService,
    private toast: ToastService,
    private host: ElementRef<HTMLElement>
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

  onDelete(t: Transaction, list: Transaction[] = []): void {
    const i = list.findIndex((x) => x.id === t.id);
    const neighbor = list[i + 1] ?? list[i - 1];
    this.transactionService.remove(t.id).subscribe({
      next: () => {
        this.moveFocusAfterDelete(neighbor);
        this.toast.show(`Se eliminó "${t.description}"`, {
          label: 'Deshacer',
          run: () =>
            this.transactionService
              .restore(t.id)
              .subscribe({ error: () => this.toast.show('No pudimos restaurar la transacción') }),
        });
      },
      error: () => this.toast.show('No pudimos eliminar la transacción. Intenta de nuevo.'),
    });
  }

  /** El foco no se pierde al quitar el ítem: siguiente, anterior o el título si no queda ninguno. */
  private moveFocusAfterDelete(neighbor: Transaction | undefined): void {
    const target = neighbor
      ? this.host.nativeElement.querySelector<HTMLElement>(
          `app-transaction-item[data-id="${neighbor.id}"] button`
        )
      : null;
    (target ?? this.heading?.nativeElement)?.focus();
  }
}
