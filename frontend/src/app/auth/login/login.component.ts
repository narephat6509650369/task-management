import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <img src="assets/logo.png" class="logo-img" alt="logo" />
          <h1>Welcome back</h1>
          <p>Sign in to your workspace</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Email</label>
            <input
              type="email"
              formControlName="email"
              placeholder="you@example.com"
              [class.error]="isFieldInvalid('email')"
            />
            @if (isFieldInvalid('email')) {
              <span class="field-error">Valid email is required</span>
            }
          </div>

          <div class="form-group">
            <label>Password</label>
            <input
              type="password"
              formControlName="password"
              placeholder="••••••••"
              [class.error]="isFieldInvalid('password')"
            />
            @if (isFieldInvalid('password')) {
              <span class="field-error">Password is required</span>
            }
          </div>

          @if (errorMsg()) {
            <div class="alert alert-error">{{ errorMsg() }}</div>
          }

          <button type="submit" class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <p class="auth-footer">
          Don't have an account? <a routerLink="/register">Create one</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      padding: 1rem;
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2.5rem;
    }
    .auth-header { text-align: center; margin-bottom: 2rem; }
    /* Login / Register */
    .logo-img {width: 120px; height: auto; margin-bottom: 1rem;}
    .logo { font-size: 2.5rem; margin-bottom: 1rem; }
    .auth-header h1 { font-size: 1.75rem; font-weight: 700; color: var(--text); margin: 0 0 0.5rem; }
    .auth-header p { color: var(--text-muted); margin: 0; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--text); margin-bottom: 0.5rem; }
    .form-group input {
      width: 100%; padding: 0.75rem 1rem; background: var(--bg);
      border: 1.5px solid var(--border); border-radius: 8px; color: var(--text);
      font-size: 0.95rem; transition: border-color 0.2s; box-sizing: border-box;
    }
    .form-group input:focus { outline: none; border-color: var(--accent); }
    .form-group input.error { border-color: var(--danger); }
    .field-error { color: var(--danger); font-size: 0.8rem; margin-top: 0.25rem; display: block; }
    .btn-primary {
      width: 100%; padding: 0.875rem; background: var(--accent);
      color: white; border: none; border-radius: 8px; font-size: 1rem;
      font-weight: 600; cursor: pointer; margin-top: 0.5rem; transition: opacity 0.2s;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .alert { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem; }
    .alert-error { background: rgba(239,68,68,0.1); color: var(--danger); border: 1px solid rgba(239,68,68,0.2); }
    .auth-footer { text-align: center; color: var(--text-muted); font-size: 0.875rem; margin-top: 1.5rem; margin-bottom: 0; }
    .auth-footer a { color: var(--accent); text-decoration: none; font-weight: 500; }
  `],
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  errorMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.loginForm.value).subscribe({
      next: () => this.router.navigate(['/tasks']),
      error: (err) => {
        this.errorMsg.set(err.error?.error || 'Login failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
