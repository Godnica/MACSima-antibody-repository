import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Laboratory, CreateLaboratoryDto } from '../models/laboratory.model';

@Injectable({ providedIn: 'root' })
export class LaboratoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/laboratories';

  getAll() {
    return this.http.get<Laboratory[]>(this.baseUrl);
  }

  create(data: CreateLaboratoryDto) {
    return this.http.post<Laboratory>(this.baseUrl, data);
  }

  update(id: number, data: CreateLaboratoryDto) {
    return this.http.put<Laboratory>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
