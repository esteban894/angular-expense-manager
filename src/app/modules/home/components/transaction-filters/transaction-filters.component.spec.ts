import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { TransactionFilters, TypeAmount } from 'src/app/models/transaction.model';
import { TransactionService } from 'src/app/services/transaction.service';
import { TransactionFiltersComponent } from './transaction-filters.component';

describe('TransactionFiltersComponent', () => {
  let fixture: ComponentFixture<TransactionFiltersComponent>;
  let filters$: BehaviorSubject<TransactionFilters>;
  let service: any;

  function setup(initial: TransactionFilters = {}) {
    filters$ = new BehaviorSubject<TransactionFilters>(initial);
    service = {
      filters$,
      summary$: of({
        counts: { income: 2, expense_necessary: 3, expense_unnecessary: 4 },
      }),
      setFilters: jasmine.createSpy('setFilters').and.callFake((p: TransactionFilters) =>
        filters$.next({ ...filters$.value, ...p })
      ),
      clearFilters: jasmine.createSpy('clearFilters'),
    };
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [TransactionFiltersComponent],
      providers: [{ provide: TransactionService, useValue: service }],
    });
    fixture = TestBed.createComponent(TransactionFiltersComponent);
    fixture.detectChanges();
  }
  const el = () => fixture.nativeElement as HTMLElement;
  const chip = (label: string) =>
    Array.from(el().querySelectorAll('button[aria-pressed]')).find((b) =>
      b.textContent!.includes(label)
    ) as HTMLButtonElement;
  const type = (sel: string, value: string) => {
    const i = el().querySelector(sel) as HTMLInputElement;
    i.value = value;
    i.dispatchEvent(new Event('input'));
  };

  it('chip Innecesarios aplica el filtro de tipo', () => {
    setup();
    chip('Innecesarios').click();
    expect(service.setFilters).toHaveBeenCalledWith({ type: 'expense_unnecessary' });
  });

  it('chip Todas quita el tipo', () => {
    setup({ type: TypeAmount.INCOME });
    chip('Todas').click();
    expect(service.setFilters).toHaveBeenCalledWith({ type: undefined });
  });

  it('chips con aria-pressed y contadores', () => {
    setup({ type: TypeAmount.INCOME });
    expect(chip('Ingresos').getAttribute('aria-pressed')).toBe('true');
    expect(chip('Todas').getAttribute('aria-pressed')).toBe('false');
    expect(chip('Todas').textContent).toContain('9');
    expect(chip('Necesarios').textContent).toContain('3');
  });

  it('busca una sola vez tras 300 ms (debounce + distinct)', fakeAsync(() => {
    setup();
    type('input[type=search]', 's');
    tick(100);
    type('input[type=search]', 'su');
    tick(100);
    type('input[type=search]', 'sup');
    tick(299);
    expect(service.setFilters).not.toHaveBeenCalled();
    tick(1);
    expect(service.setFilters).toHaveBeenCalledOnceWith({ search: 'sup' });
    type('input[type=search]', 'sup');
    tick(300);
    expect(service.setFilters).toHaveBeenCalledTimes(1);
  }));

  it('un chip no pisa la búsqueda pendiente', fakeAsync(() => {
    setup();
    type('input[type=search]', 'abc');
    tick(100);
    chip('Ingresos').click();
    fixture.detectChanges();
    expect((el().querySelector('input[type=search]') as HTMLInputElement).value).toBe('abc');
    tick(300);
    expect(service.setFilters).toHaveBeenCalledWith({ search: 'abc' });
  }));

  it('borrado externo vacía el input y cancela búsqueda pendiente', fakeAsync(() => {
    setup({ search: 'abc' });
    type('input[type=search]', 'abcd');
    tick(100);
    filters$.next({});
    fixture.detectChanges();
    expect((el().querySelector('input[type=search]') as HTMLInputElement).value).toBe('');
    tick(500);
    expect(service.setFilters).not.toHaveBeenCalled();
  }));

  it('búsqueda vacía envía undefined', fakeAsync(() => {
    setup({ search: 'sup' });
    type('input[type=search]', '');
    tick(300);
    expect(service.setFilters).toHaveBeenCalledOnceWith({ search: undefined });
  }));

  it('from > to muestra error y no llama setFilters', () => {
    setup();
    type('#filter-from', '2026-10-10');
    type('#filter-to', '2026-10-01');
    fixture.detectChanges();
    expect(el().textContent).toContain('La fecha desde no puede ser posterior a hasta');
    expect(service.setFilters).toHaveBeenCalledTimes(1); // solo la primera (desde válido)
    expect(service.setFilters).not.toHaveBeenCalledWith(jasmine.objectContaining({ to: '2026-10-01' }));
  });

  it('rango válido llama setFilters', () => {
    setup();
    type('#filter-from', '2026-10-01');
    type('#filter-to', '2026-10-10');
    expect(service.setFilters).toHaveBeenCalledWith({ from: '2026-10-01', to: '2026-10-10' });
  });

  it('inputs con labels y max = hoy', () => {
    setup();
    expect(el().querySelector('label[for=filter-search]')!.textContent).toContain('Buscar');
    expect(el().querySelector('label[for=filter-from]')!.textContent).toContain('Desde');
    expect(el().querySelector('label[for=filter-to]')!.textContent).toContain('Hasta');
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(el().querySelector('#filter-from')!.getAttribute('max')).toBe(today);
    expect(el().querySelector('input[type=search]')!.getAttribute('placeholder')).toBe('Buscar por descripción');
  });

  it('Limpiar filtros solo visible con filtros activos', () => {
    setup();
    const find = () =>
      Array.from(el().querySelectorAll('button')).find((b) => b.textContent!.includes('Limpiar filtros'));
    expect(find()).toBeUndefined();
    filters$.next({ search: 'x' });
    fixture.detectChanges();
    find()!.click();
    expect(service.clearFilters).toHaveBeenCalled();
  });

  it('al iniciar rellena búsqueda y fechas con los filtros vigentes sin re-emitir', fakeAsync(() => {
    setup({ search: 'luz', from: '2026-10-01', to: '2026-10-10' });
    expect((el().querySelector('input[type=search]') as HTMLInputElement).value).toBe('luz');
    expect((el().querySelector('#filter-from') as HTMLInputElement).value).toBe('2026-10-01');
    expect((el().querySelector('#filter-to') as HTMLInputElement).value).toBe('2026-10-10');
    tick(500);
    expect(service.setFilters).not.toHaveBeenCalled();
  }));
});
