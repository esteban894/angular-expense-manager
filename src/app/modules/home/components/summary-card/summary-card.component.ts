import { Component } from '@angular/core';
import { map, Observable } from 'rxjs';
import { TransactionService } from 'src/app/services/transaction.service';
import { formatCents } from 'src/app/utils/money';

interface SummaryView {
  balance: string;
  negative: boolean;
  income: string;
  expense: string;
  necessary: string;
  unnecessary: string;
  pctNec: number;
  pctUnn: number;
  insight: string;
  barLabel: string;
}

@Component({
  selector: 'app-summary-card',
  templateUrl: './summary-card.component.html',
})
export class SummaryCardComponent {
  readonly view$: Observable<SummaryView>;

  constructor(private transactions: TransactionService) {
    this.view$ = this.transactions.summary$.pipe(
      map((s) => {
        const pctNec = s.expense > 0 ? Math.round((s.necessary / s.expense) * 100) : 0;
        const pctUnn = s.expense > 0 ? 100 - pctNec : 0;
        const insight =
          s.expense === 0
            ? 'Todavía no registraste gastos. Cuando lo hagas, verás aquí cuánto podrías ahorrar.'
            : s.unnecessary === 0
            ? 'Ningún gasto innecesario. Todo lo que gastaste fue esencial.'
            : `Si evitaras los gastos innecesarios, tu saldo sería ${formatCents(s.balance + s.unnecessary)}`;
        return {
          balance: formatCents(s.balance),
          negative: s.balance < 0,
          income: formatCents(s.income),
          expense: formatCents(s.expense),
          necessary: formatCents(s.necessary),
          unnecessary: formatCents(s.unnecessary),
          pctNec,
          pctUnn,
          insight,
          barLabel: `Necesarios ${pctNec}%, innecesarios ${pctUnn}%`,
        };
      })
    );
  }
}
