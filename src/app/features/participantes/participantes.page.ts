import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CpDataService } from '../../core/services/cp-data.service';
import { AppButtonComponent } from '../../shared/ui/atoms/app-button/app-button.component';
import { AvatarPickerComponent } from '../../shared/ui/molecules/avatar-picker/avatar-picker.component';
import { ConfirmModalComponent } from '../../shared/ui/molecules/confirm-modal/confirm-modal.component';

type PendingConfirmation =
  | { kind: 'details'; participantId: string; title: string; message: string; confirmText: string; danger?: false }
  | { kind: 'avatar'; participantId: string; avatar: string; title: string; message: string; confirmText: string; danger?: false }
  | { kind: 'remove'; participantId: string; title: string; message: string; confirmText: string; danger: true };

@Component({
  selector: 'app-participantes-page',
  imports: [FormsModule, AppButtonComponent, AvatarPickerComponent, ConfirmModalComponent],
  templateUrl: './participantes.page.html',
  styleUrl: './participantes.page.css',
})
export class ParticipantesPage {
  readonly data = inject(CpDataService);
  name = '';
  avatar = 'FaceIcon_Human_soldier_M.webp';
  editingParticipantId: string | null = null;
  editingDetailsId: string | null = null;
  editName = '';
  editAvatar = '';
  editActive = true;
  pendingConfirmation: PendingConfirmation | null = null;
  isConfirming = false;

  async add(): Promise<void> {
    if (!this.name.trim()) {
      return;
    }

    try {
      await this.data.addParticipant(this.name, this.avatar);
    } catch {
      window.alert('No se pudo agregar el participante.');
      return;
    }

    window.alert('Participante agregado exitosamente.');
    this.name = '';
  }

  avatarPath(file: string): string {
    return `/assets/images/app/avatars/Lineage/webp/${file}`;
  }

  startAvatarEdit(participantId: string): void {
    this.editingParticipantId = this.editingParticipantId === participantId ? null : participantId;
    this.editingDetailsId = null;
  }

  startDetailsEdit(participantId: string): void {
    const participant = this.data.participants().find((item) => item.id === participantId);

    if (!participant) {
      return;
    }

    this.editingDetailsId = participantId;
    this.editingParticipantId = null;
    this.editName = participant.name;
    this.editAvatar = participant.avatar;
    this.editActive = participant.active;
  }

  cancelDetailsEdit(): void {
    this.editingDetailsId = null;
    this.editName = '';
    this.editAvatar = '';
    this.editActive = true;
  }

  saveDetails(participantId: string): void {
    const name = this.editName.trim();

    if (!name) {
      window.alert('El nombre no puede estar vacio.');
      return;
    }

    this.pendingConfirmation = {
      kind: 'details',
      participantId,
      title: 'Guardar cambios',
      message: `¿Confirmás guardar los cambios de ${name.toUpperCase()}?`,
      confirmText: 'Guardar',
    };
  }

  askAvatarUpdate(participantId: string, participantName: string, avatar: string): void {
    this.pendingConfirmation = {
      kind: 'avatar',
      participantId,
      avatar,
      title: 'Cambiar avatar',
      message: `¿Confirmás cambiar el avatar de ${participantName}?`,
      confirmText: 'Cambiar avatar',
    };
  }

  askRemove(participantId: string, participantName: string): void {
    this.pendingConfirmation = {
      kind: 'remove',
      participantId,
      title: 'Quitar participante',
      message: `¿Confirmás quitar a ${participantName}? También se borrarán sus aportes cargados.`,
      confirmText: 'Quitar',
      danger: true,
    };
  }

  cancelConfirmation(): void {
    if (!this.isConfirming) {
      this.pendingConfirmation = null;
    }
  }

  async confirmPendingAction(): Promise<void> {
    const pending = this.pendingConfirmation;

    if (!pending || this.isConfirming) {
      return;
    }

    this.isConfirming = true;

    try {
      if (pending.kind === 'details') {
        await this.data.updateParticipant(pending.participantId, {
          name: this.editName.trim(),
          avatar: this.editAvatar,
          active: this.editActive,
        });
        this.cancelDetailsEdit();
        window.alert('Participante actualizado exitosamente.');
      }

      if (pending.kind === 'avatar') {
        await this.data.updateParticipantAvatar(pending.participantId, pending.avatar);
        this.editingParticipantId = null;
        window.alert('Avatar actualizado exitosamente.');
      }

      if (pending.kind === 'remove') {
        await this.data.removeParticipant(pending.participantId);
        window.alert('Participante quitado exitosamente.');
      }

      this.pendingConfirmation = null;
    } catch {
      window.alert('No se pudo completar la acción.');
    } finally {
      this.isConfirming = false;
    }
  }
}
