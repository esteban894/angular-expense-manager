import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { emailFormat, notBlank } from '../auth-form';
import { AuthFormBase } from '../auth-form-base';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent extends AuthFormBase {
  form: FormGroup;

  constructor(authService: AuthService, router: Router, host: ElementRef<HTMLElement>, fb: FormBuilder) {
    super(authService, router, host);
    this.form = fb.group({
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
    this.run(this.authService.registerAndLogin(v.name.trim(), v.email.trim(), v.password), 'register');
  }
}
