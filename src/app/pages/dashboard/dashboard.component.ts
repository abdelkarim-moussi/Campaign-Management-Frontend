import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  stats = [
    { label: 'Total Contacts', value: '0', change: '—', positive: true },
    { label: 'Active Campaigns', value: '0', change: '—', positive: true },
    { label: 'Emails Sent', value: '0', change: '—', positive: true },
    { label: 'Open Rate', value: '0%', change: '—', positive: true },
  ];
}
