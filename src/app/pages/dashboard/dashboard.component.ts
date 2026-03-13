import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsStore } from '../../stores/analytics-store';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { LoadingOverlayComponent } from '../../components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, LoadingOverlayComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  readonly store = inject(AnalyticsStore);

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
    this.store.loadDashboard();
    this.store.loadAllStats();
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
