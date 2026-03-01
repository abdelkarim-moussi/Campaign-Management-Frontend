import { computed, inject } from '@angular/core';
import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withState,
} from '@ngrx/signals';

import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
    Template,
    TemplateDTO,
    TemplateService,
    TemplateStatus,
    TemplateType,
} from '../services/template.service';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export const TemplateStore = signalStore(
    { providedIn: 'root' },
    withState({
        templates: [] as Template[],
        isLoading: false,
        saveSuccess: false,
    }),

    withComputed(({ templates }) => ({
        templatesCount: computed(() => templates().length),
    })),

    withMethods(
        (
            store,
            templateService = inject(TemplateService),
            toastr = inject(ToastrService),
        ) => ({
            loadTemplates: rxMethod<{
                type?: TemplateType;
                status?: TemplateStatus;
            } | void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((params) => {
                        const type =
                            params && 'type' in params ? params.type : undefined;
                        const status =
                            params && 'status' in params ? params.status : undefined;
                        return templateService.getTemplates(type, status).pipe(
                            tap((templates) =>
                                patchState(store, { templates, isLoading: false }),
                            ),
                            catchError((error) => {
                                toastr.error('Failed to load templates');
                                patchState(store, { isLoading: false });
                                return EMPTY;
                            }),
                        );
                    }),
                ),
            ),

            addTemplate: rxMethod<TemplateDTO>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((dto) =>
                        templateService.createTemplate(dto).pipe(
                            tap((savedTemplate) => {
                                patchState(store, (state) => ({
                                    templates: [...state.templates, savedTemplate],
                                    isLoading: false,
                                    saveSuccess: true,
                                }));
                                toastr.success('Template created successfully');
                            }),
                            catchError((error) => {
                                toastr.error('Failed to create template');
                                patchState(store, { isLoading: false, saveSuccess: false });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),

            updateTemplate: rxMethod<{ id: string; dto: TemplateDTO }>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap(({ id, dto }) =>
                        templateService.updateTemplate(id, dto).pipe(
                            tap((updatedTemplate) => {
                                patchState(store, (state) => ({
                                    templates: state.templates.map((t) =>
                                        t.id === id ? updatedTemplate : t,
                                    ),
                                    isLoading: false,
                                    saveSuccess: true,
                                }));
                                toastr.success('Template updated successfully');
                            }),
                            catchError((error) => {
                                toastr.error('Failed to update template');
                                patchState(store, { isLoading: false, saveSuccess: false });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),

            removeTemplate: rxMethod<string>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((id) =>
                        templateService.deleteTemplate(id).pipe(
                            tap(() => {
                                patchState(store, (state) => ({
                                    templates: state.templates.filter((t) => t.id !== id),
                                    isLoading: false,
                                }));
                                toastr.success('Template deleted successfully');
                            }),
                            catchError((error) => {
                                toastr.error('Failed to delete template');
                                patchState(store, { isLoading: false });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),

            activateTemplate: rxMethod<string>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((id) =>
                        templateService.activateTemplate(id).pipe(
                            tap((activated) => {
                                patchState(store, (state) => ({
                                    templates: state.templates.map((t) =>
                                        t.id === id ? activated : t,
                                    ),
                                    isLoading: false,
                                }));
                                toastr.success('Template activated');
                            }),
                            catchError((error) => {
                                toastr.error('Failed to activate template');
                                patchState(store, { isLoading: false });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),

            archiveTemplate: rxMethod<string>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((id) =>
                        templateService.archiveTemplate(id).pipe(
                            tap((archived) => {
                                patchState(store, (state) => ({
                                    templates: state.templates.map((t) =>
                                        t.id === id ? archived : t,
                                    ),
                                    isLoading: false,
                                }));
                                toastr.success('Template archived');
                            }),
                            catchError((error) => {
                                toastr.error('Failed to archive template');
                                patchState(store, { isLoading: false });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),
        }),
    ),
);
