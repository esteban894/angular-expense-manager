import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { UserService } from './user.service';
import { TransactionService } from './transaction.service';
import { ToastService } from './toast.service';

describe('AuthService', () => {
  it('logout limpia sesión, filtros y toast, y vuelve al inicio', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const token = jasmine.createSpyObj<TokenService>('TokenService', ['removeToken']);
    const user = jasmine.createSpyObj<UserService>('UserService', ['removeEmail']);
    const transactions = jasmine.createSpyObj<TransactionService>('TransactionService', ['clearFilters']);
    const toast = jasmine.createSpyObj<ToastService>('ToastService', ['dismiss']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: router },
        { provide: TokenService, useValue: token },
        { provide: UserService, useValue: user },
        { provide: TransactionService, useValue: transactions },
        { provide: ToastService, useValue: toast },
      ],
    });

    TestBed.inject(AuthService).logout();

    expect(token.removeToken).toHaveBeenCalled();
    expect(user.removeEmail).toHaveBeenCalled();
    expect(transactions.clearFilters).toHaveBeenCalled();
    expect(toast.dismiss).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
