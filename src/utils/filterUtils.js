import { isSameDay, toDate } from "./dateUtils";

export function getStatusLabel(status) {
  if (status === "in_progress") {
    return "Ongoing";
  }

  if (status === "resolved") {
    return "Resolved";
  }

  return "Pending";
}

export function getResidentName(report) {
  return report?.resident?.name?.trim() || "Anonymous";
}

export function filterReports(reports, filters) {
  const { searchTerm = "", selectedStatus = "", selectedDate = null } = filters;
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return reports.filter((report) => {
    const matchesStatus = !selectedStatus || report.status === selectedStatus;
    const reportDate = toDate(report.createdAt);
    const matchesDate = !selectedDate || isSameDay(reportDate, selectedDate);
    const matchesSearch =
      !normalizedSearch ||
      [
        report.category,
        report.description,
        report.location,
        report.purok,
        report.status,
        getResidentName(report),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesStatus && matchesDate && matchesSearch;
  });
}

export function getReportStats(reports) {
  return {
    total: reports.length,
    pending: reports.filter((report) => report.status === "pending").length,
    ongoing: reports.filter((report) => report.status === "in_progress").length,
    resolved: reports.filter((report) => report.status === "resolved").length,
  };
}

export function sortReportsByLatestActivity(reports) {
  return [...reports].sort((leftReport, rightReport) => {
    const leftTime = new Date(leftReport.updatedAt || leftReport.createdAt || 0).getTime();
    const rightTime = new Date(rightReport.updatedAt || rightReport.createdAt || 0).getTime();

    return rightTime - leftTime;
  });
}

export function getRecentRequests(reports, limit = 6) {
  const prioritizedReports = [...reports].sort((leftReport, rightReport) => {
    const leftPriority = leftReport.status === "pending" ? 0 : 1;
    const rightPriority = rightReport.status === "pending" ? 0 : 1;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftTime = new Date(leftReport.updatedAt || leftReport.createdAt || 0).getTime();
    const rightTime = new Date(rightReport.updatedAt || rightReport.createdAt || 0).getTime();

    return rightTime - leftTime;
  });

  return prioritizedReports.slice(0, limit);
}

export function buildNotificationEvents(reports, limit = 8) {
  return sortReportsByLatestActivity(reports)
    .slice(0, limit)
    .map((report) => {
      const residentName = getResidentName(report);
      const statusLabel = getStatusLabel(report.status);
      const eventDate = report.updatedAt || report.createdAt;
      const isStatusUpdate = Boolean(report.updatedAt && report.updatedAt !== report.createdAt);

      return {
        id: `${report._id}:${eventDate || ""}:${report.status || ""}`,
        reportId: report._id,
        title: isStatusUpdate ? `Report marked as ${statusLabel.toLowerCase()}` : "New report submitted",
        description: isStatusUpdate
          ? `${residentName}'s ${report.category || "report"} is now ${statusLabel}.`
          : `${residentName} submitted ${report.category || "a new report"} for review.`,
        date: eventDate,
        status: report.status,
      };
    });
}

export function getPurokSummary(reports) {
  const summaryMap = {
    "Purok 1": 0,
    "Purok 2": 0,
    "Purok 3": 0,
    "Purok 4": 0,
    "Purok 5": 0,
  };

  reports.forEach((report) => {
    const rawPurok = String(report.purok || "Unspecified").trim();
    const purokNumber = rawPurok.match(/\d+/)?.[0];
    const key = purokNumber ? `Purok ${purokNumber}` : rawPurok;

    if (!summaryMap[key]) {
      summaryMap[key] = 0;
    }

    summaryMap[key] += 1;
  });

  return Object.entries(summaryMap)
    .map(([purok, totalReports]) => ({ purok, totalReports }))
    .sort((firstItem, secondItem) => {
      const firstNumber = Number(firstItem.purok.match(/\d+/)?.[0] || Number.MAX_SAFE_INTEGER);
      const secondNumber = Number(secondItem.purok.match(/\d+/)?.[0] || Number.MAX_SAFE_INTEGER);

      if (firstNumber !== secondNumber) {
        return firstNumber - secondNumber;
      }

      return firstItem.purok.localeCompare(secondItem.purok);
    });
}
