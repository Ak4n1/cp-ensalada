import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContributionsTableComponent } from '../../shared/ui/organisms/contributions-table/contributions-table.component';

@Component({
  selector: 'app-aportes-page',
  imports: [FormsModule, ContributionsTableComponent],
  templateUrl: './aportes.page.html',
  styleUrl: './aportes.page.css',
})
export class AportesPage {
  searchText = '';

  clearSearch(): void {
    this.searchText = '';
  }
}
