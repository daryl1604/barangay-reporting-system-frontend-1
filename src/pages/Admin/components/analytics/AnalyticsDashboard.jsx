import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAnalyticsPeriodSummary, fetchAnalyticsTrends, fetchYearlyAnalytics } from "../../../../api/reports";
import { createReportSummary, fetchReportSummaries } from "../../../../api/reportSummaries";
import StatCard from "../dashboard/StatCard";
import { formatDateTime } from "../../../../utils/dateUtils";

const ORDERED_PUROKS = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5", "Purok 6", "Purok 7"];
const MIN_REPORT_LENGTH = 80;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getPeriodStart(period) {
  const now = new Date();

  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (period === "year") {
    return new Date(now.getFullYear(), 0, 1);
  }

  const dayIndex = now.getDay();
  const diffToMonday = (dayIndex + 6) % 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
}

function shiftPeriod(startDate, period, direction) {
  const nextDate = new Date(startDate);

  if (period === "month") {
    nextDate.setMonth(nextDate.getMonth() + direction);
    return nextDate;
  }

  if (period === "year") {
    nextDate.setFullYear(nextDate.getFullYear() + direction);
    return nextDate;
  }

  nextDate.setDate(nextDate.getDate() + direction * 7);
  return nextDate;
}

function isWithinPeriod(dateValue, startDate, period) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const endDate = shiftPeriod(startDate, period, 1);
  return date >= startDate && date < endDate;
}

function normalizePurokLabel(value) {
  const rawValue = String(value || "").trim();
  const purokNumber = rawValue.match(/\d+/)?.[0];

  if (purokNumber && Number(purokNumber) >= 1 && Number(purokNumber) <= 7) {
    return `Purok ${purokNumber}`;
  }

  return rawValue || "Unspecified";
}

function normalizePurokCounts(items = []) {
  const countMap = ORDERED_PUROKS.reduce((result, purok) => {
    result[purok] = 0;
    return result;
  }, {});

  items.forEach((item) => {
    const label = normalizePurokLabel(item.label);

    if (ORDERED_PUROKS.includes(label)) {
      countMap[label] += item.value || 0;
    }
  });

  return ORDERED_PUROKS.map((label) => ({
    label,
    value: countMap[label] || 0,
  }));
}

function getTopItem(items, emptyLabel, accessor) {
  if (items.length === 0) {
    return emptyLabel;
  }

  return [...items].sort((leftItem, rightItem) => accessor(rightItem) - accessor(leftItem))[0];
}

function getChangeLabel(currentValue, previousValue, period) {
  const periodLabel = period === "year" ? "year" : period;

  if (previousValue === 0) {
    return currentValue === 0 ? `No change from last ${periodLabel}` : `New increase from last ${periodLabel}`;
  }

  const delta = currentValue - previousValue;
  const direction = delta > 0 ? "up" : "down";
  return `${Math.abs(delta)} ${direction} from last ${periodLabel}`;
}

function buildTimeline(reports, period) {
  const currentStart = getPeriodStart(period);

  if (period === "year") {
    const timeline = Array.from({ length: 12 }, (_, index) => ({
      label: new Date(currentStart.getFullYear(), index, 1).toLocaleString("en-US", { month: "short" }),
      value: 0,
    }));

    reports.forEach((report) => {
      const createdAt = new Date(report.createdAt);

      if (Number.isNaN(createdAt.getTime()) || createdAt.getFullYear() !== currentStart.getFullYear()) {
        return;
      }

      timeline[createdAt.getMonth()].value += 1;
    });

    return timeline;
  }

  if (period === "month") {
    const daysInMonth = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 0).getDate();
    const weekCount = Math.ceil(daysInMonth / 7);
    const timeline = Array.from({ length: weekCount }, (_, index) => ({
      label: `Week ${index + 1}`,
      value: 0,
    }));

    reports.forEach((report) => {
      const createdAt = new Date(report.createdAt);

      if (!isWithinPeriod(createdAt, currentStart, period)) {
        return;
      }

      const weekIndex = Math.min(Math.floor((createdAt.getDate() - 1) / 7), weekCount - 1);
      timeline[weekIndex].value += 1;
    });

    return timeline;
  }

  const timeline = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({
    label,
    value: 0,
  }));

  reports.forEach((report) => {
    const createdAt = new Date(report.createdAt);

    if (!isWithinPeriod(createdAt, currentStart, period)) {
      return;
    }

    const dayIndex = (createdAt.getDay() + 6) % 7;
    timeline[dayIndex].value += 1;
  });

  return timeline;
}

function normalizeStatusSummary(summary = {}) {
  return [
    { label: "Pending", value: summary.pending || 0, tone: "yellow" },
    { label: "Ongoing", value: summary.ongoing || 0, tone: "blue" },
    { label: "Resolved", value: summary.resolved || 0, tone: "green" },
  ];
}

function getPeriodLabel(period) {
  if (period === "year") {
    return "Yearly";
  }

  if (period === "month") {
    return "Monthly";
  }

  return "Weekly";
}

function getCoverageLabel(period) {
  if (period === "year") {
    return "This year";
  }

  if (period === "month") {
    return "This month";
  }

  return "This week";
}

function getExportReportStyles() {
  return `
    :root {
      color-scheme: light;
      --ink: #18324c;
      --ink-soft: #34506d;
      --muted: #70839a;
      --line: #d9e2ec;
      --paper: #ffffff;
      --panel: #f7fafc;
      --panel-strong: #eef5fb;
      --accent: #35648f;
      --accent-soft: #85a9c9;
    }
    * { box-sizing: border-box; }
    @page { size: A4 portrait; margin: 8mm; }
    html, body { width: 100%; }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: "Segoe UI", Arial, sans-serif;
      color: var(--ink);
      display: flex;
      justify-content: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .report-page {
      width: 100%;
      max-width: 794px;
      margin: 0 auto;
      padding: 0;
      display: flex;
      justify-content: center;
    }
    .report-export-root {
      width: 794px;
      margin: 0 auto;
      background: #ffffff;
    }
    .report-page + .report-page {
      break-before: page;
      page-break-before: always;
    }
    .report-sheet {
      width: 100%;
      max-width: 794px;
      margin: 0 auto;
      padding: 16px 16px 14px;
      background: var(--paper);
      border: 1px solid var(--line);
    }
    .report-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: end;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--ink);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .report-eyebrow,
    .report-meta-label,
    .report-card-label,
    .report-section-label,
    .report-chart-note,
    .report-table thead th {
      display: block;
      color: var(--muted);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .report-eyebrow {
      margin-bottom: 4px;
    }
    .report-title {
      margin: 0 0 4px;
      font-size: 24px;
      line-height: 1.08;
      font-weight: 700;
    }
    .report-subtitle {
      margin: 0;
      color: var(--ink-soft);
      font-size: 12px;
      line-height: 1.45;
    }
    .report-meta {
      display: grid;
      grid-template-columns: repeat(2, auto);
      gap: 12px;
      align-items: end;
      justify-content: end;
    }
    .report-meta-value {
      display: block;
      margin-top: 4px;
      font-size: 11px;
      font-weight: 600;
      color: var(--ink);
    }
    .report-overview {
      margin-top: 12px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .report-overview-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin-top: 8px;
      align-items: start;
      align-content: start;
      grid-auto-rows: minmax(min-content, auto);
    }
    .report-card {
      height: auto;
      min-height: 0;
      padding: 10px;
      background: var(--panel);
      border: 1px solid var(--line);
      align-self: start;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .report-card-value {
      display: block;
      margin-top: 7px;
      font-size: 22px;
      line-height: 1;
      font-weight: 700;
    }
    .report-main-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 12px;
    }
    .report-section-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      align-items: start;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .report-section {
      height: auto;
      min-height: 0;
      padding: 12px;
      background: var(--panel);
      border: 1px solid var(--line);
      align-self: start;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .report-section-head {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: start;
      margin-bottom: 10px;
    }
    .report-section-title {
      margin: 3px 0 0;
      font-size: 16px;
      line-height: 1.15;
      font-weight: 700;
    }
    .report-section-subtitle {
      color: var(--muted);
      font-size: 11px;
      font-weight: 600;
      text-align: right;
    }
    .report-mini-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
      margin-bottom: 10px;
    }
    .report-mini-card {
      padding: 8px;
      background: #ffffff;
      border: 1px solid var(--line);
    }
    .report-mini-value {
      display: block;
      margin-top: 5px;
      font-size: 16px;
      line-height: 1;
      font-weight: 700;
    }
    .report-chart-panel {
      padding: 10px;
      background: #ffffff;
      border: 1px solid var(--line);
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .report-chart-head {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: baseline;
      margin-bottom: 8px;
    }
    .report-chart-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--ink);
    }
    .report-chart {
      display: grid;
      grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
      align-items: end;
      gap: 8px;
      width: 100%;
      min-height: 152px;
      height: 152px;
    }
    .report-chart-item {
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 5px;
      height: 100%;
      min-width: 0;
    }
    .report-chart-value {
      font-size: 10px;
      font-weight: 700;
      color: var(--muted);
      text-align: center;
    }
    .report-chart-track {
      height: 112px;
      display: flex;
      align-items: end;
      justify-content: center;
      background:
        linear-gradient(180deg, rgba(53, 100, 143, 0.12) 0%, rgba(53, 100, 143, 0) 100%);
      border-radius: 8px 8px 0 0;
      overflow: hidden;
    }
    .report-chart-bar {
      width: 100%;
      min-height: 2px;
      background: linear-gradient(180deg, var(--accent-soft) 0%, var(--accent) 100%);
      border-radius: 8px 8px 0 0;
    }
    .report-chart-label {
      font-size: 10px;
      color: var(--muted);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .report-insight-text {
      margin: 9px 0 0;
      color: var(--ink-soft);
      font-size: 11px;
      line-height: 1.55;
    }
    .report-footer-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 12px;
      align-items: stretch;
    }
    .report-summary-block {
      margin-top: 12px;
      padding: 12px;
      background: var(--panel);
      border: 1px solid var(--line);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .report-summary-text {
      margin: 8px 0 0;
      color: var(--ink-soft);
      font-size: 11px;
      line-height: 1.6;
    }
    .report-panel {
      padding: 12px;
      background: var(--panel);
      border: 1px solid var(--line);
      height: 100%;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .report-panel-title {
      margin: 3px 0 0;
      font-size: 15px;
      line-height: 1.15;
      font-weight: 700;
    }
    .report-insights-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin-top: 10px;
    }
    .report-insight-card {
      padding: 9px;
      background: #ffffff;
      border: 1px solid var(--line);
    }
    .report-insight-value {
      display: block;
      margin-top: 5px;
      font-size: 13px;
      line-height: 1.35;
      font-weight: 700;
    }
    .report-table-wrap {
      margin-top: 10px;
      overflow: hidden;
      border: 1px solid var(--line);
      background: #ffffff;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
    }
    .report-table thead th {
      padding: 8px 10px;
      text-align: left;
      background: var(--panel-strong);
      border-bottom: 1px solid var(--line);
    }
    .report-table tbody td {
      padding: 8px 10px;
      font-size: 11px;
      border-top: 1px solid #edf2f7;
    }
    .report-table tbody td:last-child {
      text-align: right;
      font-weight: 700;
      color: var(--ink);
    }
    @media print {
      body {
        display: block;
        background: #ffffff;
      }
      .report-page {
        width: 100%;
        max-width: 100%;
      }
      .report-sheet {
        width: 100%;
        max-width: 794px;
        margin: 0 auto;
        padding: 8px 10px 6px;
        border: none;
      }
      .report-overview,
      .report-main-grid,
      .report-summary-block,
      .report-footer-grid {
        margin-top: 10px;
      }
      .report-section-row,
      .report-footer-grid {
        gap: 10px;
      }
      .report-section,
      .report-summary-block,
      .report-panel {
        padding: 10px;
      }
      .report-overview-grid {
        align-items: start;
        align-content: start;
      }
      .report-card {
        height: auto;
        min-height: 0;
      }
      .report-chart-panel,
      .report-table-wrap {
        margin-top: 8px;
      }
    }
  `;
}

function buildPrintableSectionRowMarkup(sections) {
  if (!sections.length) {
    return "";
  }

  return `
    <div class="report-section-row">
      ${sections.map((section) => `
        <section class="report-section">
          <div class="report-section-head">
            <div>
              <span class="report-section-label">${escapeHtml(section.label)}</span>
              <h2 class="report-section-title">${escapeHtml(section.title)}</h2>
            </div>
            <span class="report-section-subtitle">${escapeHtml(section.subtitle)}</span>
          </div>

          <div class="report-mini-grid">
            ${section.summaryStats.map((item) => `<div class="report-mini-card"><span class="report-card-label">${escapeHtml(item.label)}</span><strong class="report-mini-value">${escapeHtml(item.value)}</strong></div>`).join("")}
          </div>

          <div class="report-chart-panel">
            <div class="report-chart-head">
              <span class="report-chart-title">Report Volume Graph</span>
              <span class="report-chart-note">${escapeHtml(section.chartCaption)}</span>
            </div>
            <div class="report-chart" style="--columns: ${section.timeline.length}">
              ${section.timeline.map((item) => `<div class="report-chart-item"><span class="report-chart-value">${escapeHtml(item.value)}</span><div class="report-chart-track"><div class="report-chart-bar" style="height: ${Math.max((item.value / section.chartMaxValue) * 100, item.value > 0 ? 10 : 2)}%"></div></div><span class="report-chart-label">${escapeHtml(item.label)}</span></div>`).join("")}
            </div>
          </div>

          <p class="report-insight-text">${escapeHtml(section.insight)}</p>
        </section>
      `).join("")}
    </div>
  `;
}

function buildPrintableReportBody(report) {
  const firstRowSections = report.sections.slice(0, 2);
  const secondRowSections = report.sections.slice(2, 4);

  return `
    <div class="report-page">
      <main class="report-sheet">
        <header class="report-header">
          <div>
            <span class="report-eyebrow">${escapeHtml(report.barangayName)}</span>
            <h1 class="report-title">Community Analytics Report</h1>
            <p class="report-subtitle">Daily, Weekly, Monthly, and Yearly Summary</p>
          </div>
          <div class="report-meta">
            <div>
              <span class="report-meta-label">Date Generated</span>
              <span class="report-meta-value">${escapeHtml(report.preparedAt)}</span>
            </div>
            <div>
              <span class="report-meta-label">Prepared By</span>
              <span class="report-meta-value">Admin</span>
            </div>
          </div>
        </header>

        <section class="report-overview">
          <span class="report-section-label">Summary Overview</span>
          <div class="report-overview-grid">
            ${report.overview.summaryStats.map((item) => `<div class="report-card"><span class="report-card-label">${escapeHtml(item.label)}</span><strong class="report-card-value">${escapeHtml(item.value)}</strong></div>`).join("")}
          </div>
        </section>

        <section class="report-main-grid">
          ${buildPrintableSectionRowMarkup(firstRowSections)}
          ${buildPrintableSectionRowMarkup(secondRowSections)}
        </section>
      </main>
    </div>

    <div class="report-page">
      <main class="report-sheet">
        <section class="report-summary-block">
          <span class="report-section-label">Summary Snapshot</span>
          <p class="report-summary-text">${escapeHtml(report.summarySentence)}</p>
        </section>

        <section class="report-footer-grid">
          <section class="report-panel">
            <div>
              <span class="report-section-label">Key Insights</span>
              <h2 class="report-panel-title">Operational Highlights</h2>
            </div>
            <div class="report-insights-grid">
              ${report.keyInsights.map((item) => `<div class="report-insight-card"><span class="report-card-label">${escapeHtml(item.label)}</span><strong class="report-insight-value">${escapeHtml(item.value)}</strong></div>`).join("")}
            </div>
          </section>

          <section class="report-panel">
            <div>
              <span class="report-section-label">Purok Breakdown</span>
              <h2 class="report-panel-title">Reports by Purok</h2>
            </div>
            <div class="report-table-wrap">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Purok</th>
                    <th>Reports</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.purokRows.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.value)}</td></tr>`).join("")}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
    </div>
  `;
}

function buildPrintableReportMarkup(report) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title></title>
    <style>${getExportReportStyles()}</style>
  </head>
  <body>${buildPrintableReportBody(report)}</body>
</html>`;
}



function getDailyRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function isWithinRange(dateValue, start, end) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date >= start && date < end;
}

function buildDailyTimeline(reports) {
  const { start, end } = getDailyRange();
  const slots = [
    { label: "12AM", startHour: 0, endHour: 4, value: 0 },
    { label: "4AM", startHour: 4, endHour: 8, value: 0 },
    { label: "8AM", startHour: 8, endHour: 12, value: 0 },
    { label: "12PM", startHour: 12, endHour: 16, value: 0 },
    { label: "4PM", startHour: 16, endHour: 20, value: 0 },
    { label: "8PM", startHour: 20, endHour: 24, value: 0 },
  ];

  reports.forEach((report) => {
    const createdAt = new Date(report.createdAt);

    if (!isWithinRange(createdAt, start, end)) {
      return;
    }

    const slot = slots.find((item) => createdAt.getHours() >= item.startHour && createdAt.getHours() < item.endHour);

    if (slot) {
      slot.value += 1;
    }
  });

  return slots.map(({ label, value }) => ({ label, value }));
}

function buildPrintableSection(reports, config) {
  let currentReports = [];
  let previousReports = [];
  let timeline = [];

  if (config.period === "day") {
    const currentRange = getDailyRange();
    const previousRange = getDailyRange(-1);
    currentReports = reports.filter((report) => isWithinRange(report.createdAt, currentRange.start, currentRange.end));
    previousReports = reports.filter((report) => isWithinRange(report.createdAt, previousRange.start, previousRange.end));
    timeline = buildDailyTimeline(reports);
  } else {
    const currentStart = getPeriodStart(config.period);
    const previousStart = shiftPeriod(currentStart, config.period, -1);
    currentReports = reports.filter((report) => isWithinPeriod(report.createdAt, currentStart, config.period));
    previousReports = reports.filter((report) => isWithinPeriod(report.createdAt, previousStart, config.period));
    timeline = buildTimeline(reports, config.period);
  }

  const statusSummary = normalizeStatusSummary({
    pending: currentReports.filter((report) => report.status === "pending").length,
    ongoing: currentReports.filter((report) => report.status === "in_progress").length,
    resolved: currentReports.filter((report) => report.status === "resolved").length,
  });
  const currentTotal = currentReports.length;
  const chartMaxValue = Math.max(...timeline.map((item) => item.value), 1);
  const topCategory = getTopItem(
    Object.entries(
      currentReports.reduce((result, report) => {
        const key = report.category || "Unspecified";
        result[key] = (result[key] || 0) + 1;
        return result;
      }, {})
    ).map(([label, value]) => ({ label, value })),
    "No dominant category yet",
    (item) => item.value
  );

  return {
    label: config.label,
    title: config.title,
    subtitle: getChangeLabel(currentTotal, previousReports.length, config.period === "day" ? "day" : config.period),
    chartCaption: config.chartCaption,
    chartMaxValue,
    timeline,
    statusSummary,
    summaryStats: [
      { label: "Total Reports", value: currentTotal },
      { label: "Pending", value: statusSummary[0].value },
      { label: "Ongoing", value: statusSummary[1].value },
      { label: "Resolved", value: statusSummary[2].value },
    ],
    insight:
      currentTotal === 0
        ? `No reports were recorded for ${config.title.toLowerCase()}.`
        : `${currentTotal} report(s) were recorded for ${config.title.toLowerCase()}, led by ${typeof topCategory === "string" ? topCategory : topCategory.label}. ${statusSummary[2].value} case(s) are already resolved.`,
  };
}

function buildPrintableSections(reports) {
  return [
    { period: "day", label: "Daily View", title: "Today", chartCaption: "Hourly activity" },
    { period: "week", label: "Weekly View", title: "This Week", chartCaption: "Daily activity" },
    { period: "month", label: "Monthly View", title: "This Month", chartCaption: "Weekly activity" },
    { period: "year", label: "Yearly View", title: "This Year", chartCaption: "Monthly activity" },
  ].map((config) => buildPrintableSection(reports, config));
}

function buildExportReportData(reports, preparedAt) {
  const overallStatusSummary = normalizeStatusSummary({
    pending: reports.filter((report) => report.status === "pending").length,
    ongoing: reports.filter((report) => report.status === "in_progress").length,
    resolved: reports.filter((report) => report.status === "resolved").length,
  });
  const purokRows = normalizePurokCounts(
    Object.entries(
      reports.reduce((result, report) => {
        const key = normalizePurokLabel(report.purok);
        result[key] = (result[key] || 0) + 1;
        return result;
      }, {})
    ).map(([label, value]) => ({ label, value }))
  );
  const categoryCounts = Object.entries(
    reports.reduce((result, report) => {
      const key = report.category || "Unspecified";
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {})
  ).map(([label, value]) => ({ label, value }));
  const topCategory = getTopItem(categoryCounts, "No dominant category yet", (item) => item.value);
  const topPurok = getTopItem(purokRows, "No active purok yet", (item) => item.value);
  const sections = buildPrintableSections(reports);
  const weeklySection = sections.find((section) => section.label === "Weekly View") || sections[0];
  const strongestSection = [...sections].sort(
    (leftSection, rightSection) => rightSection.summaryStats[0].value - leftSection.summaryStats[0].value
  )[0];
  const topCategoryLabel = typeof topCategory === "string" ? topCategory : topCategory.label;
  const topPurokLabel = typeof topPurok === "string" ? topPurok : topPurok.label;
  const summarySentence =
    reports.length === 0
      ? "No reports were recorded in the available analytics periods."
      : `This week, the barangay recorded ${weeklySection.summaryStats[0].value} total reports. The most common case type is ${topCategoryLabel}. The most active purok is ${topPurokLabel}. Pending reports are at ${overallStatusSummary[0].value}, while ${overallStatusSummary[2].value} cases have been resolved.`;

  return {
    barangayName: "Barangay Mataas na Lupa",
    preparedAt,
    summarySentence,
    overview: {
      summaryStats: [
        { label: "Total Reports", value: reports.length },
        { label: "Pending", value: overallStatusSummary[0].value },
        { label: "Ongoing", value: overallStatusSummary[1].value },
        { label: "Resolved", value: overallStatusSummary[2].value },
      ],
    },
    sections,
    keyInsights: [
      {
        label: "Most Common Report Type",
        value: typeof topCategory === "string" ? topCategory : `${topCategory.label} (${topCategory.value})`,
      },
      {
        label: "Most Active Purok",
        value: typeof topPurok === "string" ? topPurok : `${topPurok.label} (${topPurok.value})`,
      },
      {
        label: "Current Trend",
        value: weeklySection?.subtitle || "No change from last week",
      },
      {
        label: "Notable Pattern",
        value:
          strongestSection && strongestSection.summaryStats[0].value > 0
            ? `${strongestSection.title} has the highest activity with ${strongestSection.summaryStats[0].value} report(s).`
            : "No notable reporting spikes were recorded.",
      },
    ],
    purokRows,
  };
}

function buildFallbackAnalytics(reports, period) {
  const currentStart = getPeriodStart(period);
  const previousStart = shiftPeriod(currentStart, period, -1);

  const currentReports = reports.filter((report) => isWithinPeriod(report.createdAt, currentStart, period));
  const previousReports = reports.filter((report) => isWithinPeriod(report.createdAt, previousStart, period));

  const statusSummary = normalizeStatusSummary({
    pending: currentReports.filter((report) => report.status === "pending").length,
    ongoing: currentReports.filter((report) => report.status === "in_progress").length,
    resolved: currentReports.filter((report) => report.status === "resolved").length,
  });

  const categoryCounts = Object.entries(
    currentReports.reduce((result, report) => {
      const key = report.category || "Unspecified";
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {})
  ).map(([label, value]) => ({ label, value }));

  const purokCounts = normalizePurokCounts(
    Object.entries(
      currentReports.reduce((result, report) => {
        const key = normalizePurokLabel(report.purok);
        result[key] = (result[key] || 0) + 1;
        return result;
      }, {})
    ).map(([label, value]) => ({ label, value }))
  );

  return {
    currentTotal: currentReports.length,
    previousTotal: previousReports.length,
    statusSummary,
    categoryCounts,
    purokCounts,
    topCategory: getTopItem(categoryCounts, "No dominant category yet", (item) => item.value),
    topPurok: getTopItem(purokCounts, "No active purok yet", (item) => item.value),
    timeline: buildTimeline(reports, period),
  };
}

function AnalyticsDashboard({ reports }) {
  const [period, setPeriod] = useState("week");
  const [reportDraft, setReportDraft] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [backendAnalytics, setBackendAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [savedReports, setSavedReports] = useState([]);
  const [savedReportsError, setSavedReportsError] = useState("");
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [isPrintingReport, setIsPrintingReport] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [reportActionMessage, setReportActionMessage] = useState("");
  const printFrameRef = useRef(null);
  const printTimeoutRef = useRef(null);

  const fallbackAnalytics = useMemo(() => buildFallbackAnalytics(reports, period), [period, reports]);

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      setBackendAnalytics(null);

      try {
        let analyticsResponse;

        if (period === "year") {
          analyticsResponse = await fetchYearlyAnalytics();
        } else {
          const [summary, trends] = await Promise.all([
            fetchAnalyticsPeriodSummary(period),
            fetchAnalyticsTrends(period),
          ]);

          analyticsResponse = {
            current: summary.current,
            previous: summary.previous,
            statusSummary: trends.statusSummary,
            topCategory: trends.topCategory,
            topPurok: trends.topPurok,
            categoryCounts: trends.categoryCounts,
            purokCounts: trends.purokCounts,
          };
        }

        if (!isMounted) {
          return;
        }

        const normalizedPurokCounts = normalizePurokCounts(analyticsResponse.purokCounts || []);

        setBackendAnalytics({
          currentTotal: analyticsResponse.current?.total || 0,
          previousTotal: analyticsResponse.previous?.total || 0,
          statusSummary: normalizeStatusSummary(analyticsResponse.statusSummary || analyticsResponse.current),
          topCategory: analyticsResponse.topCategory || "No dominant category yet",
          topPurok: getTopItem(normalizedPurokCounts, "No active purok yet", (item) => item.value),
          categoryCounts: analyticsResponse.categoryCounts || [],
          purokCounts: normalizedPurokCounts,
          timeline: analyticsResponse.timeline || buildTimeline(reports, period),
        });
        setAnalyticsError("");
      } catch (error) {
        console.error(error);

        if (!isMounted) {
          return;
        }

        setBackendAnalytics(null);
        setAnalyticsError("Using local analytics snapshot while backend analytics is unavailable.");
      }
    };

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [period, reports]);

  useEffect(() => {
    let isMounted = true;

    const loadSavedReports = async () => {
      try {
        const data = await fetchReportSummaries();

        if (!isMounted) {
          return;
        }

        setSavedReports(data);
        setSavedReportsError("");
      } catch (error) {
        console.error(error);

        if (!isMounted) {
          return;
        }

        setSavedReportsError("Saved reports are currently unavailable.");
      }
    };

    loadSavedReports();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (printTimeoutRef.current) {
        window.clearTimeout(printTimeoutRef.current);
      }

      if (printFrameRef.current) {
        printFrameRef.current.remove();
        printFrameRef.current = null;
      }
    };
  }, []);

  const analytics = backendAnalytics || fallbackAnalytics;
  const chartMaxValue = Math.max(...analytics.timeline.map((item) => item.value), 1);
  const trimmedDraft = reportDraft.trim();
  const periodLabel = getPeriodLabel(period);
  const coverageLabel = getCoverageLabel(period);
  const preparedAt = formatDateTime(new Date());

  const generatedSummary = useMemo(() => {
    const summaryPeriodLabel = period === "year" ? "year" : period;
    const topCategoryLabel =
      !analytics.topCategory || typeof analytics.topCategory === "string"
        ? analytics.topCategory
        : `${analytics.topCategory.label} (${analytics.topCategory.value})`;
    const topPurokLabel =
      !analytics.topPurok || typeof analytics.topPurok === "string"
        ? analytics.topPurok
        : `${analytics.topPurok.label} (${analytics.topPurok.value})`;

    return `This ${summaryPeriodLabel}, the barangay recorded ${analytics.currentTotal} total reports. The most common case type is ${topCategoryLabel}. The most active purok is ${topPurokLabel}. Pending reports stand at ${analytics.statusSummary[0].value}, while ${analytics.statusSummary[2].value} report(s) have already been resolved.`;
  }, [analytics, period]);

  const summarySentence = useMemo(() => {
    const periodLead =
      period === "year" ? "This year" : period === "month" ? "This month" : "This week";
    const topCategoryLabel =
      typeof analytics.topCategory === "string"
        ? analytics.topCategory
        : analytics.topCategory?.label || "No dominant category yet";
    const topPurokLabel =
      typeof analytics.topPurok === "string" ? analytics.topPurok : analytics.topPurok?.label || "No active purok yet";

    return `${periodLead}, the barangay recorded ${analytics.currentTotal} total reports. The most common case type is ${topCategoryLabel}. The most active purok is ${topPurokLabel}. Pending reports are ${analytics.statusSummary[0].value}, while ${analytics.statusSummary[2].value} have been resolved.`;
  }, [analytics, period]);

  const validationErrors = useMemo(() => {
    const nextErrors = [];

    if (reports.length === 0) {
      nextErrors.push("At least one report is needed before exporting a PDF.");
    }

    return nextErrors;
  }, [reports]);

  const canExportReport = validationErrors.length === 0;

  const handleSaveReport = async () => {
    if (!trimmedDraft || isSavingReport) {
      return;
    }

    setIsSavingReport(true);
    setSaveMessage("");

    try {
      const savedReport = await createReportSummary({
        content: trimmedDraft,
        period,
      });

      setSavedReports((currentReports) => [savedReport, ...currentReports]);
      setSaveMessage("Report saved successfully.");
    } catch (error) {
      console.error(error);
      setSaveMessage("Unable to save the report right now.");
    } finally {
      setIsSavingReport(false);
    }
  };

  const handlePrintReport = () => {
    if (!canExportReport) {
      setReportActionMessage(validationErrors[0]);
      return;
    }

    if (isPrintingReport) {
      setReportActionMessage("The PDF print window is already being prepared.");
      return;
    }

    if (printFrameRef.current) {
      printFrameRef.current.remove();
      printFrameRef.current = null;
    }

    const printFrame = document.createElement("iframe");
    printFrame.setAttribute("aria-hidden", "true");
    printFrame.tabIndex = -1;
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.style.opacity = "0";
    printFrame.style.pointerEvents = "none";
    document.body.appendChild(printFrame);

    setIsPrintingReport(true);
    setReportActionMessage("");
    printFrameRef.current = printFrame;

    const finishPrinting = () => {
      if (printTimeoutRef.current) {
        window.clearTimeout(printTimeoutRef.current);
        printTimeoutRef.current = null;
      }

      setIsPrintingReport(false);

      if (printFrameRef.current === printFrame) {
        printFrameRef.current = null;
      }

      printFrame.onload = null;

      if (printFrame.parentNode) {
        printFrame.parentNode.removeChild(printFrame);
      }
    };

    let printableMarkup;

    try {
      printableMarkup = buildPrintableReportMarkup(buildExportReportData(reports, preparedAt));
    } catch (error) {
      console.error(error);
      setReportActionMessage("Unable to prepare the PDF preview right now.");
      finishPrinting();
      return;
    }

    printFrame.onload = () => {
      const frameWindow = printFrame.contentWindow;
      const frameDocument = printFrame.contentDocument;

      if (!frameWindow || !frameDocument) {
        setReportActionMessage("Unable to prepare the PDF preview right now.");
        finishPrinting();
        return;
      }

      try {
        frameDocument.title = "";
      } catch (error) {
        console.error(error);
      }

      const triggerPrint = () => {
        try {
          frameWindow.document.title = "";
          frameWindow.focus();
          frameWindow.print();
        } catch (error) {
          console.error(error);
          setReportActionMessage("Unable to open the browser print dialog right now.");
          finishPrinting();
        }
      };

      frameWindow.onafterprint = finishPrinting;
      frameWindow.onbeforeunload = finishPrinting;

      const waitForRender = () => {
        frameWindow.requestAnimationFrame(() => {
          frameWindow.requestAnimationFrame(() => {
            if (frameDocument.fonts?.ready) {
              frameDocument.fonts.ready.then(triggerPrint).catch(triggerPrint);
            } else {
              triggerPrint();
            }
          });
        });
      };

      if (frameDocument.readyState === "complete") {
        waitForRender();
      } else {
        frameDocument.addEventListener("readystatechange", () => {
          if (frameDocument.readyState === "complete") {
            waitForRender();
          }
        }, { once: true });
      }
    };

    // Fallback in case the browser never fires `load` or `afterprint`.
    printTimeoutRef.current = window.setTimeout(() => {
      if (printFrameRef.current === printFrame) {
        try {
          const frameWindow = printFrame.contentWindow;

          if (frameWindow) {
            frameWindow.focus();
            frameWindow.print();
            return;
          }
        } catch (error) {
          console.error(error);
        }

        finishPrinting();
      }
    }, 8000);

    const frameDocument = printFrame.contentDocument;

    if (!frameDocument) {
      setReportActionMessage("Unable to prepare the PDF preview right now.");
      finishPrinting();
      return;
    }

    frameDocument.open();
    frameDocument.write(printableMarkup);
    frameDocument.close();
  };

  const handleDownloadPdf = async () => {
    if (!canExportReport) {
      setReportActionMessage(validationErrors[0]);
      return;
    }

    if (isDownloadingPdf) {
      setReportActionMessage("The PDF download window is already being prepared.");
      return;
    }

    let reportData;

    try {
      reportData = buildExportReportData(reports, preparedAt);
    } catch (error) {
      console.error(error);
      setReportActionMessage("Unable to prepare the PDF download right now.");
      setIsDownloadingPdf(false);
      return;
    }

    setIsDownloadingPdf(true);
    setReportActionMessage("");

    try {
      const { default: html2pdf } = await import("html2pdf.js");
      const exportContainer = document.createElement("div");
      exportContainer.style.position = "fixed";
      exportContainer.style.left = "-10000px";
      exportContainer.style.top = "0";
      exportContainer.style.width = "794px";
      exportContainer.style.display = "flex";
      exportContainer.style.justifyContent = "center";
      exportContainer.style.background = "#ffffff";
      exportContainer.setAttribute("aria-hidden", "true");
      exportContainer.innerHTML = `<style>${getExportReportStyles()}</style><div class="report-export-root">${buildPrintableReportBody(reportData)}</div>`;
      document.body.appendChild(exportContainer);

      try {
        const target = exportContainer.querySelector(".report-export-root") || exportContainer;

        await html2pdf()
          .set({
            margin: 0,
            filename: `community-analytics-report-${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              backgroundColor: "#ffffff",
              width: 794,
              windowWidth: 794,
            },
            jsPDF: {
              unit: "px",
              format: [794, 1123],
              orientation: "portrait",
              hotfixes: ["px_scaling"],
            },
            pagebreak: {
              mode: ["css", "legacy"],
              avoid: [".report-header", ".report-overview", ".report-section-row", ".report-summary-block", ".report-panel", ".report-chart-panel"],
            },
          })
          .from(target)
          .save();
      } finally {
        document.body.removeChild(exportContainer);
      }
    } catch (error) {
      console.error(error);
      setReportActionMessage("Unable to download the PDF right now.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="analytics-dashboard">
      <div className="analytics-dashboard__controls">
        <div>
          <p className="dashboard-panel__eyebrow">Analytics Overview</p>
          <h3>Weekly, monthly, and yearly report insights for admin review.</h3>
          {analyticsError ? <p className="analytics-announcement__message">{analyticsError}</p> : null}
        </div>
        <div className="analytics-dashboard__toggle">
          <button
            type="button"
            className={["filter-bar__chip", period === "week" ? "is-active" : ""].filter(Boolean).join(" ")}
            onClick={() => setPeriod("week")}
          >
            Weekly
          </button>
          <button
            type="button"
            className={["filter-bar__chip", period === "month" ? "is-active" : ""].filter(Boolean).join(" ")}
            onClick={() => setPeriod("month")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={["filter-bar__chip", period === "year" ? "is-active" : ""].filter(Boolean).join(" ")}
            onClick={() => setPeriod("year")}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="analytics-dashboard__stats">
        <StatCard label={`Total Reports (${period})`} value={analytics.currentTotal} tone="slate" />
        {analytics.statusSummary.map((item) => (
          <StatCard key={item.label} label={`${item.label} Reports`} value={item.value} tone={item.tone} />
        ))}
      </div>

      <article className="analytics-panel analytics-panel--chart">
        <div className="analytics-panel__header">
          <h4>Report Volume Graph</h4>
          <span>{period === "week" ? "Daily view" : period === "month" ? "Weekly view" : "Monthly view"}</span>
        </div>
        <div className="analytics-chart">
          {analytics.timeline.map((item) => (
            <div key={item.label} className="analytics-chart__item">
              <span className="analytics-chart__value">{item.value}</span>
              <div className="analytics-chart__bar-track">
                <div
                  className="analytics-chart__bar"
                  style={{ height: `${Math.max((item.value / chartMaxValue) * 100, item.value > 0 ? 12 : 0)}%` }}
                />
              </div>
              <span className="analytics-chart__label">{item.label}</span>
            </div>
          ))}
        </div>
      </article>

      <div className="analytics-dashboard__grid">
        <article className="analytics-panel">
          <div className="analytics-panel__header">
            <h4>Trend Insights</h4>
            <span>{getChangeLabel(analytics.currentTotal, analytics.previousTotal, period)}</span>
          </div>
          <div className="analytics-insight-list">
            <div className="analytics-insight-card">
              <span>Reports this {period}</span>
              <strong>{analytics.currentTotal}</strong>
            </div>
            <div className="analytics-insight-card">
              <span>Previous {period}</span>
              <strong>{analytics.previousTotal}</strong>
            </div>
            <div className="analytics-insight-card">
              <span>Most common report type</span>
              <strong>{typeof analytics.topCategory === "string" ? analytics.topCategory : analytics.topCategory.label}</strong>
            </div>
            <div className="analytics-insight-card">
              <span>Most active purok</span>
              <strong>{typeof analytics.topPurok === "string" ? analytics.topPurok : analytics.topPurok.label}</strong>
            </div>
          </div>
        </article>

        <article className="analytics-panel">
          <div className="analytics-panel__header">
            <h4>Status Distribution</h4>
            <span>
              {period === "week" ? "This week" : period === "month" ? "This month" : "This year"}
            </span>
          </div>
          <div className="analytics-bar-list">
            {analytics.statusSummary.map((item) => {
              const percentage = analytics.currentTotal > 0 ? (item.value / analytics.currentTotal) * 100 : 0;

              return (
                <div key={item.label} className="analytics-bar-item">
                  <div className="analytics-bar-item__meta">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className="analytics-bar-track">
                    <div
                      className={`analytics-bar-fill analytics-bar-fill--${item.tone}`}
                      style={{ width: `${Math.max(percentage, item.value > 0 ? 12 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      <div className="analytics-dashboard__grid analytics-dashboard__grid--bottom">
        <article className="analytics-panel">
          <div className="analytics-panel__header">
            <h4>Reports by Purok</h4>
            <span>Current {period}</span>
          </div>
          <div className="analytics-list">
            {analytics.purokCounts.map((item) => (
              <div key={item.label} className="analytics-list__row">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-panel">
          <div className="analytics-panel__header">
            <h4>Community Report Preview</h4>
            <span>Admin draft only</span>
          </div>
          <div className="analytics-announcement">
            <div className="analytics-announcement__preview-header">
              <div>
                <strong>{periodLabel} barangay brief</strong>
                <span>{coverageLabel} analytics with printable report preview</span>
              </div>
              <span className="analytics-announcement__badge">PDF-ready</span>
            </div>
            <textarea
              value={reportDraft}
              onChange={(event) => {
                setReportDraft(event.target.value);
                setSaveMessage("");
                setReportActionMessage("");
              }}
              placeholder="Draft a public-facing safety insight or barangay advisory..."
            />
            <div className="analytics-announcement__meta">
              <span>{trimmedDraft.length} characters</span>
              <span>{analytics.currentTotal} report(s) included in this {period}</span>
            </div>
            <div className="analytics-announcement__actions">
              <button
                type="button"
                className="report-action-button report-action-button--ghost"
                onClick={() => {
                  setReportDraft(generatedSummary);
                  setSaveMessage("");
                  setReportActionMessage("");
                }}
              >
                Generate Summary
              </button>
              <button
                type="button"
                className="report-action-button report-action-button--ghost"
                disabled={isDownloadingPdf}
                onClick={handleDownloadPdf}
              >
                {isDownloadingPdf ? "Opening PDF..." : "Download PDF"}
              </button>
              <button
                type="button"
                className="report-action-button report-action-button--ghost"
                disabled={isPrintingReport}
                onClick={handlePrintReport}
              >
                {isPrintingReport ? "Preparing PDF..." : "Print as PDF"}
              </button>
              <button
                type="button"
                className="report-action-button report-action-button--blue"
                disabled={isSavingReport || !trimmedDraft}
                onClick={handleSaveReport}
              >
                {isSavingReport ? "Saving..." : "Save Report"}
              </button>
            </div>
            {validationErrors.length > 0 ? (
              <div className="analytics-validation">
                <strong>Before export:</strong>
                <ul>
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {reportActionMessage ? <p className="analytics-announcement__message">{reportActionMessage}</p> : null}
            {saveMessage ? <p className="analytics-announcement__message">{saveMessage}</p> : null}
          </div>
        </article>
      </div>

      <p className="analytics-announcement__message">{summarySentence}</p>

      <article className="analytics-panel">
        <div className="analytics-panel__header">
          <h4>Saved Reports</h4>
        </div>
        {savedReportsError ? <p className="analytics-announcement__message">{savedReportsError}</p> : null}
        <div className="analytics-saved-list">
          {savedReports.length > 0 ? (
            savedReports.map((summary) => (
              <article key={summary._id} className="analytics-saved-card">
                <div className="analytics-saved-card__meta">
                  <span>{summary.period || "week"}</span>
                  <span>{formatDateTime(summary.createdAt)}</span>
                </div>
                <p>{summary.content}</p>
                <strong>{summary.createdBy?.name || "Admin"}</strong>
              </article>
            ))
          ) : (
            <p className="dashboard-empty-state">No saved reports yet.</p>
          )}
        </div>
      </article>

    </div>
  );
}

export default AnalyticsDashboard;
