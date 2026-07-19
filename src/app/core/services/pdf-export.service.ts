import { Injectable } from '@angular/core';
import { CpDataService } from './cp-data.service';

type PdfDocument = import('jspdf').jsPDF;
type PdfOrientation = 'p' | 'l';

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  async exportParticipant(data: CpDataService, participantId: string): Promise<void> {
    const participant = data.participants().find((item) => item.id === participantId);

    if (!participant) {
      return;
    }

    const rows = data
      .materials()
      .map((material) => ({
        material: material.name,
        amount: data.totalFor(material.id, participant.id),
      }))
      .filter((row) => row.amount > 0);

    const document = await this.createDocument(`Aportes de ${participant.name}`);
    this.writeTable(document, ['Material', 'Cantidad'], rows.map((row) => [row.material, row.amount]));
    this.writeTotal(document, rows.reduce((total, row) => total + row.amount, 0));
    document.save(`aportes-${participant.name.toLowerCase()}.pdf`);
  }

  async exportGeneral(data: CpDataService): Promise<void> {
    const participants = data.participants();
    const materials = data.materials().filter((material) => data.totalFor(material.id) > 0);
    const headers = ['Material', ...participants.map((participant) => participant.name), 'Total'];
    const rows = materials.map((material) => [
      material.name,
      ...participants.map((participant) => data.totalFor(material.id, participant.id)),
      data.totalFor(material.id),
    ]);

    const document = await this.createDocument('Resumen general de aportes', 'l');
    this.writeTable(document, headers, rows);
    this.writeTotal(document, materials.reduce((total, material) => total + data.totalFor(material.id), 0));
    document.save('aportes-generales.pdf');
  }

  private async createDocument(
    title: string,
    orientation: PdfOrientation = 'p',
  ): Promise<PdfDocument> {
    const { jsPDF } = await import('jspdf');
    const document = new jsPDF({ orientation, unit: 'pt', format: 'a4' });

    document.setFillColor(19, 14, 10);
    document.rect(0, 0, document.internal.pageSize.getWidth(), document.internal.pageSize.getHeight(), 'F');
    document.setTextColor(245, 228, 193);
    document.setFont('helvetica', 'bold');
    document.setFontSize(20);
    document.text(title, 36, 42);
    document.setTextColor(188, 169, 135);
    document.setFont('helvetica', 'normal');
    document.setFontSize(10);
    document.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 36, 62);

    return document;
  }

  private writeTable(document: PdfDocument, headers: string[], rows: (string | number)[][]): void {
    const pageWidth = document.internal.pageSize.getWidth();
    const margin = 36;
    const tableWidth = pageWidth - margin * 2;
    const columnWidth = tableWidth / headers.length;
    let y = 92;

    this.writeRow(document, headers, y, columnWidth, margin, true);
    y += 24;

    for (const row of rows) {
      if (y > document.internal.pageSize.getHeight() - 58) {
        document.addPage();
        this.paintPage(document);
        y = 44;
        this.writeRow(document, headers, y, columnWidth, margin, true);
        y += 24;
      }

      this.writeRow(document, row, y, columnWidth, margin);
      y += 22;
    }
  }

  private writeRow(
    document: PdfDocument,
    cells: (string | number)[],
    y: number,
    columnWidth: number,
    margin: number,
    isHeader = false,
  ): void {
    document.setFillColor(isHeader ? 61 : 28, isHeader ? 38 : 22, isHeader ? 15 : 16);
    document.rect(margin, y - 15, columnWidth * cells.length, 21, 'F');
    document.setTextColor(isHeader ? 255 : 245, isHeader ? 217 : 228, isHeader ? 135 : 193);
    document.setFont('helvetica', isHeader ? 'bold' : 'normal');
    document.setFontSize(isHeader ? 9 : 8);

    cells.forEach((cell, index) => {
      const text = String(cell);
      const x = margin + columnWidth * index + 6;
      document.text(text.slice(0, 22), x, y);
    });
  }

  private writeTotal(document: PdfDocument, total: number): void {
    const pageHeight = document.internal.pageSize.getHeight();
    document.setTextColor(255, 217, 135);
    document.setFont('helvetica', 'bold');
    document.setFontSize(12);
    document.text(`Total cargado: ${total}`, 36, pageHeight - 28);
  }

  private paintPage(document: PdfDocument): void {
    document.setFillColor(19, 14, 10);
    document.rect(0, 0, document.internal.pageSize.getWidth(), document.internal.pageSize.getHeight(), 'F');
  }
}
