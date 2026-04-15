const variantStyles = {
  saved: 'bg-gray-100 text-gray-700',
  applied: 'bg-indigo-50 text-indigo-700',
  'phone screen': 'bg-sky-50 text-sky-700',
  interview: 'bg-amber-50 text-amber-700',
  offer: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  ghosted: 'bg-slate-100 text-slate-700',
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
};

export default function Badge({ children }) {
  const key = String(children || '').toLowerCase();
  const style = variantStyles[key] ?? 'bg-indigo-50 text-indigo-700';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {children}
    </span>
  );
}
