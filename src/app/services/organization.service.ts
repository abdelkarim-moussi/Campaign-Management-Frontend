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

  constructor(private http: HttpClient) { }

  getCurrentOrganization(): Observable<OrganizationDto> {
    return this.http.get<OrganizationDto>(`${environment.apiUrl}/organizations/current`);
  }

  updateOrganization(data: Partial<OrganizationDto>): Observable<OrganizationDto> {
    return this.http.put<OrganizationDto>(`${environment.apiUrl}/organizations/current`, data);
  }
}
