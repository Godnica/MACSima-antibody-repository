export type QualityColor = 'none' | 'green' | 'yellow' | 'grey';

export interface Antibody {
  id: number;
  lab_id: number;
  lab_name: string;
  tube_number: string;
  species: string | null;
  antigen_target: string | null;
  clone: string | null;
  company: string | null;
  order_number: string | null;
  lot_number: string | null;
  fluorochrome: string | null;
  processing: string | null;
  panel: string | null;
  volume_on_arrival: number;
  current_volume: number;
  cost_chf: number;
  chf_per_ul: number;
  quality_color: QualityColor;
  created_at: string;
}

export interface CreateAntibodyDto {
  lab_id: number;
  tube_number: string;
  species: string;
  antigen_target: string;
  clone: string;
  company: string;
  order_number: string;
  lot_number: string;
  fluorochrome: string;
  processing: string;
  panel: string;
  volume_on_arrival: number;
  cost_chf: number;
  quality_color: QualityColor;
}
