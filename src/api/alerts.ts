import { api } from './client';
import type { EscalationAlert, Paginated } from '../types';

export const alertsApi = {
  list: (params?: { status?: string; patient?: number; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.patient) q.set('patient', String(params.patient));
    if (params?.page && params.page > 1) q.set('page', String(params.page));
    const qs = q.toString();
    return api.get<Paginated<EscalationAlert>>(`/escalation-alerts/${qs ? '?' + qs : ''}`);
  },
  acknowledge: (id: number) =>
    api.post<EscalationAlert>(`/escalation-alerts/${id}/acknowledge/`, {}),
  resolve: (id: number) =>
    api.post<EscalationAlert>(`/escalation-alerts/${id}/resolve/`, {}),
};
