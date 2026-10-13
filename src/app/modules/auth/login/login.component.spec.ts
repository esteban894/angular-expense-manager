import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NEVER, of, Subject, throwError } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let auth: any;
  let router: Router;
  const el = () => fixture.nativeElement as HTMLElement;
  const q = (s: string) => el().querySelector(s) as HTMLElement | null;
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

  function setup(loginResult: any = of({ token: 't', email: 'a@b.co' })) {
    auth = { login: jasmine.createSpy('login').and.returnValue(loginResult) };
    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: auth }],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(LoginComponent);
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

  it('submit inválido muestra errores, enfoca el primer campo inválido y no llama login', () => {
    setup();
    submit();
    const text = norm(el().textContent!);
    expect(text).toContain('Escribe tu email.');
    expect(text).toContain('Escribe tu contraseña.');
    expect(document.activeElement).toBe(q('#email'));
    expect(q('#email')!.getAttribute('aria-invalid')).toBe('true');
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('email con mal formato', () => {
    setup();
    type('#email', 'ana');
    submit();
    expect(norm(el().textContent!)).toContain('Revisa el formato, por ejemplo: ana@email.com');
  });

  it('contraseña de 5 caracteres: faltan 3', () => {
    setup();
    type('#email', 'ana@email.com');
    type('#password', '12345');
    submit();
    expect(norm(el().textContent!)).toContain('Le faltan 3 caracteres (mínimo 8).');
    expect(document.activeElement).toBe(q('#password'));
  });

  it('Mostrar/Ocultar cambia el type', () => {
    setup();
    const btn = q('#toggle-pass') as HTMLButtonElement;
    expect(btn.textContent!.trim()).toBe('Mostrar');
    expect(btn.getAttribute('aria-controls')).toBe('password');
    btn.click();
    fixture.detectChanges();
    expect((q('#password') as HTMLInputElement).type).toBe('text');
    expect(btn.textContent!.trim()).toBe('Ocultar');
  });

  it('submit válido deshabilita el botón, no resetea el form y navega a /app al éxito', () => {
    const res = new Subject<any>();
    setup(res);
    type('#email', 'ana@email.com');
    type('#password', '12345678');
    submit();
    const btn = q('#auth-submit') as HTMLButtonElement;
    expect(auth.login).toHaveBeenCalledWith('ana@email.com', '12345678');
    expect(btn.disabled).toBeTrue();
    expect(btn.textContent!.trim()).toBe('Ingresando…');
    expect((q('#email') as HTMLInputElement).value).toBe('ana@email.com');
    res.next({});
    res.complete();
    expect(router.navigate).toHaveBeenCalledWith(['/app']);
  });

  it('401 muestra mensaje genérico', () => {
    setup(throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'email is wrong' } })));
    type('#email', 'ana@email.com');
    type('#password', '12345678');
    submit();
    const alert = q('[role="alert"]')!;
    expect(norm(alert.textContent!)).toBe('Email o contraseña incorrectos.');
    expect((q('#auth-submit') as HTMLButtonElement).disabled).toBeFalse();
    expect((q('#email') as HTMLInputElement).value).toBe('ana@email.com');
  });

  it('otro error muestra mensaje de conexión', () => {
    setup(throwError(() => new HttpErrorResponse({ status: 0 })));
    type('#email', 'ana@email.com');
    type('#password', '12345678');
    submit();
    expect(norm(q('[role="alert"]')!.textContent!)).toBe('No pudimos conectar con el servidor. Intenta de nuevo.');
  });

  it('cuenta demo usa las credenciales del environment', () => {
    setup(NEVER);
    (q('#demo-login') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(auth.login).toHaveBeenCalledWith(environment.demo.email, environment.demo.password);
  });

  it('textos principales', () => {
    setup();
    const text = norm(el().textContent!);
    expect(text).toContain('Bienvenido de nuevo');
    expect(text).toContain('Ingresa con tu email para ver tu balance.');
    expect(q('#auth-submit')!.textContent!.trim()).toBe('Iniciar sesión');
  });
});
