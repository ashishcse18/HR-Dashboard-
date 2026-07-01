import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserSession } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class AuthComponent {
  private readonly authService = inject(AuthService);

  @Output() navigateToRegister = new EventEmitter<void>();

  public mode = signal<'login' | 'forgot'>('login');
  public step = signal<'form' | 'otp'>('form');
  public loading = signal<boolean>(false);

  public alertMessage = signal<string | null>(null);
  public alertType = signal<'error' | 'success'>('error');

  public email = '';
  public password = '';
  public otpCode = '';

  public setMode(mode: 'login' | 'forgot') {
    this.mode.set(mode);
    this.alertMessage.set(null);
    this.password = '';
    this.otpCode = '';
  }

  public resetToForm() {
    this.step.set('form');
    this.otpCode = '';
    this.password = '';
    this.alertMessage.set(null);
  }

  public onSubmitForm() {
    if (!this.email) {
      this.showAlert('Email is required.', 'error');
      return;
    }

    this.loading.set(true);
    this.alertMessage.set(null);

    let request$: Observable<{ success: boolean; message: string; user?: UserSession }>;

    if (this.mode() === 'forgot') {
      request$ = this.authService.requestResetOTP(this.email);
    } else {
      if (!this.password) {
        this.showAlert('Password is required.', 'error');
        this.loading.set(false);
        return;
      }
      request$ = this.authService.loginWithPassword(this.email, this.password);
    }

    request$.subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          if (this.mode() === 'login') {
            this.showAlert('Welcome back!', 'success');
          } else {
            this.step.set('otp');
            this.showAlert(res.message, 'success');
          }
        } else {
          this.showAlert(res.message, 'error');
        }
      },
      error: () => {
        this.loading.set(false);
        this.showAlert('An unexpected error occurred.', 'error');
      },
    });
  }

  public onSubmitOTP() {
    if (!this.otpCode || this.otpCode.length !== 6) {
      this.showAlert('Please enter a valid 6-digit OTP code.', 'error');
      return;
    }

    this.loading.set(true);
    this.alertMessage.set(null);

    let request$: Observable<{ success: boolean; message: string }>;

    if (this.mode() === 'forgot') {
      if (!this.password) {
        this.showAlert('New password is required.', 'error');
        this.loading.set(false);
        return;
      }
      request$ = this.authService.resetPassword(this.email, this.otpCode, this.password);
    } else {
      this.loading.set(false);
      return;
    }

    request$.subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.showAlert(res.message, 'success');

          setTimeout(() => {
            this.mode.set('login');
            this.step.set('form');
            this.otpCode = '';
            this.password = '';
            this.showAlert('Please sign in using your account.', 'success');
          }, 1500);
        } else {
          this.showAlert(res.message, 'error');
        }
      },
      error: () => {
        this.loading.set(false);
        this.showAlert('An unexpected error occurred.', 'error');
      },
    });
  }

  private showAlert(msg: string, type: 'error' | 'success') {
    this.alertMessage.set(msg);
    this.alertType.set(type);
  }
}
