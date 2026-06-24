import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import type { Notification, NotificationKind } from '../types';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  return `${d}d ago`;
}

function kindColor(kind: NotificationKind): 'red' | 'blue' | 'purple' | 'gray' {
  if (kind === 'ESCALATION') return 'red';
  if (kind === 'INTELLIGENCE_COMPLETE') return 'blue';
  if (kind === 'WORKFLOW_UPDATE') return 'purple';
  return 'gray';
}

const KIND_LABELS: Record<NotificationKind, string> = {
  ESCALATION: 'Escalation',
  INTELLIGENCE_COMPLETE: 'AI Complete',
  WORKFLOW_UPDATE: 'Workflow',
  GENERAL: 'General',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  function load() {
    setLoading(true);
    notificationsApi.list({ unread: filter === 'unread' }).then((r) => setNotifications(r.results)).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]);

  async function handleMarkRead(n: Notification) {
    if (n.is_read) {
      navigateToTarget(n);
      return;
    }
    try {
      await notificationsApi.markRead(n.id);
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x));
      navigateToTarget(n);
    } catch { /**/ }
  }

  function navigateToTarget(n: Notification) {
    if (n.payload.patient_id) navigate(`/patients/${n.payload.patient_id}`);
    else if (n.payload.instance_id) navigate(`/workflows/${n.payload.instance_id}`);
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      load();
    } catch { /**/ } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary" onClick={handleMarkAllRead} disabled={markingAll}>
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      <div className="filter-pills" style={{ marginBottom: 16 }}>
        <button className={`filter-pill${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>All</button>
        <button className={`filter-pill${filter === 'unread' ? ' active' : ''}`} onClick={() => setFilter('unread')}>Unread</button>
      </div>

      {loading ? (
        <Spinner />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="✅"
          title="You're all caught up"
          description={filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {notifications.map((n, i) => (
            <div
              key={n.id}
              onClick={() => handleMarkRead(n)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '14px 16px',
                background: n.is_read ? 'var(--card)' : 'var(--blue-bg)',
                borderLeft: n.is_read ? 'none' : '4px solid var(--blue)',
                borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: (n.payload.patient_id || n.payload.instance_id) ? 'pointer' : 'default',
              }}
              onMouseEnter={(e) => { if (!n.is_read || n.payload.patient_id || n.payload.instance_id) (e.currentTarget as HTMLDivElement).style.filter = 'brightness(0.97)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.filter = ''; }}
            >
              <div style={{ paddingTop: 2 }}>
                <Badge color={kindColor(n.kind)}>{KIND_LABELS[n.kind]}</Badge>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--t1)', marginBottom: 3, fontWeight: n.is_read ? 400 : 500 }}>
                  {typeof n.payload.message === 'string'
                    ? n.payload.message
                    : KIND_LABELS[n.kind]}
                </div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>{relativeTime(n.created_at)}</div>
              </div>
              {!n.is_read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0, marginTop: 5 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
