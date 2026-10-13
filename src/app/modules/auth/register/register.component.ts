import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { FIELD_ERRORS, apiErrorMessage, emailFormat, notBlank } from '../auth-form';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  form: FormGroup;
  showPassword = false;
  pending = false;
  errorMessage: string | null = null;
  private submitted = false;
  private touchedWithValue: Record<string, boolean> = {};

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

  private run(request$: Observable<unknown>) {
    this.pending = true;
    this.errorMessage = null;
    request$.subscribe({
      next: () => this.router.navigate(['/app']),
      error: (err) => {
        this.pending = false;
        this.errorMessage = apiErrorMessage(err, 'register');
      },
    });
  }

  loginDemo() {
    if (this.pending) return;
    this.run(this.authService.login(environment.demo.email, environment.demo.password));
  }

  private focusFirstInvalid() {
    const first = Object.keys(this.form.controls).find((k) => this.form.get(k)!.invalid);
    if (first) this.host.nativeElement.querySelector<HTMLElement>('#' + first)?.focus();
  }

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private host: ElementRef<HTMLElement>
  ) {
    this.form = this.fb.group({
      name: ['', [notBlank]],
      email: ['', [Validators.required, emailFormat]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }
    if (this.pending) return;
    const v = this.form.value;
    this.run(this.authService.registerAndLogin(v.name.trim(), v.email.trim(), v.password));
  }
}
