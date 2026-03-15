import { TestBed } from '@angular/core/testing';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  it('should be created', () => {
    TestBed.runInInjectionContext(() => {
      expect(guestGuard).toBeTruthy();
    });
  });
});
