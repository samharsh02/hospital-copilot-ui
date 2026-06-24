import { hospitalApi } from '../api/hospital';
import type { Hospital } from '../types';

type Listener = () => void;
const listeners = new Set<Listener>();

interface HospitalState {
  hospital: Hospital | null;
  loading: boolean;
}

export const hospitalStore = {
  state: { hospital: null, loading: false } as HospitalState,

  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },

  _notify() {
    listeners.forEach((fn) => fn());
  },

  async load() {
    if (hospitalStore.state.hospital) return;
    hospitalStore.state.loading = true;
    hospitalStore._notify();
    try {
      const h = await hospitalApi.get();
      hospitalStore.state.hospital = h;
    } catch {
      hospitalStore.state.hospital = null;
    } finally {
      hospitalStore.state.loading = false;
      hospitalStore._notify();
    }
  },

  clear() {
    hospitalStore.state = { hospital: null, loading: false };
    hospitalStore._notify();
  },
};
