import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type WorkflowTriggerType =
  | 'CONTACT_CREATED'
  | 'CAMPAIGN_SENT'
  | 'EMAIL_OPENED';
export type ActionType = 'SEND_EMAIL' | 'SEND_SMS' | 'CHANGE_STATUS' | 'WAIT';
export type ExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'WAITING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface WorkflowAction {
  id?: number;
  type: ActionType;
  orderIndex: number;
  delayHours?: number;
  actionParams?: string;
  isActive?: boolean;
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  status: WorkflowStatus;
  triggerType: WorkflowTriggerType;
  triggerParams?: string;
  actions: WorkflowAction[];
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDto {
  name: string;
  description?: string;
  triggerType: WorkflowTriggerType;
  triggerParams?: string;
  actions: WorkflowActionDto[];
}

export interface WorkflowActionDto {
  type: ActionType;
  orderIndex: number;
  delayHours?: number;
  actionParams?: string;
}

export interface WorkflowExecution {
  id: number;
  workflow: Workflow;
  contact: any;
  status: ExecutionStatus;
  currentActionIndex: number;
  resumeAt?: string;
  context?: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface WorkflowStatsDto {
  workflowId: number;
  workflowName: string;
  status: WorkflowStatus;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  activeExecutions: number;
  createdAt: string;
}

export interface WorkflowLog {
  id: number;
  executionId: number;
  actionId?: number;
  actionType?: ActionType;
  status: string;
  message: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AutomationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/automation/workflows`;

  createWorkflow(dto: WorkflowDto): Observable<Workflow> {
    return this.http.post<Workflow>(this.apiUrl, dto);
  }

  updateWorkflow(id: number, dto: WorkflowDto): Observable<Workflow> {
    return this.http.put<Workflow>(`${this.apiUrl}/${id}`, dto);
  }

  getAllWorkflows(): Observable<Workflow[]> {
    return this.http.get<Workflow[]>(this.apiUrl);
  }

  getActiveWorkflows(): Observable<Workflow[]> {
    return this.http.get<Workflow[]>(`${this.apiUrl}/active`);
  }

  getWorkflow(id: number): Observable<Workflow> {
    return this.http.get<Workflow>(`${this.apiUrl}/${id}`);
  }

  activateWorkflow(id: number): Observable<Workflow> {
    return this.http.patch<Workflow>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateWorkflow(id: number): Observable<Workflow> {
    return this.http.patch<Workflow>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  deleteWorkflow(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getWorkflowExecutions(id: number): Observable<WorkflowExecution[]> {
    return this.http.get<WorkflowExecution[]>(
      `${this.apiUrl}/${id}/executions`,
    );
  }

  getExecutionLogs(executionId: number): Observable<WorkflowLog[]> {
    return this.http.get<WorkflowLog[]>(
      `${this.apiUrl}/executions/${executionId}/logs`,
    );
  }

  getWorkflowStats(id: number): Observable<WorkflowStatsDto> {
    return this.http.get<WorkflowStatsDto>(`${this.apiUrl}/${id}/stats`);
  }
}
