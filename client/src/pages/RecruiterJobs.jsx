
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  Pencil,
  Power,
  X,
  BriefcaseBusiness,
  MapPin
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./RecruiterJobs.css";

const API_URL = "http://localhost:5000/api";

const emptyJob = {
  title: "",
  company: "",
  location: "",
  jobType: "Full-time",
  description: "",
  requiredSkills: "",
  experience: "Fresher",
  salary: ""
};

function RecruiterJobs() {
    console.log("RecruiterJobs rendered:", window.location.pathname);
  const navigate = useNavigate();
  const token = sessionStorage.getItem("hirelensToken");

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyJob);
  const [saving, setSaving] = useState(false);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/jobs/my-jobs`, {
        headers: authHeaders
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load jobs");
      }

      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.message || "Unable to load jobs");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadJobs();
  }, [token, navigate, loadJobs]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyJob);
    setShowForm(true);
    setMessage("");
    setError("");
  };

  const openEditForm = (job) => {
    setEditingId(job._id);
    setForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      jobType: job.jobType || "Full-time",
      description: job.description || "",
      requiredSkills: (job.requiredSkills || []).join(", "),
      experience: job.experience || "Fresher",
      salary: job.salary || ""
    });
    setShowForm(true);
    setMessage("");
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      requiredSkills: form.requiredSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    };

    try {
      const url = editingId
        ? `${API_URL}/jobs/${editingId}`
        : `${API_URL}/jobs`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save job");
      }

      setMessage(data.message || "Job saved successfully");
      setShowForm(false);
      setForm(emptyJob);
      setEditingId(null);
      await loadJobs();
    } catch (err) {
      setError(err.message || "Could not save job");
    } finally {
      setSaving(false);
    }
  };

  const toggleJob = async (job) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/jobs/${job._id}/active`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ isActive: !job.isActive })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update job");
      }

      setMessage(data.message || "Job status updated");
      await loadJobs();
    } catch (err) {
      setError(err.message || "Could not update job");
    }
  };

  return (
    <div className="rjobs-page">
      <header className="rjobs-header">
        <div className="rjobs-brand">
          <BriefcaseBusiness size={25} />
          <span>HireLens <b>AI</b></span>
        </div>

        <button className="rjobs-back" onClick={() => navigate("/recruiter")}>
          Back to Workspace
        </button>
      </header>

      <main className="rjobs-main">
        <section className="rjobs-heading">
          <div>
            <p className="rjobs-eyebrow">RECRUITER TOOLS</p>
            <h1>Job Management</h1>
            <p>Create, edit and manage your job listings.</p>
          </div>

          <div className="rjobs-actions">
            <button className="rjobs-secondary" onClick={loadJobs}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="rjobs-primary" onClick={openCreateForm}>
              <Plus size={18} /> Post a Job
            </button>
          </div>
        </section>

        {message && <div className="rjobs-success">{message}</div>}
        {error && <div className="rjobs-error">{error}</div>}

        {showForm && (
          <section className="rjobs-form-card">
            <div className="rjobs-form-heading">
              <h2>{editingId ? "Edit Job" : "Create a Job"}</h2>
              <button
                type="button"
                className="rjobs-close"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="rjobs-form">
              <label>
                Job Title *
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Company *
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Location *
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Job Type
                <select
                  name="jobType"
                  value={form.jobType}
                  onChange={handleChange}
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Internship</option>
                  <option>Remote</option>
                </select>
              </label>

              <label>
                Experience
                <input
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="Fresher or 1-2 years"
                />
              </label>

              <label>
                Salary
                <input
                  name="salary"
                  value={form.salary}
                  onChange={handleChange}
                  placeholder="e.g. ₹10,000–₹15,000/month"
                />
              </label>

              <label className="rjobs-full">
                Required Skills * (comma-separated)
                <input
                  name="requiredSkills"
                  value={form.requiredSkills}
                  onChange={handleChange}
                  placeholder="React, Node.js, MongoDB"
                  required
                />
              </label>

              <label className="rjobs-full">
                Job Description *
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  required
                />
              </label>

              <div className="rjobs-full rjobs-form-actions">
                <button
                  type="button"
                  className="rjobs-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="rjobs-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Publish Job"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rjobs-list-section">
          <div className="rjobs-list-heading">
            <h2>Your Listings</h2>
            <span>{jobs.length} total</span>
          </div>

          {loading ? (
            <p className="rjobs-state">Loading your jobs...</p>
          ) : jobs.length === 0 ? (
            <div className="rjobs-empty">
              <BriefcaseBusiness size={35} />
              <h3>No jobs posted yet</h3>
              <p>Create your first job listing to get started.</p>
              <button className="rjobs-primary" onClick={openCreateForm}>
                <Plus size={18} /> Post a Job
              </button>
            </div>
          ) : (
            <div className="rjobs-list">
              {jobs.map((job) => (
                <article className="rjobs-card" key={job._id}>
                  <div className="rjobs-card-top">
                    <div className="rjobs-job-icon">
                      <BriefcaseBusiness size={21} />
                    </div>
                    <span
                      className={
                        job.isActive
                          ? "rjobs-status active"
                          : "rjobs-status inactive"
                      }
                    >
                      {job.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <h3>{job.title}</h3>
                  <p className="rjobs-company">{job.company}</p>
                  <p className="rjobs-location">
                    <MapPin size={15} /> {job.location}
                  </p>

                  <div className="rjobs-tags">
                    <span>{job.jobType}</span>
                    <span>{job.experience || "Fresher"}</span>
                  </div>

                  <p className="rjobs-skills">
                    <b>Skills:</b>{" "}
                    {(job.requiredSkills || []).join(", ")}
                  </p>

                  <div className="rjobs-card-actions">
                    <button
                      className="rjobs-secondary"
                      onClick={() => openEditForm(job)}
                    >
                      <Pencil size={15} /> Edit
                    </button>
                    <button
                      className="rjobs-secondary"
                      onClick={() => toggleJob(job)}
                    >
                      <Power size={15} />
                      {job.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default RecruiterJobs;
