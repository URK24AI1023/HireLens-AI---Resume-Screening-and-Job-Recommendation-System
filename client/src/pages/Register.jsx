
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  UserRound,
  Mail,
  LockKeyhole,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "jobseeker",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Please check your backend."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-brand">
        <span className="auth-brand-icon">
          <Sparkles size={23} />
        </span>
        <span>
          HireLens<span className="brand-accent"> AI</span>
        </span>
      </Link>

      <div className="auth-card">
        <div className="auth-heading">
          <span className="auth-eyebrow">YOUR NEXT CHAPTER</span>
          <h1>Create your account</h1>
          <p>
            Join HireLens AI and discover opportunities aligned with your
            skills.
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {success && (
          <div
            style={{
              padding: "12px",
              marginBottom: "16px",
              borderRadius: "9px",
              background: "#eaf8ef",
              color: "#237744",
              fontSize: "13px",
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>
          <div className="auth-input-wrap">
            <UserRound size={18} />
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <label htmlFor="register-email">Email address</label>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              id="register-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="register-password">Password</label>
          <div className="auth-input-wrap">
            <LockKeyhole size={18} />
            <input
              id="register-password"
              type="password"
              name="password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <label htmlFor="role">I want to join as</label>
          <div className="auth-input-wrap">
            <BriefcaseBusiness size={18} />
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "14px 0",
                border: "none",
                outline: "none",
                background: "transparent",
                color: "#211f35",
                font: "inherit",
                fontSize: "14px",
              }}
            >
              <option value="jobseeker">Job Seeker</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <Link to="/" className="auth-back">
          ← Back to home
        </Link>
      </div>

      <p className="auth-footer">
        Smarter hiring. Better opportunities.
      </p>
    </div>
  );
}

export default Register;
