import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface BillingAntibody {
  tube_number: string;
  target: string;
  clone: string;
  fluorochrome: string;
  total_ul_used: number;
  chf_per_ul: number;
  total_chf: number;
}

export interface BillingLab {
  lab_id: number;
  lab_name: string;
  pi_name: string;
  email: string;
  billing_address: string;
  antibodies: BillingAntibody[];
  total_cost: number;
}

export interface BillingData {
  experiment: {
    id: number;
    name: string;
    date: string;
    status: string;
    requesting_lab_name: string;
  };
  labs: BillingLab[];
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/billing';

  getBillingData(experimentId: number) {
    return this.http.get<BillingData>(`${this.base}/experiment/${experimentId}`);
  }

  downloadPdf(experimentId: number, labId: number) {
    return this.http.get(`${this.base}/experiment/${experimentId}/pdf/${labId}`, {
      responseType: 'blob',
    });
  }
}
