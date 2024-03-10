import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get emailField() {
    return this.form.get('email');
  }

  get passwordField() {
    return this.form.get('password');
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (this.form.valid) {
      this.errorMessage = null;
      this.authService
        .login(this.emailField!.value, this.passwordField!.value)
        .subscribe({
          next: () => {
            this.router.navigate(['/app']);
          },
          error: (err) => {
            this.errorMessage = err.error.message;
          },
        });

      this.form.reset();
    } else {
      this.form.markAllAsTouched();
    }
  }
}
