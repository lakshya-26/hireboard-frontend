export default function Card({ children, className = '' }) {
  return <section className={`hb-card ${className}`}>{children}</section>;
}
