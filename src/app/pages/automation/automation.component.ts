import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutomationStore } from '../../stores/automation-store';
import { Workflow, WorkflowDto, WorkflowTriggerType } from '../../services/automation.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { LoadingOverlayComponent } from '../../components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-automation',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, LoadingOverlayComponent],
  templateUrl: './automation.component.html',
  styleUrl: './automation.component.css',
})
export class AutomationComponent implements OnInit {
  readonly store = inject(AutomationStore);
  private router = inject(Router);

  showCreateModal = false;
  showDeleteConfirm = false;
  workflowToDelete: number | null = null;

  newWorkflow: WorkflowDto = {
    name: '',
    description: '',
    triggerType: 'CONTACT_CREATED',
    actions: []
  };

  triggerTypes: { value: WorkflowTriggerType; label: string }[] = [
    { value: 'CONTACT_CREATED', label: 'Contact Created' },
    { value: 'CAMPAIGN_SENT', label: 'Campaign Sent' },
    { value: 'EMAIL_OPENED', label: 'Email Opened' }
  ];

  constructor() {
    effect(() => {
      if (this.store.saveSuccess()) {
        this.closeCreateModal();
        // Redirect to detail page for the newly created workflow if possible
        // But for now just stay here
      }
    });
  }

  ngOnInit(): void {
    this.store.loadWorkflows();
  }

  openCreateModal(): void {
    this.newWorkflow = {
      name: '',
      description: '',
      triggerType: 'CONTACT_CREATED',
      actions: []
    };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createWorkflow(): void {
    if (!this.newWorkflow.name) return;
    this.store.createWorkflow(this.newWorkflow);
  }

  viewDetail(id: number): void {
    this.router.navigate(['/automation', id]);
  }

  confirmDelete(id: number, event: Event): void {
    event.stopPropagation();
    this.workflowToDelete = id;
    this.showDeleteConfirm = true;
  }

  executeDelete(): void {
    if (this.workflowToDelete) {
      this.store.deleteWorkflow(this.workflowToDelete);
    }
    this.cancelDelete();
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.workflowToDelete = null;
  }

  toggleStatus(workflow: Workflow, event: Event): void {
    event.stopPropagation();
    if (workflow.status === 'ACTIVE') {
      this.store.deactivateWorkflow(workflow.id);
    } else {
      this.store.activateWorkflow(workflow.id);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-700';
      case 'INACTIVE': return 'bg-gray-100 text-gray-500';
      default: return 'bg-border text-text-muted';
    }
  }

  getTriggerLabel(type: string): string {
    return this.triggerTypes.find(t => t.value === type)?.label || type;
  }
}
