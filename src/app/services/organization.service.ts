import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface OrganizationDto {
  id: number;
  name: string;
  slug: string;
  email: string;
  plan: string;
  status: string;
  maxContacts: number;
  maxCampaignsPerMonth: number;
  maxUsers: number;
  currentContacts: number;
  currentUsers: number;
  trialEndsAt?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  // Use /api/organizations to match the backend controller mapping
  private readonly API_URL = `${environment.apiUrl.replace('/api/v1', '/api')}/organizations`;

  constructor(private http: HttpClient) { }

  getCurrentOrganization(): Observable<OrganizationDto> {
    return this.http.get<OrganizationDto>(`${this.API_URL}/current`);
  }

  updateOrganization(data: Partial<OrganizationDto>): Observable<OrganizationDto> {
    return this.http.put<OrganizationDto>(`${this.API_URL}/current`, data);
  }
}
