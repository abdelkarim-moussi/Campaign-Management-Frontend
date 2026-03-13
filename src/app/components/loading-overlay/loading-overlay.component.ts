import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoading()) {
      <div class="fixed inset-0 bg-white/60 backdrop-blur-[1px] z-[9999] flex flex-col items-center justify-center gap-3">
        <div class="w-10 h-10 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
        <p class="text-xs font-semibold text-primary uppercase tracking-widest animate-pulse">{{ message() }}</p>
      </div>
    }
  `,
  styles: []
})
export class LoadingOverlayComponent {
  isLoading = input.required<boolean>();
  message = input<string>('Processing...');
}
