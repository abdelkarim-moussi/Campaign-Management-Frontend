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

        dashboardDoughnutData: computed(() => {
            const dash = dashboard();
            if (!dash) return { labels: [], datasets: [] };

            const delivered = dash.totalMessagesDelivered - dash.totalMessagesOpened;
            const opened = dash.totalMessagesOpened - dash.totalMessagesClicked;
            const clicked = dash.totalMessagesClicked;
            const failed = dash.totalMessagesSent - dash.totalMessagesDelivered;

            return {
                labels: ['Delivered', 'Opened', 'Clicked', 'Failed'],
                datasets: [
                    {
                        data: [
                            Math.max(0, delivered),
                            Math.max(0, opened),
                            clicked,
                            Math.max(0, failed),
                        ],
                        backgroundColor: ['#22c55e', '#8b8d3a', '#a855f7', '#dc2626'],
                        borderWidth: 0,
                        hoverOffset: 6,
                    },
                ],
            };
        }),

        recentCampaignsForChart: computed(() => {
            const campaigns = allCampaignStats();
            return campaigns
                .slice()
                .sort((a, b) => {
                    const aDate = new Date(a.lastUpdatedAt || '').getTime() || 0;
                    const bDate = new Date(b.lastUpdatedAt || '').getTime() || 0;
                    return bDate - aDate;
                })
                .slice(0, 5);
        }),

        topPerformingChartData: computed(() => {
            const top = topPerforming();
            return {
                labels: top.slice(0, 8).map(c => {
                    const name = c.campaignName || 'Unknown';
                    return name.length > 20 ? name.substring(0, 20) + '…' : name;
                }),
                datasets: [{
                    label: 'Open Rate %',
                    data: top.slice(0, 8).map(c => c.openRate),
                    backgroundColor: top.slice(0, 8).map((_, i) =>
                        i < 3 ? '#8b8d3a' : i < 5 ? '#a3a54e' : '#c5c770'
                    ),
                }],
            };
        }),

        dashboardBarData: computed(() => {
            const campaigns = allCampaignStats();
            const top = campaigns
                .slice()
                .sort((a, b) => {
                    const aDate = new Date(a.lastUpdatedAt || '').getTime() || 0;
                    const bDate = new Date(b.lastUpdatedAt || '').getTime() || 0;
                    return bDate - aDate;
                })
                .slice(0, 5);

            return {
                labels: top.map(c => {
                    const name = c.campaignName || 'Unknown';
                    return name.length > 15 ? name.substring(0, 15) + '…' : name;
                }),
                datasets: [
                    { label: 'Sent', data: top.map(c => c.totalSent), backgroundColor: '#3b82f6' },
                    { label: 'Delivered', data: top.map(c => c.totalDelivered), backgroundColor: '#22c55e' },
                    { label: 'Opened', data: top.map(c => c.totalOpened), backgroundColor: '#8b8d3a' },
                ],
            };
        })
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
