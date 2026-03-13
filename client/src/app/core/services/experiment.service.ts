import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Experiment, ExperimentAntibody } from '../models/experiment.model';

@Injectable({ providedIn: 'root' })
export class ExperimentService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/experiments';

  getAll(filters?: { antigen_target?: string; clone?: string }) {
    let params = new HttpParams();
    if (filters?.antigen_target) params = params.set('antigen_target', filters.antigen_target);
    if (filters?.clone) params = params.set('clone', filters.clone);
    return this.http.get<Experiment[]>(this.base, { params });
  }
  getById(id: number)    { return this.http.get<Experiment>(`${this.base}/${id}`); }
  create(data: Partial<Experiment>)       { return this.http.post<Experiment>(this.base, data); }
  update(id: number, data: Partial<Experiment>) { return this.http.put<Experiment>(`${this.base}/${id}`, data); }

  execute(id: number)    { return this.http.post<any>(`${this.base}/${id}/execute`, {}); }
  markBilled(id: number) { return this.http.post<Experiment>(`${this.base}/${id}/mark-billed`, {}); }

  getAntibodies(id: number) { return this.http.get<ExperimentAntibody[]>(`${this.base}/${id}/antibodies`); }
  addAntibody(id: number, antibody_id: number, titration_ratio: number) {
    return this.http.post<ExperimentAntibody>(`${this.base}/${id}/antibodies`, { antibody_id, titration_ratio });
  }
  updateAntibody(id: number, eaId: number, titration_ratio: number) {
    return this.http.put<ExperimentAntibody>(`${this.base}/${id}/antibodies/${eaId}`, { titration_ratio });
  }
  removeAntibody(id: number, eaId: number) {
    return this.http.delete<void>(`${this.base}/${id}/antibodies/${eaId}`);
  }
}
