import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let auth: any;
  let router: Router;
  const el = () => fixture.nativeElement as HTMLElement;
  const q = (s: string) => el().querySelector(s) as HTMLElement | null;
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

  function setup(result: any = of({})) {
    auth = {
      registerAndLogin: jasmine.createSpy('registerAndLogin').and.returnValue(result),
      login: jasmine.createSpy('login').and.returnValue(of({})),
    };
    TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: auth }],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
  }
  function type(id: string, value: string) {
    const input = q(id) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }
  function submit() {
    (q('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }
  function fill() {
    type('#name', 'Ana Pérez');
    type('#email', 'ana@email.com');
    type('#password', '12345678');
  }

  it('muestra título, botón y placeholder', () => {
    setup();
    const text = norm(el().textContent!);
    expect(text).toContain('Crea tu cuenta');
    expect(text).toContain('Te toma menos de un minuto. No pedimos datos bancarios.');
    expect(q('#auth-submit')!.textContent!.trim()).toBe('Crear cuenta');
    expect(q('#name')!.getAttribute('placeholder')).toBe('Ana Pérez');
  });

  it('submit vacío muestra errores y enfoca el nombre', () => {
    setup();
    submit();
    expect(norm(el().textContent!)).toContain('Escribe tu nombre.');
    expect(document.activeElement).toBe(q('#name'));
    expect(auth.registerAndLogin).not.toHaveBeenCalled();
  });

  it('éxito usa registerAndLogin y navega a /app', () => {
    setup();
    fill();
    submit();
    expect(auth.registerAndLogin).toHaveBeenCalledWith('Ana Pérez', 'ana@email.com', '12345678');
    expect(router.navigate).toHaveBeenCalledWith(['/app']);
  });

  it('400 User already exists', () => {
    setup(throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'User already exists' } })));
    fill();
    submit();
    expect(norm(q('[role="alert"]')!.textContent!)).toBe('Ya existe una cuenta con ese email.');
    expect((q('#name') as HTMLInputElement).value).toBe('Ana Pérez');
  });

  it('otro error muestra mensaje de conexión', () => {
    setup(throwError(() => new HttpErrorResponse({ status: 500 })));
    fill();
    submit();
    expect(norm(q('[role="alert"]')!.textContent!)).toBe('No pudimos conectar con el servidor. Intenta de nuevo.');
  });

  it('cuenta demo', () => {
    setup();
    (q('#demo-login') as HTMLButtonElement).click();
    expect(auth.login).toHaveBeenCalledWith(environment.demo.email, environment.demo.password);
  });
});
