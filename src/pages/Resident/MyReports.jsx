import { useEffect, useState } from "react";
import API from "../../api/axios";

function MyReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await API.get("/reports/my");
      setReports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>My Reports</h2>

      {reports.length === 0 ? (
        <p>No reports submitted yet.</p>
      ) : (
        reports.map((report) => (
          <div
            key={report._id}
            style={{
              border: "1px solid gray",
              padding: "10px",
              marginBottom: "10px"
            }}
          >
            <h4>{report.category}</h4>
            <p>{report.description}</p>
            <p><b>Location:</b> {report.location}</p>
            <p><b>Purok:</b> {report.purok}</p>
            <p><b>Status:</b> {report.status}</p>

            {/* COMMENTS SECTION */}
            <h4>Comments</h4>

            {report.comments && report.comments.length > 0 ? (
              report.comments.map((comment, index) => (
                <div key={index}>
                  <p>{comment.text}</p>
                </div>
              ))
            ) : (
              <p>No comments yet</p>
            )}

          </div>
        ))
      )}
    </div>
  );
}

export default MyReports;