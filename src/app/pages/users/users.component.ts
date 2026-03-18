import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User, UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { UserStore } from '../../stores/user.store';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { LoadingOverlayComponent } from '../../components/loading-overlay/loading-overlay.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, CommonModule, ConfirmDialogComponent, LoadingOverlayComponent, PaginationComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  searchQuery = signal('');
  roleFilter = signal('');
  showAddForm = false;
  showInviteForm = false;
  showDeleteConfirm = false;
  showRoleConfirm = false;
  deleteTargetId: number | null = null;
  roleUpdateTarget: { userId: number, role: string } | null = null;
  
  newUser: Partial<User> = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'MEMBER',
  };

  newInvite = {
    email: '',
    role: 'MEMBER',
  };

  currentUser: any = null;
  readonly userStore = inject(UserStore);
  readonly authService = inject(AuthService);

  filteredUsers = computed(() => {
    const users = this.userStore.users();
    const query = this.searchQuery().toLowerCase();
    const role = this.roleFilter();

    return users.filter((user) => {
      const name = this.getDisplayName(user).toLowerCase();
      const matchesSearch =
        !query ||
        name.includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchesRole = !role || user.role === role;
      return matchesSearch && matchesRole;
    });
  });

  constructor() {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.userStore.loadUsers({ page: 0 });
  }

  getDisplayName(user: User): string {
    if (user.fullName) return user.fullName;
    if (user.name) return user.name;
    const first = user.firstName || '';
    const last = user.lastName || '';
    return `${first} ${last}`.trim() || user.email;
  }

  inviteUser(): void {
    if (!this.newInvite.email || !this.newInvite.role) return;

    this.userStore.inviteUser({
      request: this.newInvite,
      onSuccess: () => {
        this.newInvite = { email: '', role: 'MEMBER' };
        this.showInviteForm = false;
        this.userStore.loadUsers({ page: this.userStore.currentPage() });
      }
    });
  }

  confirmDelete(id: number): void {
    this.deleteTargetId = id;
    this.showDeleteConfirm = true;
  }

  deleteUser(): void {
    if (!this.deleteTargetId) return;
    this.userStore.deleteUser(this.deleteTargetId);
    setTimeout(() => this.userStore.loadUsers({ page: this.userStore.currentPage() }), 300);
    this.cancelDelete();
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteTargetId = null;
  }

  canManageUser(user: User): boolean {
    const meRole = this.currentUser?.role || 'MEMBER';
    if (meRole === 'OWNER') return true;
    if (meRole === 'ADMIN') {
        // Admins can't delete Owners
        return user.role !== 'OWNER';
    }
    return false;
  }

  updateRole(userId: number, role: string): void {
    this.roleUpdateTarget = { userId, role };
    this.showRoleConfirm = true;
  }

  confirmRoleUpdate(): void {
    if (!this.roleUpdateTarget) return;
    this.userStore.updateUserRole(this.roleUpdateTarget);
    this.cancelRoleUpdate();
  }

  cancelRoleUpdate(): void {
    this.showRoleConfirm = false;
    this.roleUpdateTarget = null;
  }

  onPageChange(page: number): void {
    this.userStore.loadUsers({ page });
  }
}
