import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { of } from 'rxjs';
import { Transaction, TransactionFilters, TypeAmount } from 'src/app/models/transaction.model';
import { TransactionService } from 'src/app/services/transaction.service';
import { TransactionListComponent } from './transaction-list.component';

@Component({ selector: 'app-transaction-filters', template: '' })
class FiltersStub {}
@Component({ selector: 'app-transaction-item', template: '<button (click)="delete.emit(transaction)">x</button>' })
class ItemStub {
  @Input() transaction!: Transaction;
  @Output() delete = new EventEmitter<Transaction>();
}

const tx = (id: number): Transaction => ({
  id, description: `t${id}`, typeAmount: TypeAmount.INCOME, amount: 100, createdAt: '2026-10-13T12:00:00',
});

describe('TransactionListComponent', () => {
  let fixture: ComponentFixture<TransactionListComponent>;
  let service: any;
  const el = () => fixture.nativeElement as HTMLElement;
  const btn = (label: string) =>
    Array.from(el().querySelectorAll('button')).find((b) => b.textContent!.includes(label)) as HTMLButtonElement;

  function setup(o: { list?: Transaction[]; loading?: boolean; error?: string | null; filters?: TransactionFilters } = {}) {
    service = {
      transactions$: of(o.list ?? []),
      loading$: new BehaviorSubject(o.loading ?? false),
      error$: new BehaviorSubject(o.error ?? null),
      filters$: new BehaviorSubject(o.filters ?? {}),
      clearFilters: jasmine.createSpy('clearFilters'),
      reload: jasmine.createSpy('reload'),
      remove: jasmine.createSpy('remove').and.returnValue(of(undefined)),
    };
    TestBed.configureTestingModule({
      declarations: [TransactionListComponent, FiltersStub, ItemStub],
      providers: [{ provide: TransactionService, useValue: service }],
    });
    fixture = TestBed.createComponent(TransactionListComponent);
    fixture.detectChanges();
  }

  it('loading muestra 4 filas skeleton', () => {
    setup({ loading: true });
    expect(el().querySelectorAll('[data-testid=skeleton]').length).toBe(4);
  });

  it('vacía sin filtros', () => {
    setup();
    expect(el().textContent).toContain('Tu historial está vacío');
    expect(el().textContent).toContain('Agrega tu primer ingreso o gasto con el formulario.');
  });

  it('vacía con filtros ofrece limpiar', () => {
    setup({ filters: { search: 'zzz' } });
    expect(el().textContent).toContain('Ningún resultado con estos filtros');
    btn('Limpiar filtros').click();
    expect(service.clearFilters).toHaveBeenCalled();
  });

  it('error muestra alerta y Reintentar recarga', () => {
    setup({ error: 'Falló' });
    expect(el().querySelector('[role=alert]')!.textContent).toContain('Falló');
    btn('Reintentar').click();
    expect(service.reload).toHaveBeenCalled();
  });

  it('cuenta resultados con singular y plural', () => {
    setup({ list: [tx(1)] });
    expect(el().textContent).toContain('1 resultado');
    expect(el().textContent).not.toContain('1 resultados');
  });

  it('plural', () => {
    setup({ list: [tx(1), tx(2)] });
    expect(el().textContent).toContain('2 resultados');
    expect(el().querySelectorAll('app-transaction-item').length).toBe(2);
  });

  it('eliminar llama a remove', () => {
    setup({ list: [tx(5)] });
    (el().querySelector('app-transaction-item button') as HTMLButtonElement).click();
    expect(service.remove).toHaveBeenCalledWith(5);
  });
});
