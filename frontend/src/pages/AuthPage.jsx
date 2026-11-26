
import { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  ShieldCheck,
  LoaderCircle
} from "lucide-react";

import {
  registerStudent,
  loginStudent
} from "../services/api";

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    course: ""
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

    setError("");
  }

  
async function handleSubmit(e) {
  e.preventDefault();
  setError("");

  try {
    setLoading(true);

    let response;

    if (mode === "signup" && role === "student") {
      response = await registerStudent({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        course: form.course.trim()
      });
    } else {
      // Both students and admins must authenticate through Flask.
      response = await loginStudent({
        email: form.email.trim(),
        password: form.password
      });
    }

    // The backend returns the authenticated user's actual role.
    onLogin(response.user);

  } catch (err) {
    setError(err.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
}

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <BookOpen size={35} />
        <h2>LearnWise AI</h2>
      </div>

      <div className="auth-card">
        <div className="auth-icon">
          {role === "admin" ? (
            <ShieldCheck size={30} />
          ) : (
            <GraduationCap size={30} />
          )}
        </div>

        <h1>
          {mode === "signup"
            ? "Create Your Account"
            : role === "admin"
            ? "Admin Portal"
            : "Welcome Back"}
        </h1>

        <p className="auth-subtitle">
          Your personalised journey to smarter learning.
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={role === "student" ? "selected" : ""}
            onClick={() => {
              setRole("student");
              setMode("login");
              setError("");
            }}
          >
            Student
          </button>

          <button
            type="button"
            className={role === "admin" ? "selected" : ""}
            onClick={() => {
              setRole("admin");
              setMode("login");
              setError("");
            }}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && role === "student" && (
            <>
              <label>Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />

              <label>Course</label>
              <input
                name="course"
                value={form.course}
                onChange={handleChange}
                placeholder="Example: B.Sc Computer Science"
                required
              />
            </>
          )}

          <label>Email Address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            minLength={role === "student" && mode === "signup" ? 8 : undefined}
            required
          />

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="auth-spinner" />
                Please wait...
              </>
            ) : mode === "signup" ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {role === "student" && (
          <p className="auth-switch">
            {mode === "login"
              ? "New to LearnPath AI?"
              : "Already have an account?"}

            <button type="button" onClick={switchMode}>
              {mode === "login" ? "Sign Up" : "Login"}
            </button>
          </p>
        )}

        {role === "admin" && (
          <p className="auth-note">
            Restricted access for authorised administrators.
          </p>
        )}
      </div>
    </div>
  );
}

export default AuthPage;
