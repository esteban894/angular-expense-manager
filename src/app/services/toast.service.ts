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

@Injectable({ providedIn: 'root' })
export class ToastService {
  private subject = new BehaviorSubject<Toast | null>(null);
  private nextId = 1;
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly toast$: Observable<Toast | null> = this.subject.asObservable();

  show(message: string, action?: ToastAction, ms = 6000): void {
    this.clearTimer();
    this.subject.next({ id: this.nextId++, message, action });
    this.timer = setTimeout(() => this.dismiss(), ms);
  }

  dismiss(): void {
    this.clearTimer();
    this.subject.next(null);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
