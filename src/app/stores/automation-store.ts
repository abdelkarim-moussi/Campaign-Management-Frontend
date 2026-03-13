import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import {
  AutomationService,
  Workflow,
  WorkflowDto,
  WorkflowExecution,
  WorkflowLog,
  WorkflowStatsDto,
} from '../services/automation.service';

interface AutomationState {
  workflows: Workflow[];
  activeWorkflows: Workflow[];
  selectedWorkflow: Workflow | null;
  executions: WorkflowExecution[];
  logs: WorkflowLog[];
  stats: WorkflowStatsDto | null;
  isLoading: boolean;
  saveSuccess: boolean;
}

const initialState: AutomationState = {
  workflows: [],
  activeWorkflows: [],
  selectedWorkflow: null,
  executions: [],
  logs: [],
  stats: null,
  isLoading: false,
  saveSuccess: false,
};

export const AutomationStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ workflows }) => ({
    workflowsCount: computed(() => workflows().length),
    activeCount: computed(() => workflows().filter(w => w.status === 'ACTIVE').length),
  })),

  withMethods(
    (
      store,
      automationService = inject(AutomationService),
      toastr = inject(ToastrService),
    ) => ({
      loadWorkflows: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(() =>
            automationService.getAllWorkflows().pipe(
              tap((workflows) =>
                patchState(store, { workflows, isLoading: false }),
              ),
              catchError(() => {
                toastr.error('Failed to load workflows');
                patchState(store, { isLoading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      loadActiveWorkflows: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(() =>
            automationService.getActiveWorkflows().pipe(
              tap((activeWorkflows) =>
                patchState(store, { activeWorkflows, isLoading: false }),
              ),
              catchError(() => {
                toastr.error('Failed to load active workflows');
                patchState(store, { isLoading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      loadWorkflow: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((id) =>
            automationService.getWorkflow(id).pipe(
              tap((selectedWorkflow) =>
                patchState(store, { selectedWorkflow, isLoading: false }),
              ),
              catchError(() => {
                toastr.error('Failed to load workflow details');
                patchState(store, { isLoading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      createWorkflow: rxMethod<WorkflowDto>(
        pipe(
          tap(() => patchState(store, { isLoading: true, saveSuccess: false })),
          switchMap((dto) =>
            automationService.createWorkflow(dto).pipe(
              tap((newWorkflow) => {
                patchState(store, (state) => ({
                  workflows: [...state.workflows, newWorkflow],
                  isLoading: false,
                  saveSuccess: true,
                }));
                toastr.success('Workflow created successfully');
              }),
              catchError(() => {
                toastr.error('Failed to create workflow');
                patchState(store, { isLoading: false, saveSuccess: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      updateWorkflow: rxMethod<{ id: number; dto: WorkflowDto }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, saveSuccess: false })),
          switchMap(({ id, dto }) =>
            automationService.updateWorkflow(id, dto).pipe(
              tap((updatedWorkflow) => {
                patchState(store, (state) => ({
                  workflows: state.workflows.map((w) =>
                    w.id === id ? updatedWorkflow : w,
                  ),
                  selectedWorkflow: updatedWorkflow,
                  isLoading: false,
                  saveSuccess: true,
                }));
                toastr.success('Workflow updated successfully');
              }),
              catchError(() => {
                toastr.error('Failed to update workflow');
                patchState(store, { isLoading: false, saveSuccess: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      activateWorkflow: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((id) =>
            automationService.activateWorkflow(id).pipe(
              tap((updatedWorkflow) => {
                patchState(store, (state) => ({
                  workflows: state.workflows.map((w) =>
                    w.id === id ? updatedWorkflow : w,
                  ),
                  selectedWorkflow: state.selectedWorkflow?.id === id ? updatedWorkflow : state.selectedWorkflow,
                  isLoading: false,
                }));
                toastr.success('Workflow activated');
              }),
              catchError(() => {
                toastr.error('Failed to activate workflow');
                patchState(store, { isLoading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      deactivateWorkflow: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((id) =>
            automationService.deactivateWorkflow(id).pipe(
              tap((updatedWorkflow) => {
                patchState(store, (state) => ({
                  workflows: state.workflows.map((w) =>
                    w.id === id ? updatedWorkflow : w,
                  ),
                  selectedWorkflow: state.selectedWorkflow?.id === id ? updatedWorkflow : state.selectedWorkflow,
                  isLoading: false,
                }));
                toastr.success('Workflow deactivated');
              }),
              catchError(() => {
                toastr.error('Failed to deactivate workflow');
                patchState(store, { isLoading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      deleteWorkflow: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((id) =>
            automationService.deleteWorkflow(id).pipe(
              tap(() => {
                patchState(store, (state) => ({
                  workflows: state.workflows.filter((w) => w.id !== id),
                  isLoading: false,
                }));
                toastr.success('Workflow deleted');
              }),
              catchError(() => {
                toastr.error('Failed to delete workflow');
                patchState(store, { isLoading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      loadExecutions: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((id) =>
            automationService.getWorkflowExecutions(id).pipe(
              tap((executions) =>
                patchState(store, { executions, isLoading: false }),
              ),
              catchError(() => {
                toastr.error('Failed to load executions');
                patchState(store, { isLoading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      loadLogs: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((executionId) =>
            automationService.getExecutionLogs(executionId).pipe(
              tap((logs) =>
                patchState(store, { logs, isLoading: false }),
              ),
              catchError(() => {
                toastr.error('Failed to load logs');
                patchState(store, { isLoading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      loadStats: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((id) =>
            automationService.getWorkflowStats(id).pipe(
              tap((stats) =>
                patchState(store, { stats, isLoading: false }),
              ),
              catchError(() => {
                toastr.error('Failed to load statistics');
                patchState(store, { isLoading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      clearSelection: () => patchState(store, {
        selectedWorkflow: null,
        executions: [],
        logs: [],
        stats: null,
        saveSuccess: false
      }),
    }),
  ),
);
