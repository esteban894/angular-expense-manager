import { Component } from '@angular/core';
import { Toast, ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
})
export class ToastComponent {
  toast$ = this.toastService.toast$;

  constructor(private toastService: ToastService) {}

  run(t: Toast): void {
    this.toastService.dismiss();
    t.action?.run();
  }
}
