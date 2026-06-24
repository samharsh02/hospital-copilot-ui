import { api } from './client';
import type { WorkflowTemplate, WorkflowInstance, Paginated } from '../types';

export const workflowsApi = {
  templates: {
    list: () => api.get<Paginated<WorkflowTemplate>>('/workflow-templates/'),
    get: (id: number) => api.get<WorkflowTemplate>(`/workflow-templates/${id}/`),
    create: (data: Partial<WorkflowTemplate>) =>
      api.post<WorkflowTemplate>('/workflow-templates/', data),
    update: (id: number, data: Partial<WorkflowTemplate>) =>
      api.patch<WorkflowTemplate>(`/workflow-templates/${id}/`, data),
    delete: (id: number) => api.delete<void>(`/workflow-templates/${id}/`),
  },
  instances: {
    list: (params?: { status?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.page && params.page > 1) q.set('page', String(params.page));
      const qs = q.toString();
      return api.get<Paginated<WorkflowInstance>>(`/workflow-instances/${qs ? '?' + qs : ''}`);
    },
    get: (id: number) => api.get<WorkflowInstance>(`/workflow-instances/${id}/`),
    start: (data: { template: number; admission: number }) =>
      api.post<WorkflowInstance>('/workflow-instances/', data),
    completeStep: (id: number, stepIndex: number, notes?: string) =>
      api.post<WorkflowInstance>(`/workflow-instances/${id}/steps/${stepIndex}/complete/`, {
        notes: notes ?? '',
      }),
    cancel: (id: number) =>
      api.post<WorkflowInstance>(`/workflow-instances/${id}/cancel/`, {}),
  },
};
