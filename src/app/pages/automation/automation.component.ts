import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutomationStore } from '../../stores/automation-store';
import {
  Workflow,
  WorkflowDto,
  WorkflowTriggerType,
  WorkflowAction,
  ActionType,
} from '../../services/automation.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { LoadingOverlayComponent } from '../../components/loading-overlay/loading-overlay.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';

interface ActionFormData {
  type: ActionType | '';
  delayHours?: number;
  templateId?: number;
  newStatus?: string;
}

@Component({
  selector: 'app-automation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialogComponent,
    LoadingOverlayComponent,
    PaginationComponent,
  ],
  templateUrl: './automation.component.html',
  styleUrl: './automation.component.css',
})
export class AutomationComponent implements OnInit {
  readonly store = inject(AutomationStore);
  private router = inject(Router);

  showCreateForm = false;
  editingWorkflowId: number | null = null;
  showDeleteConfirm = false;
  workflowToDelete: number | null = null;
  formSubmitted = false;
  searchQuery = '';

  newWorkflow: WorkflowDto = {
    name: '',
    description: '',
    triggerType: 'CONTACT_CREATED',
    actions: [],
  };

  triggerTypes: { value: WorkflowTriggerType; label: string }[] = [
    { value: 'CONTACT_CREATED', label: 'Contact Created' },
    { value: 'CAMPAIGN_SENT', label: 'Campaign Sent' },
    { value: 'EMAIL_OPENED', label: 'Email Opened' },
  ];

  actionTypes: { value: ActionType; label: string }[] = [
    { value: 'WAIT', label: 'Wait' },
    { value: 'SEND_EMAIL', label: 'Send Email' },
    { value: 'CHANGE_STATUS', label: 'Change Status' },
  ];

  statusOptions = [
    'ACTIVE',
    'PROSPECT',
    'CUSTOMER',
    'VIP',
    'BOUNCED',
    'UNSUBSCRIBED',
  ];

  showActionBuilder = false;
  newAction: ActionFormData = { type: '' };
  filteredWorkflows: Workflow[] = [];

  constructor() {
    effect(() => {
      if (this.store.saveSuccess() && this.store.lastCreatedId()) {
        const id = this.store.lastCreatedId();
        this.resetForm();
        this.router.navigate(['/automation', id]);
      }
      this.filteredWorkflows = this.store.workflows();
      this.filterWorkflows();
    });
  }

  ngOnInit(): void {
    this.store.loadWorkflows({ page: 0 });
  }

  filterWorkflows(): void {
    this.filteredWorkflows = this.store.workflows().filter((w) => {
      const matchesSearch =
        !this.searchQuery ||
        w.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (w.description || '')
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());
      return matchesSearch;
    });
  }

  openCreateForm(): void {
    this.editingWorkflowId = null;
    this.resetForm();
    this.showCreateForm = true;
  }

  closeCreateForm(): void {
    this.showCreateForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newWorkflow = {
      name: '',
      description: '',
      triggerType: 'CONTACT_CREATED',
      actions: [],
    };
    this.formSubmitted = false;
    this.editingWorkflowId = null;
  }

  createWorkflow(): void {
    this.formSubmitted = true;
    if (!this.isFormValid()) return;
    this.store.createWorkflow(this.newWorkflow);
    this.resetForm();
    this.showCreateForm = false;
  }

  isFormValid(): boolean {
    return !!this.newWorkflow.name.trim() && !!this.newWorkflow.triggerType;
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
      setTimeout(() => this.store.loadWorkflows({ page: this.store.currentPage() }), 300);
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

  onPageChange(page: number): void {
    this.store.loadWorkflows({ page });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'DRAFT':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'INACTIVE':
        return 'bg-gray-50 text-gray-600 border border-gray-200';
      default:
        return 'bg-border text-text-muted';
    }
  }

  getTriggerLabel(type: string): string {
    return this.triggerTypes.find((t) => t.value === type)?.label || type;
  }

  openActionBuilder(): void {
    this.showActionBuilder = true;
    this.newAction = { type: '' };
  }

  closeActionBuilder(): void {
    this.showActionBuilder = false;
    this.newAction = { type: '' };
  }

  addAction(): void {
    if (!this.newAction.type) return;

    const action: WorkflowAction = {
      type: this.newAction.type as ActionType,
      orderIndex: (this.newWorkflow.actions.length || 0) + 1,
      actionParams: this.buildActionParams(),
    };

    this.newWorkflow.actions = [...(this.newWorkflow.actions || []), action];
    this.closeActionBuilder();
  }

  removeAction(index: number): void {
    this.newWorkflow.actions = this.newWorkflow.actions.filter(
      (_, i) => i !== index,
    );
    // Re-order actions
    this.newWorkflow.actions = this.newWorkflow.actions.map((action, i) => ({
      ...action,
      orderIndex: i + 1,
    }));
  }

  buildActionParams(): string {
    switch (this.newAction.type) {
      case 'WAIT':
        return JSON.stringify({ delayHours: this.newAction.delayHours || 1 });
      case 'SEND_EMAIL':
        return JSON.stringify({ templateId: this.newAction.templateId || 1 });
      case 'CHANGE_STATUS':
        return JSON.stringify({
          newStatus: this.newAction.newStatus || 'PROSPECT',
        });
      default:
        return '{}';
    }
  }

  getActionLabel(type: string): string {
    return this.actionTypes.find((a) => a.value === type)?.label || type;
  }
}
