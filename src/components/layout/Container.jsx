export default function Container({ children, className = '' }) {
  return <div className={`hb-container ${className}`}>{children}</div>;
}
