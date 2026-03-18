import { TestBed } from '@angular/core/testing';
import { refreshTokenInterceptor } from './refresh-token.interceptor';

describe('refreshTokenInterceptor', () => {
  it('should be created', () => {
    TestBed.runInInjectionContext(() => {
      expect(refreshTokenInterceptor).toBeTruthy();
    });
  });
});
