import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AutomationStore } from '../../stores/automation-store';
import { ActionType, WorkflowActionDto } from '../../services/automation.service';
import { LoadingOverlayComponent } from '../../components/loading-overlay/loading-overlay.component';
import { TemplateStore } from '../../stores/template-store';

@Component({
  selector: 'app-automation-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingOverlayComponent],
  templateUrl: './automation-detail.component.html',
  styleUrl: './automation-detail.component.css',
})
export class AutomationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly store = inject(AutomationStore);
  readonly templateStore = inject(TemplateStore);

  workflowId = signal<number | null>(null);
  activeTab = signal<'builder' | 'executions' | 'stats'>('builder');
  selectedExecutionId = signal<number | null>(null);

  actionTypes: { value: ActionType; label: string; icon: string }[] = [
    { value: 'SEND_EMAIL', label: 'Send Email', icon: '✉️' },
    { value: 'SEND_SMS', label: 'Send SMS', icon: '📱' },
    { value: 'WAIT', label: 'Wait / Delay', icon: '⏱️' },
    { value: 'CHANGE_STATUS', label: 'Change Status', icon: '🔄' }
  ];

  constructor() {
    effect(() => {
      const id = this.workflowId();
      if (id) {
        this.store.loadWorkflow(id);
        this.store.loadStats(id);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      if (this.activeTab() === 'executions' && this.workflowId()) {
        this.store.loadExecutions(this.workflowId()!);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.workflowId.set(Number(id));
      this.templateStore.loadTemplates();
    }
  }

  setTab(tab: 'builder' | 'executions' | 'stats'): void {
    this.activeTab.set(tab);
    if (tab === 'executions') {
      this.selectedExecutionId.set(null);
    }
  }

  addAction(): void {
    const workflow = this.store.selectedWorkflow();
    if (!workflow) return;

    const currentActions = workflow.actions || [];
    const newAction: any = {
      type: 'SEND_EMAIL',
      orderIndex: currentActions.length,
      delayHours: 0,
      actionParams: ''
    };
    
    // Create new workflow object with added action
    const updatedDto = {
      name: workflow.name,
      description: workflow.description,
      triggerType: workflow.triggerType,
      triggerParams: workflow.triggerParams,
      actions: [...currentActions, newAction]
    };

    this.store.updateWorkflow({ id: workflow.id, dto: updatedDto });
  }

  saveWorkflow(): void {
    const workflow = this.store.selectedWorkflow();
    if (!workflow) return;

    const dto = {
      name: workflow.name,
      description: workflow.description,
      triggerType: workflow.triggerType,
      triggerParams: workflow.triggerParams,
      actions: workflow.actions.map((a, i) => ({
        type: a.type,
        orderIndex: i,
        delayHours: a.delayHours,
        actionParams: a.actionParams
      }))
    };

    this.store.updateWorkflow({ id: workflow.id, dto });
  }

  removeAction(index: number): void {
    const workflow = this.store.selectedWorkflow();
    if (!workflow) return;

    const updatedActions = workflow.actions.filter((_, i) => i !== index);
    const dto = {
      name: workflow.name,
      description: workflow.description,
      triggerType: workflow.triggerType,
      triggerParams: workflow.triggerParams,
      actions: updatedActions.map((a, i) => ({
        type: a.type,
        orderIndex: i,
        delayHours: a.delayHours,
        actionParams: a.actionParams
      }))
    };

    this.store.updateWorkflow({ id: workflow.id, dto });
  }

  moveAction(index: number, direction: 'up' | 'down'): void {
    const workflow = this.store.selectedWorkflow();
    if (!workflow) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= workflow.actions.length) return;

    const updatedActions = [...workflow.actions];
    [updatedActions[index], updatedActions[newIndex]] = [updatedActions[newIndex], updatedActions[index]];

    const dto = {
      name: workflow.name,
      description: workflow.description,
      triggerType: workflow.triggerType,
      triggerParams: workflow.triggerParams,
      actions: updatedActions.map((a, i) => ({
        type: a.type,
        orderIndex: i,
        delayHours: a.delayHours,
        actionParams: a.actionParams
      }))
    };

    this.store.updateWorkflow({ id: workflow.id, dto });
  }

  updateActionParams(index: number, params: any): void {
    const workflow = this.store.selectedWorkflow();
    if (!workflow) return;

    workflow.actions[index].actionParams = JSON.stringify(params);
  }

  viewLogs(executionId: number): void {
    this.selectedExecutionId.set(executionId);
    this.store.loadLogs(executionId);
  }

  goBack(): void {
    this.router.navigate(['/automation']);
  }

  getTemplateName(templateId: string): string {
    const template = this.templateStore.templates().find(t => t.id === templateId);
    return template ? template.name : 'Unknown Template';
  }

  parseParams(params?: string): any {
    if (!params) return {};
    try {
      return JSON.parse(params);
    } catch {
      return {};
    }
  }
}
