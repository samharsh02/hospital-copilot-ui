import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowsApi } from '../api/workflows';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import type { WorkflowInstance, WorkflowTemplate, WorkflowTrigger } from '../types';

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function statusColor(status: string): 'gray' | 'blue' | 'green' | 'red' {
  if (status === 'PENDING') return 'gray';
  if (status === 'IN_PROGRESS') return 'blue';
  if (status === 'COMPLETED') return 'green';
  return 'red';
}

const TRIGGER_LABELS: Record<WorkflowTrigger, string> = {
  ON_ADMIT: 'On Admit',
  ON_DISCHARGE: 'On Discharge',
  MANUAL: 'Manual',
};

interface TemplateForm {
  name: string;
  trigger: WorkflowTrigger;
  steps: { title: string; description: string }[];
  is_active: boolean;
}

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState<'instances' | 'templates'>('instances');
  const [statusFilter, setStatusFilter] = useState('');
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [instanceTotal, setInstanceTotal] = useState(0);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);
  const [tForm, setTForm] = useState<TemplateForm>({ name: '', trigger: 'MANUAL', steps: [{ title: '', description: '' }], is_active: true });
  const [tSubmitting, setTSubmitting] = useState(false);
  const [tError, setTError] = useState('');

  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user?.role ?? '');

  function loadInstances() {
    workflowsApi.instances.list({ status: statusFilter || undefined }).then((r) => {
      setInstances(r.results);
      setInstanceTotal(r.count);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  function loadTemplates() {
    workflowsApi.templates.list().then((r) => setTemplates(r.results)).catch(() => {});
  }

  useEffect(() => {
    setLoading(true);
    if (tab === 'instances') loadInstances();
    else { loadTemplates(); setLoading(false); }
  }, [tab, statusFilter]);

  async function handleTemplateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTError('');
    setTSubmitting(true);
    try {
      const payload = {
        name: tForm.name,
        trigger: tForm.trigger,
        is_active: tForm.is_active,
        steps: tForm.steps.map((s, i) => ({ index: i, title: s.title, description: s.description })),
      };
      if (editingTemplate) {
        await workflowsApi.templates.update(editingTemplate.id, payload);
      } else {
        await workflowsApi.templates.create(payload);
      }
      setShowTemplateModal(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (err: unknown) {
      setTError((err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to save template.');
    } finally {
      setTSubmitting(false);
    }
  }

  async function handleDeleteTemplate(tmpl: WorkflowTemplate) {
    if (!confirm(`Delete template "${tmpl.name}"?`)) return;
    try {
      await workflowsApi.templates.delete(tmpl.id);
      loadTemplates();
    } catch (err: unknown) {
      alert((err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to delete.');
    }
  }

  function openEditTemplate(tmpl: WorkflowTemplate) {
    setEditingTemplate(tmpl);
    setTForm({
      name: tmpl.name,
      trigger: tmpl.trigger,
      is_active: tmpl.is_active,
      steps: tmpl.steps.map((s) => ({ title: s.title, description: s.description })),
    });
    setShowTemplateModal(true);
  }

  const instanceFilters = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Workflows</h1>
          <p className="page-subtitle">Clinical checklists and workflow management</p>
        </div>
        {tab === 'templates' && isAdmin && (
          <button className="btn-primary" onClick={() => { setEditingTemplate(null); setTForm({ name: '', trigger: 'MANUAL', steps: [{ title: '', description: '' }], is_active: true }); setShowTemplateModal(true); }}>
            + Add Template
          </button>
        )}
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'instances' ? ' active' : ''}`} onClick={() => setTab('instances')}>
          Instances ({instanceTotal})
        </button>
        <button className={`tab${tab === 'templates' ? ' active' : ''}`} onClick={() => setTab('templates')}>
          Templates
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : tab === 'instances' ? (
        <>
          <div className="filter-pills" style={{ marginBottom: 16 }}>
            {instanceFilters.map((f) => (
              <button key={f.value} className={`filter-pill${statusFilter === f.value ? ' active' : ''}`}
                onClick={() => setStatusFilter(f.value)}>
                {f.label}
              </button>
            ))}
          </div>

          {instances.length === 0 ? (
            <EmptyState icon="⚙️" title="No workflow instances" description="No workflows match the selected filter." />
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Template</th>
                    <th>Admission</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Started</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {instances.map((wf) => {
                    const completed = wf.steps.filter((s) => s.is_completed).length;
                    return (
                      <tr key={wf.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/workflows/${wf.id}`)}>
                        <td style={{ fontWeight: 500, color: 'var(--t1)' }}>{wf.template_name ?? `#${wf.template}`}</td>
                        <td style={{ color: 'var(--t3)', fontSize: 12 }}>Admission #{wf.admission}</td>
                        <td><Badge color={statusColor(wf.status)}>{wf.status.replace('_', ' ')}</Badge></td>
                        <td style={{ fontSize: 12, color: 'var(--t3)' }}>{completed}/{wf.steps.length} steps</td>
                        <td style={{ fontSize: 12, color: 'var(--t3)' }}>{relativeTime(wf.started_at)}</td>
                        <td>
                          <button className="btn-secondary" style={{ padding: '3px 10px', fontSize: 11 }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/workflows/${wf.id}`); }}>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {templates.length === 0 ? (
            <EmptyState icon="📋" title="No templates" description="Create workflow templates to standardise clinical checklists."
              action={isAdmin ? <button className="btn-primary" onClick={() => setShowTemplateModal(true)}>Add Template</button> : undefined} />
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Trigger</th>
                    <th>Steps</th>
                    <th>Active</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {templates.map((tmpl) => (
                    <tr key={tmpl.id}>
                      <td style={{ fontWeight: 500, color: 'var(--t1)' }}>{tmpl.name}</td>
                      <td><Badge color="blue">{TRIGGER_LABELS[tmpl.trigger]}</Badge></td>
                      <td style={{ color: 'var(--t3)', fontSize: 12 }}>{tmpl.steps.length} steps</td>
                      <td><Badge color={tmpl.is_active ? 'green' : 'gray'}>{tmpl.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-secondary" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => openEditTemplate(tmpl)}>Edit</button>
                            <button className="btn-danger" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => handleDeleteTemplate(tmpl)}>Delete</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingTemplate ? 'Edit Template' : 'Add Template'}</span>
              <button className="modal-close" onClick={() => setShowTemplateModal(false)}>×</button>
            </div>
            <form onSubmit={handleTemplateSubmit}>
              <div className="modal-body">
                {tError && <div className="error-msg">{tError}</div>}
                <div className="form-group">
                  <label className="form-label">Template Name *</label>
                  <input className="form-input" required value={tForm.name}
                    onChange={(e) => setTForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Trigger</label>
                  <select className="form-input" value={tForm.trigger}
                    onChange={(e) => setTForm((f) => ({ ...f, trigger: e.target.value as WorkflowTrigger }))}>
                    <option value="MANUAL">Manual</option>
                    <option value="ON_ADMIT">On Admit</option>
                    <option value="ON_DISCHARGE">On Discharge</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <input type="checkbox" id="isActive" checked={tForm.is_active}
                    onChange={(e) => setTForm((f) => ({ ...f, is_active: e.target.checked }))} />
                  <label htmlFor="isActive" style={{ fontSize: 13, color: 'var(--t2)' }}>Active</label>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>Steps</label>
                    <button type="button" className="btn-secondary" style={{ padding: '3px 10px', fontSize: 11 }}
                      onClick={() => setTForm((f) => ({ ...f, steps: [...f.steps, { title: '', description: '' }] }))}>
                      + Add Step
                    </button>
                  </div>
                  {tForm.steps.map((step, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 10, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t3)' }}>Step {i + 1}</span>
                        {tForm.steps.length > 1 && (
                          <button type="button" onClick={() => setTForm((f) => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 16, padding: '0 4px' }}>×</button>
                        )}
                      </div>
                      <input className="form-input" placeholder="Step title" value={step.title} style={{ marginBottom: 6 }}
                        onChange={(e) => setTForm((f) => ({ ...f, steps: f.steps.map((s, idx) => idx === i ? { ...s, title: e.target.value } : s) }))} />
                      <input className="form-input" placeholder="Description (optional)" value={step.description}
                        onChange={(e) => setTForm((f) => ({ ...f, steps: f.steps.map((s, idx) => idx === i ? { ...s, description: e.target.value } : s) }))} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={tSubmitting}>
                  {tSubmitting ? 'Saving…' : (editingTemplate ? 'Save Changes' : 'Create Template')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
