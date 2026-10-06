import "./App.css";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import AuthModal from "./AuthModal";
import MyContext from "./MyContext";
import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";

const GUEST_LIMIT_SECONDS = 300; // 5 Minutes (300 seconds)

function App() {
  const [prompt, setPrompt] = useState("");
  const [prevChat, setPrevChat] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [reply, setReply] = useState(null);
  const [currthreadId, setCurrthreadId] = useState(uuid());
  const [allThreads, setAllThreads] = useState([]);

  // Auth States
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("signup"); // 'login' | 'signup'
  const [guestTimeRemaining, setGuestTimeRemaining] = useState(GUEST_LIMIT_SECONDS);
  const [isGuestExpired, setIsGuestExpired] = useState(false);

  // Validate Token on Mount
  useEffect(() => {
    if (token) {
      fetch("http://localhost:8080/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
          } else {
            logout();
          }
        })
        .catch(() => {});
    }
  }, [token]);

  // 5-Minute Guest Trial Timer
  useEffect(() => {
    if (user) {
      // User is logged in: no guest restrictions
      setIsGuestExpired(false);
      return;
    }

    // Guest user trial tracking
    let startTime = localStorage.getItem("guest_trial_start");
    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem("guest_trial_start", startTime);
    }

    const checkTimer = () => {
      const elapsed = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
      const remaining = Math.max(0, GUEST_LIMIT_SECONDS - elapsed);
      setGuestTimeRemaining(remaining);

      if (remaining <= 0) {
        setIsGuestExpired(true);
        setIsAuthModalOpen(true);
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Login handler
  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setIsGuestExpired(false);
    setIsAuthModalOpen(false);
  };

  // Logout handler
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("guest_trial_start"); // Fresh guest trial
    setCurrthreadId(uuid());
    setPrevChat([]);
    setReply(null);
    setNewChat(true);
  };

  const openAuthModal = (mode = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const providerValue = {
    prompt,
    setPrompt,
    reply,
    setReply,
    currthreadId,
    setCurrthreadId,
    newChat,
    setNewChat,
    prevChat,
    setPrevChat,
    allThreads,
    setAllThreads,
    user,
    token,
    login,
    logout,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    openAuthModal,
    guestTimeRemaining,
    isGuestExpired,
  };

  return (
    <div className="app">
      <MyContext.Provider value={providerValue}>
        <Sidebar />
        <ChatWindow />
        <AuthModal />
      </MyContext.Provider>
    </div>
  );
}

export default App;
