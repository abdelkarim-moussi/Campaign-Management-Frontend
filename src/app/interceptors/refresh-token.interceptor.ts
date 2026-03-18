import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import {
  catchError,
  throwError,
  switchMap,
  BehaviorSubject,
  filter,
  take,
  finalize,
} from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<
  string | null
>(null);

export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !req.url.includes('/auth/refresh') &&
        !req.url.includes('/auth/login')
      ) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          const refreshToken = authService.getRefreshToken();

          if (refreshToken) {
            return authService.refreshToken({ refreshToken }).pipe(
              switchMap((response) => {
                isRefreshing = false;
                refreshTokenSubject.next(response.accessToken);
                return next(
                  req.clone({
                    setHeaders: {
                      Authorization: `Bearer ${response.accessToken}`,
                    },
                  }),
                );
              }),
              catchError((refreshError) => {
                isRefreshing = false;
                authService.logout();
                return throwError(() => refreshError);
              }),
            );
          } else {
            isRefreshing = false;
            authService.logout();
            return throwError(() => error);
          }
        } else {
          return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((token) => {
              return next(
                req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${token}`,
                  },
                }),
              );
            }),
          );
        }
      }

      return throwError(() => error);
    }),
  );
};
