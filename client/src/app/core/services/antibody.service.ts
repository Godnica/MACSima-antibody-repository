import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Antibody, CreateAntibodyDto } from '../models/antibody.model';

@Injectable({ providedIn: 'root' })
export class AntibodyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/antibodies';

  getAll(filters: Record<string, string> = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params = params.set(key, value);
    }
    return this.http.get<Antibody[]>(this.baseUrl, { params });
  }

  getCombinations() {
    return this.http.get<{ antigen_target: string; clone: string }[]>(`${this.baseUrl}/combinations`);
  }

  getLowStock() {
    return this.http.get<Antibody[]>(`${this.baseUrl}/low-stock`);
  }

  create(data: CreateAntibodyDto) {
    return this.http.post<Antibody>(this.baseUrl, data);
  }

  update(id: number, data: CreateAntibodyDto) {
    return this.http.put<Antibody>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
