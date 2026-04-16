export default function Card({ children, className = '', interactive = false }) {
  const interactiveClass = interactive ? 'hb-card--interactive' : '';
  return <section className={`hb-card ${interactiveClass} ${className}`.trim()}>{children}</section>;
}
