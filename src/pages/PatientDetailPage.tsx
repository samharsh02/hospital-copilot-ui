import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientsApi } from '../api/patients';
import { wardsApi } from '../api/wards';
import { workflowsApi } from '../api/workflows';
import { intelligenceApi } from '../api/intelligence';
import { useClinical } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Spinner, InlineSpinner } from '../components/Spinner';
import type { Patient, Admission, ClinicalEvent, Ward, Bed, WorkflowInstance, IntelligenceRequest, PromptType } from '../types';

function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

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

function eventTypeColor(type: string): 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray' {
  const map: Record<string, 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray'> = {
    VITALS: 'blue', MEDICATION: 'green', NURSE_NOTE: 'amber',
    DOCTOR_NOTE: 'purple', LAB_RESULT: 'amber', ALERT: 'red', OTHER: 'gray',
  };
  return map[type] ?? 'gray';
}

function statusColor(status: string): 'gray' | 'blue' | 'green' | 'red' {
  if (status === 'PENDING') return 'gray';
  if (status === 'IN_PROGRESS') return 'blue';
  if (status === 'COMPLETED') return 'green';
  if (status === 'CANCELLED') return 'red';
  return 'gray';
}

const PROMPT_LABELS: Record<PromptType, string> = {
  PATIENT_SUMMARY: 'Patient Summary',
  DISCHARGE_READINESS: 'Discharge Readiness',
  RISK_FLAG: 'Risk Flag',
  CLINICAL_SUMMARY: 'Clinical Summary',
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clinicalEnabled = useClinical();
  const { user } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [events, setEvents] = useState<ClinicalEvent[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [intelligence, setIntelligence] = useState<IntelligenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'timeline' | 'workflows' | 'intelligence'>('timeline');

  // Admit modal
  const [showAdmit, setShowAdmit] = useState(false);
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [selectedWard, setSelectedWard] = useState<number | ''>('');
  const [selectedBed, setSelectedBed] = useState<number | ''>('');
  const [admitNotes, setAdmitNotes] = useState('');
  const [admitting, setAdmitting] = useState(false);
  const [admitError, setAdmitError] = useState('');

  // Intelligence
  const [promptType, setPromptType] = useState<PromptType>('PATIENT_SUMMARY');
  const [querying, setQuerying] = useState(false);
  const [queryError, setQueryError] = useState('');
  const [expandedIntel, setExpandedIntel] = useState<Set<number>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const patientId = Number(id);
  const isNurseOrAbove = ['NURSE', 'DOCTOR', 'ADMIN', 'SUPERADMIN'].includes(user?.role ?? '');
  

  const activeAdmission = admissions.find((a) => a.is_active) ?? null;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      patientsApi.get(patientId),
      patientsApi.admissions(patientId),
      patientsApi.events(patientId),
    ]).then(([p, admRes, evRes]) => {
      setPatient(p);
      setAdmissions(admRes.results);
      setEvents(evRes.results);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => {
    if (tab === 'workflows' && activeAdmission) {
      workflowsApi.instances.list().then((r) => {
        setWorkflows(r.results.filter((w) => w.admission === activeAdmission.id));
      }).catch(() => {});
    }
    if (tab === 'intelligence') {
      loadIntelligence();
    }
  }, [tab, activeAdmission]);

  function loadIntelligence() {
    intelligenceApi.patientHistory(patientId).then((r) => setIntelligence(r.results)).catch(() => {});
  }

  // Poll pending intelligence
  useEffect(() => {
    const hasPending = intelligence.some((r) => r.status === 'PENDING');
    if (hasPending && !pollRef.current) {
      pollRef.current = setInterval(() => {
        loadIntelligence();
      }, 5000);
    } else if (!hasPending && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [intelligence]);

  useEffect(() => {
    if (showAdmit) {
      wardsApi.list().then((r) => setWards(r.results)).catch(() => {});
    }
  }, [showAdmit]);

  useEffect(() => {
    if (selectedWard) {
      wardsApi.beds(Number(selectedWard)).then((r) => setBeds(r.results.filter((b) => !b.is_occupied))).catch(() => {});
    } else {
      setBeds([]);
      setSelectedBed('');
    }
  }, [selectedWard]);

  async function handleAdmit(e: React.FormEvent) {
    e.preventDefault();
    setAdmitError('');
    setAdmitting(true);
    try {
      const data: { bed?: number; notes?: string } = {};
      if (selectedBed) data.bed = Number(selectedBed);
      if (admitNotes) data.notes = admitNotes;
      await patientsApi.admit(patientId, data);
      setShowAdmit(false);
      const admRes = await patientsApi.admissions(patientId);
      setAdmissions(admRes.results);
      const p = await patientsApi.get(patientId);
      setPatient(p);
    } catch (err: unknown) {
      setAdmitError((err as { data?: { detail?: string } })?.data?.detail ?? 'Admission failed.');
    } finally {
      setAdmitting(false);
    }
  }

  async function handleDischarge() {
    if (!confirm('Discharge this patient?')) return;
    try {
      await patientsApi.discharge(patientId);
      const [admRes, p] = await Promise.all([patientsApi.admissions(patientId), patientsApi.get(patientId)]);
      setAdmissions(admRes.results);
      setPatient(p);
    } catch (err: unknown) {
      alert((err as { data?: { detail?: string } })?.data?.detail ?? 'Discharge failed.');
    }
  }

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault();
    if (!activeAdmission) return;
    setQueryError('');
    setQuerying(true);
    try {
      await intelligenceApi.query({ patient: patientId, admission: activeAdmission.id, prompt_type: promptType });
      loadIntelligence();
    } catch (err: unknown) {
      setQueryError((err as { data?: { detail?: string } })?.data?.detail ?? 'Query failed.');
    } finally {
      setQuerying(false);
    }
  }

  if (loading) return <Spinner />;
  if (!patient) return <EmptyState title="Patient not found" description="This patient record does not exist." />;

  return (
    <div style={{ padding: 24 }}>
      {/* Back */}
      <button
        className="btn-secondary"
        style={{ marginBottom: 16, padding: '6px 12px', fontSize: 12 }}
        onClick={() => navigate('/patients')}
      >
        ← Patients
      </button>

      {/* Demographics card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 52, height: 52, background: 'var(--blue-bg)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--blue-text)', fontSize: 18, fontWeight: 700, flexShrink: 0,
            }}>
              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>
                {patient.first_name} {patient.last_name}
              </h1>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--t3)' }}>MRN: <b style={{ color: 'var(--t2)' }}>{patient.mrn}</b></span>
                <span style={{ fontSize: 12, color: 'var(--t3)' }}>Age: <b style={{ color: 'var(--t2)' }}>{ageFromDob(patient.date_of_birth)}</b></span>
                <span style={{ fontSize: 12, color: 'var(--t3)' }}>Gender: <b style={{ color: 'var(--t2)' }}>{patient.gender}</b></span>
                <Badge color="blue">{patient.blood_group}</Badge>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {activeAdmission ? (
              <>
                <div style={{ textAlign: 'right' }}>
                  <Badge color="green">Admitted</Badge>
                  {activeAdmission.ward_name && (
                    <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
                      Ward: {activeAdmission.ward_name}
                      {activeAdmission.bed_number && ` · Bed ${activeAdmission.bed_number}`}
                    </div>
                  )}
                  {!activeAdmission.ward_name && (
                    <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
                      Admitted without bed assignment
                    </div>
                  )}
                </div>
                {isNurseOrAbove && (
                  <button className="btn-danger" style={{ padding: '6px 14px', fontSize: 12 }} onClick={handleDischarge}>
                    Discharge
                  </button>
                )}
              </>
            ) : (
              <>
                <Badge color="gray">Not Admitted</Badge>
                {isNurseOrAbove && (
                  <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setShowAdmit(true)}>
                    Admit Patient
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab${tab === 'timeline' ? ' active' : ''}`} onClick={() => setTab('timeline')}>Timeline</button>
        <button className={`tab${tab === 'workflows' ? ' active' : ''}`} onClick={() => setTab('workflows')} style={{ opacity: clinicalEnabled ? 1 : 0.5 }} disabled={!clinicalEnabled}>
          Workflows {!clinicalEnabled && '🔒'}
        </button>
        <button className={`tab${tab === 'intelligence' ? ' active' : ''}`} onClick={() => setTab('intelligence')} style={{ opacity: clinicalEnabled ? 1 : 0.5 }} disabled={!clinicalEnabled}>
          AI Intelligence {!clinicalEnabled && '🔒'}
        </button>
      </div>

      {/* Timeline */}
      {tab === 'timeline' && (
        <div>
          {events.length === 0 ? (
            <EmptyState icon="📋" title="No clinical events" description="No events have been recorded for this patient." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {admissions.map((adm) => (
                <div key={`adm-${adm.id}`} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: adm.is_active ? 'var(--green)' : 'var(--t4)', flexShrink: 0 }} />
                    <div style={{ flex: 1, width: 2, background: 'var(--border)', marginTop: 4 }} />
                  </div>
                  <div className="card" style={{ flex: 1, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Badge color={adm.is_active ? 'green' : 'gray'}>{adm.is_active ? 'Admission' : 'Discharged'}</Badge>
                      <span style={{ fontSize: 12, color: 'var(--t3)' }}>{relativeTime(adm.admitted_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--t2)' }}>
                      Admitted {adm.admitted_at ? new Date(adm.admitted_at).toLocaleDateString() : ''}
                      {adm.discharged_at ? ` · Discharged ${new Date(adm.discharged_at).toLocaleDateString()}` : ''}
                    </div>
                    {adm.notes && <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{adm.notes}</div>}
                  </div>
                </div>
              ))}
              {events.map((ev) => (
                <div key={`ev-${ev.id}`} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
                    <div style={{ flex: 1, width: 2, background: 'var(--border)', marginTop: 4 }} />
                  </div>
                  <div className="card" style={{ flex: 1, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Badge color={eventTypeColor(ev.event_type)}>{ev.event_type.replace('_', ' ')}</Badge>
                      <span style={{ fontSize: 12, color: 'var(--t3)' }}>{relativeTime(ev.recorded_at)}</span>
                    </div>
                    {ev.notes && <div style={{ fontSize: 13, color: 'var(--t2)' }}>{ev.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workflows */}
      {tab === 'workflows' && (
        <div>
          {!activeAdmission ? (
            <EmptyState icon="⚙️" title="No active admission" description="Patient must be admitted to view workflows." />
          ) : workflows.length === 0 ? (
            <EmptyState icon="⚙️" title="No workflows" description="No workflows have been started for this admission." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {workflows.map((wf) => {
                const completed = wf.steps.filter((s) => s.is_completed).length;
                const total = wf.steps.length;
                return (
                  <div key={wf.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/workflows/${wf.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>
                          {wf.template_name ?? `Workflow #${wf.id}`}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                          {completed}/{total} steps completed
                        </div>
                      </div>
                      <Badge color={statusColor(wf.status)}>{wf.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Intelligence */}
      {tab === 'intelligence' && (
        <div>
          {!activeAdmission ? (
            <EmptyState icon="🤖" title="No active admission" description="Patient must be admitted to request AI insights." />
          ) : (
            <>
              {/* Query form */}
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 12 }}>Request AI Analysis</h3>
                {queryError && <div className="error-msg">{queryError}</div>}
                <form onSubmit={handleQuery} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label">Analysis Type</label>
                    <select className="form-input" value={promptType} onChange={(e) => setPromptType(e.target.value as PromptType)}>
                      <option value="PATIENT_SUMMARY">Patient Summary</option>
                      <option value="DISCHARGE_READINESS">Discharge Readiness</option>
                      {clinicalEnabled && <option value="RISK_FLAG">Risk Flag</option>}
                      {clinicalEnabled && <option value="CLINICAL_SUMMARY">Clinical Summary</option>}
                    </select>
                  </div>
                  <button type="submit" className="btn-primary" disabled={querying} style={{ marginBottom: 14 }}>
                    {querying ? <><InlineSpinner /> Submitting…</> : 'Request Analysis'}
                  </button>
                </form>
              </div>

              {/* History */}
              {intelligence.length === 0 ? (
                <EmptyState icon="🤖" title="No analyses yet" description="Request an AI analysis above to see results here." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {intelligence.map((req) => (
                    <div key={req.id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Badge color="blue">{PROMPT_LABELS[req.prompt_type]}</Badge>
                          <Badge color={req.status === 'COMPLETED' ? 'green' : req.status === 'FAILED' ? 'red' : 'amber'}>
                            {req.status === 'PENDING' ? 'Processing…' : req.status}
                          </Badge>
                          {req.status === 'PENDING' && <InlineSpinner />}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--t3)' }}>{relativeTime(req.created_at)}</span>
                      </div>
                      {req.response_text && (
                        <div>
                          <button
                            onClick={() => setExpandedIntel((prev) => {
                              const next = new Set(prev);
                              if (next.has(req.id)) next.delete(req.id); else next.add(req.id);
                              return next;
                            })}
                            style={{ fontSize: 12, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8 }}
                          >
                            {expandedIntel.has(req.id) ? '▲ Collapse' : '▼ View response'}
                          </button>
                          {expandedIntel.has(req.id) && (
                            <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 8, padding: 12, background: 'var(--page)', borderRadius: 6 }}>
                              {req.response_text}
                            </div>
                          )}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--t4)', fontStyle: 'italic', marginTop: 4 }}>
                        {req.disclaimer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Admit Modal */}
      {showAdmit && (
        <div className="modal-overlay" onClick={() => setShowAdmit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Admit Patient</span>
              <button className="modal-close" onClick={() => setShowAdmit(false)}>×</button>
            </div>
            <form onSubmit={handleAdmit}>
              <div className="modal-body">
                {admitError && <div className="error-msg">{admitError}</div>}
                <div className="form-group">
                  <label className="form-label">Ward (optional)</label>
                  <select className="form-input" value={selectedWard}
                    onChange={(e) => { setSelectedWard(e.target.value ? Number(e.target.value) : ''); setSelectedBed(''); }}>
                    <option value="">No ward (small hospital)</option>
                    {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                {selectedWard !== '' && (
                  <div className="form-group">
                    <label className="form-label">Bed (optional)</label>
                    <select className="form-input" value={selectedBed} onChange={(e) => setSelectedBed(e.target.value ? Number(e.target.value) : '')}>
                      <option value="">No specific bed</option>
                      {beds.map((b) => <option key={b.id} value={b.id}>Bed {b.number}</option>)}
                    </select>
                    {beds.length === 0 && selectedWard && (
                      <span style={{ fontSize: 12, color: 'var(--amber)', marginTop: 4 }}>No available beds in this ward</span>
                    )}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows={3} value={admitNotes}
                    onChange={(e) => setAdmitNotes(e.target.value)}
                    placeholder="Optional admission notes" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAdmit(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={admitting}>
                  {admitting ? 'Admitting…' : 'Admit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
