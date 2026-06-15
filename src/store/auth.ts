import { authApi } from '../api/auth';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

function loadState(): AuthState {
  return {
    user: null,
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
  };
}

// Minimal reactive auth store (no external lib dependency at scaffold stage)
type Listener = () => void;
const listeners = new Set<Listener>();

export const authStore = {
  state: loadState(),

  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  _notify() {
    listeners.forEach((fn) => fn());
  },

  async login(username: string, password: string) {
    const tokens = await authApi.login(username, password);
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    authStore.state.accessToken = tokens.access;
    authStore.state.refreshToken = tokens.refresh;
    authStore.state.user = await authApi.me();
    authStore._notify();
  },

  async logout() {
    const refresh = authStore.state.refreshToken;
    if (refresh) {
      await authApi.logout(refresh).catch(() => null);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    authStore.state = { user: null, accessToken: null, refreshToken: null };
    authStore._notify();
  },

  async loadUser() {
    if (!authStore.state.accessToken) return;
    try {
      authStore.state.user = await authApi.me();
      authStore._notify();
    } catch {
      authStore.logout();
    }
  },
};
