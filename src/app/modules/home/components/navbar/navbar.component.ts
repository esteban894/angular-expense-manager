import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { ThemeMode, ThemeService } from 'src/app/services/theme.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  initials = '';
  isLoggedIn: boolean = false;
  userEmail: string | null = null;
  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    public theme: ThemeService
  ) {}

  modeLabel(mode: ThemeMode | null): string {
    return mode === 'light' ? 'claro' : mode === 'dark' ? 'oscuro' : 'sistema';
  }

  ngOnInit(): void {
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isLoggedIn = this.authService.isLoggedIn();
        this.userEmail = this.userService.getEmail();
        this.initials = (this.userEmail ?? '').split('@')[0].slice(0, 2).toUpperCase();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logOut() {
    this.authService.logout();
  }
}
