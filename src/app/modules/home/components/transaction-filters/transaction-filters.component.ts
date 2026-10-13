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
  /** true mientras este componente emite filtros, para distinguirlos de cambios externos. */
  private ownChange = false;
  private searchReset$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    let first = true;
    this.filters$.pipe(takeUntil(this.destroy$)).subscribe((f) => {
      const prev = this.current;
      this.current = f;
      if (first) {
        // Al volver a montar el componente, los inputs reflejan los filtros vigentes.
        first = false;
        this.search.setValue(f.search ?? '', { emitEvent: false });
        this.from.setValue(f.from ?? '', { emitEvent: false });
        this.to.setValue(f.to ?? '', { emitEvent: false });
        return;
      }
      // Cambios propios: los inputs ya muestran lo que tipeó el usuario.
      if (this.ownChange) return;
      if (!(f.type || f.search || f.from || f.to)) {
        // Borrado externo total (p. ej. "Limpiar filtros" del historial): incluye un rango inválido.
        this.resetInputs();
        return;
      }
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
      .subscribe((v) => this.apply({ search: v || undefined }));

    merge(this.from.valueChanges, this.to.valueChanges)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const from = this.from.value;
        const to = this.to.value;
        this.rangeError = !!from && !!to && from > to;
        // Con rango inválido se quita el rango del servicio para no listar uno viejo;
        // los inputs conservan lo que el usuario escribió.
        this.apply(
          this.rangeError
            ? { from: undefined, to: undefined }
            : { from: from || undefined, to: to || undefined }
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  select(type: TypeAmount | undefined): void {
    this.apply({ type });
  }

  hasFilters(f: TransactionFilters): boolean {
    return !!(f.type || f.search || f.from || f.to) || this.rangeError;
  }

  total(counts: Record<TypeAmount, number> | undefined): number {
    return counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  }

  clear(): void {
    this.resetInputs();
    this.ownChange = true;
    try {
      this.transactionService.clearFilters();
    } finally {
      this.ownChange = false;
    }
  }

  private apply(patch: Partial<TransactionFilters>): void {
    this.ownChange = true;
    try {
      this.transactionService.setFilters(patch);
    } finally {
      this.ownChange = false;
    }
  }

  private resetInputs(): void {
    this.rangeError = false;
    this.searchReset$.next();
    this.search.setValue('', { emitEvent: false });
    this.from.setValue('', { emitEvent: false });
    this.to.setValue('', { emitEvent: false });
  }
}
