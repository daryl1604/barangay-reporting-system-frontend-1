import React from 'react';
import '../../styles/ResidentDashboard.css';

/**
 * MetricCard
 * Props:
 *  - label  {string}  e.g. "Total Reports"
 *  - value  {number}  e.g. 6
 */
export default function MetricCard({ label, value }) {
  return (
    <div className="res-metric-card">
      <div className="res-metric-card__label">{label}</div>
      <div className="res-metric-card__value">{value}</div>
    </div>
  );
}