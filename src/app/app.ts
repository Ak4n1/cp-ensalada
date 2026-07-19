import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { CpDataService } from './core/services/cp-data.service';
import { PasswordGateComponent } from './shared/ui/molecules/password-gate/password-gate.component';
import { AppShellComponent } from './shared/ui/organisms/app-shell/app-shell.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PasswordGateComponent, AppShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly auth = inject(AuthService);
  private readonly data = inject(CpDataService);

  constructor() {
    effect(() => {
      if (!this.auth.isReady()) {
        return;
      }

      if (this.auth.isAuthenticated()) {
        void this.data.load();
      } else {
        this.data.clear();
      }
    });
  }
}
