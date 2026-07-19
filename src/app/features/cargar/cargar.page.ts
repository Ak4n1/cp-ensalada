import { Component } from '@angular/core';
import { Contribution } from '../../core/models/contribution.model';
import { ContributionFormComponent } from '../../shared/ui/organisms/contribution-form/contribution-form.component';
import { RecentContributionsComponent } from '../../shared/ui/organisms/recent-contributions/recent-contributions.component';

@Component({
  selector: 'app-cargar-page',
  imports: [ContributionFormComponent, RecentContributionsComponent],
  templateUrl: './cargar.page.html',
  styleUrl: './cargar.page.css',
})
export class CargarPage {
  contributionToEdit: Contribution | null = null;

  editContribution(contribution: Contribution): void {
    this.contributionToEdit = contribution;
  }

  clearEdit(): void {
    this.contributionToEdit = null;
  }
}
