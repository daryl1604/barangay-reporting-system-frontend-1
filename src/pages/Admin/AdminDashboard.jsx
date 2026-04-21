import { useContext, useEffect, useMemo, useRef, useState } from "react";
import API from "../../api/axios";
import AnalyticsDashboard from "./components/analytics/AnalyticsDashboard";
import { deleteNotification, fetchMyNotifications, markNotificationAsRead } from "../../api/notifications";
import {
  addReportComment,
  deleteReport,
  deleteReportComment,
  fetchAllReports,
  updateReportComment,
  updateReportStatus,
} from "../../api/reports";
import { AuthContext } from "../../context/authContext";
import { formatDateTime, formatLongDate, isSameDay, toDate } from "../../utils/dateUtils";
import {
  filterReports,
  getPurokSummary,
  getRecentRequests,
  getReportStats,
  getResidentName,
  getStatusLabel,
} from "../../utils/filterUtils";
import AdminNavbar from "./components/layout/AdminNavbar";
import AdminSidebar from "./components/layout/AdminSidebar";
import FilterBar from "./components/dashboard/FilterBar";
import HeaderDashboard from "./components/dashboard/HeaderDashboard";
import ReportCardAdmin from "./components/reports/ReportCardAdmin";
import ReportsSection from "./components/reports/ReportsSection";
import "./styles/AdminDashboard.css";

const INITIAL_RESIDENT_FORM = {
  email: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  purokNumber: "",
  contactNumber: "",
  age: "",
  gender: "",
};

const PUROK_OPTIONS = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5", "Purok 6", "Purok 7"];
const DEFAULT_ADMIN_EMAIL = "brgymataasnalupa@brs.com";
const RESIDENT_DETAILS_FIELDS = [
  { key: "email", label: "Email" },
  { key: "name", label: "Full Name" },
  { key: "purokNumber", label: "Purok Number" },
  { key: "contactNumber", label: "Contact Number" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
];

function EyeIcon({ isVisible }) {
  return isVisible ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l2.3 2.3A12.6 12.6 0 0 0 1.7 9.98a1.9 1.9 0 0 0 0 2.04C3.57 15.06 7.28 18 12 18c1.87 0 3.58-.46 5.08-1.22l3.39 3.39a.75.75 0 1 0 1.06-1.06Zm8.47 4.28A5.25 5.25 0 0 1 17.25 12c0 .64-.11 1.25-.3 1.82l-6.47-6.47c.48-.19 1-.3 1.52-.3Zm-5.2 1.12 6.33 6.33A5.25 5.25 0 0 1 6.8 7.87Zm5.2-3.87c4.72 0 8.43 2.94 10.3 5.98a1.9 1.9 0 0 1 0 2.04 14.68 14.68 0 0 1-2.33 2.89l-1.07-1.07A6.67 6.67 0 0 0 19.5 12 6.75 6.75 0 0 0 8.25 6.97L6.64 5.36A10.14 10.14 0 0 1 12 4.01Z"
        fill="currentColor"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5.25c-4.75 0-8.44 2.95-10.3 5.98a1.83 1.83 0 0 0 0 1.54c1.86 3.03 5.55 5.98 10.3 5.98s8.44-2.95 10.3-5.98a1.83 1.83 0 0 0 0-1.54c-1.86-3.03-5.55-5.98-10.3-5.98Zm0 11.25A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Zm0-1.5A3 3 0 1 0 12 9a3 3 0 0 0 0 6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AdminDashboard() {
  const { logout, user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [todayStatusFilter, setTodayStatusFilter] = useState("");
  const [purokStatusFilter, setPurokStatusFilter] = useState("");
  const [allReportsStatusFilter, setAllReportsStatusFilter] = useState("");
  const [allReportsSearchTerm, setAllReportsSearchTerm] = useState("");
  const [allReportsDateFilter, setAllReportsDateFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedReport, setSelectedReport] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [recentCommentId, setRecentCommentId] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState([]);
  const [reportPendingDelete, setReportPendingDelete] = useState(null);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isReportActionsOpen, setIsReportActionsOpen] = useState(false);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentPendingDelete, setCommentPendingDelete] = useState(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [isSavingCommentEdit, setIsSavingCommentEdit] = useState(false);
  const [commentActionError, setCommentActionError] = useState("");
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  const [residentForm, setResidentForm] = useState(INITIAL_RESIDENT_FORM);
  const [residentErrors, setResidentErrors] = useState({});
  const [residentSubmitError, setResidentSubmitError] = useState("");
  const [isCreatingResident, setIsCreatingResident] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [residentAutocompleteSeed, setResidentAutocompleteSeed] = useState(() => Date.now());
  const [residentFieldLocks, setResidentFieldLocks] = useState({
    password: true,
    confirmPassword: true,
    fullName: true,
  });
  const [isDiscardResidentConfirmOpen, setIsDiscardResidentConfirmOpen] = useState(false);
  const [isResidentSuccessOpen, setIsResidentSuccessOpen] = useState(false);
  const [isManageResidentsOpen, setIsManageResidentsOpen] = useState(false);
  const [residents, setResidents] = useState([]);
  const [residentsSearchTerm, setResidentsSearchTerm] = useState("");
  const [isResidentsLoading, setIsResidentsLoading] = useState(false);
  const [residentsError, setResidentsError] = useState("");
  const [selectedResidentDetails, setSelectedResidentDetails] = useState(null);
  const [isResidentDetailsLoading, setIsResidentDetailsLoading] = useState(false);
  const [residentDetailsError, setResidentDetailsError] = useState("");
  const [residentReportSummary, setResidentReportSummary] = useState(null);
  const [isResidentReportSummaryLoading, setIsResidentReportSummaryLoading] = useState(false);
  const [residentReportSummaryError, setResidentReportSummaryError] = useState("");
  const [residentPendingDelete, setResidentPendingDelete] = useState(null);
  const [isDeletingResident, setIsDeletingResident] = useState(false);
  const [deleteResidentError, setDeleteResidentError] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const reportActionsRef = useRef(null);
  const attachmentInputRef = useRef(null);

  const reportsCacheKey = "admin-dashboard-reports";
  const storedUser = useMemo(() => {
    try {
      const rawUser = localStorage.getItem("user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, []);
  const adminUser = user || storedUser;
  const profileEmail = adminUser?.email || DEFAULT_ADMIN_EMAIL;
  const profileRole = adminUser?.role || "admin";
  const profileName = adminUser?.name || "Barangay Administrator";

  const isNotificationLinkedToReport = (notification, report) => {
    if (!notification || !report) {
      return false;
    }

    const notificationReportId =
      typeof notification.report === "string"
        ? notification.report
        : notification.report?._id || null;

    if (notificationReportId && notificationReportId === report._id) {
      return true;
    }

    const submittedMessage = `A new ${report.category} report was submitted in ${report.purok || "an unspecified purok"}.`;
    return notification.message === submittedMessage;
  };

  useEffect(() => {
    const cachedReports = localStorage.getItem(reportsCacheKey);

    if (!cachedReports) {
      return;
    }

    try {
      const parsedReports = JSON.parse(cachedReports);

      if (Array.isArray(parsedReports) && reports.length === 0) {
        setReports(parsedReports);
      }
    } catch (error) {
      console.error(error);
    }
  }, [reports.length, reportsCacheKey]);

  useEffect(() => {
    const isAnyModalOpen =
      isAddResidentOpen ||
      isDiscardResidentConfirmOpen ||
      isResidentSuccessOpen ||
      isManageResidentsOpen ||
      Boolean(selectedResidentDetails) ||
      Boolean(residentPendingDelete) ||
      isProfileModalOpen ||
      isLogoutConfirmOpen ||
      Boolean(selectedReport) ||
      Boolean(reportPendingDelete);

    if (!isAnyModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [
    isAddResidentOpen,
    isDiscardResidentConfirmOpen,
    isResidentSuccessOpen,
    isManageResidentsOpen,
    selectedResidentDetails,
    residentPendingDelete,
    isProfileModalOpen,
    isLogoutConfirmOpen,
    selectedReport,
    reportPendingDelete,
  ]);

  const loadReports = async () => {
    try {
      const data = await fetchAllReports();
      setReports(data);
      localStorage.setItem(reportsCacheKey, JSON.stringify(data));
    } catch (error) {
      console.error(error);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await fetchMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadResidents = async ({ preserveError = false } = {}) => {
    setIsResidentsLoading(true);

    if (!preserveError) {
      setResidentsError("");
    }

    try {
      let response;

      try {
        response = await API.get("/auth/admin/residents");
      } catch (primaryError) {
        response = await API.get("/auth/residents");
      }

      const payload = response?.data;
      const nextResidents = Array.isArray(payload) ? payload : Array.isArray(payload?.residents) ? payload.residents : [];
      setResidents(nextResidents);
    } catch (error) {
      console.error(error);
      setResidentsError(error.response?.data?.msg || "Unable to load residents right now. Please try again.");
    } finally {
      setIsResidentsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!isManageResidentsOpen) {
      return;
    }

    loadResidents();
  }, [isManageResidentsOpen]);

  useEffect(() => {
    if (!selectedReport) {
      return;
    }

    const refreshedSelectedReport = reports.find((report) => report._id === selectedReport._id);
    setSelectedReport(refreshedSelectedReport || null);
  }, [reports, selectedReport]);

  useEffect(() => {
    setCommentText("");
    setAttachmentFile(null);
    setAttachmentPreviewUrl("");
    setIsAddingComment(false);
    setRecentCommentId(null);
    setIsReportActionsOpen(false);
    setActiveCommentMenuId(null);
    setEditingCommentId(null);
    setEditingCommentText("");
    setCommentPendingDelete(null);
    setIsDeletingComment(false);
    setIsSavingCommentEdit(false);
    setCommentActionError("");
  }, [selectedReport]);

  useEffect(() => {
    if (!isReportActionsOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!reportActionsRef.current?.contains(event.target)) {
        setIsReportActionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isReportActionsOpen]);

  useEffect(() => {
    if (!attachmentFile || !attachmentFile.type.startsWith("image/")) {
      setAttachmentPreviewUrl("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(attachmentFile);
    setAttachmentPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [attachmentFile]);

  useEffect(() => {
    if (!recentCommentId) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setRecentCommentId(null);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [recentCommentId]);

  const stats = useMemo(() => getReportStats(reports), [reports]);
  const profileReportSummary = useMemo(
    () => [
      { label: "Total Reports", value: stats?.total ?? 0 },
      { label: "Pending Reports", value: stats?.pending ?? 0 },
      { label: "Resolved Reports", value: stats?.resolved ?? 0 },
      { label: "In Progress Reports", value: stats?.ongoing ?? 0 },
    ],
    [stats]
  );
  const purokFilteredReports = useMemo(
    () => filterReports(reports, { selectedStatus: purokStatusFilter }),
    [reports, purokStatusFilter]
  );
  const visiblePurokSummary = useMemo(() => getPurokSummary(purokFilteredReports), [purokFilteredReports]);

  const highlightedReportDates = useMemo(
    () => reports.map((report) => new Date(report.createdAt)).filter((date) => !Number.isNaN(date.getTime())),
    [reports]
  );

  const featuredDate = selectedDate || new Date();
  const featuredReports = useMemo(
    () =>
      filterReports(reports, {
        selectedStatus: todayStatusFilter,
        selectedDate: featuredDate,
      }),
    [reports, todayStatusFilter, featuredDate]
  );

  const allReportsFiltered = useMemo(
    () =>
      filterReports(reports, {
        searchTerm: allReportsSearchTerm,
        selectedStatus: allReportsStatusFilter,
        selectedDate: allReportsDateFilter ? toDate(allReportsDateFilter) : null,
      }),
    [reports, allReportsSearchTerm, allReportsStatusFilter, allReportsDateFilter]
  );

  const recentRequests = useMemo(() => getRecentRequests(reports), [reports]);
  const dropdownNotifications = useMemo(() => {
    return [...notifications]
      .filter((notification) => !dismissedNotificationIds.includes(notification._id || notification.id))
      .sort((leftNotification, rightNotification) => {
        const leftTime = new Date(leftNotification.createdAt || 0).getTime();
        const rightTime = new Date(rightNotification.createdAt || 0).getTime();
        return rightTime - leftTime;
      })
      .map((notification) => ({
        id: notification._id,
        reportId:
          typeof notification.report === "string"
            ? notification.report
            : notification.report?._id || null,
        title: notification.title || "Notification",
        description: notification.message,
        date: notification.createdAt,
        status: notification.type || "general",
        read: Boolean(notification.read),
      }));
  }, [dismissedNotificationIds, notifications]);

  const unreadNotificationCount = useMemo(
    () => dropdownNotifications.filter((notification) => !notification.read).length,
    [dropdownNotifications]
  );
  const visibleResidents = useMemo(() => {
    const normalizedSearchTerm = residentsSearchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return residents;
    }

    return residents.filter((resident) =>
      [resident.name, resident.email, resident.purokNumber, resident.contactNumber, resident.gender]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearchTerm))
    );
  }, [residents, residentsSearchTerm]);
  const residentSummary = useMemo(() => {
    const total = residents.length;
    const puroksCovered = new Set(residents.map((resident) => resident.purokNumber).filter(Boolean)).size;

    return {
      total,
      puroksCovered,
    };
  }, [residents]);

  const getResidentDisplayValue = (resident, key) => {
    if (!resident) {
      return "Not available";
    }

    const value = resident[key];
    return value === null || value === undefined || value === "" ? "Not available" : value;
  };
  const residentReportSummaryCards = useMemo(
    () => [
      { label: "Total Reports", value: residentReportSummary?.totalReports ?? 0, tone: "blue" },
      { label: "Pending Reports", value: residentReportSummary?.pending ?? 0, tone: "yellow" },
      { label: "In Progress Reports", value: residentReportSummary?.inProgress ?? 0, tone: "blue" },
      { label: "Resolved Reports", value: residentReportSummary?.resolved ?? 0, tone: "green" },
    ],
    [residentReportSummary]
  );
  const buildResidentReportSummaryFromReports = (residentId) => {
    const residentReports = reports.filter((report) => {
      const linkedResidentId =
        typeof report.resident === "string" ? report.resident : report.resident?._id || null;
      return linkedResidentId === residentId;
    });

    return {
      totalReports: residentReports.length,
      pending: residentReports.filter((report) => report.status === "pending").length,
      inProgress: residentReports.filter((report) => report.status === "in_progress").length,
      resolved: residentReports.filter((report) => report.status === "resolved").length,
    };
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const hasResidentUnsavedChanges = Object.values(residentForm).some((value) => String(value).trim() !== "");
  const getPasswordStrength = (passwordValue) => {
    if (!passwordValue) {
      return null;
    }

    if (passwordValue.length < 8) {
      return { label: "Weak", className: "is-weak" };
    }

    if (passwordValue.length < 12) {
      return { label: "Medium", className: "is-medium" };
    }

    return { label: "Strong", className: "is-strong" };
  };

  const validateResidentField = (field, nextValue, formValues) => {
    switch (field) {
      case "email":
        if (!nextValue.trim()) {
          return "Email is required.";
        }
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextValue.trim()) ? "" : "Please enter a valid email address.";
      case "password":
        if (!nextValue) {
          return "Password is required.";
        }
        return nextValue.length >= 8 ? "" : "Password must be at least 8 characters.";
      case "confirmPassword":
        if (!nextValue) {
          return "Please confirm the password.";
        }
        return nextValue === formValues.password ? "" : "Passwords do not match.";
      case "fullName":
        return nextValue.trim() ? "" : "Full name is required.";
      case "purokNumber":
        return PUROK_OPTIONS.includes(nextValue) ? "" : "Please select a valid purok.";
      case "contactNumber":
        if (!nextValue) {
          return "Contact number is required.";
        }
        return /^09\d{9}$/.test(nextValue) ? "" : "Please enter a valid contact number.";
      case "age": {
        const ageValue = Number(nextValue);
        if (!nextValue) {
          return "Age is required.";
        }
        return Number.isInteger(ageValue) && ageValue >= 1 && ageValue <= 120
          ? ""
          : "Enter a valid age between 1 and 120.";
      }
      case "gender":
        return nextValue ? "" : "Gender is required.";
      default:
        return "";
    }
  };

  const validateResidentForm = (formValues = residentForm) => {
    const nextErrors = {};
    Object.keys(formValues).forEach((field) => {
      const message = validateResidentField(field, formValues[field], formValues);
      if (message) {
        nextErrors[field] = message;
      }
    });

    return nextErrors;
  };

  const resetResidentFormState = () => {
    setResidentForm(INITIAL_RESIDENT_FORM);
    setResidentErrors({});
    setResidentSubmitError("");
    setIsPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
    setResidentFieldLocks({
      password: true,
      confirmPassword: true,
      fullName: true,
    });
    setIsDiscardResidentConfirmOpen(false);
  };

  const unlockResidentField = (field) => () => {
    setResidentFieldLocks((currentLocks) =>
      currentLocks[field]
        ? {
            ...currentLocks,
            [field]: false,
          }
        : currentLocks
    );
  };

  const handleOpenAddResident = () => {
    resetResidentFormState();
    setResidentAutocompleteSeed(Date.now());
    setIsAddResidentOpen(true);
  };

  const getResidentMaskedInputStyle = (isVisible) =>
    isVisible
      ? undefined
      : {
          WebkitTextSecurity: "disc",
        };

  const closeAddResidentImmediately = () => {
    if (isCreatingResident) {
      return;
    }

    setIsAddResidentOpen(false);
    resetResidentFormState();
  };

  const handleRequestCloseAddResident = () => {
    if (isCreatingResident) {
      return;
    }

    if (hasResidentUnsavedChanges) {
      setIsDiscardResidentConfirmOpen(true);
      return;
    }

    closeAddResidentImmediately();
  };

  const handleResidentInputChange = (field) => (event) => {
    const rawValue = event.target.value;
    const nextValue =
      field === "contactNumber"
        ? rawValue.replace(/\D/g, "").slice(0, 11)
        : field === "age"
          ? rawValue.replace(/[^\d]/g, "").slice(0, 3)
          : rawValue;

    setResidentForm((currentForm) => {
      const nextForm = {
        ...currentForm,
        [field]: nextValue,
      };

      const nextErrors = { ...residentErrors };
      const fieldMessage = validateResidentField(field, nextValue, nextForm);

      if (fieldMessage) {
        nextErrors[field] = fieldMessage;
      } else {
        delete nextErrors[field];
      }

      if (field === "password" && nextForm.confirmPassword) {
        const confirmMessage = validateResidentField("confirmPassword", nextForm.confirmPassword, nextForm);
        if (confirmMessage) {
          nextErrors.confirmPassword = confirmMessage;
        } else {
          delete nextErrors.confirmPassword;
        }
      }

      setResidentErrors(nextErrors);
      return nextForm;
    });

    if (residentSubmitError) {
      setResidentSubmitError("");
    }
  };

  const handleCreateResident = async (event) => {
    event.preventDefault();

    if (isCreatingResident) {
      return;
    }

    const validationErrors = validateResidentForm();
    setResidentErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsCreatingResident(true);
    setResidentSubmitError("");

    try {
      await API.post("/auth/register", {
        name: residentForm.fullName.trim(),
        email: residentForm.email.trim(),
        password: residentForm.password,
        purokNumber: residentForm.purokNumber.trim(),
        contactNumber: residentForm.contactNumber.trim(),
        age: Number(residentForm.age),
        gender: residentForm.gender,
        role: "resident",
      });

      if (isManageResidentsOpen) {
        await loadResidents({ preserveError: true });
      }

      setIsAddResidentOpen(false);
      resetResidentFormState();
      setIsResidentSuccessOpen(true);
    } catch (error) {
      console.error(error);
      setResidentSubmitError(error.response?.data?.msg || "Unable to add resident right now. Please try again.");
    } finally {
      setIsCreatingResident(false);
    }
  };

  const handleOpenManageResidents = async () => {
    setIsManageResidentsOpen(true);
    setResidentsSearchTerm("");
    setResidentsError("");
    setResidentDetailsError("");
    setDeleteResidentError("");
  };

  const handleCloseManageResidents = () => {
    if (isDeletingResident) {
      return;
    }

    setIsManageResidentsOpen(false);
    setResidentsSearchTerm("");
    setResidentsError("");
    setResidentDetailsError("");
  };

  const handleViewResidentDetails = async (residentId) => {
    setIsResidentDetailsLoading(true);
    setResidentDetailsError("");
    setResidentReportSummary(null);
    setResidentReportSummaryError("");
    setIsResidentReportSummaryLoading(true);

    try {
      const residentResponse = await (async () => {
        try {
          return await API.get(`/auth/admin/residents/${residentId}`);
        } catch (primaryError) {
          return await API.get(`/auth/residents/${residentId}`);
        }
      })();

      setSelectedResidentDetails(residentResponse?.data || null);
    } catch (error) {
      console.error(error);
      setResidentDetailsError(error.response?.data?.msg || "Unable to load resident details right now. Please try again.");
    } finally {
      setIsResidentDetailsLoading(false);
    }

    try {
      const summaryResponse = await API.get(`/reports/resident/${residentId}/summary`);
      setResidentReportSummary(summaryResponse?.data || null);
    } catch (error) {
      console.error(error);

      const fallbackSummary = buildResidentReportSummaryFromReports(residentId);
      setResidentReportSummary(fallbackSummary);
    } finally {
      setIsResidentReportSummaryLoading(false);
    }
  };

  const handleCloseResidentDetails = () => {
    setSelectedResidentDetails(null);
    setResidentDetailsError("");
    setResidentReportSummary(null);
    setResidentReportSummaryError("");
  };

  const handleRequestDeleteResident = (resident) => {
    setResidentPendingDelete(resident);
    setDeleteResidentError("");
  };

  const handleConfirmDeleteResident = async () => {
    if (!residentPendingDelete || isDeletingResident) {
      return;
    }

    setIsDeletingResident(true);
    setDeleteResidentError("");

    try {
      const deletedResidentId = residentPendingDelete._id;
      const deletedReportIds = reports
        .filter((report) => {
          const residentId =
            typeof report.resident === "string" ? report.resident : report.resident?._id || null;
          return residentId === deletedResidentId;
        })
        .map((report) => report._id);

      try {
        await API.delete(`/auth/admin/residents/${deletedResidentId}`);
      } catch (primaryError) {
        await API.delete(`/auth/residents/${deletedResidentId}`);
      }

      setResidents((currentResidents) => currentResidents.filter((resident) => resident._id !== deletedResidentId));

      if (selectedResidentDetails?._id === deletedResidentId) {
        setSelectedResidentDetails(null);
      }

      setReports((currentReports) => {
        const nextReports = currentReports.filter((report) => {
          const residentId =
            typeof report.resident === "string" ? report.resident : report.resident?._id || null;
          return residentId !== deletedResidentId;
        });

        localStorage.setItem(reportsCacheKey, JSON.stringify(nextReports));
        return nextReports;
      });
      setNotifications((currentNotifications) =>
        currentNotifications.filter((notification) => {
          const notificationReportId =
            typeof notification.report === "string" ? notification.report : notification.report?._id || null;
          const notificationUserId =
            typeof notification.user === "string" ? notification.user : notification.user?._id || null;

          return notificationUserId !== deletedResidentId && !deletedReportIds.includes(notificationReportId);
        })
      );

      setResidentPendingDelete(null);
    } catch (error) {
      console.error(error);
      setDeleteResidentError(error.response?.data?.msg || "Unable to delete this resident account right now. Please try again.");
    } finally {
      setIsDeletingResident(false);
    }
  };

  const handleOpenProfile = () => {
    setIsProfileModalOpen(true);
  };

  const handleCloseProfile = () => {
    setIsProfileModalOpen(false);
  };

  const handleRequestLogout = () => {
    setIsProfileModalOpen(false);
    setIsLogoutConfirmOpen(true);
  };

  const updateReportsState = (nextReports) => {
    setReports(nextReports);
    localStorage.setItem(reportsCacheKey, JSON.stringify(nextReports));
  };

  const getUpdatedComments = (responseData, fallbackComments = []) => {
    if (Array.isArray(responseData)) {
      return responseData;
    }

    if (Array.isArray(responseData?.comments)) {
      return responseData.comments;
    }

    return fallbackComments;
  };

  const updateReportCommentsState = (reportId, nextComments) => {
    setSelectedReport((currentReport) =>
      currentReport && currentReport._id === reportId
        ? {
            ...currentReport,
            comments: nextComments,
          }
        : currentReport
    );

    setReports((currentReports) => {
      const nextReports = currentReports.map((report) =>
        report._id === reportId
          ? {
              ...report,
              comments: nextComments,
            }
          : report
      );

      localStorage.setItem(reportsCacheKey, JSON.stringify(nextReports));
      return nextReports;
    });
  };

  const handleStatusChange = async (reportId, status) => {
    if (statusUpdating[reportId]) {
      return;
    }

    const previousReports = reports;
    const currentReport = reports.find((report) => report._id === reportId);

    if (!currentReport || currentReport.status === status) {
      return;
    }

    setStatusUpdating((currentState) => ({
      ...currentState,
      [reportId]: status,
    }));

    setReports((currentReports) =>
      currentReports.map((report) =>
        report._id === reportId
          ? {
              ...report,
              status,
            }
          : report
      )
    );

    try {
      await updateReportStatus(reportId, status);
      await Promise.all([loadReports(), loadNotifications()]);
    } catch (error) {
      console.error(error);
      updateReportsState(previousReports);
    } finally {
      setStatusUpdating((currentState) => {
        const nextState = { ...currentState };
        delete nextState[reportId];
        return nextState;
      });
    }
  };

  const handleAddComment = async () => {
    if (!selectedReport || (!commentText.trim() && !attachmentFile) || isAddingComment) {
      return;
    }

    try {
      setIsAddingComment(true);
      let attachmentPayload;

      if (attachmentFile) {
        const attachmentUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Unable to read the selected attachment."));
          reader.readAsDataURL(attachmentFile);
        });

        attachmentPayload = {
          name: attachmentFile.name,
          mimeType: attachmentFile.type || "application/octet-stream",
          url: attachmentUrl,
          isImage: attachmentFile.type.startsWith("image/"),
        };
      }

      const response = await addReportComment(selectedReport._id, commentText.trim(), attachmentPayload);
      const nextComments = getUpdatedComments(response, selectedReport.comments || []);
      const newestComment = nextComments[nextComments.length - 1];

      updateReportCommentsState(selectedReport._id, nextComments);
      setRecentCommentId(newestComment?._id || null);
      setCommentText("");
      setAttachmentFile(null);
      setAttachmentPreviewUrl("");
      setCommentActionError("");
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
      await Promise.all([loadReports(), loadNotifications()]);
    } catch (error) {
      console.error(error);
      setCommentActionError(error.response?.data?.msg || error.message || "Unable to add the comment right now.");
    } finally {
      setIsAddingComment(false);
    }
  };

  const getCommentAttachment = (comment) => {
    const item = comment?.attachment;

    if (!item?.url) {
      return null;
    }

    const name = item.name || item.fileName || item.originalName || "Attachment";
    const type = item.mimeType || item.type || "";
    const isImage = Boolean(item.isImage) || type.startsWith("image/") || /^data:image\//i.test(item.url);
    const normalizedUrl =
      /^https?:\/\//i.test(item.url) || /^data:/i.test(item.url)
        ? item.url
        : `${API.defaults.baseURL?.replace(/\/api$/, "") || window.location.origin}${item.url}`;

    return {
      name,
      url: normalizedUrl,
      isImage,
    };
  };

  const getReportResidentId = (report) => {
    if (!report) {
      return null;
    }

    return typeof report.resident === "string" ? report.resident : report.resident?._id || null;
  };

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentText(comment.text || "");
    setActiveCommentMenuId(null);
    setCommentActionError("");
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
    setCommentActionError("");
  };

  const handleSaveCommentEdit = async () => {
    if (!selectedReport || !editingCommentId || isSavingCommentEdit) {
      return;
    }

    const nextText = editingCommentText.trim();

    if (!nextText) {
      setCommentActionError("Comment text cannot be empty.");
      return;
    }

    const previousComments = selectedReport.comments || [];
    const previousComment = previousComments.find((comment) => comment._id === editingCommentId);

    if (!previousComment) {
      setCommentActionError("Comment not found.");
      return;
    }

    const optimisticComments = previousComments.map((comment) =>
      comment._id === editingCommentId
        ? {
            ...comment,
            text: nextText,
            date: new Date().toISOString(),
          }
        : comment
    );

    setIsSavingCommentEdit(true);
    setCommentActionError("");
    updateReportCommentsState(selectedReport._id, optimisticComments);

    try {
      const response = await updateReportComment(selectedReport._id, editingCommentId, nextText);
      const comments = getUpdatedComments(response, optimisticComments);

      updateReportCommentsState(selectedReport._id, comments);
      setEditingCommentId(null);
      setEditingCommentText("");
      await loadReports();
    } catch (error) {
      console.error(error);
      updateReportCommentsState(selectedReport._id, previousComments);
      setCommentActionError(error.response?.data?.msg || "Unable to save the comment right now.");
    } finally {
      setIsSavingCommentEdit(false);
    }
  };

  const handleRequestDeleteComment = (comment) => {
    setActiveCommentMenuId(null);
    setCommentPendingDelete(comment);
    setCommentActionError("");
  };

  const handleCancelDeleteComment = () => {
    if (isDeletingComment) {
      return;
    }

    setCommentPendingDelete(null);
    setCommentActionError("");
  };

  const handleDeleteComment = async () => {
    if (!selectedReport || !commentPendingDelete?._id || isDeletingComment) {
      return;
    }

    const reportId = selectedReport._id;
    const commentId = commentPendingDelete._id;
    const previousComments = selectedReport.comments || [];
    const fallbackComments = previousComments.filter((comment) => comment._id !== commentId);

    setIsDeletingComment(true);
    setCommentActionError("");
    updateReportCommentsState(reportId, fallbackComments);

    try {
      const response = await deleteReportComment(reportId, commentId);
      const comments = getUpdatedComments(response, fallbackComments);

      updateReportCommentsState(reportId, comments);
      setCommentPendingDelete(null);
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingCommentText("");
      }
      await loadReports();
    } catch (error) {
      console.error(error);
      updateReportCommentsState(reportId, previousComments);
      setCommentActionError(error.response?.data?.msg || "Unable to delete the comment right now.");
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate((currentSelectedDate) =>
      currentSelectedDate && isSameDay(currentSelectedDate, date) ? null : date
    );
    setViewDate(date);
  };

  const handleMonthSelect = (monthIndex) => {
    setViewDate((currentDate) => new Date(currentDate.getFullYear(), monthIndex, 1));
  };

  const handleYearSelect = (yearValue) => {
    setViewDate((currentDate) => new Date(yearValue, currentDate.getMonth(), 1));
  };

  const getReportAttachments = (report) => {
    const normalizeAttachmentItem = (item, index) => {
      if (!item) {
        return null;
      }

      if (typeof item === "string") {
        const fileName = item.split("/").pop() || `Attachment ${index + 1}`;
        const isImage = /^data:image\//i.test(item) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(item);

        return {
          id: `${fileName}-${index}`,
          name: fileName,
          url: item,
          isImage,
        };
      }

      const url =
        item.url ||
        item.path ||
        item.src ||
        item.downloadUrl ||
        item.fileUrl ||
        item.base64 ||
        item.data ||
        item.secure_url ||
        "";
      const name =
        item.name ||
        item.fileName ||
        item.originalName ||
        item.filename ||
        item.public_id ||
        url.split("/").pop() ||
        `Attachment ${index + 1}`;
      const type = item.type || item.mimeType || item.contentType || "";
      const isImage =
        Boolean(item.isImage) ||
        type.startsWith("image/") ||
        /^data:image\//i.test(url) ||
        /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url || name);

      return url
        ? {
            id: item._id || item.id || `${name}-${index}`,
            name,
            url,
            isImage,
          }
        : null;
    };

    const attachmentCandidates = [
      report?.attachments,
      report?.files,
      report?.images,
      report?.attachment,
      report?.file,
      report?.image,
      report?.photos,
      report?.photo,
      report?.media,
      report?.mediaFiles,
      report?.documents,
      report?.document,
      report?.evidence,
      report?.evidences,
      report?.proof,
      report?.proofs,
    ]
      .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
      .filter(Boolean);

    const discoveredObjectAttachments = Object.values(report || {})
      .filter((value) => value && typeof value === "object")
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map((value, index) => normalizeAttachmentItem(value, attachmentCandidates.length + index))
      .filter(Boolean);

    const allAttachments = [...attachmentCandidates, ...discoveredObjectAttachments]
      .map((item, index) => normalizeAttachmentItem(item, index))
      .filter(Boolean);

    return allAttachments.filter(
      (attachment, index, items) => items.findIndex((item) => item.url === attachment.url && item.name === attachment.name) === index
    );
  };

  const handleRequestDeleteReport = (report) => {
    setDeleteError("");
    setReportPendingDelete(report);
  };

  const handleCancelDeleteReport = () => {
    if (isDeletingReport) {
      return;
    }

    setDeleteError("");
    setReportPendingDelete(null);
  };

  const findReportForNotification = (notification) => {
    if (notification.reportId) {
      return reports.find((report) => report._id === notification.reportId) || null;
    }

    const description = notification.description || "";
    const submittedMatch = description.match(/^A new (.+) report was submitted in (.+)\.$/i);

    if (submittedMatch) {
      const [, category, purok] = submittedMatch;

      return (
        [...reports]
          .sort((leftReport, rightReport) => {
            const leftTime = new Date(leftReport.createdAt || 0).getTime();
            const rightTime = new Date(rightReport.createdAt || 0).getTime();
            return rightTime - leftTime;
          })
          .find((report) => {
            const reportCategory = String(report.category || "").trim().toLowerCase();
            const reportPurok = String(report.purok || "an unspecified purok").trim().toLowerCase();

            return (
              reportCategory === category.trim().toLowerCase() &&
              reportPurok === purok.trim().toLowerCase()
            );
          }) || null
      );
    }

    return null;
  };

  const handleOpenNotification = async (notification) => {
    const targetReport = findReportForNotification(notification);

    if (targetReport) {
      setSelectedReport(targetReport);
    }

    if (notification.read) {
      return;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((currentNotification) =>
        currentNotification._id === notification.id
          ? {
              ...currentNotification,
              read: true,
            }
          : currentNotification
      )
    );

    try {
      await markNotificationAsRead(notification.id);
    } catch (error) {
      console.error(error);
      await loadNotifications();
    }
  };

  const handleDismissNotification = async (notificationId) => {
    setDismissedNotificationIds((currentIds) =>
      currentIds.includes(notificationId) ? currentIds : [...currentIds, notificationId]
    );

    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification._id !== notificationId)
    );

    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error(error);

      try {
        await markNotificationAsRead(notificationId);
      } catch (markReadError) {
        console.error(markReadError);
      }
    }
  };

  const handleConfirmDeleteReport = async () => {
    if (!reportPendingDelete || isDeletingReport) {
      return;
    }

    const reportToDelete = reportPendingDelete;
    const previousReports = reports;
    const wasSelectedReport = selectedReport?._id === reportToDelete._id;
    const nextReports = reports.filter((report) => report._id !== reportToDelete._id);

    setIsDeletingReport(true);
    setDeleteError("");
    updateReportsState(nextReports);
    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => !isNotificationLinkedToReport(notification, reportToDelete))
    );

    if (wasSelectedReport) {
      setSelectedReport(null);
    }

    try {
      await deleteReport(reportToDelete._id);
      setReportPendingDelete(null);
      await loadNotifications();
    } catch (error) {
      console.error(error);
      updateReportsState(previousReports);
      await loadNotifications();

      if (wasSelectedReport) {
        setSelectedReport(reportToDelete);
      }

      setDeleteError("Unable to delete the report right now. Please try again.");
    } finally {
      setIsDeletingReport(false);
    }
  };

  return (
    <div className="barangay-dashboard">
      <AdminNavbar
        adminName={adminUser?.name || "Administrator"}
        onAddResident={handleOpenAddResident}
        onManageResidents={handleOpenManageResidents}
        onViewProfile={handleOpenProfile}
        onRequestLogout={handleRequestLogout}
      />

      <div className="barangay-dashboard__content">
        <main className="barangay-dashboard__main">
          <HeaderDashboard
            stats={stats}
            notifications={dropdownNotifications}
            unreadNotificationCount={unreadNotificationCount}
            onOpenNotification={handleOpenNotification}
            onDismissNotification={handleDismissNotification}
          />

          <ReportsSection
            id="reports"
            title={selectedDate ? "Reports for Selected Date" : "Today's Reports"}
            subtitle={
              selectedDate
                ? `Showing reports filed on ${formatLongDate(selectedDate)}`
                : "Quick access to reports filed today."
            }
            action={
              <FilterBar
                label="Filter Today's Reports"
                selectedStatus={todayStatusFilter}
                onStatusChange={setTodayStatusFilter}
                searchTerm=""
                onSearchChange={() => {}}
                selectedDateLabel=""
                showSearch={false}
                showDatePill={false}
              />
            }
          >
            {featuredReports.length === 0 ? (
              <div className="dashboard-report-scroll dashboard-report-scroll--today dashboard-report-scroll--empty">
                <p className="dashboard-empty-state">No reports found for the current selection.</p>
              </div>
            ) : (
              <div className="dashboard-report-scroll dashboard-report-scroll--today">
                <div className={["report-grid", "report-grid--today"].filter(Boolean).join(" ")}>
                  {featuredReports.map((report) => (
                    <ReportCardAdmin
                      key={report._id}
                      report={report}
                      onView={setSelectedReport}
                      onStatusChange={handleStatusChange}
                      onDelete={handleRequestDeleteReport}
                      statusUpdating={statusUpdating[report._id]}
                      deletePending={isDeletingReport && reportPendingDelete?._id === report._id}
                      showDescription={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </ReportsSection>

          <ReportsSection
            id="purok"
            title="Reports by Purok"
            subtitle="Live purok distribution based on the active filters."
            action={
              <FilterBar
                label="Filter Purok Summary"
                selectedStatus={purokStatusFilter}
                onStatusChange={setPurokStatusFilter}
                searchTerm=""
                onSearchChange={() => {}}
                selectedDateLabel=""
                showSearch={false}
                showDatePill={false}
              />
            }
          >
            {visiblePurokSummary.length === 0 ? (
              <p className="dashboard-empty-state">No purok data available for the current filters.</p>
            ) : (
              <div className="purok-grid">
                {visiblePurokSummary.map((item) => (
                  <article key={item.purok} className="purok-card">
                    <span className="purok-card__label">{item.purok}</span>
                    <strong>{item.totalReports}</strong>
                    <p>{item.totalReports} report{item.totalReports === 1 ? "" : "s"}</p>
                  </article>
                ))}
              </div>
            )}
          </ReportsSection>

          <ReportsSection
            id="analytics"
            className="dashboard-panel--wide"
            title="Analytics"
            subtitle="Admin-only insights for weekly, monthly, and yearly report trends."
          >
            <AnalyticsDashboard reports={reports} />
          </ReportsSection>

          <ReportsSection
            id="all-reports"
            className="dashboard-panel--wide"
            title="All Reports"
            subtitle="Every report updates instantly as the date and status filters change."
            action={
              <FilterBar
                label="Filter All Reports"
                selectedStatus={allReportsStatusFilter}
                onStatusChange={setAllReportsStatusFilter}
                searchTerm={allReportsSearchTerm}
                onSearchChange={setAllReportsSearchTerm}
                selectedDateLabel=""
                showDatePill={false}
                dateValue={allReportsDateFilter}
                dateLabel={allReportsDateFilter ? formatLongDate(toDate(allReportsDateFilter)) : "All dates"}
                onDateChange={setAllReportsDateFilter}
                onDateClear={() => setAllReportsDateFilter("")}
              />
            }
          >
            {allReportsFiltered.length === 0 ? (
              <p className="dashboard-empty-state">No reports match the active filters.</p>
            ) : (
              <div className="dashboard-report-scroll dashboard-report-scroll--all">
                <div className="report-grid report-grid--compact">
                  {allReportsFiltered.map((report) => (
                    <ReportCardAdmin
                      key={report._id}
                      report={report}
                      onView={setSelectedReport}
                      onStatusChange={handleStatusChange}
                      onDelete={handleRequestDeleteReport}
                      statusUpdating={statusUpdating[report._id]}
                      deletePending={isDeletingReport && reportPendingDelete?._id === report._id}
                    />
                  ))}
                </div>
              </div>
            )}
          </ReportsSection>
        </main>

        <AdminSidebar
          reports={recentRequests}
          selectedDate={selectedDate}
          viewDate={viewDate}
          reportDates={highlightedReportDates}
          onSelectDate={handleDateSelect}
          onPreviousMonth={() =>
            setViewDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
          }
          onNextMonth={() =>
            setViewDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
          }
          onSelectMonth={handleMonthSelect}
          onSelectYear={handleYearSelect}
          onClearDate={() => setSelectedDate(null)}
          onViewReport={setSelectedReport}
          onDeleteReport={handleRequestDeleteReport}
          deletingReportId={isDeletingReport ? reportPendingDelete?._id : null}
        />
      </div>

      {isAddResidentOpen ? (
        <div className="report-modal" role="dialog" aria-modal="true">
          <div className="report-modal__backdrop" />
          <section className="report-modal__card report-modal__card--resident">
            <div className="report-modal__header">
              <div className="report-modal__hero report-modal__hero--dark">
                <p className="report-modal__eyebrow report-modal__eyebrow--blue">Resident Registration</p>
                <h2>Add Resident</h2>
                <p className="resident-modal__subtitle">
                  Create a resident account without leaving the dashboard.
                </p>
              </div>
              <button type="button" className="report-modal__close" onClick={handleRequestCloseAddResident}>
                Close
              </button>
            </div>

            <div className="report-modal__body">
              <form className="resident-modal__form" onSubmit={handleCreateResident} autoComplete="off">
                <input className="resident-modal__autofill-trap" type="text" name="fake-username" autoComplete="username" tabIndex="-1" />
                <input
                  className="resident-modal__autofill-trap"
                  type="password"
                  name="fake-password"
                  autoComplete="current-password"
                  tabIndex="-1"
                />
                <div className="resident-modal__grid">
                  <label className="resident-modal__field resident-modal__field--wide">
                    <span>Email</span>
                    <input
                      type="email"
                      value={residentForm.email}
                      onChange={handleResidentInputChange("email")}
                      placeholder="Enter email address"
                      aria-invalid={Boolean(residentErrors.email)}
                      name="resident-email"
                      autoComplete="new-password"
                      spellCheck="false"
                      required
                    />
                    {residentErrors.email ? <small className="resident-modal__field-error">{residentErrors.email}</small> : null}
                  </label>

                  <label className="resident-modal__field">
                    <span>Password</span>
                    <div className="resident-modal__input-wrap">
                      <input
                        key={`resident-password-${residentAutocompleteSeed}`}
                        type="text"
                        value={residentForm.password}
                        onChange={handleResidentInputChange("password")}
                        onFocus={unlockResidentField("password")}
                        placeholder="Enter password"
                        aria-invalid={Boolean(residentErrors.password)}
                        name={`resident-password-${residentAutocompleteSeed}`}
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                        readOnly={residentFieldLocks.password}
                        style={getResidentMaskedInputStyle(isPasswordVisible)}
                        required
                      />
                      <button
                        type="button"
                        className="resident-modal__toggle"
                        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                        onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
                      >
                        <EyeIcon isVisible={isPasswordVisible} />
                      </button>
                    </div>
                    {residentForm.password ? (
                      <div className="resident-modal__strength">
                        <div className="resident-modal__strength-track">
                          <span
                            className={["resident-modal__strength-fill", getPasswordStrength(residentForm.password)?.className]
                              .filter(Boolean)
                              .join(" ")}
                          />
                        </div>
                        <small>{getPasswordStrength(residentForm.password)?.label}</small>
                      </div>
                    ) : null}
                    {residentErrors.password ? <small className="resident-modal__field-error">{residentErrors.password}</small> : null}
                  </label>

                  <label className="resident-modal__field">
                    <span>Confirm Password</span>
                    <div className="resident-modal__input-wrap">
                      <input
                        key={`resident-confirm-password-${residentAutocompleteSeed}`}
                        type="text"
                        value={residentForm.confirmPassword}
                        onChange={handleResidentInputChange("confirmPassword")}
                        onFocus={unlockResidentField("confirmPassword")}
                        placeholder="Confirm password"
                        aria-invalid={Boolean(residentErrors.confirmPassword)}
                        name={`resident-confirm-password-${residentAutocompleteSeed}`}
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                        readOnly={residentFieldLocks.confirmPassword}
                        style={getResidentMaskedInputStyle(isConfirmPasswordVisible)}
                        required
                      />
                      <button
                        type="button"
                        className="resident-modal__toggle"
                        aria-label={isConfirmPasswordVisible ? "Hide confirm password" : "Show confirm password"}
                        onClick={() => setIsConfirmPasswordVisible((currentValue) => !currentValue)}
                      >
                        <EyeIcon isVisible={isConfirmPasswordVisible} />
                      </button>
                    </div>
                    {residentErrors.confirmPassword ? (
                      <small className="resident-modal__field-error">{residentErrors.confirmPassword}</small>
                    ) : null}
                  </label>

                  <label className="resident-modal__field resident-modal__field--wide">
                    <span>Full Name</span>
                    <input
                      key={`resident-full-name-${residentAutocompleteSeed}`}
                      type="text"
                      value={residentForm.fullName}
                      onChange={handleResidentInputChange("fullName")}
                      onFocus={unlockResidentField("fullName")}
                      placeholder="Enter full name"
                      aria-invalid={Boolean(residentErrors.fullName)}
                      name={`resident-full-name-${residentAutocompleteSeed}`}
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      readOnly={residentFieldLocks.fullName}
                      spellCheck="false"
                      autoCapitalize="words"
                      autoCorrect="off"
                      required
                    />
                    {residentErrors.fullName ? (
                      <small className="resident-modal__field-error">{residentErrors.fullName}</small>
                    ) : null}
                  </label>

                  <label className="resident-modal__field">
                    <span>Purok Number</span>
                    <select
                      value={residentForm.purokNumber}
                      onChange={handleResidentInputChange("purokNumber")}
                      aria-invalid={Boolean(residentErrors.purokNumber)}
                      required
                    >
                      <option value="">Select purok</option>
                      {PUROK_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {residentErrors.purokNumber ? (
                      <small className="resident-modal__field-error">{residentErrors.purokNumber}</small>
                    ) : null}
                  </label>

                  <label className="resident-modal__field">
                    <span>Contact Number</span>
                    <input
                      type="text"
                      value={residentForm.contactNumber}
                      onChange={handleResidentInputChange("contactNumber")}
                      placeholder="Enter contact number"
                      aria-invalid={Boolean(residentErrors.contactNumber)}
                      inputMode="numeric"
                      pattern="09[0-9]{9}"
                      autoComplete="new-password"
                      required
                    />
                    {residentErrors.contactNumber ? (
                      <small className="resident-modal__field-error">{residentErrors.contactNumber}</small>
                    ) : null}
                  </label>

                  <label className="resident-modal__field">
                    <span>Age</span>
                    <input
                      type="number"
                      min="1"
                      value={residentForm.age}
                      onChange={handleResidentInputChange("age")}
                      placeholder="Enter age"
                      aria-invalid={Boolean(residentErrors.age)}
                      required
                    />
                    {residentErrors.age ? <small className="resident-modal__field-error">{residentErrors.age}</small> : null}
                  </label>

                  <label className="resident-modal__field">
                    <span>Gender</span>
                    <select
                      value={residentForm.gender}
                      onChange={handleResidentInputChange("gender")}
                      aria-invalid={Boolean(residentErrors.gender)}
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {residentErrors.gender ? <small className="resident-modal__field-error">{residentErrors.gender}</small> : null}
                  </label>
                </div>

                {residentSubmitError ? <p className="report-modal__error">{residentSubmitError}</p> : null}

                <div className="resident-modal__actions">
                  <button
                    type="button"
                    className="report-action-button report-action-button--ghost"
                    onClick={handleRequestCloseAddResident}
                    disabled={isCreatingResident}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="report-action-button report-action-button--blue" disabled={isCreatingResident}>
                    {isCreatingResident ? "Adding Resident..." : "Add Resident"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      ) : null}

      {isDiscardResidentConfirmOpen ? (
        <div className="report-modal" role="dialog" aria-modal="true">
          <div className="report-modal__backdrop" onClick={() => setIsDiscardResidentConfirmOpen(false)} />
          <section className="report-modal__card report-modal__card--confirm report-modal__card--decision">
            <div className="report-modal__header">
              <div className="report-modal__hero report-modal__hero--dark">
                <p className="report-modal__eyebrow">Discard Changes?</p>
                <h2 className="report-modal__confirm-title">Discard resident details?</h2>
                <p className="report-modal__confirm-copy">
                  You have unsaved resident information. If you leave now, the details you entered will be lost.
                </p>
              </div>
            </div>

            <div className="report-modal__body">
              <div className="report-modal__decision-card">
                <span className="report-modal__label">Current action</span>
                <p>Close the Add Resident form without saving.</p>
              </div>
              <div className="report-modal__actions report-modal__actions--confirm">
                <button
                  type="button"
                  className="report-action-button report-action-button--ghost"
                  onClick={() => setIsDiscardResidentConfirmOpen(false)}
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  className="report-action-button report-action-button--danger"
                  onClick={closeAddResidentImmediately}
                >
                  Discard
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {isResidentSuccessOpen ? (
        <div className="report-modal" role="dialog" aria-modal="true">
          <div className="report-modal__backdrop" onClick={() => setIsResidentSuccessOpen(false)} />
          <section className="report-modal__card report-modal__card--confirm report-modal__card--decision">
            <div className="report-modal__header">
              <div className="report-modal__hero report-modal__hero--dark">
                <p className="report-modal__eyebrow report-modal__eyebrow--blue">Success</p>
                <h2 className="report-modal__confirm-title">Resident Successfully Registered</h2>
                <p className="report-modal__confirm-copy">
                  The resident account has been created successfully. You can continue managing residents from the dashboard.
                </p>
              </div>
            </div>

            <div className="report-modal__body">
              <div className="report-modal__decision-card">
                <span className="report-modal__label">Registration completed</span>
                <p>The new resident information has been saved and the account is ready to use.</p>
              </div>
              <div className="report-modal__actions report-modal__actions--confirm">
                <button
                  type="button"
                  className="report-action-button report-action-button--blue"
                  onClick={() => setIsResidentSuccessOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {isManageResidentsOpen ? (
        <div className="report-modal" role="dialog" aria-modal="true">
          <div className="report-modal__backdrop" onClick={handleCloseManageResidents} />
          <section className="report-modal__card report-modal__card--resident-management">
            <div className="report-modal__header">
              <div className="report-modal__hero report-modal__hero--dark">
                <p className="report-modal__eyebrow report-modal__eyebrow--blue">Residents Directory</p>
                <h2>Manage Residents</h2>
                <p className="resident-modal__subtitle">
                  Review resident accounts, open their details, and remove accounts when needed.
                </p>
              </div>
              <button type="button" className="report-modal__close" onClick={handleCloseManageResidents}>
                Close
              </button>
            </div>

            <div className="report-modal__body">
              <div className="resident-management">
                <div className="resident-management__summary">
                  <article className="resident-management__summary-card">
                    <span>Total Residents</span>
                    <strong>{residentSummary.total}</strong>
                    <p>Live resident accounts currently available in the system.</p>
                  </article>
                  <article className="resident-management__summary-card">
                    <span>Puroks Covered</span>
                    <strong>{residentSummary.puroksCovered}</strong>
                    <p>Resident records distributed across registered puroks.</p>
                  </article>
                </div>

                <div className="resident-management__toolbar">
                  <label className="resident-management__search">
                    <span>Search Residents</span>
                    <input
                      type="text"
                      value={residentsSearchTerm}
                      onChange={(event) => setResidentsSearchTerm(event.target.value)}
                      placeholder="Search by name, email, purok, contact, or gender"
                    />
                  </label>

                  <button
                    type="button"
                    className="report-action-button report-action-button--ghost"
                    onClick={() => loadResidents()}
                    disabled={isResidentsLoading}
                  >
                    {isResidentsLoading ? "Refreshing..." : "Refresh List"}
                  </button>
                </div>

                {residentsError ? <p className="report-modal__error">{residentsError}</p> : null}
                {residentDetailsError ? <p className="report-modal__error">{residentDetailsError}</p> : null}

                {isResidentsLoading ? (
                  <div className="resident-management__empty">
                    <p className="dashboard-empty-state">Loading resident accounts...</p>
                  </div>
                ) : visibleResidents.length === 0 ? (
                  <div className="resident-management__empty">
                    <p className="dashboard-empty-state">
                      {residentsSearchTerm.trim()
                        ? "No residents match the current search."
                        : "No resident accounts are available yet."}
                    </p>
                  </div>
                ) : (
                  <div className="resident-management__grid">
                    {visibleResidents.map((resident) => (
                      <article key={resident._id} className="resident-card">
                        <div className="resident-card__main">
                          <div className="resident-card__identity">
                            <span className="resident-card__avatar">
                              {(resident.name || resident.email || "R").trim().slice(0, 1).toUpperCase()}
                            </span>
                            <div className="resident-card__copy">
                              <h3>{resident.name || "Unnamed Resident"}</h3>
                              <p>{resident.email || "No email available"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="resident-card__side">
                          <div className="resident-card__actions">
                            <button
                              type="button"
                              className="report-action-button report-action-button--ghost"
                              onClick={() => handleViewResidentDetails(resident._id)}
                              disabled={isResidentDetailsLoading || isDeletingResident}
                            >
                              View Details
                            </button>
                            <button
                              type="button"
                              className="report-action-button report-action-button--danger"
                              onClick={() => handleRequestDeleteResident(resident)}
                              disabled={isDeletingResident}
                            >
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {selectedResidentDetails ? (
        <div className="report-modal report-modal--stacked" role="dialog" aria-modal="true">
          <div className="report-modal__backdrop" onClick={handleCloseResidentDetails} />
          <section className="report-modal__card report-modal__card--resident-details">
            <div className="report-modal__header">
              <div className="report-modal__hero report-modal__hero--dark">
                <p className="report-modal__eyebrow report-modal__eyebrow--blue">Resident Details</p>
                <h2>{selectedResidentDetails.name || "Resident Information"}</h2>
                <p className="resident-modal__subtitle">
                  Review the resident account information saved from the registration form.
                </p>
              </div>
              <button type="button" className="report-modal__close" onClick={handleCloseResidentDetails}>
                Close
              </button>
            </div>

            <div className="report-modal__body">
              <div className="resident-details">
                <div className="resident-details__hero">
                  <span className="resident-details__avatar">
                    {(selectedResidentDetails.name || selectedResidentDetails.email || "R").trim().slice(0, 1).toUpperCase()}
                  </span>
                  <div className="resident-details__hero-copy">
                    <strong>{selectedResidentDetails.name || "Unnamed Resident"}</strong>
                    <span>{selectedResidentDetails.email || "No email available"}</span>
                    <small>
                      {selectedResidentDetails.createdAt
                        ? `Registered ${formatLongDate(selectedResidentDetails.createdAt)}`
                        : "Registration date unavailable"}
                    </small>
                  </div>
                </div>

                <div className="resident-details__panel">
                  <div className="resident-details__panel-header">
                    <div>
                      <span className="report-modal__eyebrow report-modal__eyebrow--blue">Resident Record</span>
                      <h3>Account Information</h3>
                    </div>
                    <p>Complete resident account details from the current registration data.</p>
                  </div>

                  <div className="resident-details__grid">
                    {RESIDENT_DETAILS_FIELDS.map((field) => (
                      <article key={field.key} className="resident-details__card">
                        <span>{field.label}</span>
                        <strong>
                          {field.formatter
                            ? getResidentDisplayValue(selectedResidentDetails, field.key) === "Not available"
                              ? "Not available"
                              : field.formatter(selectedResidentDetails[field.key])
                            : getResidentDisplayValue(selectedResidentDetails, field.key)}
                        </strong>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="resident-details__panel">
                  <div className="resident-details__panel-header">
                    <div>
                      <span className="report-modal__eyebrow report-modal__eyebrow--blue">Summary of Reports</span>
                      <h3>Resident Report Activity</h3>
                    </div>
                    <p>Report totals for the selected resident only.</p>
                  </div>

                  {residentReportSummaryError ? <p className="report-modal__error">{residentReportSummaryError}</p> : null}

                  {isResidentReportSummaryLoading ? (
                    <div className="resident-details__summary-empty">
                      <p className="dashboard-empty-state">Loading report summary...</p>
                    </div>
                  ) : (
                    <div className="resident-details__summary-grid">
                      {residentReportSummaryCards.map((item) => (
                        <article
                          key={item.label}
                          className={["resident-details__summary-card", `resident-details__summary-card--${item.tone}`].join(" ")}
                        >
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {residentPendingDelete ? (
        <div className="report-modal" role="dialog" aria-modal="true">
          <div className="report-modal__backdrop" onClick={() => (!isDeletingResident ? setResidentPendingDelete(null) : null)} />
          <section className="report-modal__card report-modal__card--confirm report-modal__card--decision">
            <div className="report-modal__header">
              <div className="report-modal__hero report-modal__hero--dark">
                <p className="report-modal__eyebrow">Resident Deletion</p>
                <h2 className="report-modal__confirm-title">Delete Resident Account?</h2>
                <p className="report-modal__confirm-copy">
                  Are you sure you want to delete this resident account? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="report-modal__body">
              <div className="report-modal__decision-card resident-delete-card">
                <span className="report-modal__label">Selected resident</span>
                <strong>{residentPendingDelete.name || "Unnamed Resident"}</strong>
                <p>{residentPendingDelete.email || "No email available"}</p>
              </div>

              {deleteResidentError ? <p className="report-modal__error">{deleteResidentError}</p> : null}

              <div className="report-modal__actions report-modal__actions--confirm">
                <button
                  type="button"
                  className="report-action-button report-action-button--ghost"
                  onClick={() => setResidentPendingDelete(null)}
                  disabled={isDeletingResident}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="report-action-button report-action-button--danger"
                  onClick={handleConfirmDeleteResident}
                  disabled={isDeletingResident}
                >
                  {isDeletingResident ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {isProfileModalOpen ? (
        <div className="report-modal" role="dialog" aria-modal="true">
          <div className="report-modal__backdrop" onClick={handleCloseProfile} />
          <section className="report-modal__card report-modal__card--profile">
            <div className="report-modal__header">
              <div className="report-modal__hero report-modal__hero--dark">
                <p className="report-modal__eyebrow report-modal__eyebrow--blue">Admin Profile</p>
                <h2>{profileName}</h2>
                <p className="resident-modal__subtitle">Overview of the current authenticated admin account.</p>
              </div>
              <button type="button" className="report-modal__close" onClick={handleCloseProfile}>
                Close
              </button>
            </div>

            <div className="report-modal__body">
              <div className="profile-modal__hero-card">
                <div className="profile-modal__avatar">{profileName.trim().slice(0, 1).toUpperCase()}</div>
                <div className="profile-modal__hero-copy">
                  <strong>{profileName}</strong>
                  <span>{profileEmail}</span>
                  <small>{profileRole === "admin" ? "Barangay Administrator" : profileRole}</small>
                </div>
              </div>

              <div className="profile-modal__grid">
                <div className="delete-report-summary__item profile-modal__detail-card">
                  <span className="report-modal__label">Full Name</span>
                  <p>{profileName}</p>
                </div>
                <div className="delete-report-summary__item profile-modal__detail-card">
                  <span className="report-modal__label">Email</span>
                  <p>{profileEmail}</p>
                </div>
                <div className="delete-report-summary__item profile-modal__detail-card">
                  <span className="report-modal__label">Account Type</span>
                  <p>{profileRole === "admin" ? "Administrator" : "Standard Account"}</p>
                </div>
                <div className="delete-report-summary__item profile-modal__detail-card">
                  <span className="report-modal__label">Status</span>
                  <p>Active Session</p>
                </div>
              </div>

              <div className="profile-modal__summary">
                <div className="profile-modal__summary-header">
                  <span className="report-modal__label">Summary of Reports</span>
                  <p>Snapshot of current report activity from the existing dashboard data.</p>
                </div>
                <div className="profile-modal__summary-grid">
                  {profileReportSummary.map((item) => (
                    <div key={item.label} className="profile-modal__summary-card">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {isLogoutConfirmOpen ? (
        <div className="report-modal" role="dialog" aria-modal="true">
          <div className="report-modal__backdrop" onClick={() => setIsLogoutConfirmOpen(false)} />
          <section className="report-modal__card report-modal__card--confirm report-modal__card--decision">
            <div className="report-modal__header">
              <div className="report-modal__hero report-modal__hero--dark">
                <p className="report-modal__eyebrow">Confirm Logout</p>
                <h2 className="report-modal__confirm-title">Log out of the admin dashboard?</h2>
                <p className="report-modal__confirm-copy">
                  You will end the current admin session and return to the login screen.
                </p>
              </div>
            </div>

            <div className="report-modal__body">
              <div className="report-modal__decision-card">
                <span className="report-modal__label">Signed in as</span>
                <p>{adminUser?.email || adminUser?.name || "Administrator"}</p>
              </div>
              <div className="report-modal__actions report-modal__actions--confirm">
                <button
                  type="button"
                  className="report-action-button report-action-button--ghost"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="report-action-button report-action-button--danger"
                  onClick={handleLogout}
                >
                  Confirm Logout
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {selectedReport ? (
        <div className="report-modal" role="dialog" aria-modal="true">
          <div className="report-modal__backdrop" onClick={() => setSelectedReport(null)} />
          <section className="report-modal__card report-modal__card--details">
            <div className="report-modal__header">
              <div className="report-modal__hero">
                <p className="report-modal__eyebrow">{getResidentName(selectedReport)}</p>
                <h2>{selectedReport.category}</h2>
                <span className={`report-status report-status--${selectedReport.status}`}>
                  {getStatusLabel(selectedReport.status)}
                </span>
              </div>
              <div className="report-modal__header-actions" ref={reportActionsRef}>
                <button type="button" className="report-modal__close" onClick={() => setSelectedReport(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className={["report-modal__menu-trigger", isReportActionsOpen ? "is-active" : ""].filter(Boolean).join(" ")}
                  aria-label="Report actions"
                  aria-expanded={isReportActionsOpen}
                  onClick={() => setIsReportActionsOpen((currentValue) => !currentValue)}
                >
                  <span />
                  <span />
                  <span />
                </button>

                {isReportActionsOpen ? (
                  <div className="report-modal__menu">
                    <button
                      type="button"
                      className="report-modal__menu-item report-modal__menu-item--blue"
                      disabled={
                        selectedReport.status === "in_progress" || Boolean(statusUpdating[selectedReport._id])
                      }
                      onClick={() => {
                        setIsReportActionsOpen(false);
                        handleStatusChange(selectedReport._id, "in_progress");
                      }}
                    >
                      {selectedReport.status === "in_progress" ? "Already Ongoing" : "Mark as Ongoing"}
                    </button>
                    <button
                      type="button"
                      className="report-modal__menu-item report-modal__menu-item--green"
                      disabled={
                        selectedReport.status === "resolved" || Boolean(statusUpdating[selectedReport._id])
                      }
                      onClick={() => {
                        setIsReportActionsOpen(false);
                        handleStatusChange(selectedReport._id, "resolved");
                      }}
                    >
                      {selectedReport.status === "resolved" ? "Already Resolved" : "Mark as Resolved"}
                    </button>
                    <button
                      type="button"
                      className="report-modal__menu-item report-modal__menu-item--danger"
                      onClick={() => {
                        setIsReportActionsOpen(false);
                        handleRequestDeleteReport(selectedReport);
                      }}
                    >
                      Delete Report
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="report-modal__body">
              {(() => {
                const residentId = getReportResidentId(selectedReport);
                const isResidentProfileAvailable = Boolean(residentId);

                return (
              <div className="report-modal__info-grid">
                <div className="report-modal__info-card">
                  <span className="report-modal__label">Date Filed</span>
                  <p>{formatDateTime(selectedReport.createdAt)}</p>
                </div>
                <div className="report-modal__info-card">
                  <span className="report-modal__label">Purok</span>
                  <p>{selectedReport.purok || "N/A"}</p>
                </div>
                <div className="report-modal__info-card">
                  <span className="report-modal__label">Location</span>
                  <p>{selectedReport.location || "Location unavailable"}</p>
                </div>
                <div className="report-modal__info-card">
                  <span className="report-modal__label">Resident</span>
                  <div className="report-modal__resident-row">
                    {isResidentProfileAvailable ? (
                      <button
                        type="button"
                        className="report-modal__resident-name-button"
                        onClick={() => handleViewResidentDetails(residentId)}
                        disabled={isResidentDetailsLoading}
                        title="View resident profile"
                        aria-label="Open resident profile"
                      >
                        {getResidentName(selectedReport)}
                      </button>
                    ) : (
                      <p>{getResidentName(selectedReport)}</p>
                    )}
                  </div>
                </div>
              </div>
                );
              })()}

              <div className="report-modal__description">
                <span className="report-modal__label">Description</span>
                <p>{selectedReport.description}</p>
              </div>

              {getReportAttachments(selectedReport).length ? (
                <div className="report-modal__attachments">
                  <span className="report-modal__label">Attachments</span>
                  <div className="report-modal__attachments-list">
                    {getReportAttachments(selectedReport).map((attachment) => (
                      <article key={attachment.id} className="report-modal__attachment-card">
                        {attachment.isImage ? (
                          <img src={attachment.url} alt={attachment.name} className="report-modal__report-image" />
                        ) : (
                          <div className="report-modal__report-file">
                            <strong>{attachment.name}</strong>
                            <span>File attachment</span>
                          </div>
                        )}

                        <div className="report-modal__report-file-meta">
                          <p>{attachment.name}</p>
                          <a href={attachment.url} target="_blank" rel="noreferrer">
                            View attachment
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              {statusUpdating[selectedReport._id] ? (
                <div className="report-status-feedback">
                  <span className="report-status-feedback__spinner" />
                  Updating...
                </div>
              ) : null}

              <div className="report-modal__comments">
                <div className="report-modal__comments-header">
                  <h3>Barangay Admin Feedback</h3>
                  <span>{selectedReport.comments?.length || 0} total</span>
                </div>

                <div className="report-modal__comment-list">
                  {selectedReport.comments?.length ? (
                    selectedReport.comments.map((comment) => {
                      const commentAttachment = getCommentAttachment(comment);

                      return (
                      <article
                        key={comment._id || `${comment.text}-${comment.date}`}
                        className={["comment-card", recentCommentId && comment._id === recentCommentId ? "comment-card--new" : ""]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className="comment-card__header">
                          <div>
                            <strong>{comment.user?.name || "Admin"}</strong>
                            <span>{formatDateTime(comment.date)}</span>
                          </div>
                          <div className="comment-card__actions">
                            <button
                              type="button"
                              className={["comment-card__menu-trigger", activeCommentMenuId === comment._id ? "is-active" : ""]
                                .filter(Boolean)
                                .join(" ")}
                              aria-label="Comment actions"
                              aria-expanded={activeCommentMenuId === comment._id}
                              onClick={() =>
                                setActiveCommentMenuId((currentValue) => (currentValue === comment._id ? null : comment._id))
                              }
                            >
                              <span />
                              <span />
                              <span />
                            </button>

                            {activeCommentMenuId === comment._id ? (
                              <div className="comment-card__menu">
                                <button
                                  type="button"
                                  className="comment-card__menu-item"
                                  onClick={() => handleStartEditComment(comment)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="comment-card__menu-item comment-card__menu-item--danger"
                                  onClick={() => handleRequestDeleteComment(comment)}
                                >
                                  Delete
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {editingCommentId === comment._id ? (
                          <div className="comment-card__editor">
                            <input
                              type="text"
                              value={editingCommentText}
                              onChange={(event) => {
                                setEditingCommentText(event.target.value);
                                if (commentActionError) {
                                  setCommentActionError("");
                                }
                              }}
                              placeholder="Edit admin comment"
                            />
                            <div className="comment-card__editor-actions">
                              <button
                                type="button"
                                className="report-action-button report-action-button--ghost"
                                disabled={isSavingCommentEdit}
                                onClick={handleCancelEditComment}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="report-action-button report-action-button--blue"
                                disabled={isSavingCommentEdit}
                                onClick={handleSaveCommentEdit}
                              >
                                {isSavingCommentEdit ? "Saving..." : "Save"}
                              </button>
                            </div>
                            {editingCommentId === comment._id && commentActionError ? (
                              <p className="report-modal__error">{commentActionError}</p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="comment-card__content">
                            {comment.text ? <p>{comment.text}</p> : null}
                            {commentAttachment ? (
                              <div className="comment-card__attachment">
                                {commentAttachment.isImage ? (
                                  <div className="comment-card__attachment-image-wrap">
                                    <a href={commentAttachment.url} target="_blank" rel="noreferrer">
                                      <img
                                        src={commentAttachment.url}
                                        alt={commentAttachment.name}
                                        className="comment-card__attachment-image"
                                      />
                                    </a>
                                    <a
                                      href={commentAttachment.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="comment-card__attachment-link"
                                    >
                                      View Image
                                    </a>
                                  </div>
                                ) : commentAttachment.url ? (
                                  <a
                                    href={commentAttachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="comment-card__attachment-file"
                                  >
                                    <strong>{commentAttachment.name}</strong>
                                    <span>Open attachment</span>
                                  </a>
                                ) : (
                                  <div className="comment-card__attachment-file">
                                    <strong>{commentAttachment.name}</strong>
                                    <span>Attachment unavailable</span>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </article>
                    )})
                  ) : (
                    <p className="dashboard-empty-state">No comments yet for this report.</p>
                  )}
                </div>

                <div className="report-modal__comment-form">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(event) => {
                      setCommentText(event.target.value);
                      if (commentActionError) {
                        setCommentActionError("");
                      }
                    }}
                    placeholder="Add a comment"
                  />
                  <label className="report-modal__attachment">
                    <span>Attach file or photo</span>
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(event) => {
                        setAttachmentFile(event.target.files?.[0] || null);
                        if (commentActionError) {
                          setCommentActionError("");
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="report-action-button report-action-button--ghost"
                    onClick={handleAddComment}
                    disabled={isAddingComment}
                  >
                    {isAddingComment ? (
                      <span className="report-modal__button-progress" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                    ) : null}
                    {isAddingComment ? "Adding..." : "Add Comment"}
                  </button>
                </div>

                {attachmentFile ? (
                  <div className="report-modal__attachment-preview report-modal__attachment-preview--visible">
                    <div>
                      <span className="report-modal__label">Selected Attachment</span>
                      <p>{attachmentFile.name}</p>
                    </div>

                    {attachmentPreviewUrl ? (
                      <img src={attachmentPreviewUrl} alt={attachmentFile.name} />
                    ) : (
                      <p className="report-modal__attachment-note">File ready for review in the current session.</p>
                    )}
                  </div>
                ) : null}
                {!editingCommentId && commentActionError ? <p className="report-modal__error">{commentActionError}</p> : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {reportPendingDelete ? (
        <div className="report-modal" role="dialog" aria-modal="true">
          <div className="report-modal__backdrop" onClick={handleCancelDeleteReport} />
          <section className="report-modal__card report-modal__card--confirm">
            <div className="report-modal__header">
              <div>
                <p className="report-modal__eyebrow">Delete Report</p>
                <h2>Are you sure you want to delete this report?</h2>
              </div>
            </div>

            <div className="report-modal__body">
              <div className="delete-report-summary">
                <div className="delete-report-summary__grid">
                  <div className="delete-report-summary__item">
                    <span className="report-modal__label">Report</span>
                    <p>{reportPendingDelete.category}</p>
                  </div>
                  <div className="delete-report-summary__item">
                    <span className="report-modal__label">Resident</span>
                    <p>{getResidentName(reportPendingDelete)}</p>
                  </div>
                  <div className="delete-report-summary__item">
                    <span className="report-modal__label">Date</span>
                    <p>{formatDateTime(reportPendingDelete.createdAt)}</p>
                  </div>
                  <div className="delete-report-summary__item">
                    <span className="report-modal__label">Purok</span>
                    <p>{reportPendingDelete.purok || "N/A"}</p>
                  </div>
                  <div className="delete-report-summary__item">
                    <span className="report-modal__label">Location</span>
                    <p>{reportPendingDelete.location || "Location unavailable"}</p>
                  </div>
                </div>

                <div className="delete-report-summary__item delete-report-summary__item--full">
                  <span className="report-modal__label">Description</span>
                  <p>{reportPendingDelete.description || "No description provided."}</p>
                </div>
              </div>

              {deleteError ? <p className="report-modal__error">{deleteError}</p> : null}

              <div className="report-modal__actions report-modal__actions--confirm">
                <button
                  type="button"
                  className="report-action-button report-action-button--ghost"
                  disabled={isDeletingReport}
                  onClick={handleCancelDeleteReport}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="report-action-button report-action-button--danger"
                  disabled={isDeletingReport}
                  onClick={handleConfirmDeleteReport}
                >
                  {isDeletingReport ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {commentPendingDelete ? (
        <div className="report-modal" role="dialog" aria-modal="true">
          <div className="report-modal__backdrop" onClick={handleCancelDeleteComment} />
          <section className="report-modal__card report-modal__card--confirm">
            <div className="report-modal__header">
              <div>
                <p className="report-modal__eyebrow">Delete Comment</p>
                <h2 className="report-modal__confirm-title">Are you sure you want to delete this comment?</h2>
                <p className="report-modal__confirm-copy">
                  This action will permanently remove the comment from this report.
                </p>
              </div>
            </div>

            <div className="report-modal__body">
              <div className="delete-report-summary">
                <div className="delete-report-summary__item delete-report-summary__item--full">
                  <span className="report-modal__label">Comment</span>
                  <p>{commentPendingDelete.text || "No comment text provided."}</p>
                </div>
              </div>

              {commentActionError ? <p className="report-modal__error">{commentActionError}</p> : null}

              <div className="report-modal__actions report-modal__actions--confirm">
                <button
                  type="button"
                  className="report-action-button report-action-button--ghost"
                  disabled={isDeletingComment}
                  onClick={handleCancelDeleteComment}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="report-action-button report-action-button--danger"
                  disabled={isDeletingComment}
                  onClick={handleDeleteComment}
                >
                  {isDeletingComment ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default AdminDashboard;
