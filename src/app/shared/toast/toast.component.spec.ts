import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from 'src/app/services/toast.service';
import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let service: ToastService;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [ToastComponent] });
    service = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(ToastComponent);
    fixture.detectChanges();
  });

  afterEach(() => service.dismiss());

  it('no renderiza nada sin toast', () => {
    expect(el().querySelector('[role=status]')).toBeNull();
  });

  it('muestra el mensaje con role=status', () => {
    service.show('Hola');
    fixture.detectChanges();
    const s = el().querySelector('[role=status]')!;
    expect(s.textContent).toContain('Hola');
    expect(s.getAttribute('aria-live')).toBe('polite');
    expect(s.querySelector('button')).toBeNull();
  });

  it('la acción se ejecuta y cierra el toast', () => {
    const run = jasmine.createSpy('run');
    service.show('Listo', { label: 'Deshacer', run });
    fixture.detectChanges();
    (el().querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(run).toHaveBeenCalled();
    expect(el().querySelector('[role=status]')).toBeNull();
  });
});
