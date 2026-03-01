import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-users',
  imports: [FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchQuery = '';
  roleFilter = '';
  showAddForm = false;
  newUser: Partial<User> = { name: '', email: '', role: 'user' };

  // Mock data for demonstration
  private mockUsers: User[] = [
    { id: 1, name: 'Ahmed Benali', email: 'ahmed@easytakrawt.com', role: 'admin', status: 'active', createdAt: '2025-01-15' },
    { id: 2, name: 'Sara Moussaoui', email: 'sara@easytakrawt.com', role: 'manager', status: 'active', createdAt: '2025-02-20' },
    { id: 3, name: 'Youssef El Amrani', email: 'youssef@easytakrawt.com', role: 'user', status: 'active', createdAt: '2025-03-10' },
    { id: 4, name: 'Fatima Zahra', email: 'fatima@easytakrawt.com', role: 'user', status: 'inactive', createdAt: '2025-04-05' },
    { id: 5, name: 'Karim Hadid', email: 'karim@easytakrawt.com', role: 'manager', status: 'active', createdAt: '2025-05-12' },
    { id: 6, name: 'Nadia Larbi', email: 'nadia@easytakrawt.com', role: 'user', status: 'active', createdAt: '2025-06-08' },
  ];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    // Use mock data initially; swap with API call when backend is ready
    // this.userService.getUsers().subscribe(users => { this.users = users; this.filterUsers(); });
    this.users = [...this.mockUsers];
    this.filterUsers();
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchQuery ||
        user.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesRole = !this.roleFilter || user.role === this.roleFilter;
      return matchesSearch && matchesRole;
    });
  }

  addUser(): void {
    if (!this.newUser.name || !this.newUser.email) return;
    const user: User = {
      id: this.users.length + 1,
      name: this.newUser.name!,
      email: this.newUser.email!,
      role: this.newUser.role || 'user',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.users.unshift(user);
    this.filterUsers();
    this.newUser = { name: '', email: '', role: 'user' };
    this.showAddForm = false;
  }

  deleteUser(id: number): void {
    this.users = this.users.filter(u => u.id !== id);
    this.filterUsers();
  }
}
