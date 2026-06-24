import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsApi } from '../api/patients';
import { wardsApi } from '../api/wards';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import type { Patient, Ward, Paginated } from '../types';

const PAGE_SIZE = 20;

interface AddPatientForm {
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Paginated<Patient> | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [wardFilter, setWardFilter] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AddPatientForm>({
    mrn: '', first_name: '', last_name: '', date_of_birth: '', gender: 'M', blood_group: 'O+',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  const loadPatients = useCallback(() => {
    setLoading(true);
    patientsApi.list({
      search: search || undefined,
      ward: wardFilter || undefined,
      status: status || undefined,
      page,
    }).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [search, wardFilter, status, page]);

  useEffect(() => {
    wardsApi.list().then((r) => setWards(r.results)).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, wardFilter, status]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  async function handleAddPatient(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await patientsApi.create(form);
      setShowModal(false);
      setForm({ mrn: '', first_name: '', last_name: '', date_of_birth: '', gender: 'M', blood_group: 'O+' });
      loadPatients();
    } catch (err: unknown) {
      const e = err as { data?: Record<string, unknown> };
      const msg = Object.values(e.data ?? {}).flat().join(' ') || 'Failed to add patient.';
      setFormError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;
  const startIdx = data ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endIdx = data ? Math.min(page * PAGE_SIZE, data.count) : 0;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">{data ? `${data.count} total patients` : ''}</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Patient
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 200 }}
          placeholder="Search by MRN or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-input"
          style={{ width: 140 }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="discharged">Discharged</option>
          <option value="">All</option>
        </select>
        {wards.length > 0 && (
          <select
            className="form-input"
            style={{ width: 160 }}
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">All Wards</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          icon="👤"
          title="No patients found"
          description={search ? 'Try adjusting your search or filters.' : 'No patients match the selected criteria.'}
          action={isAdmin && !search ? (
            <button className="btn-primary" onClick={() => setShowModal(true)}>Add First Patient</button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>MRN</th>
                  <th>Name</th>
                  <th>DOB</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((patient) => (
                  <tr key={patient.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--t3)' }}>{patient.mrn}</td>
                    <td>
                      <span style={{ fontWeight: 500, color: 'var(--t1)' }}>
                        {patient.first_name} {patient.last_name}
                      </span>
                    </td>
                    <td style={{ color: 'var(--t3)', fontSize: 12 }}>{patient.date_of_birth}</td>
                    <td style={{ color: 'var(--t3)', fontSize: 12 }}>{patient.gender}</td>
                    <td>
                      <Badge color="blue">{patient.blood_group}</Badge>
                    </td>
                    <td>
                      <Badge color={patient.is_active ? 'green' : 'gray'}>
                        {patient.is_active ? 'Active' : 'Discharged'}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 12px', fontSize: 12 }}
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <span style={{ fontSize: 13, color: 'var(--t3)' }}>
              Showing {startIdx}–{endIdx} of {data.count}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-secondary"
                style={{ padding: '4px 12px', fontSize: 12 }}
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '4px 12px', fontSize: 12 }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Patient Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Patient</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddPatient}>
              <div className="modal-body">
                {formError && <div className="error-msg">{formError}</div>}
                <div className="form-group">
                  <label className="form-label">MRN *</label>
                  <input className="form-input" required value={form.mrn}
                    onChange={(e) => setForm((f) => ({ ...f, mrn: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input className="form-input" required value={form.first_name}
                      onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input className="form-input" required value={form.last_name}
                      onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input type="date" className="form-input" required value={form.date_of_birth}
                    onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <select className="form-input" value={form.gender}
                      onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Group *</label>
                    <select className="form-input" value={form.blood_group}
                      onChange={(e) => setForm((f) => ({ ...f, blood_group: e.target.value }))}>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Adding…' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
