export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  ...rest
}) {
  const base =
    'inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

  const variants = {
    primary:
      'bg-[var(--color-primary)] text-white shadow-sm hover:brightness-95 focus-visible:ring-[var(--color-primary)]',
    secondary:
      'border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:bg-gray-50 focus-visible:ring-[var(--color-primary)]',
    danger:
      'bg-[var(--color-danger)] text-white shadow-sm hover:brightness-95 focus-visible:ring-[var(--color-danger)]',
  };

  return (
    <button type={type} disabled={disabled || loading} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {loading ? 'Please wait...' : children}
    </button>
  );
}
