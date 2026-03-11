import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  navItems = [
    { route: '/dashboard', label: 'Dashboard', icon: '&#x229E;', exact: true },
    { route: '/analytics', label: 'Analytics', icon: '&#x2261;', exact: false },
    { route: '/users', label: 'Users', icon: '&#x22A1;', exact: false },
    { route: '/contacts', label: 'Contacts', icon: '&#x229F;', exact: false },
    { route: '/templates', label: 'Templates', icon: '&#x2756;', exact: false },
    { route: '/campaigns', label: 'Campaigns', icon: '&#x22A0;', exact: false },
    {
      route: '/email-marketing',
      label: 'Email Marketing',
      icon: '&#x2709;',
      exact: false,
    },
    {
      route: '/sms-marketing',
      label: 'SMS Marketing',
      icon: '&#x22B9;',
      exact: false,
    },
    {
      route: '/automation',
      label: 'Automation',
      icon: '&#x27F3;',
      exact: false,
    },
  ];

  constructor(private authService: AuthService) { }

  logout(): void {
    this.authService.logout();
  }

  getUserInitials(): string {
    const user = this.authService.getUser();
    if (!user) return 'U';
    const displayName = user.name || user.email || '';
    if (!displayName) return 'U';
    return displayName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getUsername(): string {
    return this.authService.getUser()?.name || 'User';
  }

  getUserEmail(): string {
    return this.authService.getUser()?.email || '';
  }
}
