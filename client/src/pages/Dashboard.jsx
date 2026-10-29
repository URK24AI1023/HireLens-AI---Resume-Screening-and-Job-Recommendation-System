
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BriefcaseBusiness,
  LogOut,
  Upload,
  Sparkles,
  MapPin,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  AlertCircle,
  RefreshCw,
  Trophy,
  Target,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import "./Dashboard.css";

const API_URL = "http://localhost:5000/api";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");

  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");
  const [resumeError, setResumeError] = useState(false);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [resumeName, setResumeName] = useState("");

  // Individual resume-to-job matching results.
  const [matchResults, setMatchResults] = useState({});
  const [matchingJobId, setMatchingJobId] = useState("");
  const [matchErrors, setMatchErrors] = useState({});

  // Smart job recommendations.
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] =
    useState(false);
  const [recommendationsError, setRecommendationsError] = useState("");
  const [recommendationsLoaded, setRecommendationsLoaded] =
    useState(false);
  const [recommendationResume, setRecommendationResume] = useState(null);

  // Saved jobs and application tracking.
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);
  const [savedJobsError, setSavedJobsError] = useState("");
  const [savingJobIds, setSavingJobIds] = useState({});
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applyingJobIds, setApplyingJobIds] = useState({});
  const [withdrawingIds, setWithdrawingIds] = useState({});

  // Candidate preferences.
  const [currentLocation, setCurrentLocation] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("Any city");
  const [willingToRelocate, setWillingToRelocate] = useState("false");
  const [willingToLearn, setWillingToLearn] = useState("true");

  const getToken = () => sessionStorage.getItem("hirelensToken");

  const fetchRecommendations = async (showLoading = true) => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    if (showLoading) {
      setRecommendationsLoading(true);
    }

    setRecommendationsError("");

    try {
      const response = await fetch(`${API_URL}/recommendations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load smart recommendations."
        );
      }

      setRecommendations(
        Array.isArray(data.recommendations) ? data.recommendations : []
      );
      setRecommendationResume(data.resume || null);
      setRecommendationsLoaded(true);
    } catch (error) {
      setRecommendationsError(
        error.message || "Could not load recommendations."
      );
      setRecommendationsLoaded(false);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    const savedUser = sessionStorage.getItem("hirelensUser");

    if (!token || !savedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      if (parsedUser.role === "recruiter") {
        navigate("/recruiter");
      }
    } catch {
      sessionStorage.removeItem("hirelensUser");
      sessionStorage.removeItem("hirelensToken");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setJobsLoading(true);
        setJobsError("");

        const response = await fetch(`${API_URL}/jobs`);

        if (!response.ok) {
          throw new Error("Unable to load jobs.");
        }

        const data = await response.json();
        setJobs(Array.isArray(data) ? data : data.jobs || []);
      } catch (error) {
        setJobsError(error.message || "Could not load jobs. Please try again.");
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Load personalized recommendations when the dashboard opens.
  useEffect(() => {
    const token = getToken();
    const savedUser = sessionStorage.getItem("hirelensUser");

    if (!token || !savedUser) return;

    try {
      const parsedUser = JSON.parse(savedUser);

      if (parsedUser.role === "jobseeker") {
        fetchRecommendations();
        fetchSavedJobs();
        fetchApplications();
      }
    } catch {
      // The authentication effect handles invalid session data.
    }
  }, []);

  const fetchSavedJobs = async () => {
    const token = getToken();
    if (!token) return;
    setSavedJobsLoading(true);
    setSavedJobsError("");
    try {
      const response = await fetch(`${API_URL}/saved-jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load saved jobs.");
      setSavedJobs(Array.isArray(data.savedJobs) ? data.savedJobs : []);
    } catch (error) {
      setSavedJobsError(error.message || "Could not load saved jobs.");
    } finally {
      setSavedJobsLoading(false);
    }
  };

  const handleToggleSavedJob = async (job) => {
    const token = getToken();
    const jobId = getJobId(job);
    if (!token) return navigate("/login");
    if (!jobId) return;
    const isSaved = savedJobs.some((item) => String(item.job?._id || item.job?.id) === String(jobId));
    setSavingJobIds((prev) => ({ ...prev, [jobId]: true }));
    setSavedJobsError("");
    try {
      const response = await fetch(`${API_URL}/saved-jobs/${jobId}`, {
        method: isSaved ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update saved jobs.");
      await fetchSavedJobs();
    } catch (error) {
      setSavedJobsError(error.message || "Could not update saved jobs.");
    } finally {
      setSavingJobIds((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const renderSaveButton = (job) => {
    const jobId = getJobId(job);
    const isSaved = savedJobs.some((item) => String(item.job?._id || item.job?.id) === String(jobId));
    return (
      <button type="button" className="recommendation-refresh-btn" onClick={() => handleToggleSavedJob(job)} disabled={!jobId || Boolean(savingJobIds[jobId])}>
        {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        {savingJobIds[jobId] ? "Saving..." : isSaved ? "Saved" : "Save job"}
      </button>
    );
  };

  const fetchApplications = async () => {
    const token = getToken();
    if (!token) return;
    setApplicationsLoading(true);
    setApplicationsError("");
    try {
      const response = await fetch(`${API_URL}/applications/my-applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load applications.");
      setApplications(Array.isArray(data.applications) ? data.applications : []);
    } catch (error) {
      setApplicationsError(error.message || "Could not load applications.");
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleApplyForJob = async (job) => {
    const token = getToken();
    const jobId = getJobId(job);
    if (!token) return navigate("/login");
    if (!jobId) return;
    setApplicationMessage("");
    setApplyingJobIds((prev) => ({ ...prev, [jobId]: true }));
    try {
      const response = await fetch(`${API_URL}/applications/${jobId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ coverLetter: "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to submit your application.");
      setApplicationMessage(data.message || "Application submitted successfully.");
      await fetchApplications();
    } catch (error) {
      setApplicationMessage(error.message || "Could not submit application.");
      if (error.message?.toLowerCase().includes("already applied")) await fetchApplications();
    } finally {
      setApplyingJobIds((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const handleWithdrawApplication = async (application) => {
    if (!application?._id) return;
    if (!window.confirm("Are you sure you want to withdraw this application?")) return;
    setWithdrawingIds((prev) => ({ ...prev, [application._id]: true }));
    setApplicationMessage("");
    try {
      const response = await fetch(`${API_URL}/applications/${application._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to withdraw application.");
      setApplicationMessage(data.message || "Application withdrawn.");
      await fetchApplications();
    } catch (error) {
      setApplicationMessage(error.message || "Could not withdraw application.");
    } finally {
      setWithdrawingIds((prev) => ({ ...prev, [application._id]: false }));
    }
  };

  const hasApplied = (jobId) => applications.some((application) => String(application.job?._id || application.job) === String(jobId));

  const renderApplyButton = (job) => {
    const jobId = getJobId(job);
    const applied = hasApplied(jobId);
    return (
      <button type="button" className="dashboard-primary-btn match-resume-button" onClick={() => handleApplyForJob(job)} disabled={!jobId || applied || Boolean(applyingJobIds[jobId])}>
        {applyingJobIds[jobId] ? "Submitting..." : applied ? "Already Applied" : "Apply for Job"}
        <ArrowUpRight size={16} />
      </button>
    );
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again after an upload.
    event.target.value = "";

    if (!file) return;

    setResumeMessage("");
    setResumeError(false);
    setResumeSkills([]);

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setResumeError(true);
      setResumeMessage("Please select a PDF file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeError(true);
      setResumeMessage("Your PDF must be 5 MB or smaller.");
      return;
    }

    const token = getToken();

    if (!token) {
      setResumeError(true);
      setResumeMessage("Your session has expired. Please log in again.");
      navigate("/login");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("currentLocation", currentLocation.trim());
    formData.append("preferredLocation", preferredLocation.trim());
    formData.append("willingToRelocate", willingToRelocate);
    formData.append("willingToLearn", willingToLearn);

    try {
      setResumeLoading(true);
      setResumeName(file.name);

      const response = await fetch(`${API_URL}/resumes/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Resume upload failed.");
      }

      const skills = data.resume?.skills || [];

      setResumeSkills(skills);
      setResumeMessage(
        skills.length > 0
          ? "Resume uploaded successfully! Your skills have been extracted."
          : "Resume uploaded successfully, but no recognized technical skills were found."
      );
      setResumeError(false);

      // A new resume or updated preferences may change the job rankings.
      await fetchRecommendations();
    } catch (error) {
      setResumeError(true);
      setResumeMessage(
        error.message || "Unable to upload your resume. Please try again."
      );
    } finally {
      setResumeLoading(false);
    }
  };

  // Compare the latest uploaded resume with a selected job.
  const handleMatchResume = async (job) => {
    const token = getToken();
    const jobId = job._id || job.id;

    if (!token) {
      navigate("/login");
      return;
    }

    if (!jobId) {
      setMatchErrors((previous) => ({
        ...previous,
        unknown: "This job does not have a valid ID.",
      }));
      return;
    }

    setMatchingJobId(jobId);
    setMatchErrors((previous) => {
      const next = { ...previous };
      delete next[jobId];
      delete next.unknown;
      return next;
    });

    try {
      const response = await fetch(`${API_URL}/match/${jobId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to calculate your job match."
        );
      }

      setMatchResults((previous) => ({
        ...previous,
        [jobId]: data,
      }));
    } catch (error) {
      setMatchErrors((previous) => ({
        ...previous,
        [jobId]: error.message || "Something went wrong while matching.",
      }));
    } finally {
      setMatchingJobId("");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("hirelensToken");
    sessionStorage.removeItem("hirelensUser");
    navigate("/login");
  };

  const firstName = user?.name
    ? user.name.trim().split(/\s+/)[0]
    : "Job Seeker";

  const avatarLetter = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : "J";

  const getJobId = (job) => job?._id || job?.id;

  const getSuitabilityClass = (score) => {
    if (score >= 80) return "suitability-excellent";
    if (score >= 65) return "suitability-good";
    if (score >= 45) return "suitability-potential";
    return "suitability-explore";
  };

  // Recommendation objects contain job details plus ranking information.
  const renderRecommendationCard = (item, index) => {
    const job = item.job || {};
    const jobId = getJobId(job);
    const score = Number(item.suitabilityScore) || 0;
    const reasons = Array.isArray(item.recommendationReasons)
      ? item.recommendationReasons
      : [];
    const matchedSkills = Array.isArray(item.matchedSkills)
      ? item.matchedSkills
      : [];
    const missingSkills = Array.isArray(item.missingSkills)
      ? item.missingSkills
      : [];

    return (
      <article
        className="dashboard-job-card recommendation-job-card"
        key={jobId || job.title || index}
      >
        <div className="dashboard-job-top">
          <div className="dashboard-job-icon">
            {index === 0 ? (
              <Trophy size={22} />
            ) : (
              <BriefcaseBusiness size={22} />
            )}
          </div>

          <span className="recommendation-rank">
            {index === 0 ? "Top match" : `Rank #${index + 1}`}
          </span>
        </div>

        <div className="recommendation-score-row">
          <div>
            <h3>{job.title || "Untitled job"}</h3>
            <p className="dashboard-job-company">
              {job.company || "Company not specified"}
            </p>
          </div>

          <div
            className={`suitability-score ${getSuitabilityClass(score)}`}
            title="Overall suitability score"
          >
            <strong>{score}%</strong>
            <span>Suitability</span>
          </div>
        </div>

        <div className="dashboard-job-location">
          <MapPin size={14} />
          <span>{job.location || "Location not specified"}</span>
        </div>

        <div className="recommendation-label">
          <Sparkles size={15} />
          {item.recommendationLabel || "Recommended opportunity"}
        </div>

        <p className="dashboard-job-description">
          {job.description || "No description available."}
        </p>

        <div className="recommendation-metrics">
          <div>
            <Target size={17} />
            <span>Skill match</span>
            <strong>{Number(item.matchScore) || 0}%</strong>
          </div>
          <div>
            <BriefcaseBusiness size={17} />
            <span>Job type</span>
            <strong>{job.jobType || "Not specified"}</strong>
          </div>
        </div>

        {reasons.length > 0 && (
          <div className="recommendation-reasons">
            <h4>Why this job matches you</h4>
            <ul>
              {reasons.map((reason, reasonIndex) => (
                <li key={`${reasonIndex}-${reason}`}>
                  <CheckCircle2 size={15} />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="recommendation-skills-block">
          <h4>Matched skills</h4>
          {matchedSkills.length > 0 ? (
            <div className="dashboard-job-skills">
              {matchedSkills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          ) : (
            <p>No matching skills identified yet.</p>
          )}
        </div>

        {missingSkills.length > 0 && (
          <div className="recommendation-skills-block">
            <h4>Skills to develop</h4>
            <div className="dashboard-job-skills missing-skills">
              {missingSkills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            {item.learningAnalysis?.message && (
              <p>{item.learningAnalysis.message}</p>
            )}
          </div>
        )}

        {item.locationCompatibility?.message && (
          <div className="recommendation-location-note">
            <MapPin size={15} />
            <span>{item.locationCompatibility.message}</span>
          </div>
        )}

        {item.locationCompatibility?.warning && (
          <p className="recommendation-warning">
            <AlertCircle size={15} />
            {item.locationCompatibility.warning}
          </p>
        )}

        <div className="dashboard-job-footer">
          <span>{job.experience || "Experience not specified"}</span>
          <ArrowUpRight size={16} />
        </div>

        <div className="saved-job-actions">{renderSaveButton(job)}</div>
        {renderApplyButton(job)}
        <button
          type="button"
          className="dashboard-primary-btn match-resume-button"
          onClick={() => handleMatchResume(job)}
          disabled={!jobId || matchingJobId === jobId}
        >
          {matchingJobId === jobId ? "Analyzing..." : "View Detailed Match"}
          <Sparkles size={16} />
        </button>

        {jobId && (matchErrors[jobId] || matchErrors.unknown) && (
          <div className="dashboard-message dashboard-error" role="alert">
            {matchErrors[jobId] || matchErrors.unknown}
          </div>
        )}

        {jobId && matchResults[jobId] && (
          <div className="match-result-panel" aria-live="polite">
            <h4>
              Skill Match:{" "}
              {matchResults[jobId].skillAnalysis?.matchScore ?? 0}%
            </h4>

            <p>{matchResults[jobId].skillAnalysis?.explanation}</p>

            <p>
              <strong>Matched skills:</strong>{" "}
              {(matchResults[jobId].skillAnalysis?.matchedSkills || []).join(
                ", "
              ) || "None"}
            </p>

            <p>
              <strong>Missing skills:</strong>{" "}
              {(matchResults[jobId].skillAnalysis?.missingSkills || []).join(
                ", "
              ) || "None"}
            </p>

            <p>
              <strong>Location:</strong>{" "}
              {matchResults[jobId].locationCompatibility?.message ||
                "Location compatibility unavailable."}
            </p>

            {matchResults[jobId].locationCompatibility?.warning && (
              <p>
                <strong>Location note:</strong>{" "}
                {matchResults[jobId].locationCompatibility.warning}
              </p>
            )}

            <p>
              <strong>Learning suggestions:</strong>{" "}
              {(
                matchResults[jobId].learningAnalysis?.learningSuggestions ||
                []
              ).join(", ") || "No additional skills suggested"}
            </p>

            <p>{matchResults[jobId].learningAnalysis?.message}</p>

            <p>
              <strong>Recommendation:</strong>{" "}
              {matchResults[jobId].recommendation}
            </p>
          </div>
        )}
      </article>
    );
  };

  if (!user) {
    return (
      <div className="dashboard-loading">
        Loading your HireLens AI dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">
          <span className="dashboard-brand-icon">
            <Sparkles size={21} />
          </span>
          <span>HireLens AI</span>
        </Link>

        <p className="sidebar-label">WORKSPACE</p>

        <a href="#overview" className="sidebar-link active">
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </a>

        <a href="#resume" className="sidebar-link">
          <FileText size={18} />
          <span>Resume insights</span>
        </a>

        <a href="#recommendations" className="sidebar-link">
          <Sparkles size={18} />
          <span>Recommended jobs</span>
        </a>

        <a href="#saved-jobs" className="sidebar-link"><Bookmark size={18} /><span>My Saved Jobs</span></a>
        <a href="#applications" className="sidebar-link"><CheckCircle2 size={18} /><span>My Applications</span></a>
        <a href="#jobs" className="sidebar-link">
          <BriefcaseBusiness size={18} />
          <span>Explore jobs</span>
        </a>

        <div className="sidebar-bottom">
          <div className="user-avatar">{avatarLetter}</div>

          <div className="sidebar-user">
            <strong>{user.name || "Job Seeker"}</strong>
            <span>Job Seeker</span>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main dashboard */}
      <main className="dashboard-main" id="overview">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">
              YOUR CAREER WORKSPACE
            </span>
            <h1>Dashboard</h1>
            <p>Track your progress and discover your next opportunity.</p>
          </div>

          <div className="dashboard-profile">
            <div className="profile-avatar">{avatarLetter}</div>
            <div>
              <strong>{user.name || "Job Seeker"}</strong>
              <span>{user.email || "Welcome to HireLens AI"}</span>
            </div>
          </div>
        </header>

        {/* Welcome card */}
        <section className="dashboard-welcome-card">
          <div>
            <span className="welcome-pill">
              <Sparkles size={13} />
              YOUR NEXT CHAPTER
            </span>

            <h2>Welcome back, {firstName}!</h2>

            <p>
              Upload your resume, discover your technical skills, and explore
              opportunities that fit your career goals.
            </p>

            <a href="#resume" className="dashboard-primary-btn">
              Improve your profile
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="welcome-illustration">
            <div className="illustration-circle">
              <FileText size={43} />
            </div>
            <Sparkles className="illustration-sparkle" size={23} />
          </div>
        </section>

        {/* Dashboard statistics */}
        <section className="dashboard-stats">
          <div className="dashboard-stat-card">
            <div className="stat-icon purple">
              <BriefcaseBusiness size={21} />
            </div>
            <span className="stat-label">Available jobs</span>
            <strong>{jobs.length}</strong>
            <p>Opportunities to explore</p>
          </div>

          <div className="dashboard-stat-card">
            <div className="stat-icon green">
              <FileText size={21} />
            </div>
            <span className="stat-label">Resume status</span>
            <strong className="stat-text">
              {resumeName ? "Uploaded" : recommendationResume ? "Available" : "Not uploaded"}
            </strong>
            <p>
              {resumeName || recommendationResume
                ? "Your resume is ready for matching"
                : "Upload a PDF to get started"}
            </p>
          </div>

          <div className="dashboard-stat-card">
            <div className="stat-icon orange">
              <Sparkles size={21} />
            </div>
            <span className="stat-label">Skills identified</span>
            <strong>
              {resumeSkills.length ||
                recommendationResume?.skills?.length ||
                0}
            </strong>
            <p>Recognized technical skills</p>
          </div>
        </section>

        {/* Resume upload */}
        <section className="resume-upload-section" id="resume">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-eyebrow">PROFILE TOOLS</span>
              <h2>Resume insights</h2>
              <p>Upload your resume to discover your technical skills.</p>
            </div>
          </div>

          <div className="resume-preferences-panel">
            <h3>Your job preferences</h3>
            <p>
              These preferences help HireLens AI explain how well a job fits
              you. You can still explore jobs in any city.
            </p>

            <div className="resume-preferences-grid">
              <label className="resume-preference-field">
                <span>Current location</span>
                <input
                  type="text"
                  value={currentLocation}
                  onChange={(event) => setCurrentLocation(event.target.value)}
                  placeholder="e.g. Coimbatore"
                  maxLength={100}
                />
              </label>

              <label className="resume-preference-field">
                <span>Preferred job location</span>
                <input
                  type="text"
                  value={preferredLocation}
                  onChange={(event) => setPreferredLocation(event.target.value)}
                  placeholder="e.g. Chennai or Any city"
                  maxLength={100}
                />
              </label>

              <label className="resume-preference-field">
                <span>Willing to relocate?</span>
                <select
                  value={willingToRelocate}
                  onChange={(event) => setWillingToRelocate(event.target.value)}
                >
                  <option value="true">Yes, I'm willing to relocate</option>
                  <option value="false">No, I prefer not to relocate</option>
                </select>
              </label>

              <label className="resume-preference-field">
                <span>Willing to learn new skills?</span>
                <select
                  value={willingToLearn}
                  onChange={(event) => setWillingToLearn(event.target.value)}
                >
                  <option value="true">Yes, I'm open to learning</option>
                  <option value="false">
                    Prefer jobs matching my current skills
                  </option>
                </select>
              </label>
            </div>

            <p className="resume-preferences-note">
              Your preferences are saved when you upload a resume.
            </p>
          </div>

          <div className="resume-prompt-card">
            <div className="resume-prompt-icon">
              <Upload size={24} />
            </div>

            <div>
              <h3>Upload your resume</h3>
              <p>
                Choose a PDF resume up to 5 MB. HireLens AI will extract its
                selectable text and identify technical skills.
              </p>
            </div>

            <label className="dashboard-primary-btn resume-upload-label">
              <Upload size={15} />
              Choose PDF
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleResumeUpload}
                hidden
                disabled={resumeLoading}
              />
            </label>
          </div>

          {resumeLoading && (
            <div className="dashboard-message">
              <Clock3 size={17} />
              Uploading and analyzing your resume...
            </div>
          )}

          {resumeMessage && (
            <div
              className={`dashboard-message ${
                resumeError ? "dashboard-error" : ""
              }`}
              role="status"
            >
              {resumeError ? (
                <AlertCircle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              <span>{resumeMessage}</span>
            </div>
          )}

          {resumeName && (
            <div className="dashboard-message">
              <FileText size={18} />
              <span>
                <strong>Selected resume:</strong> {resumeName}
              </span>
            </div>
          )}

          {resumeSkills.length > 0 && (
            <div className="resume-results">
              <div className="dashboard-section-heading">
                <div>
                  <span className="dashboard-eyebrow">RESUME ANALYSIS</span>
                  <h2>Skills identified</h2>
                  <p>These skills were detected in your uploaded PDF.</p>
                </div>
              </div>

              <div className="dashboard-job-skills resume-skills">
                {resumeSkills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Smart recommendations */}
        <section
          className="dashboard-jobs-section recommendations-section"
          id="recommendations"
        >
          <div className="dashboard-section-heading recommendation-heading">
            <div>
              <span className="dashboard-eyebrow">PERSONALIZED FOR YOU</span>
              <h2>Recommended for You</h2>
              <p>
                Jobs ranked by your skills, location compatibility, and job
                preferences.
              </p>
            </div>

            <button
              type="button"
              className="recommendation-refresh-btn"
              onClick={() => fetchRecommendations()}
              disabled={recommendationsLoading}
            >
              <RefreshCw
                size={16}
                className={recommendationsLoading ? "refresh-spinning" : ""}
              />
              {recommendationsLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="recommendation-scoring-note">
            <Sparkles size={18} />
            <span>
              <strong>How ranking works:</strong> Skills contribute 60% of the
              suitability score, current-location compatibility 25%, and
              preferred-location compatibility 15%. This score is a guide, not
              a guarantee of job suitability.
            </span>
          </div>

          {recommendationsLoading && (
            <div className="dashboard-message">
              <Clock3 size={17} />
              Finding and ranking your best job matches...
            </div>
          )}

          {!recommendationsLoading && recommendationsError && (
            <div className="dashboard-message dashboard-error" role="alert">
              <AlertCircle size={18} />
              <span>{recommendationsError}</span>
              <button
                type="button"
                className="recommendation-inline-retry"
                onClick={() => fetchRecommendations()}
              >
                Try again
              </button>
            </div>
          )}

          {!recommendationsLoading &&
            !recommendationsError &&
            recommendationsLoaded &&
            recommendations.length === 0 && (
              <div className="recommendations-empty">
                <Sparkles size={26} />
                <h3>No recommendations available yet</h3>
                <p>
                  Upload a resume first, or check again after more jobs become
                  available.
                </p>
                <a href="#resume" className="dashboard-primary-btn">
                  Upload your resume
                  <ArrowUpRight size={16} />
                </a>
              </div>
            )}

          {!recommendationsLoading &&
            !recommendationsError &&
            recommendations.length > 0 && (
              <>
                <div className="recommendation-summary">
                  <strong>{recommendations.length} jobs ranked</strong>
                  <span>Highest suitability appears first.</span>
                </div>

                <div className="dashboard-jobs-grid">
                  {recommendations.map((item, index) =>
                    renderRecommendationCard(item, index)
                  )}
                </div>
              </>
            )}
        </section>

        {/* Saved jobs */}
        <section className="dashboard-jobs-section" id="saved-jobs">
          <div className="dashboard-section-heading">
            <div><span className="dashboard-eyebrow">YOUR SHORTLIST</span><h2>My Saved Jobs</h2><p>Keep interesting opportunities in one place.</p></div>
            <button type="button" className="recommendation-refresh-btn" onClick={fetchSavedJobs} disabled={savedJobsLoading}><RefreshCw size={16} />{savedJobsLoading ? "Refreshing..." : "Refresh"}</button>
          </div>
          {savedJobsError && <div className="dashboard-message dashboard-error" role="alert">{savedJobsError}</div>}
          {savedJobsLoading && <div className="dashboard-message">Loading saved jobs...</div>}
          {!savedJobsLoading && savedJobs.length === 0 && <div className="recommendations-empty"><Bookmark size={26}/><h3>No saved jobs yet</h3><p>Use Save job on any listing to add it to your shortlist.</p></div>}
          {!savedJobsLoading && savedJobs.length > 0 && <div className="dashboard-jobs-grid">{savedJobs.filter((item) => item.job).map((item) => { const job = item.job; const jobId = getJobId(job); return <article className="dashboard-job-card" key={jobId}><div className="dashboard-job-top"><div className="dashboard-job-icon"><BriefcaseBusiness size={22}/></div><span className="dashboard-job-type">{job.jobType || "Job"}</span></div><h3>{job.title || "Untitled job"}</h3><p className="dashboard-job-company">{job.company || "Company not specified"}</p><div className="dashboard-job-location"><MapPin size={14}/><span>{job.location || "Location not specified"}</span></div><p className="dashboard-job-description">{job.description || "No description available."}</p><div className="saved-job-actions">{renderSaveButton(job)}</div>{renderApplyButton(job)}<button type="button" className="dashboard-primary-btn match-resume-button" onClick={() => handleMatchResume(job)} disabled={!jobId || matchingJobId === jobId}>{matchingJobId === jobId ? "Analyzing..." : "Match Resume"}<Sparkles size={16}/></button></article>; })}</div>}
        </section>

        {/* Application tracking */}
        <section className="dashboard-jobs-section" id="applications">
          <div className="dashboard-section-heading">
            <div><span className="dashboard-eyebrow">YOUR CAREER ACTIVITY</span><h2>My Applications</h2><p>Track the progress of jobs you have applied for.</p></div>
            <button type="button" className="recommendation-refresh-btn" onClick={fetchApplications} disabled={applicationsLoading}><RefreshCw size={16} className={applicationsLoading ? "refresh-spinning" : ""}/>{applicationsLoading ? "Refreshing..." : "Refresh"}</button>
          </div>
          {applicationMessage && <div className="dashboard-message" role="status">{applicationMessage}</div>}
          {applicationsError && <div className="dashboard-message dashboard-error" role="alert">{applicationsError}</div>}
          {applicationsLoading && <div className="dashboard-message"><Clock3 size={17}/> Loading your applications...</div>}
          {!applicationsLoading && applications.length === 0 && <div className="recommendations-empty"><FileText size={26}/><h3>No applications yet</h3><p>Apply for a job to see its status here.</p><a href="#jobs" className="dashboard-primary-btn">Explore jobs<ArrowUpRight size={16}/></a></div>}
          {!applicationsLoading && applications.length > 0 && <div className="dashboard-jobs-grid">{applications.map((application) => { const job = application.job || {}; const statusClass = `application-status-${String(application.status || "Applied").toLowerCase().replace(/\s+/g, "-")}`; return <article className="dashboard-job-card application-card" key={application._id}><div className="dashboard-job-top"><div className="dashboard-job-icon"><FileText size={22}/></div><span className={`application-status ${statusClass}`}>{application.status || "Applied"}</span></div><h3>{job.title || "Job no longer available"}</h3><p className="dashboard-job-company">{job.company || job.recruiter?.name || "Company not specified"}</p><div className="dashboard-job-location"><MapPin size={14}/><span>{job.location || "Location not specified"}</span></div><p className="application-date">Applied on {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : "Date unavailable"}</p>{application.status !== "Shortlisted" && job._id && <button type="button" className="recommendation-refresh-btn" onClick={() => handleWithdrawApplication(application)} disabled={Boolean(withdrawingIds[application._id])}>{withdrawingIds[application._id] ? "Withdrawing..." : "Withdraw application"}</button>}{application.status === "Shortlisted" && <p className="application-note">Please contact the recruiter if you need to withdraw this application.</p>}</article>; })}</div>}
        </section>

        {/* All job listings */}
        <section className="dashboard-jobs-section" id="jobs">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-eyebrow">CAREER OPPORTUNITIES</span>
              <h2>Explore jobs</h2>
              <p>Discover all opportunities available on HireLens AI.</p>
            </div>
          </div>

          {jobsLoading && (
            <div className="dashboard-message">
              Loading available jobs...
            </div>
          )}

          {!jobsLoading && jobsError && (
            <div className="dashboard-message dashboard-error">{jobsError}</div>
          )}

          {!jobsLoading && !jobsError && jobs.length === 0 && (
            <div className="dashboard-message">
              No jobs are available yet. Please check again later.
            </div>
          )}

          {!jobsLoading && !jobsError && jobs.length > 0 && (
            <div className="dashboard-jobs-grid">
              {jobs.map((job) => {
                const jobId = getJobId(job);
                const match = matchResults[jobId];

                return (
                  <article
                    className="dashboard-job-card"
                    key={jobId || job.title}
                  >
                    <div className="dashboard-job-top">
                      <div className="dashboard-job-icon">
                        <BriefcaseBusiness size={22} />
                      </div>

                      <span className="dashboard-job-type">
                        {job.jobType || "Job"}
                      </span>
                    </div>

                    <h3>{job.title}</h3>

                    <p className="dashboard-job-company">
                      {job.company || "Company not specified"}
                    </p>

                    <div className="dashboard-job-location">
                      <MapPin size={14} />
                      <span>{job.location || "Location not specified"}</span>
                    </div>

                    <p className="dashboard-job-description">
                      {job.description || "No description available."}
                    </p>

                    {Array.isArray(job.requiredSkills) &&
                      job.requiredSkills.length > 0 && (
                        <div className="dashboard-job-skills">
                          {job.requiredSkills.slice(0, 6).map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                        </div>
                      )}

                    <div className="dashboard-job-footer">
                      <span>
                        {job.experience || "Experience not specified"}
                      </span>
                      <ArrowUpRight size={16} />
                    </div>

                    <div className="saved-job-actions">{renderSaveButton(job)}</div>
                    {renderApplyButton(job)}
                    <button
                      type="button"
                      className="dashboard-primary-btn match-resume-button"
                      onClick={() => handleMatchResume(job)}
                      disabled={!jobId || matchingJobId === jobId}
                    >
                      {matchingJobId === jobId ? "Analyzing..." : "Match Resume"}
                      <Sparkles size={16} />
                    </button>

                    {jobId && (matchErrors[jobId] || matchErrors.unknown) && (
                      <div
                        className="dashboard-message dashboard-error"
                        role="alert"
                      >
                        {matchErrors[jobId] || matchErrors.unknown}
                      </div>
                    )}

                    {match && (
                      <div className="match-result-panel" aria-live="polite">
                        <h4>
                          Skill Match: {match.skillAnalysis?.matchScore ?? 0}%
                        </h4>

                        <p>{match.skillAnalysis?.explanation}</p>

                        <p>
                          <strong>Matched skills:</strong>{" "}
                          {(match.skillAnalysis?.matchedSkills || []).join(
                            ", "
                          ) || "None"}
                        </p>

                        <p>
                          <strong>Missing skills:</strong>{" "}
                          {(match.skillAnalysis?.missingSkills || []).join(
                            ", "
                          ) || "None"}
                        </p>

                        <p>
                          <strong>Location:</strong>{" "}
                          {match.locationCompatibility?.message ||
                            "Location compatibility unavailable."}
                        </p>

                        {match.locationCompatibility?.warning && (
                          <p>
                            <strong>Location note:</strong>{" "}
                            {match.locationCompatibility.warning}
                          </p>
                        )}

                        <p>
                          <strong>Learning suggestions:</strong>{" "}
                          {(
                            match.learningAnalysis?.learningSuggestions || []
                          ).join(", ") || "No additional skills suggested"}
                        </p>

                        <p>{match.learningAnalysis?.message}</p>

                        <p>
                          <strong>Recommendation:</strong>{" "}
                          {match.recommendation}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="dashboard-footer">
          <span>© 2026 HireLens AI</span>
          <span>Helping you find your next opportunity.</span>
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
