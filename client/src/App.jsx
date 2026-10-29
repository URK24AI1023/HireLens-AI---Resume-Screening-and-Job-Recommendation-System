
import { useEffect, useState } from "react";
import {
  ArrowRight,
  FileSearch,
  BriefcaseBusiness,
  Sparkles,
  ChartNoAxesCombined,
  MapPin,
} from "lucide-react";
import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import "./App.css";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import RecruiterJobs from "./pages/RecruiterJobs";

function Home() {
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/jobs");

        if (!response.ok) {
          throw new Error("Unable to load jobs.");
        }

        const data = await response.json();
        setJobs(Array.isArray(data) ? data : []);
      } catch (error) {
        setJobsError(
          "Could not connect to the jobs service. Please try again."
        );
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <div className="app-shell">
      <nav className="navbar">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Sparkles size={21} />
          </span>
          HireLens<span className="brand-ai">AI</span>
        </Link>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#opportunities">Jobs</a>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="login-btn">
            Log in
          </Link>

          <Link to="/register" className="nav-cta">
            Get started <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} />
              YOUR NEXT CAREER MOVE STARTS HERE
            </div>

            <h1>
              Your skills deserve
              <br />
              <span>the right</span> opportunity.
            </h1>

            <p className="hero-description">
              Discover jobs that fit your skills. Understand your resume.
              Build a clearer path toward the career you want.
            </p>

            <div className="hero-actions">
              <button
                className="primary-btn"
                onClick={() =>
                  document.getElementById("opportunities")?.scrollIntoView({
                    behavior: "smooth",
                  })
                }
              >
                Explore jobs <ArrowRight size={17} />
              </button>

              <button
                className="secondary-btn"
                onClick={() =>
                  document.getElementById("features")?.scrollIntoView({
                    behavior: "smooth",
                  })
                }
              >
                Explore features
              </button>
            </div>

            <div className="trust-note">
              <span className="trust-dot" />
              Skill-based matching. Clearer career decisions.
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-orb orb-one" />
            <div className="visual-orb orb-two" />

            <div className="resume-card">
              <div className="resume-top">
                <div className="file-icon">
                  <FileSearch size={22} />
                </div>

                <div>
                  <strong>Resume insights</strong>
                  <span>YOUR PROFILE SNAPSHOT</span>
                </div>

                <span className="live-dot" />
              </div>

              <div className="match-section">
                <div>
                  <span className="muted-label">PROFILE MATCH</span>
                  <h2>
                    78<span>%</span>
                  </h2>
                  <p>Illustrative preview</p>
                </div>

                <div className="score-ring">
                  <div className="ring-inner">78%</div>
                </div>
              </div>

              <div className="card-divider" />

              <div className="skills-heading">
                <strong>Skills overview</strong>
                <span>EXAMPLE DATA</span>
              </div>

              <div className="skill-row">
                <span>Python</span>
                <div className="skill-track">
                  <div style={{ width: "90%" }} />
                </div>
                <b>90</b>
              </div>

              <div className="skill-row">
                <span>SQL</span>
                <div className="skill-track">
                  <div style={{ width: "82%" }} />
                </div>
                <b>82</b>
              </div>

              <div className="skill-row">
                <span>Data viz.</span>
                <div className="skill-track">
                  <div style={{ width: "55%" }} />
                </div>
                <b>55</b>
              </div>

              <div className="recommendation">
                <span className="recommend-icon">
                  <BriefcaseBusiness size={17} />
                </span>

                <div>
                  <strong>Opportunity preview</strong>
                  <p>Example role · Illustrative match</p>
                </div>

                <ArrowRight size={17} />
              </div>
            </div>

            <div className="floating-note">
              <span className="floating-icon">
                <ChartNoAxesCombined size={18} />
              </span>

              <div>
                <strong>Know your next step</strong>
                <span>Find skills worth building</span>
              </div>
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="section-heading">
            <span>CAREER CLARITY, BUILT IN</span>
            <h2>More than a resume checker.</h2>
            <p>
              Tools to help you understand where you stand and where to go
              next.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon lavender">
                <FileSearch size={22} />
              </div>
              <h3>Understand your resume</h3>
              <p>
                Extract skills and explore how your experience aligns with a
                role.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon mint">
                <BriefcaseBusiness size={22} />
              </div>
              <h3>Find relevant roles</h3>
              <p>
                Compare job requirements and discover opportunities that fit
                your profile.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon peach">
                <ChartNoAxesCombined size={22} />
              </div>
              <h3>Close the skill gap</h3>
              <p>
                See missing skills and identify practical areas for
                improvement.
              </p>
            </article>
          </div>
        </section>

        <section className="opportunities-section" id="opportunities">
          <div className="section-heading">
            <span>EXPLORE YOUR NEXT MOVE</span>
            <h2>Latest opportunities.</h2>
            <p>Job listings loaded directly from HireLens AI.</p>
          </div>

          {jobsLoading && (
            <p className="jobs-message">Loading opportunities...</p>
          )}

          {!jobsLoading && jobsError && (
            <p className="jobs-message">{jobsError}</p>
          )}

          {!jobsLoading && !jobsError && jobs.length === 0 && (
            <p className="jobs-message">No active jobs available yet.</p>
          )}

          {!jobsLoading && !jobsError && jobs.length > 0 && (
            <div className="jobs-grid">
              {jobs.map((job) => (
                <article className="job-card" key={job._id}>
                  <div className="job-card-icon">
                    <BriefcaseBusiness size={22} />
                  </div>

                  <span className="job-type">
                    {job.jobType || "Opportunity"}
                  </span>

                  <h3>{job.title}</h3>
                  <p className="job-company">{job.company}</p>

                  <p className="job-location">
                    <MapPin size={15} />
                    {job.location}
                  </p>

                  <p className="job-description">{job.description}</p>

                  <div className="job-skills">
                    {(job.requiredSkills || []).slice(0, 5).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>

                  <div className="job-card-footer">
                    <span>{job.salary || "Salary not specified"}</span>
                    <span className="job-arrow">
                      <ArrowRight size={17} />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="how-section" id="how-it-works">
          <div>
            <span className="section-kicker">A CLEARER WAY FORWARD</span>
            <h2>From resume to next move.</h2>
          </div>

          <div className="steps">
            <div>
              <span>01</span>
              <strong>Upload your resume</strong>
              <p>Start with your existing experience.</p>
            </div>

            <div>
              <span>02</span>
              <strong>Explore your matches</strong>
              <p>See relevant roles and skill alignment.</p>
            </div>

            <div>
              <span>03</span>
              <strong>Plan your next step</strong>
              <p>Turn insights into an improvement plan.</p>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <Link className="brand footer-brand" to="/">
          <span className="brand-icon">
            <Sparkles size={18} />
          </span>
          HireLens<span className="brand-ai">AI</span>
        </Link>

        <span>Career insights for your next chapter.</span>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/recruiter" element={<RecruiterDashboard />}/>
      <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
      <Route
        path="*"
        element={
          <div style={{ padding: "40px", textAlign: "center" }}>
            <h1>Page not found</h1>
            <Link to="/">Return home</Link>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
