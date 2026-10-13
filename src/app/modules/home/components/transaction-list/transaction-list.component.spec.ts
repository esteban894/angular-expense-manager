import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, NEVER, of, throwError } from 'rxjs';
import { ToastService } from 'src/app/services/toast.service';
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
  let toast: any;
  const el = () => fixture.nativeElement as HTMLElement;
  const btn = (label: string) =>
    Array.from(el().querySelectorAll('button')).find((b) => b.textContent!.includes(label)) as HTMLButtonElement;

  function setup(o: { list?: Transaction[] | null; loading?: boolean; error?: string | null; filters?: TransactionFilters } = {}) {
    service = {
      transactions$: o.list === null ? NEVER : of(o.list ?? []),
      loading$: new BehaviorSubject(o.loading ?? false),
      error$: new BehaviorSubject(o.error ?? null),
      filters$: new BehaviorSubject(o.filters ?? {}),
      clearFilters: jasmine.createSpy('clearFilters'),
      reload: jasmine.createSpy('reload'),
      remove: jasmine.createSpy('remove').and.returnValue(of(undefined)),
      restore: jasmine.createSpy('restore').and.returnValue(of(tx(5))),
    };
    toast = { show: jasmine.createSpy('show') };
    TestBed.configureTestingModule({
      declarations: [TransactionListComponent, FiltersStub, ItemStub],
      providers: [
        { provide: TransactionService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    });
    fixture = TestBed.createComponent(TransactionListComponent);
    fixture.detectChanges();
  }

  it('primera carga (sin lista aún) muestra 4 filas skeleton', () => {
    setup({ list: null, loading: true });
    expect(el().querySelectorAll('[data-testid=skeleton]').length).toBe(4);
  });

  it('al refrescar mantiene la lista visible con aria-busy en vez del skeleton', () => {
    setup({ list: [tx(1), tx(2)], loading: true });
    expect(el().querySelectorAll('[data-testid=skeleton]').length).toBe(0);
    expect(el().querySelectorAll('app-transaction-item').length).toBe(2);
    expect(el().querySelector('ul')!.getAttribute('aria-busy')).toBe('true');
  });

  it('sin carga en curso la lista no queda aria-busy', () => {
    setup({ list: [tx(1)] });
    expect(el().querySelector('ul')!.getAttribute('aria-busy')).toBe('false');
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

  const del = () => (el().querySelector('app-transaction-item button') as HTMLButtonElement).click();

  it('tras eliminar muestra toast con Deshacer que restaura', () => {
    setup({ list: [{ ...tx(5), description: 'Alquiler' }] });
    del();
    expect(toast.show).toHaveBeenCalledWith('Se eliminó "Alquiler"', jasmine.objectContaining({ label: 'Deshacer' }));
    toast.show.calls.mostRecent().args[1].run();
    expect(service.restore).toHaveBeenCalledWith(5);
  });

  it('si restore falla avisa', () => {
    setup({ list: [tx(5)] });
    service.restore.and.returnValue(throwError(() => new Error('x')));
    del();
    toast.show.calls.mostRecent().args[1].run();
    expect(toast.show).toHaveBeenCalledWith('No pudimos restaurar la transacción');
  });

  it('si remove falla avisa', () => {
    setup({ list: [tx(5)] });
    service.remove.and.returnValue(throwError(() => new Error('x')));
    del();
    expect(toast.show).toHaveBeenCalledWith('No pudimos eliminar la transacción. Intenta de nuevo.');
  });

  describe('foco tras eliminar', () => {
    const deleteBtn = (id: number) =>
      el().querySelector(`app-transaction-item[data-id="${id}"] button`) as HTMLButtonElement;

    it('pasa al botón eliminar del siguiente ítem', () => {
      setup({ list: [tx(1), tx(2), tx(3)] });
      deleteBtn(2).click();
      expect(document.activeElement).toBe(deleteBtn(3));
    });

    it('si era el último, pasa al anterior', () => {
      setup({ list: [tx(1), tx(2), tx(3)] });
      deleteBtn(3).click();
      expect(document.activeElement).toBe(deleteBtn(2));
    });

    it('si la lista queda vacía, pasa al título Historial', () => {
      setup({ list: [tx(1)] });
      deleteBtn(1).click();
      const h = el().querySelector('h2')!;
      expect(h.getAttribute('tabindex')).toBe('-1');
      expect(document.activeElement).toBe(h);
    });

    it('si falla el borrado no mueve el foco', () => {
      setup({ list: [tx(1), tx(2)] });
      service.remove.and.returnValue(throwError(() => new Error('x')));
      deleteBtn(1).focus();
      deleteBtn(1).click();
      expect(document.activeElement).toBe(deleteBtn(1));
    });
  });
});
