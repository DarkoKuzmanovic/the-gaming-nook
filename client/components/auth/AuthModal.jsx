import React, { useState } from "react";
import authService from "../../services/authService";
import "./AuthModal.css";

const AuthModal = ({ isOpen, onClose, onAuthSuccess, defaultMode = "login", embedded = false }) => {
  const [mode, setMode] = useState(defaultMode); // 'login', 'register', 'guest'
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let user;

      if (mode === "login") {
        if (!formData.email || !formData.password) {
          throw new Error("Please fill in all fields");
        }
        user = await authService.login(formData.email, formData.password);
      } else if (mode === "register") {
        if (!formData.username || !formData.email || !formData.password) {
          throw new Error("Please fill in all fields");
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }
        user = await authService.register(formData.username, formData.email, formData.password);
      } else if (mode === "guest") {
        if (!formData.username || formData.username.length < 2) {
          throw new Error("Please enter a username (at least 2 characters)");
        }
        user = await authService.guestLogin(formData.username);
      }

      // Success
      onAuthSuccess(user);
      onClose();

      // Reset form
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  if (!isOpen) return null;

  if (embedded) {
    return (
      <div className="auth-form-embedded">
        <div className="auth-header-embedded">
          <h3>
            {mode === "login" && "Welcome Back!"}
            {mode === "register" && "Join The Gaming Nook"}
            {mode === "guest" && "Play as Guest"}
          </h3>
          <p>
            {mode === "login" && "Sign in to your account"}
            {mode === "register" && "Create your account to track stats"}
            {mode === "guest" && "Enter a username to play anonymously"}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          {(mode === "register" || mode === "guest") && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                disabled={loading}
                required
              />
            </div>
          )}

          {(mode === "login" || mode === "register") && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                disabled={loading}
                required
              />
            </div>
          )}

          {(mode === "login" || mode === "register") && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                disabled={loading}
                required
              />
            </div>
          )}

          {mode === "register" && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                disabled={loading}
                required
              />
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              "Please wait..."
            ) : (
              <>
                {mode === "login" && "Sign In"}
                {mode === "register" && "Create Account"}
                {mode === "guest" && "Continue as Guest"}
              </>
            )}
          </button>
        </form>

        <div className="auth-mode-switcher">
          {mode === "login" && (
            <>
              <p>
                Don't have an account?{" "}
                <button type="button" onClick={() => switchMode("register")}>
                  Sign up
                </button>
              </p>
              <p>
                Or{" "}
                <button type="button" onClick={() => switchMode("guest")}>
                  play as guest
                </button>
              </p>
            </>
          )}

          {mode === "register" && (
            <>
              <p>
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("login")}>
                  Sign in
                </button>
              </p>
              <p>
                Or{" "}
                <button type="button" onClick={() => switchMode("guest")}>
                  play as guest
                </button>
              </p>
            </>
          )}

          {mode === "guest" && (
            <>
              <p>
                Want to track your stats?{" "}
                <button type="button" onClick={() => switchMode("register")}>
                  Create account
                </button>
              </p>
              <p>
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("login")}>
                  Sign in
                </button>
              </p>
            </>
          )}

          <div className="auth-benefits-compact">
            <span>Account Benefits</span>
            <button type="button" className="benefits-info-btn" title="Hover to see benefits">
              ?
            </button>
            <div className="benefits-tooltip">
              <ul>
                <li>🏆 Track your game statistics</li>
                <li>📊 See your win/loss ratios</li>
                <li>🎮 Game history and achievements</li>
                <li>⚡ Seamless game experience</li>
              </ul>
            </div>
          </div>
        </div>


      </div>
    );
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          ×
        </button>

        <div className="auth-modal-header">
          <h2>
            {mode === "login" && "Welcome Back!"}
            {mode === "register" && "Join The Gaming Nook"}
            {mode === "guest" && "Play as Guest"}
          </h2>
          <p>
            {mode === "login" && "Sign in to your account"}
            {mode === "register" && "Create your account to track stats"}
            {mode === "guest" && "Enter a username to play anonymously"}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          {(mode === "register" || mode === "guest") && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                disabled={loading}
                required
              />
            </div>
          )}

          {(mode === "login" || mode === "register") && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                disabled={loading}
                required
              />
            </div>
          )}

          {(mode === "login" || mode === "register") && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                disabled={loading}
                required
              />
            </div>
          )}

          {mode === "register" && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                disabled={loading}
                required
              />
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              "Please wait..."
            ) : (
              <>
                {mode === "login" && "Sign In"}
                {mode === "register" && "Create Account"}
                {mode === "guest" && "Continue as Guest"}
              </>
            )}
          </button>
        </form>

        <div className="auth-mode-switcher">
          {mode === "login" && (
            <>
              <p>
                Don't have an account?{" "}
                <button type="button" onClick={() => switchMode("register")}>
                  Sign up
                </button>
              </p>
              <p>
                Or{" "}
                <button type="button" onClick={() => switchMode("guest")}>
                  play as guest
                </button>
              </p>
            </>
          )}

          {mode === "register" && (
            <>
              <p>
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("login")}>
                  Sign in
                </button>
              </p>
              <p>
                Or{" "}
                <button type="button" onClick={() => switchMode("guest")}>
                  play as guest
                </button>
              </p>
            </>
          )}

          {mode === "guest" && (
            <>
              <p>
                Want to track your stats?{" "}
                <button type="button" onClick={() => switchMode("register")}>
                  Create account
                </button>
              </p>
              <p>
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("login")}>
                  Sign in
                </button>
              </p>
            </>
          )}

          <div className="auth-benefits-compact">
            <span>Account Benefits</span>
            <button type="button" className="benefits-info-btn" title="Hover to see benefits">
              ?
            </button>
            <div className="benefits-tooltip">
              <ul>
                <li>🏆 Track your game statistics</li>
                <li>📊 See your win/loss ratios</li>
                <li>🎮 Game history and achievements</li>
                <li>⚡ Seamless game experience</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
