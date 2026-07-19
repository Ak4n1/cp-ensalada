import { Component, Input, inject } from '@angular/core';
import { ExcelExportService } from '../../../../core/services/excel-export.service';
import { PdfExportService } from '../../../../core/services/pdf-export.service';
import { CpDataService } from '../../../../core/services/cp-data.service';
import { ItemIconComponent } from '../../atoms/item-icon/item-icon.component';

@Component({
  selector: 'app-contributions-table',
  imports: [ItemIconComponent],
  templateUrl: './contributions-table.component.html',
  styleUrl: './contributions-table.component.css',
})
export class ContributionsTableComponent {
  readonly data = inject(CpDataService);
  private readonly excel = inject(ExcelExportService);
  private readonly pdf = inject(PdfExportService);
  @Input() searchText = '';

  materialsWithStock() {
    const query = this.searchText.trim().toLowerCase();

    return this.data.materials()
      .filter((material) => this.data.totalFor(material.id) > 0)
      .filter((material) => {
        if (!query) {
          return true;
        }

        const materialMatches = material.name.toLowerCase().includes(query);
        const participantMatches = this.data.participants().some((participant) =>
          participant.name.toLowerCase().includes(query) &&
          this.data.totalFor(material.id, participant.id) > 0,
        );

        return materialMatches || participantMatches;
      });
  }

  async downloadParticipantPdf(participantId: string): Promise<void> {
    await this.pdf.exportParticipant(this.data, participantId);
  }

  async downloadParticipantExcel(participantId: string): Promise<void> {
    await this.excel.exportParticipant(this.data, participantId);
  }

  async downloadGeneralPdf(): Promise<void> {
    await this.pdf.exportGeneral(this.data);
  }

  async downloadGeneralExcel(): Promise<void> {
    await this.excel.exportGeneral(this.data);
  }
}
