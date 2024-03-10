import { Injectable } from '@angular/core';
import { getCookie, removeCookie, setCookie } from 'typescript-cookie';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor() {}

  saveEmail(email: string) {
    setCookie('user_email', email, { expires: 365, path: '/' });
  }

  getEmail() {
    const email = getCookie('user_email');
    if (email) return email;
    return null;
  }

  removeEmail() {
    removeCookie('user_email');
  }
}
