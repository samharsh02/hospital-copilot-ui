import { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useHospital } from '../hooks/useHospital';
import { useAuth } from '../hooks/useAuth';
import { alertsApi } from '../api/alerts';
import { notificationsApi } from '../api/notifications';
import { authStore } from '../store/auth';
import { hospitalStore } from '../store/hospital';

export const ClinicalContext = createContext(false);
export function useClinical() { return useContext(ClinicalContext); }

export default function Layout() {
  const { hospital } = useHospital();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    alertsApi.list({ status: 'OPEN' }).then((r) => setAlertCount(r.count)).catch(() => {});
    notificationsApi.list({ unread: true }).then((r) => setUnreadCount(r.count)).catch(() => {});
  }, []);

  async function handleLogout() {
    await authStore.logout();
    hospitalStore.clear();
    navigate('/login');
  }

  return (
    <ClinicalContext.Provider value={hospital?.clinical_module_enabled ?? false}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          clinicalEnabled={hospital?.clinical_module_enabled ?? false}
          hospitalName={hospital?.name ?? user?.hospital?.name ?? ''}
          alertCount={alertCount}
          unreadCount={unreadCount}
          onLogout={handleLogout}
        />
        <div style={{
          flex: 1, marginLeft: 240,
          background: 'var(--page)', minHeight: '100vh',
        }}>
          <Outlet />
        </div>
      </div>
    </ClinicalContext.Provider>
  );
}
