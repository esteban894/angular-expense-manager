import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable({
  providedIn: 'root',
})
export class RedirectGuard implements CanActivate {
  constructor(private tokenService: TokenService, private router: Router) {}

  canActivate(): boolean {
    const isValidToken = this.tokenService.isValidToken();
    if (isValidToken) {
      this.router.navigate(['/app']);
    }
    return true;
  }
}
