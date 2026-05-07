import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/tasks', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'tasks',
    loadComponent: () => import('./tasks/task-board/task-board.component').then((m) => m.TaskBoardComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/tasks' },
];
