import { useState, useEffect } from 'react';
import { hospitalStore } from '../store/hospital';

export function useHospital() {
  const [state, setState] = useState(hospitalStore.state);

  useEffect(() => {
    hospitalStore.load();
    return hospitalStore.subscribe(() => setState({ ...hospitalStore.state }));
  }, []);

  return state;
}
