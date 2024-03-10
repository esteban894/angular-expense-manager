import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RegisterDto, ResponseLogin } from '../models/auth.model';
import { environment } from 'src/environments/environment';
import { catchError, switchMap, tap } from 'rxjs';
import { TokenService } from './token.service';
import { Router } from '@angular/router';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private url: string;
  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenService: TokenService,
    private userService: UserService
  ) {
    this.url = environment.url;
  }

  login(email: string, password: string) {
    return this.http
      .post<ResponseLogin>(`${this.url}/auth/login`, {
        email,
        password,
      })
      .pipe(
        catchError((err) => {
          throw err;
        }),
        tap((response) => {
          this.tokenService.saveToken(response.token);
          this.userService.saveEmail(response.email);
        })
      );
  }

  register(name: string, email: string, password: string) {
    return this.http.post<RegisterDto>(`${this.url}/auth/register`, {
      name,
      email,
      password,
    });
  }

  registerAndLogin(name: string, email: string, password: string) {
    return this.register(name, email, password).pipe(
      switchMap(() => this.login(email, password))
    );
  }

  isLoggedIn() {
    return this.tokenService.isValidToken();
  }

  logout() {
    this.tokenService.removeToken();
    this.userService.removeEmail();
    this.router.navigate(['/']);
  }
}
