import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserStore } from '../../stores/user.store';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  readonly userStore = inject(UserStore);
  readonly authService = inject(AuthService);

  searchQuery = '';
  roleFilter = '';
  showInviteForm = false;

  newInvite = { email: '', role: 'USER' };

  currentUser = this.authService.getUser();

  ngOnInit(): void {
    this.userStore.loadUsers();
  }

  get filteredUsers() {
    return this.userStore.users().filter(user => {
      const matchesSearch = !this.searchQuery ||
        user.fullName?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesRole = !this.roleFilter || user.role === this.roleFilter;
      return matchesSearch && matchesRole;
    });
  }

  inviteUser(): void {
    if (!this.newInvite.email || !this.newInvite.role) return;

    this.userStore.inviteUser({
      request: { email: this.newInvite.email, role: this.newInvite.role },
      onSuccess: () => {
        this.newInvite = { email: '', role: 'USER' };
        this.showInviteForm = false;
        // Optionally reload users since DTO isn't returned for newly invited immediately
        this.userStore.loadUsers();
      }
    });
  }

  updateRole(userId: number, newRole: string): void {
    this.userStore.updateUserRole({ userId, role: newRole });
  }

  confirmDelete(id: number): void {
    if (confirm('Are you sure you want to remove this user from the organization? They will lose access to all campaigns and data.')) {
      this.userStore.deleteUser(id);
    }
  }

  canManageUser(targetRole: string): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'OWNER') return true;
    if (this.currentUser.role === 'ADMIN' && targetRole !== 'OWNER' && targetRole !== 'ADMIN') return true;
    return false;
  }
}
