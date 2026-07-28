import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Action, Screen } from '../models';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export function permissionGuard(screen: Screen, action: Action): CanActivateFn {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    await authService.ensureProfileLoaded();

    if (authService.can(screen, action)) {
      return true;
    }

    toast.warning('Você não tem permissão para acessar esta tela.');
    router.navigate(['/dashboard']);
    return false;
  };
}
