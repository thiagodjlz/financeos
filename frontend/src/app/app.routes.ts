import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        canActivate: [permissionGuard('DASHBOARD', 'VIEW')],
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'transactions',
        canActivate: [permissionGuard('TRANSACTIONS', 'VIEW')],
        loadComponent: () => import('./features/transactions/transactions').then((m) => m.Transactions),
      },
      {
        path: 'categories',
        canActivate: [permissionGuard('CATEGORIES', 'VIEW')],
        loadComponent: () => import('./features/categories/categories').then((m) => m.Categories),
      },
      {
        path: 'users',
        canActivate: [permissionGuard('USERS', 'VIEW')],
        loadComponent: () => import('./features/users/users').then((m) => m.Users),
      },
      {
        path: 'profiles',
        canActivate: [permissionGuard('PROFILES', 'VIEW')],
        loadComponent: () => import('./features/profiles/profiles').then((m) => m.Profiles),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
