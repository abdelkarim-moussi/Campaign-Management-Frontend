import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrganizationStore } from '../../stores/organization.store';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LoadingOverlayComponent } from '../../components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingOverlayComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  readonly orgStore = inject(OrganizationStore);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);

  readonly currentUser = this.authService.getUser();

  activeTab: 'organization' | 'profile' = 'organization';

  // Org Form Data
  orgForm = { name: '', email: '' };

  // Profile Form Data
  profileForm = { firstName: '', lastName: '' };
  isUpdatingProfile = false;

  ngOnInit(): void {
    this.orgStore.loadOrganization();

    // Fill profile form
    if (this.currentUser) {
      this.profileForm.firstName = this.currentUser.firstName || '';
      this.profileForm.lastName = this.currentUser.lastName || '';
    }
  }

  // Effect to sync orgForm when organization data loads
  constructor() {
    import('@angular/core').then(({ effect }) => {
      effect(() => {
        const org = this.orgStore.organization();
        if (org) {
          this.orgForm.name = org.name || '';
          this.orgForm.email = org.email || '';
        }
      });
    });
  }

  updateOrganization(): void {
    if (!this.orgForm.name) return;
    this.orgStore.updateOrganization({
      request: { name: this.orgForm.name, email: this.orgForm.email },
      onSuccess: () => { }
    });
  }

  updateProfile(): void {
    if (!this.profileForm.firstName || !this.profileForm.lastName) return;

    this.isUpdatingProfile = true;
    this.userService.updateProfile({
      firstName: this.profileForm.firstName,
      lastName: this.profileForm.lastName
    }).subscribe({
      next: (user) => {
        this.isUpdatingProfile = false;
        this.toastr.success('Personal profile updated successfully');
        // Update local auth cache
        const currentToken = this.authService.getToken();
        const currentOrg = this.authService.getOrganization();
        if (currentToken && currentOrg) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      },
      error: () => {
        this.isUpdatingProfile = false;
        this.toastr.error('Failed to update personal profile');
      }
    });
  }

  getUsagePercentage(current: number, max: number): number {
    if (!max) return 0;
    return Math.min(Math.round((current / max) * 100), 100);
  }
}
