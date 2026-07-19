import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface AvatarOption {
  file: string;
  race: string;
  type: string;
  gender: string;
}

const AVATAR_BASE_PATH = '/assets/images/app/avatars/Lineage/webp';

@Component({
  selector: 'app-avatar-picker',
  imports: [],
  templateUrl: './avatar-picker.component.html',
  styleUrl: './avatar-picker.component.css',
})
export class AvatarPickerComponent {
  @Input() selectedAvatar = 'FaceIcon_Human_soldier_M.webp';
  @Output() selectedAvatarChange = new EventEmitter<string>();

  readonly avatars: AvatarOption[] = [
    'FaceIcon_Darkelf_magician_M.webp',
    'FaceIcon_Darkelf_magician_W.webp',
    'FaceIcon_Darkelf_soldier_M.webp',
    'FaceIcon_Darkelf_soldier_W.webp',
    'FaceIcon_Dwarf_soldier_M.webp',
    'FaceIcon_Dwarf_soldier_W.webp',
    'FaceIcon_Elf_magician_M.webp',
    'FaceIcon_Elf_magician_W.webp',
    'FaceIcon_Elf_soldier_M.webp',
    'FaceIcon_Elf_soldier_W.webp',
    'FaceIcon_Ertheia_magician_W.webp',
    'FaceIcon_Ertheia_soldier_W.webp',
    'FaceIcon_Human_magician_M.webp',
    'FaceIcon_Human_magician_W.webp',
    'FaceIcon_Human_soldier_M.webp',
    'FaceIcon_Human_soldier_W.webp',
    'FaceIcon_Kamael_soldier_M.webp',
    'FaceIcon_Kamael_soldier_W.webp',
    'FaceIcon_Orc_magician_M.webp',
    'FaceIcon_Orc_magician_W.webp',
    'FaceIcon_Orc_soldier_M.webp',
    'FaceIcon_Orc_soldier_W.webp',
  ].map((file) => this.toOption(file));

  isOpen = false;
  selectedRace = 'Human';

  get races(): string[] {
    return [...new Set(this.avatars.map((avatar) => avatar.race))];
  }

  get raceAvatars(): AvatarOption[] {
    return this.avatars.filter((avatar) => avatar.race === this.selectedRace);
  }

  get warriorAvatars(): AvatarOption[] {
    return this.raceAvatars.filter((avatar) => avatar.type === 'Guerrero');
  }

  get mageAvatars(): AvatarOption[] {
    return this.raceAvatars.filter((avatar) => avatar.type === 'Mago');
  }

  avatarPath(file = this.selectedAvatar): string {
    return `${AVATAR_BASE_PATH}/${file}`;
  }

  selectAvatar(file: string): void {
    this.selectedAvatar = file;
    this.selectedAvatarChange.emit(file);
    this.isOpen = false;
  }

  open(): void {
    const current = this.avatars.find((avatar) => avatar.file === this.selectedAvatar);
    this.selectedRace = current?.race ?? this.selectedRace;
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
  }

  selectRace(race: string): void {
    this.selectedRace = race;
  }

  private toOption(file: string): AvatarOption {
    const [, race = 'Human', type = 'soldier', genderWithExtension = 'M.webp'] = file.split('_');
    return {
      file,
      race,
      type: type === 'magician' ? 'Mago' : 'Guerrero',
      gender: genderWithExtension.startsWith('W') ? 'Femenino' : 'Masculino',
    };
  }
}
