import { useState, useEffect } from 'react';
import { authStore } from '../store/auth';

export function useAuth() {
  const [state, setState] = useState(authStore.state);

  useEffect(() => {
    return authStore.subscribe(() => setState({ ...authStore.state }));
  }, []);

  return {
    user: state.user,
    isAuthenticated: !!state.accessToken,
    accessToken: state.accessToken,
    login: authStore.login,
    logout: authStore.logout,
  };
}
