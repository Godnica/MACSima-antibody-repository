import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ExperimentTemplate,
  ExperimentTemplateAntibody,
  InstantiateTemplateDto,
} from '../models/template.model';
import { Experiment } from '../models/experiment.model';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/templates';

  getAll() { return this.http.get<ExperimentTemplate[]>(this.base); }
  getById(id: number) { return this.http.get<ExperimentTemplate>(`${this.base}/${id}`); }
  getAntibodies(id: number) { return this.http.get<ExperimentTemplateAntibody[]>(`${this.base}/${id}/antibodies`); }
  create(data: Partial<ExperimentTemplate>) { return this.http.post<ExperimentTemplate>(this.base, data); }
  update(id: number, data: Partial<ExperimentTemplate>) { return this.http.put<ExperimentTemplate>(`${this.base}/${id}`, data); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/${id}`); }

  addAntibody(id: number, antibody_id: number, titration_ratio: number) {
    return this.http.post<ExperimentTemplateAntibody>(`${this.base}/${id}/antibodies`, { antibody_id, titration_ratio });
  }

  updateAntibody(id: number, tabId: number, titration_ratio: number) {
    return this.http.put<ExperimentTemplateAntibody>(`${this.base}/${id}/antibodies/${tabId}`, { titration_ratio });
  }

  removeAntibody(id: number, tabId: number) {
    return this.http.delete<void>(`${this.base}/${id}/antibodies/${tabId}`);
  }

  instantiate(id: number, overrides: InstantiateTemplateDto) {
    return this.http.post<Experiment>(`${this.base}/${id}/instantiate`, overrides);
  }
}
