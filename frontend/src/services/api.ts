import axios, { AxiosError, InternalAxiosRequestConfig, AxiosProgressEvent } from 'axios';
import type {
  LoginResponse,
  RefreshResponse,
  DownloadUrlResponse,
} from '@/types/api.types';
import type {
  Policy,
  PolicySummary,
  GetPoliciesResponse,
  PolicyFilters,
} from '@/types/policy.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// add token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// refresh token if expired
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post<RefreshResponse>(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = res.data;
        localStorage.setItem('accessToken', accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// auth endpoints
const auth = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    return res.data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
  },
  me: async (): Promise<{ id: string; name: string; email: string; role: string }> => {
    const res = await api.get('/auth/me');
    return res.data.user;
  },
};

// policy endpoints
const policies = {
  getAll: async (filters: PolicyFilters = {}): Promise<GetPoliciesResponse> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.uploaded_by) params.append('uploaded_by', filters.uploaded_by);

    const res = await api.get<GetPoliciesResponse>(`/policies?${params.toString()}`);
    return res.data;
  },

  getSummary: async (): Promise<PolicySummary> => {
    const res = await api.get<PolicySummary>('/policies/summary');
    return res.data;
  },

  getById: async (id: string): Promise<{ policy: Policy }> => {
    const res = await api.get(`/policies/${id}`);
    return res.data;
  },

  upload: async (
    formData: FormData,
    onProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<{ policy: Policy }> => {
    const res = await api.post<{ policy: Policy }>('/policies/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<{ policy: Policy }> => {
    const res = await api.patch<{ policy: Policy }>(`/policies/${id}/status`, { status });
    return res.data;
  },

  getDownloadUrl: async (id: string): Promise<DownloadUrlResponse> => {
    const res = await api.get<DownloadUrlResponse>(`/policies/${id}/download`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/policies/${id}`);
  },

  exportCSV: async (): Promise<Blob> => {
    const res = await api.get('/policies/export/csv', { responseType: 'blob' });
    return res.data;
  },
};

export const apiService = { auth, policies };
export default api;