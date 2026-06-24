import { api } from './client';
import type { IntelligenceRequest, Paginated, PromptType } from '../types';

export const intelligenceApi = {
  query: (data: { patient: number; admission: number; prompt_type: PromptType }) =>
    api.post<IntelligenceRequest>('/intelligence/', data),
  get: (id: number) => api.get<IntelligenceRequest>(`/intelligence/${id}/`),
  patientHistory: (patientId: number) =>
    api.get<Paginated<IntelligenceRequest>>(`/patients/${patientId}/intelligence/`),
};
