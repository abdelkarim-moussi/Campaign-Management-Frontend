import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './confirm-dialog.component.html',
    styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {
    @Input() isOpen = false;
    @Input() title = 'Delete Contact';
    @Input() message = 'Are you sure? This action cannot be undone.';
    @Input() type: 'danger' | 'warning' | 'info' | 'success' = 'danger';
    @Input() confirmText = 'Delete';

    @Output() confirmed = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    onConfirm(): void {
        this.confirmed.emit();
    }

    onCancel(): void {
        this.cancelled.emit();
    }
}
