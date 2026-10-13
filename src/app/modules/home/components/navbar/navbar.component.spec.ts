import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  it('deja de escuchar el router al destruirse', () => {
    const events = new Subject<any>();
    TestBed.configureTestingModule({
      declarations: [NavbarComponent],
      providers: [
        { provide: Router, useValue: { events } },
        { provide: AuthService, useValue: { isLoggedIn: () => true, logout() {} } },
        { provide: UserService, useValue: { getEmail: () => 'ana@x.com' } },
      ],
    });
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    events.next(new NavigationEnd(1, '/', '/'));
    expect(fixture.componentInstance.userEmail).toBe('ana@x.com');
    expect(fixture.componentInstance.initials).toBe('AN');
    fixture.componentInstance.userEmail = null;
    fixture.destroy();
    events.next(new NavigationEnd(2, '/', '/'));
    expect(fixture.componentInstance.userEmail).toBeNull();
  });
});
