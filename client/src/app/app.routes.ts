import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component'),
  },
  {
    path: 'change-password',
    loadComponent: () => import('./pages/change-password/change-password.component'),
    canActivate: [authGuard],
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component'),
    canActivate: [authGuard],
    children: [
      { path: 'inventory',    loadComponent: () => import('./pages/inventory/inventory.component'),           canActivate: [adminGuard] },
      { path: 'experiments',  loadComponent: () => import('./pages/experiments/experiments.component'),       canActivate: [adminGuard] },
      { path: 'experiments/:id', loadComponent: () => import('./pages/experiment-detail/experiment-detail.component'), canActivate: [adminGuard] },
      { path: 'low-stock',    loadComponent: () => import('./pages/low-stock/low-stock.component'),           canActivate: [adminGuard] },
      { path: 'billing',      loadComponent: () => import('./pages/billing/billing.component'),               canActivate: [adminGuard] },
      { path: 'laboratories', loadComponent: () => import('./pages/laboratories/laboratories.component'),     canActivate: [adminGuard] },
      { path: 'admin/users',  loadComponent: () => import('./pages/admin-users/admin-users.component'),       canActivate: [adminGuard] },
      { path: 'repository',   loadComponent: () => import('./pages/repository/repository.component') },
      { path: 'contacts',     loadComponent: () => import('./pages/contacts/contacts.component') },
      { path: '', redirectTo: 'inventory', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
