import { api } from './client';
import type { Hospital } from '../types';

export const hospitalApi = {
  get: () => api.get<Hospital>('/hospital/'),
};
