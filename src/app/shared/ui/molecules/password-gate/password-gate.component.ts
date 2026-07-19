import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-password-gate',
  imports: [FormsModule],
  templateUrl: './password-gate.component.html',
  styleUrl: './password-gate.component.css',
})
export class PasswordGateComponent {
  private readonly auth = inject(AuthService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  password = '';
  error = '';
  errorVariant: 'error' | 'warning' = 'error';
  isSubmitting = false;
  showPassword = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async submit(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    const password = this.password.trim();

    if (!password) {
      this.error = 'Ingresá la contraseña de la CP para continuar.';
      this.errorVariant = 'warning';
      return;
    }

    this.error = '';
    this.errorVariant = 'error';
    this.isSubmitting = true;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      this.error = 'El servidor tardó demasiado en responder. Probá otra vez en unos segundos.';
      this.isSubmitting = false;
      this.changeDetector.detectChanges();
    }, 8_000);

    try {
      const result = await this.auth.login(password);

      if (timedOut) {
        return;
      }

      if (!result.ok) {
        this.error = result.message;
        this.errorVariant = result.reason === 'rate-limited' ? 'warning' : 'error';
      }
    } catch {
      if (!timedOut) {
        this.error = 'No se pudo validar la contraseña. Probá de nuevo.';
        this.errorVariant = 'error';
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (!timedOut) {
        this.isSubmitting = false;
        this.changeDetector.detectChanges();
      }
    }
  }
}
