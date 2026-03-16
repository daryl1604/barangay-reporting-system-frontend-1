import { useEffect, useState } from "react";
import API from "../../api/axios";

function AdminDashboard() {

  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchReports();
    fetchAnalytics();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      const res = await API.get(`/reports/all?status=${statusFilter}`);
      setReports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await API.get("/reports/analytics/purok");
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/reports/${id}`, { status });
      fetchReports();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  const addComment = async (id) => {
    try {
      await API.post(`/reports/${id}/comment`, {
        text: commentText[id]
      });

      setCommentText({
        ...commentText,
        [id]: ""
      });

      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>

      <h1>Admin Dashboard</h1>

      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = "/";
        }}
          style={{ marginBottom: "20px" }}
      >
        Logout
      </button>

      {/* ANALYTICS */}

      <h2>Reports by Purok</h2>

      <div style={{ marginBottom: "30px" }}>
        {analytics.length === 0 ? (
          <p>No analytics data yet.</p>
        ) : (
          analytics.map((item) => (
            <div key={item._id}>
              <p>
                <b>{item._id}</b>: {item.totalReports} reports
              </p>
            </div>
          ))
        )}
      </div>

      {/* FILTER */}

      <h3>Filter by Status</h3>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        style={{ marginBottom: "20px" }}
      >
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>

      {/* REPORT LIST */}

      <h2>All Reports</h2>

      {reports.length === 0 ? (
        <p>No reports found.</p>
      ) : (
        reports.map((report) => (
          <div
            key={report._id}
            style={{
              border: "1px solid gray",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "5px"
            }}
          >
            <h3>{report.category}</h3>

            <p>{report.description}</p>

            <p><b>Location:</b> {report.location}</p>
            <p><b>Purok:</b> {report.purok}</p>
            <p><b>Status:</b> {report.status}</p>

            {/* STATUS BUTTONS */}

            <button
              onClick={() => updateStatus(report._id, "in_progress")}
              style={{ marginRight: "10px" }}
            >
              Mark In Progress
            </button>

            <button
              onClick={() => updateStatus(report._id, "resolved")}
            >
              Mark Resolved
            </button>

            <br /><br />

            {/* COMMENT SECTION */}

            <input
              type="text"
              placeholder="Add comment"
              value={commentText[report._id] || ""}
              onChange={(e) =>
                setCommentText({
                  ...commentText,
                  [report._id]: e.target.value
                })
              }
            />

            <button
              onClick={() => addComment(report._id)}
              style={{ marginLeft: "10px" }}
            >
              Add Comment
            </button>

          </div>
        ))
      )}

    </div>
  );
}

export default AdminDashboard;