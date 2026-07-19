import { computed, Injectable, signal } from '@angular/core';
import { Contribution, ContributionInput } from '../models/contribution.model';
import { Material } from '../models/material.model';
import { Participant } from '../models/participant.model';
import { apiUrl } from '../api/api.config';

@Injectable({ providedIn: 'root' })
export class CpDataService {
  readonly participants = signal<Participant[]>([]);
  readonly materials = signal<Material[]>([]);
  readonly contributions = signal<Contribution[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');

  readonly grandTotal = computed(() =>
    this.contributions().reduce((total, contribution) => total + contribution.amount, 0),
  );

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set('');

    try {
      const response = await fetch(apiUrl('/api/data'), { credentials: 'include' });

      if (!response.ok) {
        throw new Error('No se pudieron cargar los datos.');
      }

      const data = (await response.json()) as {
        participants: Participant[];
        materials: Material[];
        contributions: Contribution[];
      };

      this.participants.set(data.participants);
      this.materials.set(data.materials);
      this.contributions.set(data.contributions);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Error desconocido.');
    } finally {
      this.isLoading.set(false);
    }
  }

  clear(): void {
    this.participants.set([]);
    this.materials.set([]);
    this.contributions.set([]);
    this.error.set('');
  }

  async addContribution(input: ContributionInput, material: Material): Promise<Contribution> {
    const response = await fetch(apiUrl('/api/contributions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        participantId: input.participantId,
        material,
        amount: input.amount,
      }),
    });

    if (!response.ok) {
      throw new Error('No se pudo cargar el aporte.');
    }

    const data = (await response.json()) as { contribution: Contribution };
    this.ensureMaterial(material);
    this.contributions.update((items) => [data.contribution, ...items]);
    return data.contribution;
  }

  async updateContribution(
    contributionId: string,
    input: ContributionInput,
    material: Material,
  ): Promise<Contribution> {
    const response = await fetch(apiUrl(`/api/contributions/${contributionId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...input, material }),
    });

    if (!response.ok) {
      throw new Error('No se pudo corregir el aporte.');
    }

    const data = (await response.json()) as { contribution: Contribution };
    this.contributions.update((items) =>
      items.map((contribution) =>
        contribution.id === contributionId ? data.contribution : contribution,
      ),
    );
    return data.contribution;
  }

  async removeContribution(contributionId: string): Promise<void> {
    const response = await fetch(apiUrl(`/api/contributions/${contributionId}`), {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('No se pudo eliminar el aporte.');
    }

    this.contributions.update((items) =>
      items.filter((contribution) => contribution.id !== contributionId),
    );
  }

  ensureMaterial(material: Material): void {
    if (this.materials().some((item) => item.id === material.id)) {
      return;
    }

    this.materials.update((items) => [...items, material]);
  }

  async addParticipant(name: string, avatar: string): Promise<Participant> {
    const response = await fetch(apiUrl('/api/participants'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, avatar }),
    });

    if (!response.ok) {
      throw new Error('No se pudo agregar el participante.');
    }

    const data = (await response.json()) as { participant: Participant };
    const participant = data.participant;
    this.participants.update((items) => [...items, participant]);
    return participant;
  }

  async updateParticipantAvatar(participantId: string, avatar: string): Promise<void> {
    const participant = this.participants().find((item) => item.id === participantId);

    if (!participant) {
      return;
    }

    await this.updateParticipant(participantId, {
      name: participant.name,
      avatar,
      active: participant.active,
    });
  }

  async updateParticipant(
    participantId: string,
    changes: Pick<Participant, 'name' | 'avatar' | 'active'>,
  ): Promise<void> {
    const response = await fetch(apiUrl(`/api/participants/${participantId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(changes),
    });

    if (!response.ok) {
      throw new Error('No se pudo actualizar el participante.');
    }

    const data = (await response.json()) as { participant: Participant };
    this.participants.update((items) =>
      items.map((participant) =>
        participant.id === participantId ? data.participant : participant,
      ),
    );
  }

  async removeParticipant(participantId: string): Promise<void> {
    const response = await fetch(apiUrl(`/api/participants/${participantId}`), {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('No se pudo quitar el participante.');
    }

    this.participants.update((items) =>
      items.filter((participant) => participant.id !== participantId),
    );
    this.contributions.update((items) =>
      items.filter((contribution) => contribution.participantId !== participantId),
    );
  }

  totalFor(materialId: string, participantId?: string): number {
    return this.contributions()
      .filter((contribution) =>
        contribution.materialId === materialId &&
        (!participantId || contribution.participantId === participantId),
      )
      .reduce((total, contribution) => total + contribution.amount, 0);
  }

}
