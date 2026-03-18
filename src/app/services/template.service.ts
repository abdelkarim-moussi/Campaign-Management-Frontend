import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Page } from '../models/page.model';

export type TemplateType = 'SMS' | 'EMAIL';
export type TemplateStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Template {
    id?: string;
    name: string;
    subject?: string;
    content: string;
    type: TemplateType;
    status: TemplateStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface TemplateDTO {
    name: string;
    subject?: string;
    content: string;
    type: TemplateType;
}

export interface TemplatePreviewResult {
    renderedContent: string;
    subject?: string;
}

@Injectable({
    providedIn: 'root',
})
export class TemplateService {
    private baseUrl = `${environment.apiUrl}/templates`;

    constructor(private http: HttpClient) { }

    getTemplates(
        page = 0,
        size = 10,
        type?: TemplateType,
        status?: TemplateStatus,
    ): Observable<Page<Template>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        if (type) params = params.set('type', type);
        if (status) params = params.set('status', status);
        return this.http.get<Page<Template>>(this.baseUrl, { params });
    }

    getTemplate(id: string): Observable<Template> {
        return this.http.get<Template>(`${this.baseUrl}/${id}`);
    }

    createTemplate(dto: TemplateDTO): Observable<Template> {
        return this.http.post<Template>(this.baseUrl, dto);
    }

    updateTemplate(id: string, dto: TemplateDTO): Observable<Template> {
        return this.http.patch<Template>(`${this.baseUrl}/${id}`, dto);
    }

    deleteTemplate(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    getActiveTemplates(type?: TemplateType): Observable<Template[]> {
        let params = new HttpParams();
        if (type) params = params.set('type', type);
        return this.http.get<Template[]>(`${this.baseUrl}/active`, { params });
    }

    getTemplateVariables(id: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/${id}/variables`);
    }

    activateTemplate(id: string): Observable<Template> {
        return this.http.patch<Template>(`${this.baseUrl}/${id}/activate`, {});
    }

    archiveTemplate(id: string): Observable<Template> {
        return this.http.patch<Template>(`${this.baseUrl}/${id}/archive`, {});
    }

    searchTemplates(keyword: string): Observable<Template[]> {
        return this.http.get<Template[]>(`${this.baseUrl}/search/${keyword}`);
    }

    previewTemplate(
        id: string,
        variables: Record<string, string>,
    ): Observable<TemplatePreviewResult> {
        return this.http.get<TemplatePreviewResult>(
            `${this.baseUrl}/${id}/preview`,
            { params: variables },
        );
    }
}
