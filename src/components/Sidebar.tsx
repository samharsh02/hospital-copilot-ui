import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Props {
  clinicalEnabled: boolean;
  hospitalName: string;
  alertCount?: number;
  unreadCount?: number;
  onLogout: () => void;
}

function IconGrid() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconBed() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/>
      <path d="M2 14h20"/>
      <path d="M2 20h20"/>
      <path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/>
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function IconBellOutline() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function IconWorkflow() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="5" cy="6" r="3"/><circle cx="19" cy="6" r="3"/><circle cx="12" cy="18" r="3"/>
      <path d="M8 6h8M12 15V9"/>
    </svg>
  );
}

function IconBrain() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 2a4 4 0 0 1 4 4c0 .5-.1 1-.2 1.4A4 4 0 0 1 20 11a4 4 0 0 1-3 3.87V18a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-3.13A4 4 0 0 1 4 11a4 4 0 0 1 4.2-3.6A4 4 0 0 1 12 2z"/>
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  clinical?: boolean;
}

export function Sidebar({ clinicalEnabled, hospitalName, alertCount = 0, unreadCount = 0, onLogout }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: <IconGrid /> },
    { path: '/patients', label: 'Patients', icon: <IconUsers /> },
    { path: '/beds', label: 'Beds & Wards', icon: <IconBed /> },
    { path: '/alerts', label: 'Alerts', icon: <IconBell />, badge: alertCount > 0 ? alertCount : undefined },
    { path: '/workflows', label: 'Workflows', icon: <IconWorkflow />, clinical: true },
    { path: '/intelligence', label: 'AI Intelligence', icon: <IconBrain />, clinical: true },
    { path: '/notifications', label: 'Notifications', icon: <IconBellOutline />, badge: unreadCount > 0 ? unreadCount : undefined },
  ];

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  }

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
    : '';
  const initial = displayName.charAt(0).toUpperCase() || '?';

  return (
    <div style={{
      width: 240, minHeight: '100vh', background: 'var(--sb)',
      position: 'fixed', left: 0, top: 0, bottom: 0,
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--sb-border)',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--sb-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: 'var(--blue)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sb-active-text)', letterSpacing: 0.2 }}>
              Hospital Copilot
            </div>
          </div>
        </div>
        {hospitalName && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--sb-text)', paddingLeft: 36, lineHeight: 1.4 }}>
            {hospitalName}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const locked = item.clinical && !clinicalEnabled;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => !locked && navigate(item.path)}
              title={locked ? 'Clinical module not enabled' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '8px 10px', borderRadius: 6,
                background: active ? 'var(--sb-active-bg)' : 'transparent',
                color: locked ? 'var(--sb-text)' : (active ? 'var(--sb-active-text)' : 'var(--sb-text)'),
                border: 'none', cursor: locked ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: active ? 500 : 400,
                textAlign: 'left', marginBottom: 2,
                opacity: locked ? 0.45 : 1,
                transition: 'background 0.12s, color 0.12s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (!locked && !active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--sb-hover)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#C9D1D9';
                }
              }}
              onMouseLeave={(e) => {
                if (!locked && !active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--sb-text)';
                }
              }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {locked && <IconLock />}
              {item.badge != null && !locked && (
                <span style={{
                  background: 'var(--red)', color: '#fff',
                  fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
                  borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ borderTop: '1px solid var(--sb-border)', margin: '8px 0' }} />

        <button
          onClick={() => navigate('/settings')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '8px 10px', borderRadius: 6,
            background: 'transparent', color: 'var(--sb-text)',
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 400,
            textAlign: 'left', fontFamily: 'inherit',
          }}
        >
          <IconGear />
          <span>Settings</span>
        </button>
      </nav>

      {/* User footer */}
      <div style={{
        padding: '12px 12px', borderTop: '1px solid var(--sb-border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, background: 'var(--blue)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#C9D1D9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--sb-text)', textTransform: 'capitalize' }}>
            {user?.role?.toLowerCase().replace('_', ' ') ?? ''}
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Sign out"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--sb-text)', padding: 4, borderRadius: 4, flexShrink: 0,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--red)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--sb-text)')}
        >
          <IconLogout />
        </button>
      </div>
    </div>
  );
}
