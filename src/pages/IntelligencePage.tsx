import { useState, useEffect, useRef } from 'react';
import { patientsApi } from '../api/patients';
import { intelligenceApi } from '../api/intelligence';
import { useClinical } from '../components/Layout';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Spinner, InlineSpinner } from '../components/Spinner';
import type { Patient, Admission, IntelligenceRequest, PromptType } from '../types';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PROMPT_LABELS: Record<PromptType, string> = {
  PATIENT_SUMMARY: 'Patient Summary',
  DISCHARGE_READINESS: 'Discharge Readiness',
  RISK_FLAG: 'Risk Flag',
  CLINICAL_SUMMARY: 'Clinical Summary',
};

export default function IntelligencePage() {
  const clinicalEnabled = useClinical();

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeAdmission, setActiveAdmission] = useState<Admission | null>(null);
  const [history, setHistory] = useState<IntelligenceRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [promptType, setPromptType] = useState<PromptType>('PATIENT_SUMMARY');
  const [querying, setQuerying] = useState(false);
  const [queryError, setQueryError] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearching(true);
      patientsApi.list({ search }).then((r) => setSearchResults(r.results)).catch(() => {}).finally(() => setSearching(false));
    }, 350);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]);

  async function selectPatient(p: Patient) {
    setSelectedPatient(p);
    setSearchResults([]);
    setSearch('');
    setHistoryLoading(true);
    try {
      const [admRes, histRes] = await Promise.all([
        patientsApi.admissions(p.id),
        intelligenceApi.patientHistory(p.id),
      ]);
      setActiveAdmission(admRes.results.find((a) => a.is_active) ?? null);
      setHistory(histRes.results);
    } catch { /**/ }
    setHistoryLoading(false);
  }

  function loadHistory() {
    if (!selectedPatient) return;
    intelligenceApi.patientHistory(selectedPatient.id).then((r) => setHistory(r.results)).catch(() => {});
  }

  useEffect(() => {
    const hasPending = history.some((r) => r.status === 'PENDING');
    if (hasPending && !pollRef.current) {
      pollRef.current = setInterval(loadHistory, 5000);
    } else if (!hasPending && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [history]);

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient || !activeAdmission) return;
    setQueryError('');
    setQuerying(true);
    try {
      await intelligenceApi.query({ patient: selectedPatient.id, admission: activeAdmission.id, prompt_type: promptType });
      loadHistory();
    } catch (err: unknown) {
      setQueryError((err as { data?: { detail?: string } })?.data?.detail ?? 'Query failed.');
    } finally {
      setQuerying(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Intelligence</h1>
          <p className="page-subtitle">Claude-powered clinical decision support</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="banner-amber" style={{ marginBottom: 20 }}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>AI responses are decision support only. Always exercise independent clinical judgment. Never rely solely on AI output for clinical decisions.</span>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left: patient search */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              placeholder="Search patients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 6 }}
            />
            {searching && (
              <div style={{ position: 'absolute', right: 10, top: 10 }}><InlineSpinner /></div>
            )}
          </div>
          {searchResults.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 6, background: 'var(--card)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: 8 }}>
              {searchResults.map((p) => (
                <div key={p.id} onClick={() => selectPatient(p)}
                  style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#FAFAFA')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = '')}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>{p.first_name} {p.last_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>MRN: {p.mrn}</div>
                </div>
              ))}
            </div>
          )}
          {selectedPatient && (
            <div className="card" style={{ borderLeft: '4px solid var(--blue)' }}>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 2 }}>Selected Patient</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{selectedPatient.first_name} {selectedPatient.last_name}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>MRN: {selectedPatient.mrn}</div>
              {activeAdmission ? (
                <div style={{ marginTop: 6 }}><Badge color="green">Admitted</Badge></div>
              ) : (
                <div style={{ marginTop: 6 }}><Badge color="gray">Not Admitted</Badge></div>
              )}
              <button className="btn-secondary" style={{ marginTop: 10, padding: '4px 10px', fontSize: 11 }}
                onClick={() => { setSelectedPatient(null); setActiveAdmission(null); setHistory([]); }}>
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Right: query + history */}
        <div style={{ flex: 1 }}>
          {!selectedPatient ? (
            <div className="card" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState icon="🤖" title="Search for a patient" description="Search for a patient on the left to get AI-powered insights." />
            </div>
          ) : historyLoading ? (
            <Spinner />
          ) : (
            <>
              {/* Query form */}
              {activeAdmission ? (
                <div className="card" style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 12 }}>Request Analysis</h3>
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
              ) : (
                <div className="banner-amber" style={{ marginBottom: 16 }}>
                  Patient must be admitted to request AI analysis.
                </div>
              )}

              {/* History */}
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 12 }}>Analysis History</h3>
              {history.length === 0 ? (
                <EmptyState icon="📄" title="No analyses yet" description="Submit an analysis request above." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {history.map((req) => (
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
                            onClick={() => setExpanded((prev) => {
                              const next = new Set(prev);
                              if (next.has(req.id)) next.delete(req.id); else next.add(req.id);
                              return next;
                            })}
                            style={{ fontSize: 12, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8 }}
                          >
                            {expanded.has(req.id) ? '▲ Collapse' : '▼ View response'}
                          </button>
                          {expanded.has(req.id) && (
                            <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 8, padding: 12, background: 'var(--page)', borderRadius: 6 }}>
                              {req.response_text}
                            </div>
                          )}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--t4)', fontStyle: 'italic' }}>{req.disclaimer}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
