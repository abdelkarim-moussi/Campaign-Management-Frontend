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
import { catchError, EMPTY, exhaustMap, pipe, switchMap, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AnalyticsStore } from './analytics-store';

export const CampaignStore = signalStore(
    { providedIn: 'root' },
    withState({
        campaigns: [] as Campaign[],
        isLoading: false,
        saveSuccess: false,
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
        pageSize: 10,
    }),

    withComputed(({ campaigns }) => ({
        campaignsCount: computed(() => campaigns().length),
    })),

    withMethods(
        (
            store,
            campaignService = inject(CampaignService),
            analyticsStore = inject(AnalyticsStore),
            toastr = inject(ToastrService),
        ) => ({
            loadCampaigns: rxMethod<{ page?: number; size?: number; status?: CampaignStatus } | void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap((params) => {
                        const page = params && 'page' in params ? params.page ?? 0 : store.currentPage();
                        const size = params && 'size' in params ? params.size ?? 10 : store.pageSize();
                        const status =
                            params && 'status' in params
                                ? params.status
                                : undefined;
                        return campaignService.getCampaigns(page, size, status).pipe(
                            tap((response) =>
                                patchState(store, {
                                    campaigns: response.content,
                                    currentPage: response.number,
                                    totalPages: response.totalPages,
                                    totalElements: response.totalElements,
                                    pageSize: response.size,
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
                            tap(() => {
                                patchState(store, {
                                    isLoading: false,
                                    saveSuccess: true,
                                });
                                toastr.success(
                                    'Campaign created successfully',
                                );
                            }),
                            catchError((error) => {
                                const msg =
                                    error?.error?.message ||
                                    error?.error ||
                                    '';
                                if (
                                    error?.status === 409 ||
                                    (typeof msg === 'string' &&
                                        msg.toLowerCase().includes('already exists'))
                                ) {
                                    toastr.error(
                                        'A campaign with this name already exists',
                                    );
                                } else {
                                    toastr.error('Failed to create campaign');
                                }
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
                                patchState(store, { isLoading: false });
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
                    exhaustMap((id) =>
                        campaignService.sendCampaign(id).pipe(
                            switchMap(() => campaignService.getCampaigns(store.currentPage(), store.pageSize())),
                            tap((response) => {
                                patchState(store, {
                                    campaigns: response.content,
                                    currentPage: response.number,
                                    totalPages: response.totalPages,
                                    totalElements: response.totalElements,
                                    pageSize: response.size,
                                    isLoading: false,
                                });
                                analyticsStore.loadDashboard();
                                analyticsStore.loadAllStats();
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

            resetSaveSuccess() {
                patchState(store, { saveSuccess: false });
            },
        }),
    ),
);
