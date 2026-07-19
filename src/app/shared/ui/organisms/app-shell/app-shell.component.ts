import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { CpDataService } from '../../../../core/services/cp-data.service';
import { StatPillComponent } from '../../atoms/stat-pill/stat-pill.component';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, StatPillComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly data = inject(CpDataService);
}
