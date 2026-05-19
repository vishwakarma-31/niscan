export type PolicyStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface ExtractionConfidence {
  [key: string]: { value: string | null; confidence: number } | string | undefined;
  policy_number?: { value: string | null; confidence: number };
  customer_name?: { value: string | null; confidence: number };
  vehicle_number?: { value: string | null; confidence: number };
  insurer_name?: { value: string | null; confidence: number };
  premium_amount?: { value: string | null; confidence: number };
  error?: string;
  raw?: string;
}

export interface Uploader {
  name: string;
  email: string;
}

export interface Policy {
  id: string;
  policy_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  vehicle_number: string | null;
  insurer: string | null;
  premium: number | null;
  s3_file_url: string | null;
  s3_file_key: string | null;
  status: PolicyStatus;
  extraction_confidence: ExtractionConfidence | null;
  uploaded_by: string | null;
  uploader_name?: string | null;
  uploader_email?: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface PolicySummary {
  total: number;
  active: number;
  pending: number;
  expired: number;
  cancelled: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PolicyFilters {
  search?: string;
  status?: PolicyStatus;
  page?: number;
  limit?: number;
  uploaded_by?: string;
}

export interface GetPoliciesResponse {
  policies: Policy[];
  pagination: Pagination;
}