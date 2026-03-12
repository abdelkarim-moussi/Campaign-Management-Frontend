import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { OrganizationService, OrganizationDto } from '../services/organization.service';
import { ToastrService } from 'ngx-toastr';

interface OrganizationState {
    organization: OrganizationDto | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: OrganizationState = {
    organization: null,
    isLoading: false,
    error: null,
};

export const OrganizationStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed((state) => ({
        hasOrganization: computed(() => state.organization() !== null),
    })),
    withMethods(
        (
            store,
            organizationService = inject(OrganizationService),
            toastr = inject(ToastrService)
        ) => ({
            loadOrganization: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(() => {
                        return organizationService.getCurrentOrganization().pipe(
                            tap((organization) => {
                                patchState(store, { organization, isLoading: false });
                            }),
                            catchError((err) => {
                                patchState(store, {
                                    isLoading: false,
                                    error: err.message || 'Failed to load organization',
                                });
                                toastr.error('Could not load organization details.', 'Error');
                                return EMPTY;
                            })
                        );
                    })
                )
            ),

            updateOrganization: rxMethod<{ request: Partial<OrganizationDto>; onSuccess: () => void }>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(({ request, onSuccess }) => {
                        return organizationService.updateOrganization(request).pipe(
                            tap((organization) => {
                                patchState(store, { organization, isLoading: false });
                                toastr.success('Organization updated successfully!', 'Success');
                                onSuccess();
                            }),
                            catchError((err) => {
                                patchState(store, {
                                    isLoading: false,
                                    error: err.message || 'Failed to update organization',
                                });
                                toastr.error('Could not update organization.', 'Error');
                                return EMPTY;
                            })
                        );
                    })
                )
            ),
        })
    )
);
