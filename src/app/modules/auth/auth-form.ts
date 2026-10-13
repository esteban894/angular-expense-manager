import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, ValidationErrors } from '@angular/forms';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailFormat(c: AbstractControl): ValidationErrors | null {
  const v = String(c.value ?? '').trim();
  return !v || EMAIL_RE.test(v) ? null : { format: true };
}

export function notBlank(c: AbstractControl): ValidationErrors | null {
  return String(c.value ?? '').trim() ? null : { required: true };
}

export const FIELD_ERRORS: Record<string, (c: AbstractControl) => string> = {
  name: () => 'Escribe tu nombre.',
  email: (c) =>
    c.hasError('required')
      ? 'Escribe tu email.'
      : 'Revisa el formato, por ejemplo: ana@email.com',
  password: (c) =>
    c.hasError('required')
      ? 'Escribe tu contraseña.'
      : `Le faltan ${8 - String(c.value).length} caracteres (mínimo 8).`,
};

export function apiErrorMessage(err: unknown, mode: 'login' | 'register'): string {
  const e = err as HttpErrorResponse;
  if (mode === 'login' && e?.status === 401) return 'Email o contraseña incorrectos.';
  if (mode === 'register' && e?.status === 400 && e.error?.message === 'User already exists')
    return 'Ya existe una cuenta con ese email.';
  return 'No pudimos conectar con el servidor. Intenta de nuevo.';
}
