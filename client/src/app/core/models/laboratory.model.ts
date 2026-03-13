export interface Laboratory {
  id: number;
  name: string;
  pi_name: string | null;
  email: string | null;
  billing_address: string | null;
}

export interface CreateLaboratoryDto {
  name: string;
  pi_name: string;
  email: string;
  billing_address: string;
}
