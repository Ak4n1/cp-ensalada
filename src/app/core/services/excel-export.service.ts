import { Injectable } from '@angular/core';
import { CpDataService } from './cp-data.service';

@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  async exportGeneral(data: CpDataService): Promise<void> {
    const participants = data.participants();
    const materials = data.materials().filter((material) => data.totalFor(material.id) > 0);
    const rows = [
      ['Material', ...participants.map((participant) => participant.name), 'Total'],
      ...materials.map((material) => [
        material.name,
        ...participants.map((participant) => data.totalFor(material.id, participant.id).toString()),
        data.totalFor(material.id).toString(),
      ]),
    ];

    await this.downloadWorkbook(rows, 'aportes-generales.xlsx', 'Aportes');
  }

  async exportParticipant(data: CpDataService, participantId: string): Promise<void> {
    const participant = data.participants().find((item) => item.id === participantId);

    if (!participant) {
      return;
    }

    const rows = [
      ['Material', 'Cantidad'],
      ...data.materials()
        .map((material) => [material.name, data.totalFor(material.id, participant.id).toString()])
        .filter(([, amount]) => Number(amount) > 0),
    ];

    await this.downloadWorkbook(rows, `aportes-${this.slugify(participant.name)}.xlsx`, participant.name);
  }

  private async downloadWorkbook(rows: string[][], filename: string, sheetName: string): Promise<void> {
    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.aoa_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    worksheet['!cols'] = rows[0]?.map((_, index) => ({
      wch: Math.max(...rows.map((row) => row[index]?.length ?? 0), 10) + 2,
    }));
    xlsx.utils.book_append_sheet(workbook, worksheet, this.safeSheetName(sheetName));
    xlsx.writeFile(workbook, filename);
  }

  private slugify(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  private safeSheetName(value: string): string {
    return value.replace(/[:\\/?*[\]]/g, '').slice(0, 31) || 'Aportes';
  }
}
