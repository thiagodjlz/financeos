import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const isAuthEndpoint = req.url.includes('/auth/login');
  const token = authService.token();

  const authReq = token && !isAuthEndpoint
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        void router.navigate(['/login']);

        // No login o 401 é credencial errada e quem avisa é a própria tela (Falha, D12);
        // aqui é sessão expirada, que o usuário resolve entrando de novo (Alerta).
        if (!isAuthEndpoint) {
          toast.warning('Sua sessão expirou. Entre novamente.');
        }
      }

      return throwError(() => error);
    }),
  );
};
