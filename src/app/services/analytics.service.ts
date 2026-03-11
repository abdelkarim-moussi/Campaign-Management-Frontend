import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface DashboardDto {
    totalCampaigns: number;
    totalMessagesSent: number;
    totalMessagesDelivered: number;
    totalMessagesOpened: number;
    totalMessagesClicked: number;
    averageOpenRate: number;
    averageClickRate: number;
    averageDeliveryRate: number;
    campaignsThisMonth: number;
    messagesSentThisMonth: number;
    messagesSentToday: number;
}

export interface CampaignStatsDto {
    campaignId: number;
    campaignName: string;
    totalRecipients: number;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalFailed: number;
    openRate: number;
    clickRate: number;
    deliveryRate: number;
    firstSentAt: string;
    lastUpdatedAt: string;
}

export interface CampaignStats {
    id: number;
    campaignId: number;
    campaignName: string;
    totalRecipients: number;
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalBounced: number;
    totalOpened: number;
    totalClicked: number;
    totalUnsubscribed: number;
    totalSpamComplaints: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
    clickThroughRate: number;
    firstSentAt: string;
    lastUpdatedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface PerformanceMetricsDto {
    metric: string;
    count: number;
    percentage: number;
}

export interface MessageTrackingDto {
    id: number;
    messageId: number;
    campaignId: number;
    contactId: number;
    eventType: TrackingEventType;
    ipAddress?: string;
    userAgent?: string;
    url?: string;
    device?: string;
    browser?: string;
    os?: string;
    country?: string;
    city?: string;
    eventAt: string;
}

export type TrackingEventType =
    | 'SENT'
    | 'DELIVERED'
    | 'OPENED'
    | 'CLICKED'
    | 'BOUNCED'
    | 'UNSUBSCRIBED'
    | 'SPAM_COMPLAINT';

@Injectable({
    providedIn: 'root',
})
export class AnalyticsService {
    private baseUrl = `${environment.apiUrl}/analytics`;

    constructor(private http: HttpClient) { }

    getDashboard(): Observable<DashboardDto> {
        return this.http.get<DashboardDto>(`${this.baseUrl}/dashboard`);
    }

    getCampaignStats(campaignId: number): Observable<CampaignStatsDto> {
        return this.http.get<CampaignStatsDto>(
            `${this.baseUrl}/campaigns/${campaignId}`,
        );
    }

    getAllCampaignStats(): Observable<CampaignStats[]> {
        return this.http.get<CampaignStats[]>(`${this.baseUrl}/campaigns`);
    }

    getTopPerforming(): Observable<CampaignStats[]> {
        return this.http.get<CampaignStats[]>(
            `${this.baseUrl}/campaigns/top-performing`,
        );
    }

    getCampaignMetrics(
        campaignId: number,
    ): Observable<PerformanceMetricsDto[]> {
        return this.http.get<PerformanceMetricsDto[]>(
            `${this.baseUrl}/campaigns/${campaignId}/metrics`,
        );
    }

    getCampaignTracking(
        campaignId: number,
    ): Observable<MessageTrackingDto[]> {
        return this.http.get<MessageTrackingDto[]>(
            `${this.baseUrl}/campaigns/${campaignId}/tracking`,
        );
    }

    getMessageTracking(messageId: number): Observable<MessageTrackingDto[]> {
        return this.http.get<MessageTrackingDto[]>(
            `${this.baseUrl}/messages/${messageId}/tracking`,
        );
    }

    trackEvent(
        messageId: number,
        campaignId: number,
        contactId: number,
        eventType: TrackingEventType,
    ): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/track`, null, {
            params: {
                messageId: String(messageId),
                campaignId: String(campaignId),
                contactId: String(contactId),
                eventType,
            },
        });
    }
}
