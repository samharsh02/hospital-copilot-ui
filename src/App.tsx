import { useEffect, useState } from 'react';
import { authStore } from './store/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('access_token'),
  );

  useEffect(() => {
    if (isAuthenticated) {
      authStore.loadUser();
    }
    return authStore.subscribe(() => {
      setIsAuthenticated(!!authStore.state.accessToken);
    });
  }, []);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return <DashboardPage />;
}
