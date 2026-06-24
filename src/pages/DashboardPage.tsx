import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertsApi } from '../api/alerts';
import { patientsApi } from '../api/patients';
import { wardsApi } from '../api/wards';
import { workflowsApi } from '../api/workflows';
import { useClinical } from '../components/Layout';
import { Badge } from '../components/Badge';
import { Spinner } from '../components/Spinner';
import type { EscalationAlert, Patient, Ward } from '../types';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function priorityColor(priority?: string): 'red' | 'amber' | 'blue' | 'gray' {
  if (priority === 'CRITICAL') return 'red';
  if (priority === 'HIGH') return 'amber';
  if (priority === 'MEDIUM') return 'blue';
  return 'gray';
}

export default function DashboardPage() {
  const clinicalEnabled = useClinical();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<EscalationAlert[]>([]);
  const [alertTotal, setAlertTotal] = useState(0);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientTotal, setPatientTotal] = useState(0);
  const [wards, setWards] = useState<Ward[]>([]);
  const [workflowCount, setWorkflowCount] = useState(0);
  const [bedsOccupied, setBedsOccupied] = useState(0);
  const [bedsTotal, setBedsTotal] = useState(0);

  useEffect(() => {
    Promise.all([
      alertsApi.list({ status: 'OPEN' }),
      patientsApi.list({ status: 'active' }),
      wardsApi.list(),
      clinicalEnabled ? workflowsApi.instances.list({ status: 'IN_PROGRESS' }) : Promise.resolve(null),
    ]).then(([alertsRes, patientsRes, wardsRes, workflowsRes]) => {
      setAlerts(alertsRes.results.slice(0, 5));
      setAlertTotal(alertsRes.count);
      setPatients(patientsRes.results.slice(0, 5));
      setPatientTotal(patientsRes.count);
      setWards(wardsRes.results);
      if (workflowsRes) setWorkflowCount(workflowsRes.count);
      const wardResults = wardsRes.results;
      if (wardResults.length > 0) {
        Promise.all(wardResults.map((w) => wardsApi.beds(w.id))).then((bedArrays) => {
          let occ = 0, tot = 0;
          bedArrays.forEach((r) => {
            tot += r.count;
            occ += r.results.filter((b) => b.is_occupied).length;
          });
          setBedsOccupied(occ);
          setBedsTotal(tot);
        }).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [clinicalEnabled]);

  if (loading) return <Spinner />;

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{today}</p>
        </div>
      </div>

      <div className="four-col" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500, marginBottom: 8 }}>Active Patients</div>
          <div className="stat-value">{patientTotal}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500, marginBottom: 8 }}>Open Alerts</div>
          <div className="stat-value" style={{ color: alertTotal > 0 ? 'var(--red)' : 'var(--t1)' }}>{alertTotal}</div>
        </div>
        {clinicalEnabled && (
          <div className="stat-card">
            <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500, marginBottom: 8 }}>Active Workflows</div>
            <div className="stat-value">{workflowCount}</div>
          </div>
        )}
        <div className="stat-card">
          <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500, marginBottom: 8 }}>Beds Occupied</div>
          <div className="stat-value">
            {bedsTotal > 0 ? (
              <>
                <span style={{ color: bedsOccupied / bedsTotal > 0.9 ? 'var(--red)' : 'var(--t1)' }}>{bedsOccupied}</span>
                <span style={{ fontSize: 16, color: 'var(--t3)', fontWeight: 400 }}>/{bedsTotal}</span>
              </>
            ) : <span style={{ fontSize: 16, color: 'var(--t3)' }}>—</span>}
          </div>
          {bedsTotal > 0 && (
            <div className="occ-bar" style={{ marginTop: 12 }}>
              <div className="occ-bar-fill" style={{
                width: `${Math.round((bedsOccupied / bedsTotal) * 100)}%`,
                background: bedsOccupied / bedsTotal > 0.9 ? 'var(--red)'
                  : bedsOccupied / bedsTotal > 0.7 ? 'var(--amber)' : 'var(--green)',
              }} />
            </div>
          )}
        </div>
      </div>

      <div className="two-col">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Recent Alerts</span>
            <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigate('/alerts')}>View all</button>
          </div>
          {alerts.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>No open alerts</div>
          ) : (
            <div>
              {alerts.map((alert) => (
                <div key={alert.id} onClick={() => navigate(`/patients/${alert.patient}`)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#FAFAFA')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = '')}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <Badge color={priorityColor(alert.priority)}>{alert.priority ?? 'ALERT'}</Badge>
                      <span style={{ fontSize: 12, color: 'var(--t3)' }}>Patient #{alert.patient}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t3)' }}>{relativeTime(alert.triggered_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Recent Patients</span>
            <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigate('/patients')}>View all</button>
          </div>
          {patients.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>No active patients</div>
          ) : (
            <div>
              {patients.map((patient) => (
                <div key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#FAFAFA')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = '')}>
                  <div style={{ width: 36, height: 36, background: 'var(--blue-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-text)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                    {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>{patient.first_name} {patient.last_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--t3)' }}>MRN: {patient.mrn}</div>
                  </div>
                  <Badge color="green">Active</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {wards.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginBottom: 14 }}>Ward Overview</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {wards.map((ward) => (
              <div key={ward.id} className="card" style={{ minWidth: 160, cursor: 'pointer' }} onClick={() => navigate('/beds')}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>{ward.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>Capacity: {ward.capacity}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
