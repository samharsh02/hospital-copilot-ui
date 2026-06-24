import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workflowsApi } from '../api/workflows';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import type { WorkflowInstance } from '../types';

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusColor(status: string): 'gray' | 'blue' | 'green' | 'red' {
  if (status === 'PENDING') return 'gray';
  if (status === 'IN_PROGRESS') return 'blue';
  if (status === 'COMPLETED') return 'green';
  return 'red';
}

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [wf, setWf] = useState<WorkflowInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingStep, setCompletingStep] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const isNurse = ['NURSE', 'DOCTOR', 'ADMIN', 'SUPERADMIN'].includes(user?.role ?? '');

  function loadWf() {
    workflowsApi.instances.get(Number(id)).then(setWf).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { loadWf(); }, [id]);

  async function handleCompleteStep(stepIndex: number) {
    setCompletingStep(stepIndex);
    try {
      await workflowsApi.instances.completeStep(Number(id), stepIndex);
      loadWf();
    } catch (err: unknown) {
      alert((err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to complete step.');
    } finally {
      setCompletingStep(null);
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel this workflow?')) return;
    setCancelling(true);
    try {
      await workflowsApi.instances.cancel(Number(id));
      loadWf();
    } catch (err: unknown) {
      alert((err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to cancel.');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <Spinner />;
  if (!wf) return <EmptyState title="Workflow not found" description="This workflow does not exist." />;

  const sortedSteps = [...wf.steps].sort((a, b) => a.step_index - b.step_index);
  const nextStepIndex = sortedSteps.find((s) => !s.is_completed)?.step_index ?? null;
  const canCancel = isNurse && wf.status !== 'COMPLETED' && wf.status !== 'CANCELLED';

  return (
    <div style={{ padding: 24 }}>
      {/* Back */}
      <button className="btn-secondary" style={{ marginBottom: 16, padding: '6px 12px', fontSize: 12 }} onClick={() => navigate('/workflows')}>
        ← Workflows
      </button>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{wf.template_name ?? `Workflow #${wf.id}`}</h1>
          <p className="page-subtitle">Instance #{wf.id} · Admission #{wf.admission}</p>
        </div>
        <Badge color={statusColor(wf.status)}>{wf.status.replace('_', ' ')}</Badge>
      </div>

      {/* Info row */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500, marginBottom: 3 }}>Started</div>
          <div style={{ fontSize: 13, color: 'var(--t2)' }}>{relativeTime(wf.started_at)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500, marginBottom: 3 }}>Completed</div>
          <div style={{ fontSize: 13, color: 'var(--t2)' }}>{relativeTime(wf.completed_at)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500, marginBottom: 3 }}>Progress</div>
          <div style={{ fontSize: 13, color: 'var(--t2)' }}>
            {wf.steps.filter((s) => s.is_completed).length}/{wf.steps.length} steps
          </div>
        </div>
      </div>

      {/* Steps */}
      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginBottom: 14 }}>Steps</h2>
      {sortedSteps.length === 0 ? (
        <EmptyState icon="📋" title="No steps defined" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sortedSteps.map((step) => {
            const isNext = step.step_index === nextStepIndex;
            const canComplete = isNurse && isNext && wf.status !== 'COMPLETED' && wf.status !== 'CANCELLED';
            return (
              <div key={step.id} className="card" style={{
                borderLeft: `4px solid ${step.is_completed ? 'var(--green)' : isNext ? 'var(--blue)' : 'var(--border)'}`,
                opacity: !step.is_completed && !isNext ? 0.6 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: step.is_completed ? 'var(--green)' : isNext ? 'var(--blue-bg)' : 'var(--border)',
                    border: step.is_completed ? 'none' : `2px solid ${isNext ? 'var(--blue)' : 'var(--border2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {step.is_completed ? (
                      <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 600, color: isNext ? 'var(--blue)' : 'var(--t4)' }}>
                        {step.step_index + 1}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 3 }}>{step.title}</div>
                    {step.notes && <div style={{ fontSize: 13, color: 'var(--t3)' }}>{step.notes}</div>}
                    {step.is_completed && step.completed_at && (
                      <div style={{ fontSize: 11, color: 'var(--green-text)', marginTop: 4 }}>
                        Completed {new Date(step.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  {canComplete && (
                    <button
                      className="btn-primary"
                      style={{ padding: '5px 14px', fontSize: 12, flexShrink: 0 }}
                      disabled={completingStep === step.step_index}
                      onClick={() => handleCompleteStep(step.step_index)}
                    >
                      {completingStep === step.step_index ? '…' : 'Complete'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel */}
      {canCancel && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-danger" disabled={cancelling} onClick={handleCancel}>
            {cancelling ? 'Cancelling…' : 'Cancel Workflow'}
          </button>
        </div>
      )}
    </div>
  );
}
