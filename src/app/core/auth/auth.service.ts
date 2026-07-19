import { Injectable, signal } from '@angular/core';
import { apiUrl } from '../api/api.config';

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'rate-limited' | 'network' | 'unknown'; message: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionHintKey = 'cp_session_hint';

  readonly isAuthenticated = signal(this.hasSessionHint());
  readonly isReady = signal(false);

  constructor() {
    void this.checkSession();
  }

  async login(password: string): Promise<LoginResult> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

    let response: Response;

    try {
      response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
        signal: controller.signal,
      });
    } catch {
      return {
        ok: false,
        reason: 'network',
        message: 'No pude conectar con el servidor. Probá de nuevo en unos segundos.',
      };
    } finally {
      window.clearTimeout(timeoutId);
    }

    if (response.ok) {
      this.isAuthenticated.set(true);
      this.setSessionHint(true);
      return { ok: true };
    }

    if (response.status === 401) {
      return {
        ok: false,
        reason: 'invalid',
        message: 'Contraseña incorrecta.',
      };
    }

    if (response.status === 429) {
      return {
        ok: false,
        reason: 'rate-limited',
        message: 'Demasiados intentos seguidos. Esperá unos minutos antes de volver a probar.',
      };
    }

    return {
      ok: false,
      reason: 'unknown',
      message: 'No se pudo validar la contraseña. Intentá nuevamente.',
    };
  }

  async logout(): Promise<void> {
    await fetch(apiUrl('/api/auth/logout'), {
      method: 'POST',
      credentials: 'include',
    });
    this.isAuthenticated.set(false);
    this.setSessionHint(false);
  }

  async checkSession(): Promise<void> {
    try {
      const response = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
      const data = (await response.json()) as { authenticated?: boolean };
      const authenticated = Boolean(data.authenticated);

      this.isAuthenticated.set(authenticated);
      this.setSessionHint(authenticated);
    } catch {
      this.isAuthenticated.set(false);
      this.setSessionHint(false);
    } finally {
      this.isReady.set(true);
    }
  }

  private hasSessionHint(): boolean {
    return sessionStorage.getItem(this.sessionHintKey) === '1';
  }

  private setSessionHint(value: boolean): void {
    if (value) {
      sessionStorage.setItem(this.sessionHintKey, '1');
      return;
    }

    sessionStorage.removeItem(this.sessionHintKey);
  }
}
