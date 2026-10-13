import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'cc-theme';
const ORDER: ThemeMode[] = ['system', 'light', 'dark'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly modeSubject = new BehaviorSubject<ThemeMode>(this.read());
  readonly mode$: Observable<ThemeMode> = this.modeSubject.asObservable();

  constructor() {
    this.apply(this.modeSubject.value);
  }

  cycle(): void {
    const next = ORDER[(ORDER.indexOf(this.modeSubject.value) + 1) % ORDER.length];
    this.modeSubject.next(next);
    this.apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // almacenamiento no disponible
    }
  }

  private read(): ThemeMode {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'light' || v === 'dark' ? v : 'system';
    } catch {
      return 'system';
    }
  }

  private apply(mode: ThemeMode): void {
    const root = document.documentElement;
    if (mode === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', mode);
    }
  }
}
