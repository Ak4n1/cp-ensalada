import { Component, Input, inject } from '@angular/core';
import { ItemIconService } from '../../../../core/items/item-icon.service';

@Component({
  selector: 'app-item-icon',
  imports: [],
  templateUrl: './item-icon.component.html',
  styleUrl: './item-icon.component.css',
})
export class ItemIconComponent {
  private readonly icons = inject(ItemIconService);
  private failed = false;

  @Input() icon = '';
  @Input() alt = 'item';

  get src(): string {
    return this.failed ? '/favicon.ico' : this.icons.resolve(this.icon);
  }

  onError(): void {
    this.failed = true;
  }
}
