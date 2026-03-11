import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CampaignService } from '../../services/campaign.service';
import {
  AnalyticsService,
  CampaignStats,
  DashboardDto,
  MessageTrackingDto,
} from '../../services/analytics.service';
import { ToastrService } from 'ngx-toastr';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  readonly campaignService = inject(CampaignService);
  readonly analyticsService = inject(AnalyticsService);
  readonly toastr = inject(ToastrService);

  dashboard: DashboardDto | null = null;
  recentCampaigns: CampaignStats[] = [];
  recentActivity: MessageTrackingDto[] = [];
  isLoading = true;

  // Doughnut chart for message breakdown
  doughnutData: ChartData<'doughnut'> = {
    labels: ['Delivered', 'Opened', 'Clicked', 'Failed'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ['#22c55e', '#8b8d3a', '#a855f7', '#dc2626'],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
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

  // Bar chart for campaign performance comparison
  barData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Sent',
        data: [],
        backgroundColor: '#3b82f6',
      },
      {
        label: 'Delivered',
        data: [],
        backgroundColor: '#22c55e',
      },
      {
        label: 'Opened',
        data: [],
        backgroundColor: '#8b8d3a',
      },
    ],
  };

  barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Inter', size: 10 },
          color: '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: {
          font: { family: 'Inter', size: 10 },
          color: '#6b7280',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
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

  ngOnInit(): void {
    this.loadDashboardAnalytics();
    this.loadRecentCampaigns();
  }

  loadDashboardAnalytics(): void {
    this.analyticsService.getDashboard().subscribe({
      next: (dashboard: DashboardDto) => {
        this.dashboard = dashboard;
        this.isLoading = false;

        // Update doughnut chart
        const delivered = dashboard.totalMessagesDelivered - dashboard.totalMessagesOpened;
        const opened = dashboard.totalMessagesOpened - dashboard.totalMessagesClicked;
        const clicked = dashboard.totalMessagesClicked;
        const failed = dashboard.totalMessagesSent - dashboard.totalMessagesDelivered;
        this.doughnutData = {
          ...this.doughnutData,
          datasets: [
            {
              ...this.doughnutData.datasets[0],
              data: [
                Math.max(0, delivered),
                Math.max(0, opened),
                clicked,
                Math.max(0, failed),
              ],
            },
          ],
        };
      },
      error: () => {
        this.toastr.error('Failed to load dashboard analytics');
        this.isLoading = false;
      },
    });
  }

  loadRecentCampaigns(): void {
    this.analyticsService.getAllCampaignStats().subscribe({
      next: (campaigns) => {
        if (!campaigns || campaigns.length === 0) {
          this.loadRecentCampaignsFallback();
          return;
        }

        this.recentCampaigns = campaigns
          .slice()
          .sort((a, b) => {
            const aDate = new Date(a.lastUpdatedAt || '').getTime() || 0;
            const bDate = new Date(b.lastUpdatedAt || '').getTime() || 0;
            return bDate - aDate;
          })
          .slice(0, 5);

        this.updateBarChart();

        if (this.recentCampaigns.length > 0) {
          this.loadRecentActivityFromCampaigns();
        }
      },
      error: () => {
        this.toastr.error('Failed to load recent campaigns');
        this.loadRecentCampaignsFallback();
      },
    });
  }

  private updateBarChart(): void {
    const top = this.recentCampaigns.slice(0, 5);
    this.barData = {
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
  }

  loadRecentCampaignsFallback(): void {
    this.campaignService.getCampaigns().subscribe({
      next: (campaigns) => {
        if (!campaigns || campaigns.length === 0) {
          this.recentCampaigns = [];
          return;
        }

        this.recentCampaigns = campaigns
          .slice()
          .sort((a, b) => {
            const aDate =
              new Date(a.updatedAt || a.createdAt || '').getTime() || 0;
            const bDate =
              new Date(b.updatedAt || b.createdAt || '').getTime() || 0;
            return bDate - aDate;
          })
          .slice(0, 5)
          .map(
            (campaign) =>
              ({
                id: 0,
                campaignId: campaign.id ?? 0,
                campaignName: campaign.name,
                totalRecipients: campaign.totalContacts ?? 0,
                totalSent: campaign.campaignContacts?.length ?? 0,
                totalDelivered:
                  campaign.campaignContacts?.filter((c) => c.deliveredAt)
                    .length ?? 0,
                totalOpened:
                  campaign.campaignContacts?.filter((c) => c.openedAt).length ??
                  0,
                totalClicked:
                  campaign.campaignContacts?.filter((c) => c.openedAt).length ??
                  0,
                totalFailed:
                  campaign.campaignContacts?.filter((c) => !c.deliveredAt)
                    .length ?? 0,
                totalBounced: 0,
                totalUnsubscribed: 0,
                totalSpamComplaints: 0,
                openRate: 0,
                clickRate: 0,
                deliveryRate: 0,
                bounceRate: 0,
                unsubscribeRate: 0,
                clickThroughRate: 0,
                firstSentAt: campaign.createdAt ?? '',
                lastUpdatedAt: campaign.updatedAt ?? campaign.createdAt ?? '',
                createdAt: campaign.createdAt ?? '',
                updatedAt: campaign.updatedAt ?? '',
              }) as CampaignStats,
          );

        this.updateBarChart();

        if (this.recentCampaigns.length > 0) {
          this.loadRecentActivityFromCampaigns();
        }
      },
      error: () => {
        this.toastr.error('Failed to load fallback campaign data');
      },
    });
  }

  loadRecentActivityFromCampaigns(): void {
    const campaignIds = this.recentCampaigns.map((c) => c.campaignId);
    this.recentActivity = [];

    let currentIndex = 0;

    const loadNext = () => {
      if (currentIndex >= campaignIds.length) {
        return;
      }

      const id = campaignIds[currentIndex];
      this.analyticsService.getCampaignTracking(id).subscribe({
        next: (activities) => {
          if (activities && activities.length > 0) {
            this.recentActivity = activities
              .slice()
              .sort(
                (a, b) =>
                  this.getLatestEventTime(b) - this.getLatestEventTime(a),
              )
              .slice(0, 8);
          } else {
            currentIndex += 1;
            loadNext();
          }
        },
        error: () => {
          currentIndex += 1;
          loadNext();
        },
      });
    };

    loadNext();
  }

  private getLatestEventTime(event: MessageTrackingDto): number {
    return event.eventAt ? new Date(event.eventAt).getTime() : 0;
  }

  getEventTypeClass(eventType: string): string {
    switch (eventType) {
      case 'SENT': return 'event-sent';
      case 'DELIVERED': return 'event-delivered';
      case 'OPENED': return 'event-opened';
      case 'CLICKED': return 'event-clicked';
      case 'BOUNCED': return 'event-bounced';
      default: return 'event-default';
    }
  }
}
