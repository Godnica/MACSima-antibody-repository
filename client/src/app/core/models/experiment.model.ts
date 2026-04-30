export type ExperimentStatus = 'planning' | 'executed_not_billed' | 'executed_billed';

export interface Experiment {
  id: number;
  name: string;
  date: string | null;
  requesting_lab_id: number | null;
  requesting_lab_name: string | null;
  status: ExperimentStatus;
  macswell_slides: number;
  total_cocktail_volume: number;
  experiment_type: string | null;
  created_at: string;
  has_insufficient_volume?: boolean;
}

export interface ExperimentAntibody {
  id: number;
  experiment_id: number;
  antibody_id: number;
  antibody_code?: number | null;
  tube_number: string;
  antigen_target: string;
  clone: string;
  fluorochrome: string;
  status?: string | null;
  chf_per_ul: number;
  current_volume: number;
  volume_on_arrival: number;
  lab_name: string;
  pi_name?: string | null;
  titration_ratio: number;
  ul_per_slide: number;
  total_ul_used: number;
  total_chf: number;
}
