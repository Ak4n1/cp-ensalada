import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-pill',
  imports: [],
  templateUrl: './stat-pill.component.html',
  styleUrl: './stat-pill.component.css',
})
export class StatPillComponent {
  @Input() label = '';
  @Input() value = '';
}
