import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Page } from '../models/page.model';

export enum Status {
  LEAD,
  PROSPECT,
  CLIENT,
}

export interface Contact {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  group: string;
  status: string;
  tagIds: number[];
  fullName?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  constructor(private http: HttpClient) { }

  getContacts(page = 0, size = 10): Observable<Page<Contact>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Page<Contact>>(`${environment.apiUrl}/contacts`, { params });
  }

  getContact(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${environment.apiUrl}/contacts/${id}`);
  }

  createContact(contact: Partial<Contact>): Observable<Contact> {
    return this.http.post<Contact>(`${environment.apiUrl}/contacts`, contact);
  }

  createContacts(contacts: Contact[]): Observable<Contact[]> {
    return this.http.post<Contact[]>(`${environment.apiUrl}/contacts/import`, contacts);
  }

  updateContact(id: number, contact: Partial<Contact>): Observable<Contact> {
    return this.http.patch<Contact>(
      `${environment.apiUrl}/contacts/${id}`,
      contact,
    );
  }

  deleteContact(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/contacts/${id}`);
  }
}
