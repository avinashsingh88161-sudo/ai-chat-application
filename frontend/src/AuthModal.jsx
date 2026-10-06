import React, { useState, useContext } from "react";
import "./AuthModal.css";
import MyContext from "./MyContext";

function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    isGuestExpired,
  } = useContext(MyContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isAuthModalOpen) return null;

  const isLogin = authModalMode === "login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (!isLogin && !name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin
        ? "http://localhost:8080/api/auth/login"
        : "http://localhost:8080/api/auth/signup";

      const payload = isLogin
        ? { email, password }
        : { name, email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Authentication failed. Please try again.");
      }

      // Successful login/signup
      login(data.token, data.user);
      setIsAuthModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = (mode) => {
    setAuthModalMode(mode);
    setErrorMsg("");
  };

  return (
    <div className="authModalOverlay" onClick={() => !isGuestExpired && setIsAuthModalOpen(false)}>
      <div className="authModalCard" onClick={(e) => e.stopPropagation()}>
        {/* Close Button (Only if trial has not expired) */}
        {!isGuestExpired && (
          <button
            className="authModalCloseBtn"
            onClick={() => setIsAuthModalOpen(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}

        {/* Modal Header */}
        <div className="authModalHeader">
          <div className="authModalLogo">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="#ffffff"
            >
              <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
            </svg>
          </div>
          <h2 className="authModalTitle">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="authModalSubtitle">
            {isGuestExpired
              ? "⏳ Your 5-minute trial has ended. Sign up or log in to continue chatting with unlimited access."
              : isLogin
              ? "Log in to your SigmaGPT account to access your full history."
              : "Sign up for free to unlock unlimited AI chats and sync across devices."}
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="authErrorBanner">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="authTabs">
          <button
            className={`authTab ${isLogin ? "activeTab" : ""}`}
            onClick={() => handleSwitchMode("login")}
            type="button"
          >
            Log in
          </button>
          <button
            className={`authTab ${!isLogin ? "activeTab" : ""}`}
            onClick={() => handleSwitchMode("signup")}
            type="button"
          >
            Sign up
          </button>
        </div>

        {/* Form */}
        <form className="authForm" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="authInputGroup">
              <label>Full Name</label>
              <div className="authInputWrapper">
                <i className="fa-regular fa-user inputIcon"></i>
                <input
                  type="text"
                  placeholder="e.g. Avinash Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  autoFocus={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="authInputGroup">
            <label>Email address</label>
            <div className="authInputWrapper">
              <i className="fa-regular fa-envelope inputIcon"></i>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus={isLogin}
              />
            </div>
          </div>

          <div className="authInputGroup">
            <label>Password</label>
            <div className="authInputWrapper">
              <i className="fa-solid fa-lock inputIcon"></i>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="togglePasswordBtn"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i
                  className={`fa-regular ${
                    showPassword ? "fa-eye-slash" : "fa-eye"
                  }`}
                ></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="authSubmitBtn"
            disabled={loading}
          >
            {loading ? (
              <span>
                <i className="fa-solid fa-spinner fa-spin"></i> Please wait...
              </span>
            ) : isLogin ? (
              "Log in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="authModalFooter">
          {isLogin ? (
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                className="authSwitchLink"
                onClick={() => handleSwitchMode("signup")}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="authSwitchLink"
                onClick={() => handleSwitchMode("login")}
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
