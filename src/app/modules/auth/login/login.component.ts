import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { emailFormat } from '../auth-form';
import { AuthFormBase } from '../auth-form-base';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent extends AuthFormBase {
  form: FormGroup;

  constructor(authService: AuthService, router: Router, host: ElementRef<HTMLElement>, fb: FormBuilder) {
    super(authService, router, host);
    this.form = fb.group({
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
    this.run(this.authService.login(v.email.trim(), v.password), 'login');
  }
}
