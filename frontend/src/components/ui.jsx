// Small shared presentational pieces.

export function Field({ label, error, as: Tag = 'input', children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {Tag === 'select' ? <select {...props}>{children}</select> : <Tag {...props} />}
      {error && <small className="error">{error}</small>}
    </label>
  );
}

export const Options = ({ items, blank }) => (
  <>
    {blank && <option value="">{blank}</option>}
    {items.map((i) => (
      <option key={i} value={i}>
        {i}
      </option>
    ))}
  </>
);

export const Badge = ({ value }) => (
  <span className={`badge badge-${value.toLowerCase().replace(' ', '-')}`}>{value}</span>
);

export const Alert = ({ children, kind = 'error' }) =>
  children ? <div className={`alert alert-${kind}`} role="alert">{children}</div> : null;

export const Button = ({ busy, children, ...props }) => (
  <button className="btn" disabled={busy} {...props}>
    {busy ? 'Please wait…' : children}
  </button>
);

export const formatDate = (iso) => new Date(iso).toLocaleString();
