export default function Input({ label, id, error, className = '', ...rest }) {
  return (
    <div>
      {label ? (
        <label className="hb-label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className={`h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-primary)] outline-none transition-all placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgb(79_70_229_/_18%)] ${className}`}
        {...rest}
      />
      {error ? <p className="hb-error mt-1.5">{error}</p> : null}
    </div>
  );
}
