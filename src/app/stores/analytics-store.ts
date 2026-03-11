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
    AnalyticsService,
    CampaignStats,
    CampaignStatsDto,
    DashboardDto,
    MessageTrackingDto,
    PerformanceMetricsDto,
} from '../services/analytics.service';

interface AnalyticsState {
    dashboard: DashboardDto | null;
    allCampaignStats: CampaignStats[];
    topPerforming: CampaignStats[];
    selectedCampaignStats: CampaignStatsDto | null;
    performanceMetrics: PerformanceMetricsDto[];
    campaignTracking: MessageTrackingDto[];
    isLoading: boolean;
    isDetailLoading: boolean;
}

const initialState: AnalyticsState = {
    dashboard: null,
    allCampaignStats: [],
    topPerforming: [],
    selectedCampaignStats: null,
    performanceMetrics: [],
    campaignTracking: [],
    isLoading: false,
    isDetailLoading: false,
};

export const AnalyticsStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),

    withComputed(({ dashboard, allCampaignStats, topPerforming }) => ({
        totalCampaigns: computed(() => dashboard()?.totalCampaigns ?? 0),
        totalMessagesSent: computed(() => dashboard()?.totalMessagesSent ?? 0),
        avgOpenRate: computed(() => dashboard()?.averageOpenRate ?? 0),
        avgClickRate: computed(() => dashboard()?.averageClickRate ?? 0),
        avgDeliveryRate: computed(() => dashboard()?.averageDeliveryRate ?? 0),
        campaignCount: computed(() => allCampaignStats().length),
        topCampaignCount: computed(() => topPerforming().length),
    })),

    withMethods(
        (
            store,
            analyticsService = inject(AnalyticsService),
            toastr = inject(ToastrService),
        ) => ({
            loadDashboard: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap(() =>
                        analyticsService.getDashboard().pipe(
                            tap((dashboard) =>
                                patchState(store, { dashboard, isLoading: false }),
                            ),
                            catchError(() => {
                                toastr.error('Failed to load dashboard analytics');
                                patchState(store, { isLoading: false });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),

            loadAllStats: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap(() =>
                        analyticsService.getAllCampaignStats().pipe(
                            tap((allCampaignStats) =>
                                patchState(store, { allCampaignStats, isLoading: false }),
                            ),
                            catchError(() => {
                                toastr.error('Failed to load campaign stats');
                                patchState(store, { isLoading: false });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),

            loadTopPerforming: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true })),
                    switchMap(() =>
                        analyticsService.getTopPerforming().pipe(
                            tap((topPerforming) =>
                                patchState(store, { topPerforming, isLoading: false }),
                            ),
                            catchError(() => {
                                toastr.error('Failed to load top performing campaigns');
                                patchState(store, { isLoading: false });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),

            loadCampaignStats: rxMethod<number>(
                pipe(
                    tap(() => patchState(store, { isDetailLoading: true })),
                    switchMap((campaignId) =>
                        analyticsService.getCampaignStats(campaignId).pipe(
                            tap((selectedCampaignStats) =>
                                patchState(store, {
                                    selectedCampaignStats,
                                    isDetailLoading: false,
                                }),
                            ),
                            catchError(() => {
                                toastr.error('Failed to load campaign stats');
                                patchState(store, { isDetailLoading: false });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),

            loadCampaignMetrics: rxMethod<number>(
                pipe(
                    tap(() => patchState(store, { isDetailLoading: true })),
                    switchMap((campaignId) =>
                        analyticsService.getCampaignMetrics(campaignId).pipe(
                            tap((performanceMetrics) =>
                                patchState(store, {
                                    performanceMetrics,
                                    isDetailLoading: false,
                                }),
                            ),
                            catchError(() => {
                                toastr.error('Failed to load performance metrics');
                                patchState(store, { isDetailLoading: false });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),

            loadCampaignTracking: rxMethod<number>(
                pipe(
                    tap(() => patchState(store, { isDetailLoading: true })),
                    switchMap((campaignId) =>
                        analyticsService.getCampaignTracking(campaignId).pipe(
                            tap((campaignTracking) =>
                                patchState(store, {
                                    campaignTracking,
                                    isDetailLoading: false,
                                }),
                            ),
                            catchError(() => {
                                toastr.error('Failed to load tracking data');
                                patchState(store, { isDetailLoading: false });
                                return EMPTY;
                            }),
                        ),
                    ),
                ),
            ),

            clearSelection: () =>
                patchState(store, {
                    selectedCampaignStats: null,
                    performanceMetrics: [],
                    campaignTracking: [],
                }),
        }),
    ),
);
