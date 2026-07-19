import { Component, EventEmitter, Output, computed, inject } from '@angular/core';
import { Contribution } from '../../../../core/models/contribution.model';
import { CpDataService } from '../../../../core/services/cp-data.service';
import { ItemIconComponent } from '../../atoms/item-icon/item-icon.component';
import { ConfirmModalComponent } from '../../molecules/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-recent-contributions',
  imports: [ConfirmModalComponent, ItemIconComponent],
  templateUrl: './recent-contributions.component.html',
  styleUrl: './recent-contributions.component.css',
})
export class RecentContributionsComponent {
  readonly data = inject(CpDataService);
  @Output() contributionSelected = new EventEmitter<Contribution>();

  contributionToDelete: Contribution | null = null;
  isDeleting = false;

  readonly recentContributions = computed(() =>
    [...this.data.contributions()]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 12),
  );

  participantName(contribution: Contribution): string {
    return this.data.participants().find((participant) => participant.id === contribution.participantId)?.name ?? 'Sin personaje';
  }

  materialName(contribution: Contribution): string {
    return this.material(contribution)?.name ?? 'Material eliminado';
  }

  materialIcon(contribution: Contribution): string {
    return this.material(contribution)?.icon ?? '';
  }

  contributionDate(contribution: Contribution): string {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(contribution.createdAt));
  }

  deleteMessage(): string {
    const contribution = this.contributionToDelete;

    if (!contribution) {
      return '';
    }

    return `¿Eliminar el aporte de ${this.participantName(contribution)}: ${contribution.amount} ${this.materialName(contribution)}?`;
  }

  selectContribution(contribution: Contribution): void {
    this.contributionSelected.emit(contribution);
  }

  askDeleteContribution(contribution: Contribution): void {
    this.contributionToDelete = contribution;
  }

  cancelDelete(): void {
    if (!this.isDeleting) {
      this.contributionToDelete = null;
    }
  }

  async confirmDelete(): Promise<void> {
    const contribution = this.contributionToDelete;

    if (!contribution || this.isDeleting) {
      return;
    }

    this.isDeleting = true;

    try {
      await this.data.removeContribution(contribution.id);
      this.contributionToDelete = null;
      window.alert('Aporte eliminado.');
    } catch {
      window.alert('No se pudo eliminar el aporte.');
    } finally {
      this.isDeleting = false;
    }
  }

  private material(contribution: Contribution) {
    return this.data.materials().find((material) => material.id === contribution.materialId);
  }
}
