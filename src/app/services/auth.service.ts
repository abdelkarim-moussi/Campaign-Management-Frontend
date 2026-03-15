import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface AcceptInvitationRequest {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: string;
  status: string;
  organizationId?: number;
}

export interface OrganizationDto {
  id: number;
  name: string;
  email: string;
  plan: string;
  status: string;
  maxUsers?: number;
  currentUsers?: number;
}

export interface AuthResponse {
  tokens: Record<string, string>;
  type: string;
  user: UserDto;
  organization: OrganizationDto;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private accessTokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'user';
  private organizationKey = 'organization';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    this.hasToken(),
  );

  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          const token =
            response.tokens?.['accessToken'] || response.tokens?.['token'];
          if (token) {
            this.setAccessToken(token);
          }
          this.setUser(response.user);
          this.setOrganization(response.organization);
          this.isAuthenticatedSubject.next(true);
        }),
      );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        tap((response) => {
          const token =
            response.tokens?.['accessToken'] || response.tokens?.['token'];
          if (token) {
            this.setAccessToken(token);
          }
          this.setUser(response.user);
          this.setOrganization(response.organization);
          this.isAuthenticatedSubject.next(true);
        }),
      );
  }

  acceptInvitation(request: AcceptInvitationRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${environment.apiUrl}/auth/accept-invitation`,
        request,
      )
      .pipe(
        tap((response) => {
          const token =
            response.tokens?.['accessToken'] || response.tokens?.['token'];
          if (token) {
            this.setAccessToken(token);
          }
          this.setUser(response.user);
          this.setOrganization(response.organization);
          this.isAuthenticatedSubject.next(true);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.organizationKey);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getUser(): UserDto | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  getOrganization(): OrganizationDto | null {
    const org = localStorage.getItem(this.organizationKey);
    return org ? JSON.parse(org) : null;
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.accessTokenKey);
  }

  private setAccessToken(token: string): void {
    localStorage.setItem(this.accessTokenKey, token);
  }

  private setUser(user: UserDto): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private setOrganization(org: OrganizationDto): void {
    localStorage.setItem(this.organizationKey, JSON.stringify(org));
  }
}
