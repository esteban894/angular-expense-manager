import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem('cc-theme');
    document.documentElement.removeAttribute('data-theme');
  });

  it('cycle() recorre system -> light -> dark -> system y aplica el atributo', async () => {
    const svc = TestBed.inject(ThemeService);
    expect(await firstValueFrom(svc.mode$)).toBe('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBeFalse();

    svc.cycle();
    expect(await firstValueFrom(svc.mode$)).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem('cc-theme')).toBe('light');

    svc.cycle();
    expect(await firstValueFrom(svc.mode$)).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');

    svc.cycle();
    expect(await firstValueFrom(svc.mode$)).toBe('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBeFalse();
  });

  it('aplica el modo guardado al construirse', async () => {
    localStorage.setItem('cc-theme', 'dark');
    const svc = new ThemeService();
    expect(await firstValueFrom(svc.mode$)).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
