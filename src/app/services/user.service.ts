import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Page } from '../models/page.model';

export interface User {
  id: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  organizationId?: number;
}

export type UserDto = User;

export interface InviteUserRequest {
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(page = 0, size = 10): Observable<Page<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Page<User>>(this.API_URL, { params });
  }

  getOrganizationUsers(page = 0, size = 10): Observable<Page<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Page<User>>(this.API_URL, { params });
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`);
  }

  inviteUser(request: { email: string; role: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/invite`, request);
  }

  updateUserRole(id: number, role: string): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/${id}/role`, null, {
      params: { role },
    });
  }

  updateProfile(payload: {
    firstName: string;
    lastName: string;
  }): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/me`, payload);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.API_URL, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
