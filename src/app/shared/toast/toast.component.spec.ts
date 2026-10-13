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

  it('la región live existe antes de mostrar un toast', () => {
    const s = el().querySelector('[role=status]')!;
    expect(s).not.toBeNull();
    expect(s.getAttribute('aria-live')).toBe('polite');
  });

  it('no renderiza contenido sin toast', () => {
    expect(el().querySelector('[role=status]')!.textContent!.trim()).toBe('');
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
    expect(el().querySelector('[role=status]')!.textContent!.trim()).toBe('');
  });

  it('un toast mostrado por la acción no se descarta', () => {
    service.show('Uno', { label: 'Ok', run: () => service.show('Dos') });
    fixture.detectChanges();
    (el().querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().querySelector('[role=status]')!.textContent).toContain('Dos');
  });

  it('pausa con hover o foco y reanuda solo cuando ambos terminan', () => {
    const pause = spyOn(service, 'pause').and.callThrough();
    const resume = spyOn(service, 'resume').and.callThrough();
    service.show('Listo', { label: 'Deshacer', run: () => {} });
    fixture.detectChanges();
    const box = el().querySelector('[data-testid=toast]') as HTMLElement;
    box.dispatchEvent(new MouseEvent('mouseenter'));
    expect(pause).toHaveBeenCalledTimes(1);
    box.querySelector('button')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    box.dispatchEvent(new MouseEvent('mouseleave'));
    expect(resume).not.toHaveBeenCalled();
    box.querySelector('button')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(resume).toHaveBeenCalledTimes(1);
  });
});
