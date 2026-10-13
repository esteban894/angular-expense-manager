import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NEVER, of, Subject, throwError } from 'rxjs';
import { ToastService } from 'src/app/services/toast.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { TransactionFormComponent } from './transaction-form.component';

describe('TransactionFormComponent', () => {
  let fixture: ComponentFixture<TransactionFormComponent>;
  let svc: any;
  let toast: any;
  const el = () => fixture.nativeElement as HTMLElement;
  const q = (s: string) => el().querySelector(s) as HTMLElement | null;
  const norm = (s: string) => s.replace(/\s/g, ' ').trim();

  function setup(addResult: any = of({ id: 1, description: 'Sueldo', typeAmount: 'income', amount: 150025, createdAt: '2026-10-13T12:00:00' })) {
    svc = {
      add: jasmine.createSpy('add').and.returnValue(addResult),
      filters$: of({}),
      matches: jasmine.createSpy('matches').and.returnValue(true),
      clearFilters: jasmine.createSpy('clearFilters'),
    };
    toast = { show: jasmine.createSpy('show') };
    TestBed.configureTestingModule({
      declarations: [TransactionFormComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: TransactionService, useValue: svc },
        { provide: ToastService, useValue: toast },
      ],
    });
    fixture = TestBed.createComponent(TransactionFormComponent);
    fixture.detectChanges();
  }
  function type(id: string, value: string) {
    const input = q(id) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
  function pick(id: string) {
    (q(id) as HTMLInputElement).click();
    fixture.detectChanges();
  }
  function submit() {
    (q('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }
  function fill(t: string, d: string, a: string) {
    pick(t);
    type('#desc', d);
    type('#amount', a);
    fixture.detectChanges();
  }

  it('submit vacío muestra errores y no llama add', () => {
    setup();
    submit();
    const text = norm(el().textContent!);
    expect(text).toContain('Elige si es un ingreso o un gasto.');
    expect(text).toContain('Escribe una descripción corta.');
    expect(text).toContain('Escribe un monto.');
    expect(svc.add).not.toHaveBeenCalled();
  });

  it('monto con más de 2 decimales', () => {
    setup();
    fill('#t-inc', 'x', '10,555');
    submit();
    expect(norm(el().textContent!)).toContain('Usa hasta 2 decimales, por ejemplo 1500,50');
  });

  it('monto sobre el máximo', () => {
    setup();
    fill('#t-inc', 'x', '25.000.000');
    submit();
    expect(norm(el().textContent!)).toContain('El monto máximo es $ 20.000.000,00');
  });

  it('monto cero y formato inválido', () => {
    setup();
    fill('#t-inc', 'x', '0');
    submit();
    expect(norm(el().textContent!)).toContain('El monto debe ser mayor a 0.');
    type('#amount', 'abc');
    fixture.detectChanges();
    expect(norm(el().textContent!)).toContain('Usa solo números, por ejemplo 1500,50');
  });

  it('válido llama add, resetea y mantiene el tipo', () => {
    setup();
    fill('#t-inc', 'Sueldo', '1.500,25');
    submit();
    expect(svc.add).toHaveBeenCalledWith({ amount: 150025, typeAmount: 'income', description: 'Sueldo' });
    expect((q('#desc') as HTMLInputElement).value).toBe('');
    expect((q('#amount') as HTMLInputElement).value).toBe('');
    expect((q('#t-inc') as HTMLInputElement).checked).toBeTrue();
    expect(toast.show).toHaveBeenCalledWith('Ingreso agregado: $ 1.500,25');
  });

  it('muestra toast con acción si no coincide con filtros', () => {
    setup();
    svc.matches.and.returnValue(false);
    fill('#t-inc', 'Sueldo', '1.500,25');
    submit();
    const args = toast.show.calls.mostRecent().args;
    expect(args[0]).toBe('Agregado. No coincide con los filtros activos');
    expect(args[1].label).toBe('Ver todo');
    args[1].run();
    expect(svc.clearFilters).toHaveBeenCalled();
  });

  it('el botón refleja el tipo y el estado pendiente', () => {
    const pending = new Subject<any>();
    setup(pending);
    expect(norm(q('button[type=submit]')!.textContent!)).toBe('Agregar transacción');
    pick('#t-inc');
    expect(norm(q('button[type=submit]')!.textContent!)).toBe('Agregar ingreso');
    type('#desc', 'Sueldo');
    type('#amount', '10');
    submit();
    const btn = q('button[type=submit]') as HTMLButtonElement;
    expect(norm(btn.textContent!)).toBe('Agregando…');
    expect(btn.disabled).toBeTrue();
  });

  const apiError = (status: number, message?: unknown) =>
    throwError(() => new HttpErrorResponse({ status, error: message === undefined ? null : { message } }));

  it('400 muestra "Revisa los datos" en .form-alert sin texto crudo del backend', () => {
    setup(apiError(400, ['amount must not be greater than 2000000000']));
    fill('#t-nec', 'Luz', '10');
    submit();
    expect(q('.form-alert')!.textContent).toContain('Revisa los datos ingresados.');
    expect(q('.form-alert')!.textContent).not.toContain('amount must');
    expect(q('.form-alert')!.getAttribute('role')).toBe('alert');
  });

  it('401 avisa que la sesión expiró', () => {
    setup(apiError(401, 'Unauthorized'));
    fill('#t-nec', 'Luz', '10');
    submit();
    expect(q('.form-alert')!.textContent).toContain('Tu sesión expiró. Vuelve a iniciar sesión.');
  });

  it('otros errores usan el fallback', () => {
    setup(apiError(500, 'Internal server error'));
    fill('#t-nec', 'Luz', '10');
    submit();
    expect(q('.form-alert')!.textContent).toContain('No pudimos guardar la transacción. Intenta de nuevo.');
    expect(q('.form-alert')!.textContent).not.toContain('Internal');
  });
});
