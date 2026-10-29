
import { useCallback, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Users,
  UserCheck,
  RefreshCw,
  LogOut,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./RecruiterDashboard.css";

const API_URL = "http://localhost:5000/api";

function RecruiterDashboard() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");

  const token = sessionStorage.getItem("hirelensToken");

  // Fetch applications for the logged-in recruiter
  const fetchApplications = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/applications/recruiter`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load applications."
        );
      }

      setApplications(
        Array.isArray(data.applications)
          ? data.applications
          : []
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  // Fetch real recruiter analytics from MongoDB
  const fetchAnalytics = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setAnalyticsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/applications/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load analytics."
        );
      }

      setAnalytics(data);
    } catch (err) {
      setError(
        err.message || "Unable to load recruiter analytics."
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchApplications();
    fetchAnalytics();
  }, [fetchApplications, fetchAnalytics]);

  // Update an application's status
  const handleStatusChange = async (
    applicationId,
    status
  ) => {
    setError("");
    setMessage("");
    setUpdatingId(applicationId);

    try {
      const response = await fetch(
        `${API_URL}/applications/${applicationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update application status."
        );
      }

      setApplications((previous) =>
        previous.map((application) =>
          application._id === applicationId
            ? {
                ...application,
                status: data.application?.status || status,
              }
            : application
        )
      );

      // Refresh counts after the status changes
      await fetchAnalytics();

      setMessage(
        "Application status updated successfully."
      );
    } catch (err) {
      setError(
        err.message || "Status update failed."
      );
    } finally {
      setUpdatingId("");
    }
  };

  // Sign out
  const handleLogout = () => {
    sessionStorage.removeItem("hirelensToken");
    sessionStorage.removeItem("hirelensUser");
    navigate("/login");
  };

  const shortlistedCount = applications.filter(
    (application) =>
      application.status === "Shortlisted"
  ).length;

  const getStatusClass = (status) => {
    switch (status) {
      case "Shortlisted":
        return "status-shortlisted";
      case "Rejected":
        return "status-rejected";
      case "Under Review":
        return "status-review";
      default:
        return "status-applied";
    }
  };

  const formatStatus = (status) => {
    return status || "Applied";
  };

  return (
    <div className="recruiter-page">
      {/* Sidebar */}
      <aside className="recruiter-sidebar">
        <div className="recruiter-brand">
          <span className="recruiter-brand-icon">
            <BriefcaseBusiness size={22} />
          </span>

          <span>
            HireLens
            <span className="recruiter-brand-accent">
              {" "}AI
            </span>
          </span>
        </div>

        <div className="recruiter-nav-label">
          WORKSPACE
        </div>

        <button
          className="recruiter-nav-item"
          onClick={() => navigate("/recruiter/jobs")}
          style={{
            width: "100%",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            background: "transparent",
            font: "inherit",
          }}
        >
          <BriefcaseBusiness size={18} />
          Job Management
        </button>

        <div className="recruiter-nav-item active">
          <ClipboardList size={18} />
          Applicant Management
        </div>

        <div className="recruiter-sidebar-bottom">
          <button
            className="recruiter-logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="recruiter-main">
        <header className="recruiter-header">
          <div>
            <span className="recruiter-eyebrow">
              RECRUITER WORKSPACE
            </span>

            <h1>Recruiter Analytics</h1>

            <p>
              Monitor job postings, applications, and hiring
              progress in one place.
            </p>
          </div>

          <button
            className="recruiter-refresh"
            onClick={() => {
              fetchApplications();
              fetchAnalytics();
            }}
            disabled={loading || analyticsLoading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {error && (
          <div className="recruiter-alert error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {message && (
          <div className="recruiter-alert success">
            {message}
          </div>
        )}

        {/* Analytics cards */}
        <section className="recruiter-stats">
          <div className="recruiter-stat-card">
            <div className="recruiter-stat-icon purple">
              <Users size={22} />
            </div>

            <div>
              <p>Total Applicants</p>

              <h2>
                {loading ? "..." : applications.length}
              </h2>

              <span>
                Applications for your jobs
              </span>
            </div>
          </div>

          <div className="recruiter-stat-card">
            <div className="recruiter-stat-icon green">
              <UserCheck size={22} />
            </div>

            <div>
              <p>Shortlisted Candidates</p>

              <h2>
                {loading ? "..." : shortlistedCount}
              </h2>

              <span>
                Ready for the next stage
              </span>
            </div>
          </div>

          <div className="recruiter-stat-card">
            <div className="recruiter-stat-icon purple">
              <BriefcaseBusiness size={22} />
            </div>

            <div>
              <p>Total Jobs Posted</p>

              <h2>
                {analyticsLoading
                  ? "..."
                  : analytics?.totalJobs ?? 0}
              </h2>

              <span>
                {analyticsLoading
                  ? "Loading job details..."
                  : `${analytics?.activeJobs ?? 0} active · ${
                      analytics?.inactiveJobs ?? 0
                    } inactive`}
              </span>
            </div>
          </div>

          <div className="recruiter-stat-card">
            <div className="recruiter-stat-icon green">
              <ClipboardList size={22} />
            </div>

            <div>
              <p>Total Applications</p>

              <h2>
                {analyticsLoading
                  ? "..."
                  : analytics?.totalApplications ?? 0}
              </h2>

              <span>
                {analyticsLoading
                  ? "Loading application details..."
                  : `${analytics?.underReview ?? 0} under review · ${
                      analytics?.rejected ?? 0
                    } rejected`}
              </span>
            </div>
          </div>
        </section>

        {/* Application status summary */}
        <section className="recruiter-applicants">
          <div className="recruiter-section-heading">
            <div>
              <h2>Application Status Overview</h2>
              <p>
                Current status of applications for your jobs.
              </p>
            </div>
          </div>

          {analyticsLoading ? (
            <div className="recruiter-empty">
              Loading application analytics...
            </div>
          ) : analytics ? (
            <div className="recruiter-stats">
              {[
                {
                  label: "Applied",
                  value: analytics.applied ?? 0,
                  className: "status-applied",
                },
                {
                  label: "Under Review",
                  value: analytics.underReview ?? 0,
                  className: "status-review",
                },
                {
                  label: "Shortlisted",
                  value: analytics.shortlisted ?? 0,
                  className: "status-shortlisted",
                },
                {
                  label: "Rejected",
                  value: analytics.rejected ?? 0,
                  className: "status-rejected",
                },
              ].map((item) => (
                <div
                  className="recruiter-stat-card"
                  key={item.label}
                >
                  <div>
                    <p>{item.label}</p>
                    <h2>{item.value}</h2>
                    <span className={item.className}>
                      {item.label} applications
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="recruiter-empty">
              Analytics are currently unavailable.
            </div>
          )}
        </section>

        {/* Applicant Management */}
        <section className="recruiter-applicants">
          <div className="recruiter-section-heading">
            <div>
              <h2>Applications</h2>
              <p>
                Review applicants and update their status.
              </p>
            </div>

            <span className="recruiter-count">
              {applications.length} total
            </span>
          </div>

          {loading ? (
            <div className="recruiter-empty">
              Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="recruiter-empty">
              <Users size={34} />

              <h3>No applicants yet</h3>

              <p>
                Applications for your job postings will appear
                here.
              </p>
            </div>
          ) : (
            <div className="recruiter-table-wrap">
              <table className="recruiter-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Job Title</th>
                    <th>Applied On</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((application) => {
                    const applicant =
                      application.applicant || {};

                    const job = application.job || {};

                    return (
                      <tr key={application._id}>
                        <td>
                          <div className="applicant-name">
                            <div className="applicant-avatar">
                              {(applicant.name || "A")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {applicant.name ||
                                  "Unknown applicant"}
                              </strong>

                              <span>
                                {applicant.email ||
                                  "Email unavailable"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="applicant-job">
                            <strong>
                              {job.title || "Unknown job"}
                            </strong>

                            <span>
                              {job.company ||
                                "Company not specified"}
                            </span>
                          </div>
                        </td>

                        <td>
                          {application.createdAt
                            ? new Date(
                                application.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        <td>
                          <select
                            className={`recruiter-status-select ${getStatusClass(
                              application.status
                            )}`}
                            value={formatStatus(
                              application.status
                            )}
                            disabled={
                              updatingId === application._id
                            }
                            onChange={(event) =>
                              handleStatusChange(
                                application._id,
                                event.target.value
                              )
                            }
                          >
                            <option value="Applied">
                              Applied
                            </option>

                            <option value="Under Review">
                              Under Review
                            </option>

                            <option value="Shortlisted">
                              Shortlisted
                            </option>

                            <option value="Rejected">
                              Rejected
                            </option>
                          </select>

                          {updatingId === application._id && (
                            <span className="recruiter-updating">
                              Saving...
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default RecruiterDashboard;
