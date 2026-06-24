import { api } from './client';
import type { Notification, Paginated } from '../types';

export const notificationsApi = {
  list: (params?: { unread?: boolean; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.unread) q.set('unread', 'true');
    if (params?.page && params.page > 1) q.set('page', String(params.page));
    const qs = q.toString();
    return api.get<Paginated<Notification>>(`/notifications/${qs ? '?' + qs : ''}`);
  },
  markRead: (id: number) => api.post<Notification>(`/notifications/${id}/read/`, {}),
  markAllRead: () => api.post<void>('/notifications/read-all/', {}),
};
