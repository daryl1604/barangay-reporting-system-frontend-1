function StatCard({ label, value, tone = "blue" }) {
  return (
    <article className={`dashboard-stat-card dashboard-stat-card--${tone}`}>
      <p className="dashboard-stat-card__label">{label}</p>
      <strong className="dashboard-stat-card__value">{value}</strong>
    </article>
  );
}

export default StatCard;
