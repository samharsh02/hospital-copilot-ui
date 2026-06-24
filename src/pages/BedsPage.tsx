import { useState, useEffect } from 'react';
import { wardsApi } from '../api/wards';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import type { Ward, Bed } from '../types';

function OccBar({ occupied, total }: { occupied: number; total: number }) {
  if (total === 0) return null;
  const pct = Math.round((occupied / total) * 100);
  const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--amber)' : 'var(--green)';
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 3 }}>{occupied}/{total} occupied ({pct}%)</div>
      <div className="occ-bar">
        <div className="occ-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function BedsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [wardOccupancy, setWardOccupancy] = useState<Record<number, { occupied: number; total: number }>>({});

  // Ward modal
  const [showWardModal, setShowWardModal] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [wardForm, setWardForm] = useState({ name: '', capacity: '' });
  const [wardSubmitting, setWardSubmitting] = useState(false);
  const [wardError, setWardError] = useState('');

  // Bed modal
  const [showBedModal, setShowBedModal] = useState(false);
  const [bedNumber, setBedNumber] = useState('');
  const [bedSubmitting, setBedSubmitting] = useState(false);
  const [bedError, setBedError] = useState('');

  function loadWards() {
    wardsApi.list().then((r) => {
      setWards(r.results);
      // Fetch occupancy for all wards
      r.results.forEach((w) => {
        wardsApi.beds(w.id).then((br) => {
          setWardOccupancy((prev) => ({
            ...prev,
            [w.id]: {
              occupied: br.results.filter((b) => b.is_occupied).length,
              total: br.count,
            },
          }));
        }).catch(() => {});
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { loadWards(); }, []);

  function loadBeds(ward: Ward) {
    setBedsLoading(true);
    wardsApi.beds(ward.id).then((r) => setBeds(r.results)).catch(() => {}).finally(() => setBedsLoading(false));
  }

  function selectWard(ward: Ward) {
    setSelectedWard(ward);
    loadBeds(ward);
  }

  async function handleWardSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWardError('');
    setWardSubmitting(true);
    try {
      if (editingWard) {
        await wardsApi.update(editingWard.id, { name: wardForm.name, capacity: Number(wardForm.capacity) });
      } else {
        await wardsApi.create({ name: wardForm.name, capacity: Number(wardForm.capacity) });
      }
      setShowWardModal(false);
      setEditingWard(null);
      setWardForm({ name: '', capacity: '' });
      loadWards();
    } catch (err: unknown) {
      setWardError((err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to save ward.');
    } finally {
      setWardSubmitting(false);
    }
  }

  async function handleDeleteWard(ward: Ward) {
    if (!confirm(`Delete ward "${ward.name}"? All beds in this ward will be removed.`)) return;
    try {
      await wardsApi.delete(ward.id);
      if (selectedWard?.id === ward.id) setSelectedWard(null);
      loadWards();
    } catch (err: unknown) {
      alert((err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to delete ward.');
    }
  }

  async function handleAddBed(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWard) return;
    setBedError('');
    setBedSubmitting(true);
    try {
      await wardsApi.addBed(selectedWard.id, { number: bedNumber });
      setShowBedModal(false);
      setBedNumber('');
      loadBeds(selectedWard);
    } catch (err: unknown) {
      setBedError((err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to add bed.');
    } finally {
      setBedSubmitting(false);
    }
  }

  async function handleDeleteBed(bed: Bed) {
    if (bed.is_occupied) return;
    if (!confirm(`Delete bed ${bed.number}?`)) return;
    try {
      await wardsApi.deleteBed(bed.id);
      if (selectedWard) loadBeds(selectedWard);
    } catch (err: unknown) {
      alert((err as { data?: { detail?: string } })?.data?.detail ?? 'Failed to delete bed.');
    }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Beds & Wards</h1>
          <p className="page-subtitle">{wards.length} ward{wards.length !== 1 ? 's' : ''} configured</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { setEditingWard(null); setWardForm({ name: '', capacity: '' }); setShowWardModal(true); }}>
            + Add Ward
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 20, minHeight: 400 }}>
        {/* Ward list */}
        <div style={{ width: 280, flexShrink: 0 }}>
          {wards.length === 0 ? (
            <EmptyState
              icon="🏥"
              title="No wards configured"
              description="This hospital has no wards yet."
              action={isAdmin ? (
                <button className="btn-primary" onClick={() => { setWardForm({ name: '', capacity: '' }); setShowWardModal(true); }}>
                  Add First Ward
                </button>
              ) : undefined}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {wards.map((ward) => {
                const occ = wardOccupancy[ward.id];
                const active = selectedWard?.id === ward.id;
                return (
                  <div
                    key={ward.id}
                    onClick={() => selectWard(ward)}
                    className="card"
                    style={{
                      cursor: 'pointer', transition: 'all 0.12s',
                      border: active ? '2px solid var(--blue)' : '1px solid var(--border)',
                      background: active ? 'var(--blue-bg)' : 'var(--card)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--blue-text)' : 'var(--t1)', marginBottom: 2 }}>
                          {ward.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--t3)' }}>Capacity: {ward.capacity}</div>
                        {occ && <OccBar occupied={occ.occupied} total={occ.total} />}
                      </div>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn-icon"
                            onClick={() => { setEditingWard(ward); setWardForm({ name: ward.name, capacity: String(ward.capacity) }); setShowWardModal(true); }}
                            title="Edit ward"
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button className="btn-icon" onClick={() => handleDeleteWard(ward)} title="Delete ward" style={{ color: 'var(--red-text)' }}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Beds panel */}
        <div style={{ flex: 1 }}>
          {!selectedWard ? (
            <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState icon="🛏️" title="Select a ward" description="Click a ward on the left to view its beds." />
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>{selectedWard.name} — Beds</h2>
                {isAdmin && (
                  <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setShowBedModal(true)}>
                    + Add Bed
                  </button>
                )}
              </div>

              {bedsLoading ? (
                <Spinner />
              ) : beds.length === 0 ? (
                <EmptyState
                  icon="🛏️"
                  title="No beds in this ward"
                  description="Add beds to start tracking occupancy."
                  action={isAdmin ? (
                    <button className="btn-primary" onClick={() => setShowBedModal(true)}>Add First Bed</button>
                  ) : undefined}
                />
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Bed #</th>
                        <th>Status</th>
                        {isAdmin && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {beds.map((bed) => (
                        <tr key={bed.id}>
                          <td style={{ fontWeight: 500, color: 'var(--t1)' }}>Bed {bed.number}</td>
                          <td>
                            <Badge color={bed.is_occupied ? 'red' : 'green'}>
                              {bed.is_occupied ? 'Occupied' : 'Available'}
                            </Badge>
                          </td>
                          {isAdmin && (
                            <td>
                              <button
                                className="btn-icon"
                                onClick={() => handleDeleteBed(bed)}
                                disabled={bed.is_occupied}
                                title={bed.is_occupied ? 'Cannot delete occupied bed' : 'Delete bed'}
                                style={{ color: 'var(--red-text)', opacity: bed.is_occupied ? 0.3 : 1 }}
                              >
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                </svg>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ward Modal */}
      {showWardModal && (
        <div className="modal-overlay" onClick={() => setShowWardModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingWard ? 'Edit Ward' : 'Add Ward'}</span>
              <button className="modal-close" onClick={() => setShowWardModal(false)}>×</button>
            </div>
            <form onSubmit={handleWardSubmit}>
              <div className="modal-body">
                {wardError && <div className="error-msg">{wardError}</div>}
                <div className="form-group">
                  <label className="form-label">Ward Name *</label>
                  <input className="form-input" required value={wardForm.name}
                    onChange={(e) => setWardForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. General Medicine" />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity *</label>
                  <input type="number" className="form-input" required min={1} value={wardForm.capacity}
                    onChange={(e) => setWardForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="e.g. 20" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowWardModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={wardSubmitting}>
                  {wardSubmitting ? 'Saving…' : (editingWard ? 'Save Changes' : 'Add Ward')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bed Modal */}
      {showBedModal && (
        <div className="modal-overlay" onClick={() => setShowBedModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Bed — {selectedWard?.name}</span>
              <button className="modal-close" onClick={() => setShowBedModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddBed}>
              <div className="modal-body">
                {bedError && <div className="error-msg">{bedError}</div>}
                <div className="form-group">
                  <label className="form-label">Bed Number *</label>
                  <input className="form-input" required value={bedNumber}
                    onChange={(e) => setBedNumber(e.target.value)} placeholder="e.g. 101" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowBedModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={bedSubmitting}>
                  {bedSubmitting ? 'Adding…' : 'Add Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
