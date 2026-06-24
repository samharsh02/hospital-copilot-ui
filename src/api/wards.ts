import { api } from './client';
import type { Ward, Bed, Paginated } from '../types';

export const wardsApi = {
  list: () => api.get<Paginated<Ward>>('/wards/'),
  get: (id: number) => api.get<Ward>(`/wards/${id}/`),
  create: (data: { name: string; capacity: number }) => api.post<Ward>('/wards/', data),
  update: (id: number, data: Partial<Ward>) => api.patch<Ward>(`/wards/${id}/`, data),
  delete: (id: number) => api.delete<void>(`/wards/${id}/`),
  beds: (wardId: number) => api.get<Paginated<Bed>>(`/wards/${wardId}/beds/`),
  addBed: (wardId: number, data: { number: string }) =>
    api.post<Bed>(`/wards/${wardId}/beds/`, data),
  updateBed: (bedId: number, data: { number?: string; is_occupied?: boolean }) =>
    api.patch<Bed>(`/beds/${bedId}/`, data),
  deleteBed: (bedId: number) => api.delete<void>(`/beds/${bedId}/`),
};
