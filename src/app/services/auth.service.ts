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
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private accessTokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'user';
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
          this.setAccessToken(response.accessToken);
          this.setUser({ email: credentials.email });
          this.isAuthenticatedSubject.next(true);
        }),
      );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        tap((response) => {
          this.setAccessToken(response.accessToken);
          this.setUser({ name: data.name, email: data.email });
          this.isAuthenticatedSubject.next(true);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.userKey);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getUser(): any | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
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
  private setUser(user: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }
}
