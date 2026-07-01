import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface UserSession {
  name: string;
  email: string;
  token: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/auth';
  private readonly http = inject(HttpClient);

  public readonly currentUser = signal<UserSession | null>(null);
  public readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('hr_session');
      if (stored) {
        try {
          this.currentUser.set(JSON.parse(stored));
        } catch (e) {
          localStorage.removeItem('hr_session');
        }
      }
    }
  }

  public loginWithPassword(email: string, password: string): Observable<{ success: boolean; message: string; user?: UserSession }> {
    return this.http.post<{ success: boolean; message: string; user?: UserSession }>(`${this.API_URL}/login-password`, { email, password })
      .pipe(
        tap(data => {
          if (data.success && data.user) {
            this.currentUser.set(data.user);
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem('hr_session', JSON.stringify(data.user));
            }
          }
        }),
        catchError(() => of({ success: false, message: 'Could not connect to auth server.' }))
      );
  }

  public registerDirect(email: string, name: string, password: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/register-direct`, { email, name, password })
      .pipe(
        catchError(() => of({ success: false, message: 'Could not connect to auth server.' }))
      );
  }

  public requestResetOTP(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/forgot-password-otp`, { email })
      .pipe(
        catchError(() => of({ success: false, message: 'Could not connect to auth server.' }))
      );
  }

  public resetPassword(email: string, otp: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/reset-password`, { email, otp, newPassword })
      .pipe(
        catchError(() => of({ success: false, message: 'Could not connect to auth server.' }))
      );
  }

  public updateAvatar(base64: string) {
    const user = this.currentUser();
    if (user) {
      user.avatar = base64;
      this.currentUser.set({ ...user });
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('hr_session', JSON.stringify(user));
      }
    }
  }

  public logout() {
    this.currentUser.set(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('hr_session');
    }
  }
}
