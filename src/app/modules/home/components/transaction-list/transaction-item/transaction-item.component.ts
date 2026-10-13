import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Transaction, TypeAmount } from 'src/app/models/transaction.model';
import { formatCents } from 'src/app/utils/money';

const META: Record<TypeAmount, { cls: string; label: string }> = {
  [TypeAmount.INCOME]: { cls: 'inc', label: 'Ingreso' },
  [TypeAmount.EXPENSE_NECESSARY]: { cls: 'nec', label: 'Gasto necesario' },
  [TypeAmount.EXPENSE_UNNECESSARY]: { cls: 'unn', label: 'Gasto innecesario' },
};

@Component({
  selector: 'app-transaction-item',
  templateUrl: './transaction-item.component.html',
})
export class TransactionItemComponent {
  @Input() transaction!: Transaction;
  @Output() delete = new EventEmitter<Transaction>();
  formatCents = formatCents;

  get meta() {
    return META[this.transaction.typeAmount];
  }
}
