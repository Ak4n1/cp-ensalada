import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ItemIconService {
  private readonly basePath = '/assets/icons_items';

  resolve(icon?: string): string {
    const normalized = this.normalize(icon);

    if (!normalized) {
      return `${this.basePath}/_fallback.png`;
    }

    return normalized.endsWith('.png')
      ? `${this.basePath}/${normalized}`
      : `${this.basePath}/${normalized}.png`;
  }

  private normalize(icon?: string): string {
    return (icon ?? '')
      .trim()
      .replace(/^BranchSys\.icon\./i, '')
      .replace(/^BranchIcon\.icon\./i, '')
      .replace(/^Icon\./i, '')
      .replace(/^icon\./i, '');
  }
}
