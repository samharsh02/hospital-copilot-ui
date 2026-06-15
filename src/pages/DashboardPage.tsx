import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 32 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>Hospital Copilot</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#555' }}>
            {user?.first_name || user?.username} — {user?.role}
          </span>
          <button
            onClick={() => logout()}
            style={{ padding: '6px 14px', fontSize: 13, borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </header>

      <p style={{ color: '#888' }}>
        Welcome. Patient management and clinical workflows coming soon.
      </p>
    </div>
  );
}
