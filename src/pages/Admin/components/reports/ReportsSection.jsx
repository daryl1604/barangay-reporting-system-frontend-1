function ReportsSection({ id, title, subtitle, action, children }) {
  return (
    <section id={id} className="dashboard-panel">
      <div className="reports-section__header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default ReportsSection;
