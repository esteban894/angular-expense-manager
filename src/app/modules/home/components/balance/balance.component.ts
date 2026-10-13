import { Component } from '@angular/core';
import { map } from 'rxjs';
import { TransactionService } from 'src/app/services/transaction.service';
import { formatCents } from 'src/app/utils/money';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styles: [``],
})
export class BalanceComponent {
  total$ = this.transactionService.summary$.pipe(
    map((s) => formatCents(s.balance))
  );

  constructor(private transactionService: TransactionService) {}
}
