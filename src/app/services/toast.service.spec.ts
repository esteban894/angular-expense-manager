import { fakeAsync, tick, TestBed } from '@angular/core/testing';
import { Toast, ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let emitted: (Toast | null)[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    emitted = [];
    service.toast$.subscribe((t) => emitted.push(t));
  });

  it('show emite y tras 6000 ms emite null', fakeAsync(() => {
    service.show('Hola');
    expect(emitted[emitted.length - 1]?.message).toBe('Hola');
    tick(5999);
    expect(emitted[emitted.length - 1]).not.toBeNull();
    tick(1);
    expect(emitted[emitted.length - 1]).toBeNull();
  }));

  it('un segundo show reemplaza al primero y reinicia el timer', fakeAsync(() => {
    service.show('Uno');
    tick(4000);
    service.show('Dos');
    tick(4000);
    expect(emitted[emitted.length - 1]?.message).toBe('Dos');
    tick(2000);
    expect(emitted[emitted.length - 1]).toBeNull();
  }));

  it('con acción dura 10000 ms por defecto', fakeAsync(() => {
    service.show('Eliminado', { label: 'Deshacer', run: () => {} });
    tick(9999);
    expect(emitted[emitted.length - 1]).not.toBeNull();
    tick(1);
    expect(emitted[emitted.length - 1]).toBeNull();
  }));

  it('pause detiene el timer y resume continúa con el tiempo restante', fakeAsync(() => {
    service.show('Hola');
    tick(4000);
    service.pause();
    tick(60000);
    expect(emitted[emitted.length - 1]?.message).toBe('Hola');
    service.resume();
    tick(1999);
    expect(emitted[emitted.length - 1]).not.toBeNull();
    tick(1);
    expect(emitted[emitted.length - 1]).toBeNull();
  }));

  it('pause/resume repetidos no alteran el tiempo restante', fakeAsync(() => {
    service.show('Hola');
    tick(1000);
    service.pause();
    service.pause();
    service.resume();
    service.resume();
    tick(4999);
    expect(emitted[emitted.length - 1]).not.toBeNull();
    tick(1);
    expect(emitted[emitted.length - 1]).toBeNull();
  }));

  it('resume sin toast no hace nada', fakeAsync(() => {
    service.resume();
    tick(20000);
    expect(emitted).toEqual([null]);
  }));
});
