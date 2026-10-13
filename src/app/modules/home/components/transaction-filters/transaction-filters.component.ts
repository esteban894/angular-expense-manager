import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, debounceTime, filter, map, merge, takeUntil } from 'rxjs';
import { TransactionFilters, TypeAmount } from 'src/app/models/transaction.model';
import { TransactionService } from 'src/app/services/transaction.service';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-transaction-filters',
  templateUrl: './transaction-filters.component.html',
})
export class TransactionFiltersComponent implements OnInit, OnDestroy {
  readonly today = todayKey();
  readonly chips: { label: string; type: TypeAmount | undefined; dot: string }[] = [
    { label: 'Todas', type: undefined, dot: '' },
    { label: 'Ingresos', type: TypeAmount.INCOME, dot: 'bg-inc' },
    { label: 'Necesarios', type: TypeAmount.EXPENSE_NECESSARY, dot: 'bg-nec' },
    { label: 'Innecesarios', type: TypeAmount.EXPENSE_UNNECESSARY, dot: 'bg-unn' },
  ];

  filters$ = this.transactionService.filters$;
  summary$ = this.transactionService.summary$;

  search = new FormControl('', { nonNullable: true });
  from = new FormControl('', { nonNullable: true });
  to = new FormControl('', { nonNullable: true });
  rangeError = false;

  private current: TransactionFilters = {};
  private searchReset$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.filters$.pipe(takeUntil(this.destroy$)).subscribe((f) => {
      const prev = this.current;
      this.current = f;
      // Solo se sincroniza ante un borrado externo (clave pasó de valor a vacía),
      // para no pisar texto tipeado que todavía no se aplicó.
      if (prev.search && !f.search && this.search.value !== '') {
        this.search.setValue('', { emitEvent: false });
        this.searchReset$.next();
      }
      if (prev.from && !f.from) this.from.setValue('', { emitEvent: false });
      if (prev.to && !f.to) this.to.setValue('', { emitEvent: false });
      if (!this.from.value || !this.to.value) this.rangeError = false;
    });

    merge(
      this.search.valueChanges,
      this.searchReset$.pipe(map(() => null))
    )
      .pipe(
        debounceTime(300),
        filter((v): v is string => v !== null),
        map((v) => v.trim()),
        filter((v) => v !== (this.current.search ?? '')),
        takeUntil(this.destroy$)
      )
      .subscribe((v) => this.transactionService.setFilters({ search: v || undefined }));

    merge(this.from.valueChanges, this.to.valueChanges)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const from = this.from.value;
        const to = this.to.value;
        this.rangeError = !!from && !!to && from > to;
        if (this.rangeError) return;
        this.transactionService.setFilters({ from: from || undefined, to: to || undefined });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  select(type: TypeAmount | undefined): void {
    this.transactionService.setFilters({ type });
  }

  hasFilters(f: TransactionFilters): boolean {
    return !!(f.type || f.search || f.from || f.to) || this.rangeError;
  }

  total(counts: Record<TypeAmount, number> | undefined): number {
    return counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  }

  clear(): void {
    this.rangeError = false;
    this.searchReset$.next();
    this.search.setValue('', { emitEvent: false });
    this.from.setValue('', { emitEvent: false });
    this.to.setValue('', { emitEvent: false });
    this.transactionService.clearFilters();
  }
}
