import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
export enum Status {
  LEAD,
  PROSPECT,
  CLIENT,
}

export interface Contact {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  segment: string;
  status: string;
  tagIds: string[];
  fullName?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  constructor(private http: HttpClient) { }

  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${environment.apiUrl}/contacts`);
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

  updateContact(id: string, contact: Partial<Contact>): Observable<Contact> {
    return this.http.patch<Contact>(
      `${environment.apiUrl}/contacts/${id}`,
      contact,
    );
  }

  deleteContact(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/contacts/${id}`);
  }
}
