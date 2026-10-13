import { Component } from '@angular/core';
import { Toast, ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
})
export class ToastComponent {
  toast$ = this.toastService.toast$;
  private hovered = false;
  private focused = false;

  constructor(private toastService: ToastService) {}

  run(t: Toast): void {
    this.hovered = this.focused = false;
    this.toastService.dismiss();
    t.action?.run();
  }

  setHovered(value: boolean): void {
    this.hovered = value;
    this.sync();
  }

  setFocused(value: boolean): void {
    this.focused = value;
    this.sync();
  }

  /** Pausa mientras haya hover o foco; reanuda cuando no queda ninguno. */
  private sync(): void {
    if (this.hovered || this.focused) this.toastService.pause();
    else this.toastService.resume();
  }
}
