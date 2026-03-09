import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENT';
export type CampaignChannel = 'EMAIL' | 'SMS';

export interface CampaignContact {
    id?: number;
    campaignId: number;
    contactId: number;
    status?: string;
    sentAt?: string;
    deliveredAt?: string;
    openedAt?: string;
}

export interface Campaign {
    id?: number;
    name: string;
    description?: string;
    objective?: string;
    status: CampaignStatus;
    channel: CampaignChannel;
    templateId: number;
    template?: any;
    scheduledAt?: string;
    sentAt?: string;
    createdBy?: number;
    createdAt?: string;
    updatedAt?: string;
    campaignContacts?: CampaignContact[];
    totalContacts?: number;
}

export interface CampaignDto {
    name: string;
    description?: string;
    objective?: string;
    channel: CampaignChannel;
    templateId: number;
    contactIds: number[];
    scheduledAt?: string;
}

export interface CampaignSummaryDto {
    id: number;
    name: string;
    status: CampaignStatus;
    channel: CampaignChannel;
    totalContacts: number;
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    failedCount: number;
    scheduledAt?: string;
    sentAt?: string;
    createdAt?: string;
}

@Injectable({
    providedIn: 'root',
})
export class CampaignService {
    private baseUrl = `${environment.apiUrl}/campaigns`;

    constructor(private http: HttpClient) { }

    getCampaigns(status?: CampaignStatus): Observable<Campaign[]> {
        let params = new HttpParams();
        if (status) params = params.set('status', status);
        return this.http.get<Campaign[]>(this.baseUrl, { params });
    }

    getCampaign(id: number): Observable<Campaign> {
        return this.http.get<Campaign>(`${this.baseUrl}/${id}`);
    }

    createCampaign(dto: CampaignDto): Observable<Campaign> {
        return this.http.post<Campaign>(this.baseUrl, dto);
    }

    updateCampaign(id: number, dto: CampaignDto): Observable<Campaign> {
        return this.http.put<Campaign>(`${this.baseUrl}/${id}`, dto);
    }

    deleteCampaign(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    sendCampaign(id: number): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${id}/send`, {});
    }

    getCampaignSummary(id: number): Observable<CampaignSummaryDto> {
        return this.http.get<CampaignSummaryDto>(
            `${this.baseUrl}/${id}/summary`,
        );
    }

    getCampaignContacts(id: number): Observable<CampaignContact[]> {
        return this.http.get<CampaignContact[]>(
            `${this.baseUrl}/${id}/contacts`,
        );
    }

    addContactsToCampaign(
        id: number,
        contactIds: number[],
    ): Observable<void> {
        return this.http.post<void>(
            `${this.baseUrl}/${id}/contacts`,
            contactIds,
        );
    }

    removeContactFromCampaign(
        id: number,
        contactId: number,
    ): Observable<void> {
        return this.http.delete<void>(
            `${this.baseUrl}/${id}/contacts/${contactId}`,
        );
    }

    searchCampaigns(keyword: string): Observable<Campaign[]> {
        return this.http.get<Campaign[]>(`${this.baseUrl}/search`, {
            params: { keyword },
        });
    }
}
