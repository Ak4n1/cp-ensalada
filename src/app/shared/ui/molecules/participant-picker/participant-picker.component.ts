import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { Participant } from '../../../../core/models/participant.model';

const AVATAR_BASE_PATH = '/assets/images/app/avatars/Lineage/webp';

@Component({
  selector: 'app-participant-picker',
  imports: [],
  templateUrl: './participant-picker.component.html',
  styleUrl: './participant-picker.component.css',
})
export class ParticipantPickerComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @Input() participants: Participant[] = [];
  @Input() selectedParticipantId = '';
  @Output() participantSelected = new EventEmitter<Participant>();

  searchText = '';
  isOpen = false;

  get selectedParticipant(): Participant | undefined {
    return this.participants.find((participant) => participant.id === this.selectedParticipantId);
  }

  get visibleParticipants(): Participant[] {
    const query = this.searchText.trim().toLowerCase();

    return this.participants.filter((participant) =>
      !query ||
      participant.name.toLowerCase().includes(query) ||
      participant.id.toLowerCase().includes(query),
    );
  }

  avatarPath(file: string): string {
    return `${AVATAR_BASE_PATH}/${file}`;
  }

  open(): void {
    this.isOpen = true;
  }

  onSearch(value: string): void {
    this.searchText = value;
    this.isOpen = true;
  }

  clearSearch(event: MouseEvent): void {
    event.stopPropagation();
    this.searchText = '';
    this.isOpen = true;
  }

  select(participant: Participant): void {
    this.searchText = '';
    this.isOpen = false;
    this.participantSelected.emit(participant);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }
}
