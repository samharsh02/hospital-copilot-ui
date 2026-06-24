import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertsApi } from '../api/alerts';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import type { EscalationAlert, AlertStatus } from '../types';

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

function priorityColor(priority?: string): 'red' | 'amber' | 'blue' | 'gray' {
  if (priority === 'CRITICAL') return 'red';
  if (priority === 'HIGH') return 'amber';
  if (priority === 'MEDIUM') return 'blue';
  return 'gray';
}

function statusColor(status: AlertStatus): 'red' | 'amber' | 'green' {
  if (status === 'OPEN') return 'red';
  if (status === 'ACKNOWLEDGED') return 'amber';
  return 'green';
}

const FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
  { label: 'Resolved', value: 'RESOLVED' },
];

export default function AlertsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [alerts, setAlerts] = useState<EscalationAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const isNurse = ['NURSE', 'DOCTOR', 'ADMIN', 'SUPERADMIN'].includes(user?.role ?? '');
  const isDoctor = ['DOCTOR', 'ADMIN', 'SUPERADMIN'].includes(user?.role ?? '');

  function loadAlerts() {
    setLoading(true);
    alertsApi.list({ status: statusFilter || undefined, page }).then((r) => {
      setAlerts(r.results);
      setTotal(r.count);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [statusFilter, page]);

  async function handleAcknowledge(id: number) {
    setActionLoading(id);
    try {
      await alertsApi.acknowledge(id);
      loadAlerts();
    } catch (err: unknown) {
      alert((err as { data?: { detail?: string } })?.data?.detail ?? 'Failed.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResolve(id: number) {
    setActionLoading(id);
    try {
      await alertsApi.resolve(id);
      loadAlerts();
    } catch (err: unknown) {
      alert((err as { data?: { detail?: string } })?.data?.detail ?? 'Failed.');
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">{total} alert{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="filter-pills" style={{ marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`filter-pill${statusFilter === f.value ? ' active' : ''}`}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : alerts.length === 0 ? (
        <EmptyState icon="🔔" title="No alerts" description={`No ${statusFilter.toLowerCase() || ''} alerts found.`} />
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Patient</th>
                  <th>Triggered</th>
                  <th>Acknowledged</th>
                  <th>Resolved</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <Badge color={priorityColor(alert.priority)}>
                        {alert.priority ?? 'ALERT'}
                      </Badge>
                    </td>
                    <td>
                      <Badge color={statusColor(alert.status)}>{alert.status}</Badge>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/patients/${alert.patient}`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: 13, padding: 0 }}
                      >
                        Patient #{alert.patient}
                      </button>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--t3)' }}>{relativeTime(alert.triggered_at)}</td>
                    <td style={{ fontSize: 12, color: 'var(--t3)' }}>
                      {alert.acknowledged_at ? relativeTime(alert.acknowledged_at) : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--t3)' }}>
                      {alert.resolved_at ? relativeTime(alert.resolved_at) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {alert.status === 'OPEN' && isNurse && (
                          <button
                            className="btn-secondary"
                            style={{ padding: '3px 10px', fontSize: 11 }}
                            disabled={actionLoading === alert.id}
                            onClick={() => handleAcknowledge(alert.id)}
                          >
                            {actionLoading === alert.id ? '…' : 'Acknowledge'}
                          </button>
                        )}
                        {(alert.status === 'OPEN' || alert.status === 'ACKNOWLEDGED') && isDoctor && (
                          <button
                            className="btn-primary"
                            style={{ padding: '3px 10px', fontSize: 11 }}
                            disabled={actionLoading === alert.id}
                            onClick={() => handleResolve(alert.id)}
                          >
                            {actionLoading === alert.id ? '…' : 'Resolve'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
              <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
