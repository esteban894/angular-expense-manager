import { Component } from '@angular/core';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  readonly name: string;

  constructor(userService: UserService) {
    const local = (userService.getEmail() ?? '').split('@')[0];
    this.name = local.charAt(0).toUpperCase() + local.slice(1);
  }
}
