import { api } from './client';
import type { Patient, Admission, ClinicalEvent, Paginated } from '../types';

export const patientsApi = {
  list: (params?: { search?: string; ward?: number; status?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.ward) q.set('ward', String(params.ward));
    if (params?.status) q.set('status', params.status);
    if (params?.page && params.page > 1) q.set('page', String(params.page));
    const qs = q.toString();
    return api.get<Paginated<Patient>>(`/patients/${qs ? '?' + qs : ''}`);
  },
  get: (id: number) => api.get<Patient>(`/patients/${id}/`),
  create: (data: Partial<Patient>) => api.post<Patient>('/patients/', data),
  update: (id: number, data: Partial<Patient>) => api.patch<Patient>(`/patients/${id}/`, data),
  delete: (id: number) => api.delete<void>(`/patients/${id}/`),
  admit: (id: number, data: { bed?: number; notes?: string }) =>
    api.post<Admission>(`/patients/${id}/admit/`, data),
  discharge: (id: number) => api.post<Admission>(`/patients/${id}/discharge/`, {}),
  admissions: (id: number) => api.get<Paginated<Admission>>(`/patients/${id}/admissions/`),
  events: (id: number, params?: { event_type?: string }) => {
    const q = new URLSearchParams();
    if (params?.event_type) q.set('event_type', params.event_type);
    const qs = q.toString();
    return api.get<Paginated<ClinicalEvent>>(`/patients/${id}/events/${qs ? '?' + qs : ''}`);
  },
};
