export interface ExperimentTemplate {
  id: number;
  name: string;
  requesting_lab_id: number | null;
  requesting_lab_name?: string | null;
  experiment_type: string | null;
  macswell_slides: number | null;
  total_cocktail_volume: number | null;
  notes: string | null;
  antibody_count?: number;
  created_at: string;
}

export interface ExperimentTemplateAntibody {
  id: number;
  template_id: number;
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
}

export interface InstantiateTemplateDto {
  name: string;
  date?: string | Date | null;
  requesting_lab_id?: number | null;
  macswell_slides?: number | null;
  total_cocktail_volume?: number | null;
  experiment_type?: string | null;
}
