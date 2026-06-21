export default function StatCard({ label, value, tone = 'teal' }) {
  return (
    <article className={`stat ${tone}`}>
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
    </article>
  );
}
