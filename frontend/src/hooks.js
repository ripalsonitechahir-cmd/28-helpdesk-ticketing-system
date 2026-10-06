import { useCallback, useEffect, useState } from 'react';
import { ApiError } from './api';

// Form state + client validation + server error mapping, shared by every form.
export function useForm({ initial, validate, onSubmit, resetOnSuccess = false }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const bind = (name) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate?.(values) ?? {};
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await onSubmit(values);
      if (resetOnSuccess) setValues(initial);
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      setErrors(err.details || {});
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return { values, bind, handleSubmit, busy, formError };
}

// Runs an async loader; returns { data, error, loading, reload }.
export function useLoad(loader, deps) {
  const [state, setState] = useState({ data: null, error: '', loading: true });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    return loader()
      .then((data) => setState({ data, error: '', loading: false }))
      .catch((err) => setState({ data: null, error: err.message, loading: false }));
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
