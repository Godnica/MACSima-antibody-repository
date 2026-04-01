import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserAdmin } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/users';

  getAll()           { return this.http.get<UserAdmin[]>(this.base); }
  create(data: { username: string; password: string; role: string; display_name?: string }) {
    return this.http.post<UserAdmin>(this.base, data);
  }
  remove(id: number) { return this.http.delete<void>(`${this.base}/${id}`); }
  resetPassword(id: number, newPassword: string) {
    return this.http.post<any>(`${this.base}/${id}/reset-password`, { newPassword });
  }
}
