import { inject, Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private allowedRoles: string[] = [];
  private hasView = false;
  
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  constructor() {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      this.updateView();
    });
  }

  @Input() set appHasRole(roles: string[] | string) {
    this.allowedRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  private updateView() {
    const user = this.authService.getUser();
    if (user && user.role && this.allowedRoles.includes(user.role)) {
      if (!this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      }
    } else {
      if (this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    }
  }
}
