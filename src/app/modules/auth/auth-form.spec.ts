import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './auth-form';

const err = (status: number, message?: unknown) =>
  new HttpErrorResponse({ status, error: message === undefined ? null : { message } });

describe('apiErrorMessage', () => {
  it('login 401 → credenciales incorrectas', () =>
    expect(apiErrorMessage(err(401), 'login')).toBe('Email o contraseña incorrectos.'));
  it('register 400 de usuario existente', () =>
    expect(apiErrorMessage(err(400, 'User already exists'), 'register')).toBe('Ya existe una cuenta con ese email.'));
  it('cualquier otro 400 → revisa los datos (sin texto crudo del backend)', () => {
    expect(apiErrorMessage(err(400, ['email must be an email']), 'register')).toBe('Revisa los datos ingresados.');
    expect(apiErrorMessage(err(400, ['password too short']), 'login')).toBe('Revisa los datos ingresados.');
  });
  it('red caída o 5xx → no pudimos conectar', () => {
    expect(apiErrorMessage(err(0), 'login')).toBe('No pudimos conectar con el servidor. Intenta de nuevo.');
    expect(apiErrorMessage(err(503), 'register')).toBe('No pudimos conectar con el servidor. Intenta de nuevo.');
  });
});
