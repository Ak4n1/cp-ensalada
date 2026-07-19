import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Contribution } from '../../../../core/models/contribution.model';
import { Material } from '../../../../core/models/material.model';
import { Participant } from '../../../../core/models/participant.model';
import { CpDataService } from '../../../../core/services/cp-data.service';
import { AppButtonComponent } from '../../atoms/app-button/app-button.component';
import { ConfirmModalComponent } from '../../molecules/confirm-modal/confirm-modal.component';
import { MaterialPickerComponent } from '../../molecules/material-picker/material-picker.component';
import { ParticipantPickerComponent } from '../../molecules/participant-picker/participant-picker.component';

@Component({
  selector: 'app-contribution-form',
  imports: [
    FormsModule,
    AppButtonComponent,
    ConfirmModalComponent,
    MaterialPickerComponent,
    ParticipantPickerComponent,
  ],
  templateUrl: './contribution-form.component.html',
  styleUrl: './contribution-form.component.css',
})
export class ContributionFormComponent {
  readonly data = inject(CpDataService);
  @Output() editFinished = new EventEmitter<void>();

  @Input() set contributionToEdit(contribution: Contribution | null) {
    this.editingContributionId = contribution?.id ?? null;

    if (!contribution) {
      return;
    }

    this.participantId = contribution.participantId;
    this.materialId = contribution.materialId;
    this.amount = contribution.amount;
  }

  editingContributionId: string | null = null;
  participantId = 'velynn';
  materialId = '1868';
  amount: number | null = null;
  confirmation: {
    title: string;
    message: string;
    confirmText: string;
  } | null = null;
  isSaving = false;

  readonly selectedMaterial = computed(() =>
    this.data.materials().find((material) => material.id === this.materialId),
  );

  onMaterialSelected(material: Material): void {
    this.data.ensureMaterial(material);
    this.materialId = material.id;
  }

  onParticipantSelected(participant: Participant): void {
    this.participantId = participant.id;
  }

  async submit(): Promise<void> {
    const material = this.selectedMaterial();
    const participant = this.data.participants().find((item) => item.id === this.participantId);

    if (!material || !participant || !this.amount || this.amount <= 0) {
      window.alert('Completa participante, material y cantidad mayor a 0.');
      return;
    }

    const actionText = this.editingContributionId ? 'corregir' : 'cargar';
    this.confirmation = {
      title: this.editingContributionId ? 'Corregir aporte' : 'Cargar aporte',
      message: `¿Confirmás ${actionText} ${this.amount} ${material.name} para ${participant.name}?`,
      confirmText: this.editingContributionId ? 'Guardar corrección' : 'Cargar aporte',
    };
  }

  async confirmSubmit(): Promise<void> {
    const material = this.selectedMaterial();
    const participant = this.data.participants().find((item) => item.id === this.participantId);

    if (!material || !participant || !this.amount || this.amount <= 0 || this.isSaving) {
      return;
    }

    this.isSaving = true;
    try {
      const input = {
        participantId: this.participantId,
        materialId: this.materialId,
        amount: this.amount,
      };

      if (this.editingContributionId) {
        await this.data.updateContribution(this.editingContributionId, input, material);
      } else {
        await this.data.addContribution(input, material);
      }
    } catch {
      window.alert(this.editingContributionId ? 'No se pudo corregir el aporte.' : 'No se pudo cargar el aporte.');
      return;
    } finally {
      this.isSaving = false;
    }

    window.alert(this.editingContributionId ? 'Aporte corregido exitosamente.' : 'Agregado exitosamente.');
    this.confirmation = null;
    this.editingContributionId = null;
    this.editFinished.emit();
    this.amount = null;
  }

  cancelConfirmation(): void {
    if (!this.isSaving) {
      this.confirmation = null;
    }
  }

  cancelEdit(): void {
    this.editingContributionId = null;
    this.editFinished.emit();
    this.amount = null;
  }
}
