import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CpDataService } from '../../core/services/cp-data.service';
import { ItemIconComponent } from '../../shared/ui/atoms/item-icon/item-icon.component';

@Component({
  selector: 'app-historial-page',
  imports: [FormsModule, ItemIconComponent],
  templateUrl: './historial.page.html',
  styleUrl: './historial.page.css',
})
export class HistorialPage {
  searchText = '';

  constructor(public data: CpDataService) {}

  get entries() {
    const query = this.searchText.trim().toLowerCase();

    return this.data
      .contributions()
      .map((contribution) => {
        const participant = this.data
          .participants()
          .find((item) => item.id === contribution.participantId);
        const material = this.data.materials().find((item) => item.id === contribution.materialId);

        return {
          ...contribution,
          participantName: participant?.name ?? 'Participante eliminado',
          materialName: material?.name ?? 'Material desconocido',
          materialIcon: material?.icon ?? '',
          createdLabel: new Intl.DateTimeFormat('es-AR', {
            dateStyle: 'short',
            timeStyle: 'short',
          }).format(new Date(contribution.createdAt)),
        };
      })
      .filter(
        (entry) =>
          !query ||
          entry.participantName.toLowerCase().includes(query) ||
          entry.materialName.toLowerCase().includes(query) ||
          entry.amount.toString().includes(query),
      );
  }

  clearSearch(): void {
    this.searchText = '';
  }
}
