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
    Campaign,
    CampaignDto,
    CampaignService,
    CampaignStatus,
} from '../services/campaign.service';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export const CampaignStore = signalStore(
    { providedIn: 'root' },
    withState({
        campaigns: [] as Campaign[],
        isLoading: false,
        saveSuccess: false,
    }),

    withComputed(({ campaigns }) => ({
        campaignsCount: computed(() => campaigns().length),
    })),

    withMethods(
        (
            store,
            campaignService = inject(CampaignService),
            toastr = inject(ToastrService),
        ) => ({
            loadCampaigns: rxMethod<{ status?: CampaignStatus } | void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((params) => {
                        const status =
                            params && 'status' in params
                                ? params.status
                                : undefined;
                        return campaignService.getCampaigns(status).pipe(
                            tap((campaigns) =>
                                patchState(store, {
                                    campaigns,
                                    isLoading: false,
                                }),
                            ),
                            catchError((error) => {
                                toastr.error('Failed to load campaigns');
                                patchState(store, { isLoading: false });
                                return EMPTY;
                            }),
                        );
                    }),
                ),
            ),

            addCampaign: rxMethod<CampaignDto>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((dto) =>
                        campaignService.createCampaign(dto).pipe(
                            tap((savedCampaign) => {
                                patchState(store, (state) => ({
                                    campaigns: [
                                        ...state.campaigns,
                                        savedCampaign,
                                    ],
                                    isLoading: false,
                                    saveSuccess: true,
                                }));
                                toastr.success(
                                    'Campaign created successfully',
                                );
                            }),
                            catchError((error) => {
                                toastr.error('Failed to create campaign');
                                patchState(store, {
                                    isLoading: false,
                                    saveSuccess: false,
                                });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),

            updateCampaign: rxMethod<{ id: number; dto: CampaignDto }>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap(({ id, dto }) =>
                        campaignService.updateCampaign(id, dto).pipe(
                            tap((updatedCampaign) => {
                                patchState(store, (state) => ({
                                    campaigns: state.campaigns.map((c) =>
                                        c.id === id ? updatedCampaign : c,
                                    ),
                                    isLoading: false,
                                    saveSuccess: true,
                                }));
                                toastr.success(
                                    'Campaign updated successfully',
                                );
                            }),
                            catchError((error) => {
                                toastr.error('Failed to update campaign');
                                patchState(store, {
                                    isLoading: false,
                                    saveSuccess: false,
                                });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),

            removeCampaign: rxMethod<number>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((id) =>
                        campaignService.deleteCampaign(id).pipe(
                            tap(() => {
                                patchState(store, (state) => ({
                                    campaigns: state.campaigns.filter(
                                        (c) => c.id !== id,
                                    ),
                                    isLoading: false,
                                }));
                                toastr.success(
                                    'Campaign deleted successfully',
                                );
                            }),
                            catchError((error) => {
                                toastr.error('Failed to delete campaign');
                                patchState(store, { isLoading: false });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),

            sendCampaign: rxMethod<number>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((id) =>
                        campaignService.sendCampaign(id).pipe(
                            tap(() => {
                                patchState(store, (state) => ({
                                    campaigns: state.campaigns.map((c) =>
                                        c.id === id
                                            ? { ...c, status: 'SENT' as const }
                                            : c,
                                    ),
                                    isLoading: false,
                                }));
                                toastr.success('Campaign sent successfully');
                            }),
                            catchError((error) => {
                                toastr.error('Failed to send campaign');
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
