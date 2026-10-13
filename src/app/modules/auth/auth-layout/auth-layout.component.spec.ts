import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthLayoutComponent } from './auth-layout.component';

describe('AuthLayoutComponent', () => {
  it('muestra marca, titular y pestañas', () => {
    TestBed.configureTestingModule({
      declarations: [AuthLayoutComponent],
      imports: [RouterTestingModule],
    });
    const fixture = TestBed.createComponent(AuthLayoutComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')!.textContent).toContain('Separa lo que necesitas de lo que');
    const tabs = Array.from(el.querySelectorAll('[role="tab"]'));
    expect(tabs.map((t) => t.textContent!.trim())).toEqual(['Iniciar sesión', 'Crear cuenta']);
    expect(tabs.map((t) => t.getAttribute('href'))).toEqual(['/login', '/register']);
  });
});
