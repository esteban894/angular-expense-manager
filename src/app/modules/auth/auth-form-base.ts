import { Directive, ElementRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { FIELD_ERRORS, apiErrorMessage } from './auth-form';

@Directive()
export abstract class AuthFormBase {
  abstract form: FormGroup;
  showPassword = false;
  pending = false;
  errorMessage: string | null = null;
  protected submitted = false;
  private touchedWithValue: Record<string, boolean> = {};

  constructor(
    protected authService: AuthService,
    protected router: Router,
    protected host: ElementRef<HTMLElement>
  ) {}

  onBlur(name: string) {
    if (this.form.get(name)!.value) this.touchedWithValue[name] = true;
  }

  showError(name: string): boolean {
    const c = this.form.get(name)!;
    return c.invalid && (this.submitted || !!this.touchedWithValue[name]);
  }

  errorText(name: string): string {
    return this.showError(name) ? FIELD_ERRORS[name](this.form.get(name)!) : '';
  }

  protected run(request$: Observable<unknown>, mode: 'login' | 'register') {
    this.pending = true;
    this.errorMessage = null;
    request$.subscribe({
      next: () => this.router.navigate(['/app']),
      error: (err) => {
        this.pending = false;
        this.errorMessage = apiErrorMessage(err, mode);
      },
    });
  }

  loginDemo() {
    if (this.pending) return;
    this.run(this.authService.login(environment.demo.email, environment.demo.password), 'login');
  }

  protected focusFirstInvalid() {
    const first = Object.keys(this.form.controls).find((k) => this.form.get(k)!.invalid);
    if (first) this.host.nativeElement.querySelector<HTMLElement>('#' + first)?.focus();
  }
}
