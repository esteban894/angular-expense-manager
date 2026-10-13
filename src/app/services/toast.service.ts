import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: number;
  message: string;
  action?: ToastAction;
}

const DEFAULT_MS = 6000;
/** Con acción (p. ej. Deshacer) se da más tiempo para alcanzarla. */
const ACTION_MS = 10000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private subject = new BehaviorSubject<Toast | null>(null);
  private nextId = 1;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private deadline = 0;
  /** Milisegundos restantes mientras está en pausa; null si no está pausado. */
  private remaining: number | null = null;

  readonly toast$: Observable<Toast | null> = this.subject.asObservable();

  show(message: string, action?: ToastAction, ms = action ? ACTION_MS : DEFAULT_MS): void {
    this.clearTimer();
    this.remaining = null;
    this.subject.next({ id: this.nextId++, message, action });
    this.start(ms);
  }

  dismiss(): void {
    this.clearTimer();
    this.remaining = null;
    this.subject.next(null);
  }

  /** Detiene el cierre automático (hover o foco sobre el toast). */
  pause(): void {
    if (this.timer === null) return;
    this.remaining = Math.max(0, this.deadline - Date.now());
    this.clearTimer();
  }

  /** Reanuda el cierre automático con el tiempo que quedaba. */
  resume(): void {
    if (this.remaining === null || !this.subject.value) return;
    const ms = this.remaining;
    this.remaining = null;
    this.start(ms);
  }

  private start(ms: number): void {
    this.deadline = Date.now() + ms;
    this.timer = setTimeout(() => this.dismiss(), ms);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
