import { Link } from "react-router-dom";

function ResidentDashboard() {
  return (
    <div>
      <h1>Resident Dashboard</h1>

      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = "/";
        }}
          style={{ marginBottom: "20px" }}
      >
        Logout
      </button>

      <Link to="/submit-report">
        <button>Submit Report</button>
      </Link>

      <br /><br />

      <Link to="/my-reports">
        <button>My Reports</button>
      </Link>

      <br /><br />

      <Link to="/notifications">
        <button>Notifications</button>
      </Link>
    </div>
  );
}

export default ResidentDashboard;