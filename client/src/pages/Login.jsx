import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, Mail, LockKeyhole, ArrowRight } from "lucide-react";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
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
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed. Please try again.");
      }

      if (!data.token) {
        throw new Error("Login succeeded but no authentication token was returned.");
      }

      sessionStorage.setItem("hirelensToken", data.token);
      sessionStorage.setItem("hirelensUser", JSON.stringify(data.user));

      navigate(data.user?.role === "recruiter" ? "/recruiter" : "/dashboard");
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Make sure your backend is running."
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
          <BriefcaseBusiness size={23} />
        </span>
        <span>HireLens<span className="brand-accent"> AI</span></span>
      </Link>

      <div className="auth-card">
        <div className="auth-heading">
          <span className="auth-eyebrow">WELCOME BACK</span>
          <h1>Sign in to HireLens</h1>
          <p>Continue your journey toward the right opportunity.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="auth-input-wrap">
            <LockKeyhole size={18} />
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>

        <Link to="/" className="auth-back">← Back to home</Link>
      </div>

      <p className="auth-footer">
        Smarter hiring. Better opportunities.
      </p>
    </div>
  );
}

export default Login;
