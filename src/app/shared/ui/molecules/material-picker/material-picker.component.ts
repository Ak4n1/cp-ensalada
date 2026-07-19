import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { Material } from '../../../../core/models/material.model';
import { ItemIconComponent } from '../../atoms/item-icon/item-icon.component';

@Component({
  selector: 'app-material-picker',
  imports: [ItemIconComponent],
  templateUrl: './material-picker.component.html',
  styleUrl: './material-picker.component.css',
})
export class MaterialPickerComponent implements OnInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @Input() featuredMaterials: Material[] = [];
  @Input() selectedMaterialId = '';
  @Output() materialSelected = new EventEmitter<Material>();

  catalog: Material[] = [];
  searchText = '';
  isOpen = false;

  async ngOnInit(): Promise<void> {
    const response = await fetch('assets/item-catalog.json');
    const items = (await response.json()) as Material[];
    this.catalog = items.map((item) => ({
      id: item.id.toString(),
      name: item.name,
      icon: item.icon,
    }));
  }

  get selectedMaterial(): Material | undefined {
    return this.findById(this.selectedMaterialId);
  }

  get visibleMaterials(): Material[] {
    const query = this.normalize(this.searchText);
    const source = query ? [...this.featuredMaterials, ...this.catalog] : this.featuredMaterials;
    const seen = new Set<string>();
    const filtered = source.filter((material) => {
      if (seen.has(material.id)) {
        return false;
      }

      seen.add(material.id);
      return !query || this.normalize(material.name).includes(query) || material.id.includes(query);
    });

    return filtered.slice(0, 80);
  }

  open(): void {
    this.isOpen = true;
  }

  clearSearch(event: MouseEvent): void {
    event.stopPropagation();
    this.searchText = '';
    this.isOpen = true;
  }

  select(material: Material): void {
    this.searchText = '';
    this.isOpen = false;
    this.materialSelected.emit(material);
  }

  onSearch(value: string): void {
    this.searchText = value;
    this.isOpen = true;
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

  private findById(id: string): Material | undefined {
    return [...this.featuredMaterials, ...this.catalog].find((material) => material.id === id);
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }
}
