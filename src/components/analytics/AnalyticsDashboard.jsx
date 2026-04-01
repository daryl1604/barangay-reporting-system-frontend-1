import { useEffect, useMemo, useState } from "react";
import { fetchAnalyticsPeriodSummary, fetchAnalyticsTrends, fetchYearlyAnalytics } from "../../api/reports";
import { createReportSummary, fetchReportSummaries } from "../../api/reportSummaries";
import StatCard from "../../pages/Admin/components/dashboard/StatCard";
import { formatDateTime } from "../../utils/dateUtils";

const ORDERED_PUROKS = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5"];

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

  if (purokNumber && Number(purokNumber) >= 1 && Number(purokNumber) <= 5) {
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

  const analytics = backendAnalytics || fallbackAnalytics;
  const chartMaxValue = Math.max(...analytics.timeline.map((item) => item.value), 1);

  const generatedSummary = useMemo(() => {
    const periodLabel = period === "year" ? "year" : period;
    const topCategoryLabel =
      !analytics.topCategory || typeof analytics.topCategory === "string"
        ? analytics.topCategory
        : `${analytics.topCategory.label} (${analytics.topCategory.value})`;
    const topPurokLabel =
      !analytics.topPurok || typeof analytics.topPurok === "string"
        ? analytics.topPurok
        : `${analytics.topPurok.label} (${analytics.topPurok.value})`;

    return `This ${periodLabel}, the barangay recorded ${analytics.currentTotal} total reports. The most common case type is ${topCategoryLabel}. The most active purok is ${topPurokLabel}. Pending reports stand at ${analytics.statusSummary[0].value}, while ${analytics.statusSummary[2].value} report(s) have already been resolved.`;
  }, [analytics, period]);

  const handleSaveReport = async () => {
    const trimmedDraft = reportDraft.trim();

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
            <textarea
              value={reportDraft}
              onChange={(event) => {
                setReportDraft(event.target.value);
                setSaveMessage("");
              }}
              placeholder="Draft a public-facing safety insight or barangay advisory..."
            />
            <div className="analytics-announcement__actions">
              <button
                type="button"
                className="report-action-button report-action-button--ghost"
                onClick={() => {
                  setReportDraft(generatedSummary);
                  setSaveMessage("");
                }}
              >
                Generate Summary
              </button>
              <button
                type="button"
                className="report-action-button report-action-button--blue"
                disabled={isSavingReport || !reportDraft.trim()}
                onClick={handleSaveReport}
              >
                {isSavingReport ? "Saving..." : "Save Report"}
              </button>
            </div>
            {saveMessage ? <p className="analytics-announcement__message">{saveMessage}</p> : null}
          </div>
        </article>
      </div>

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
