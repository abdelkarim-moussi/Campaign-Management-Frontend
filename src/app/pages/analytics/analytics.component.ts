import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsStore } from '../../stores/analytics-store';
import { CampaignStats } from '../../services/analytics.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';

@Component({
    selector: 'app-analytics',
    imports: [CommonModule, BaseChartDirective],
    templateUrl: './analytics.component.html',
    styleUrl: './analytics.component.css',
})
export class AnalyticsComponent implements OnInit {
    readonly store = inject(AnalyticsStore);

    selectedCampaignId: number | null = null;

    // Doughnut chart for overview
    overviewDoughnutData: ChartData<'doughnut'> = {
        labels: ['Delivered', 'Opened', 'Clicked', 'Not Delivered'],
        datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: ['#22c55e', '#8b8d3a', '#a855f7', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 6,
        }],
    };

    doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
        responsive: true,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 16,
                    font: { family: 'Inter', size: 11 },
                    color: '#6b7280',
                },
            },
        },
    };

    // Horizontal bar for top performing
    horizontalBarData: ChartData<'bar'> = {
        labels: [],
        datasets: [{
            label: 'Open Rate %',
            data: [],
            backgroundColor: '#8b8d3a',
        }],
    };

    horizontalBarOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                grid: { color: '#e5e7eb' },
                ticks: {
                    font: { family: 'Inter', size: 10 },
                    color: '#6b7280',
                    callback: (value) => value + '%',
                },
            },
            y: {
                grid: { display: false },
                ticks: {
                    font: { family: 'Inter', size: 11 },
                    color: '#1a1a1a',
                },
            },
        },
        plugins: {
            legend: { display: false },
        },
    };

    ngOnInit(): void {
        this.store.loadDashboard();
        this.store.loadAllStats();
        this.store.loadTopPerforming();
    }

    ngDoCheck(): void {
        const dash = this.store.dashboard();
        if (dash && this.overviewDoughnutData.datasets[0].data[0] === 0 && dash.totalMessagesSent > 0) {
            const delivered = dash.totalMessagesDelivered - dash.totalMessagesOpened;
            const opened = dash.totalMessagesOpened - dash.totalMessagesClicked;
            this.overviewDoughnutData = {
                ...this.overviewDoughnutData,
                datasets: [{
                    ...this.overviewDoughnutData.datasets[0],
                    data: [
                        Math.max(0, delivered),
                        Math.max(0, opened),
                        dash.totalMessagesClicked,
                        Math.max(0, dash.totalMessagesSent - dash.totalMessagesDelivered),
                    ],
                }],
            };
        }

        const top = this.store.topPerforming();
        if (top.length > 0 && (this.horizontalBarData.labels?.length ?? 0) === 0) {
            this.horizontalBarData = {
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
        }
    }

    selectCampaign(campaign: CampaignStats): void {
        if (this.selectedCampaignId === campaign.campaignId) {
            this.selectedCampaignId = null;
            this.store.clearSelection();
            return;
        }
        this.selectedCampaignId = campaign.campaignId;
        this.store.loadCampaignMetrics(campaign.campaignId);
        this.store.loadCampaignTracking(campaign.campaignId);
    }

    getEventTypeClass(eventType: string): string {
        switch (eventType) {
            case 'SENT': return 'bg-blue-100 text-blue-700';
            case 'DELIVERED': return 'bg-green-100 text-green-700';
            case 'OPENED': return 'bg-accent/20 text-accent';
            case 'CLICKED': return 'bg-purple-100 text-purple-700';
            case 'BOUNCED': return 'bg-red-100 text-danger';
            case 'UNSUBSCRIBED': return 'bg-yellow-100 text-yellow-700';
            case 'SPAM_COMPLAINT': return 'bg-red-200 text-red-800';
            default: return 'bg-border text-text-muted';
        }
    }

    getMetricColor(metric: string): string {
        switch (metric) {
            case 'Send': return 'bg-blue-500';
            case 'Delivered': return 'bg-green-500';
            case 'Opened': return 'bg-accent';
            case 'Clicked': return 'bg-purple-500';
            case 'Failed': return 'bg-danger';
            default: return 'bg-border';
        }
    }

    getMetricTextColor(metric: string): string {
        switch (metric) {
            case 'Send': return 'text-blue-600';
            case 'Delivered': return 'text-green-600';
            case 'Opened': return 'text-accent';
            case 'Clicked': return 'text-purple-600';
            case 'Failed': return 'text-danger';
            default: return 'text-text-muted';
        }
    }

    getRateBarClass(rate: number): string {
        if (rate >= 80) return 'bg-green-500';
        if (rate >= 50) return 'bg-accent';
        if (rate >= 20) return 'bg-yellow-500';
        return 'bg-danger';
    }
}
