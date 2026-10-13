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
});
