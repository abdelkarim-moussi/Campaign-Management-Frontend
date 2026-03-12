import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface InviteUserRequest {
    email: string;
    role: string;
}

export interface UpdateProfileRequest {
    firstName: string;
    lastName: string;
}

export interface UserDto {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    status: string;
    avatarUrl?: string;
    emailVerified: boolean;
    lastLoginAt?: string;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    // Use /api/users to match the backend controller mapping
    private readonly API_URL = `${environment.apiUrl.replace('/api/v1', '/api')}/users`;

    constructor(private http: HttpClient) { }

    getOrganizationUsers(): Observable<UserDto[]> {
        return this.http.get<UserDto[]>(this.API_URL);
    }

    inviteUser(request: InviteUserRequest): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/invite`, request);
    }

    updateUserRole(userId: number, role: string): Observable<UserDto> {
        return this.http.patch<UserDto>(`${this.API_URL}/${userId}/role`, null, {
            params: { role }
        });
    }

    deleteUser(userId: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${userId}`);
    }

    updateProfile(request: UpdateProfileRequest): Observable<UserDto> {
        return this.http.put<UserDto>(`${this.API_URL}/me`, request);
    }
}
