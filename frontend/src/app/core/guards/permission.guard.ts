import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Action, Screen } from '../models';
import { AuthService } from '../services/auth.service';

export function permissionGuard(screen: Screen, action: Action): CanActivateFn {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    await authService.ensureProfileLoaded();

    if (authService.can(screen, action)) {
      return true;
    }

    router.navigate(['/dashboard']);
    return false;
  };
}
