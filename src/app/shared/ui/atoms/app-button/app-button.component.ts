import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './app-button.component.html',
  styleUrl: './app-button.component.css',
})
export class AppButtonComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() tone: 'primary' | 'ghost' = 'primary';
  @Input() disabled = false;
}
