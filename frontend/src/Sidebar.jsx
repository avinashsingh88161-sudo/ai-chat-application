import "./Sidebar.css";
import { useContext, useEffect, useState, useRef } from "react";
import MyContext from "./MyContext.jsx";
import { v4 as uuid } from "uuid";

function Sidebar() {
  const {
    allThreads,
    setAllThreads,
    currthreadId,
    setCurrthreadId,
    setPrevChat,
    setReply,
    setNewChat,
    setPrompt,
    user,
    logout,
    openAuthModal,
    guestTimeRemaining,
    isGuestExpired,
  } = useContext(MyContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const [menuState, setMenuState] = useState({
    isOpen: false,
    thread: null,
    position: { top: 0, left: 0 },
  });

  const menuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const editInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2500);
  };

  // Helper to extract initials
  const getInitials = (fullName) => {
    if (!fullName) return "G";
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // Format mm:ss
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Fetch all threads on mount or user change
  const getAllThreads = async () => {
    try {
      const url = user?.id
        ? `http://localhost:8080/api/thread?userId=${user.id}`
        : "http://localhost:8080/api/thread";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch threads");
      const data = await response.json();
      setAllThreads(data);
    } catch (err) {
      console.error("Error fetching threads:", err);
    }
  };

  useEffect(() => {
    getAllThreads();
  }, [user]);

  // Close menus on click outside or scroll
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuState({ isOpen: false, thread: null, position: { top: 0, left: 0 } });
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleScroll = () => {
      if (menuState.isOpen) {
        setMenuState({ isOpen: false, thread: null, position: { top: 0, left: 0 } });
      }
      if (isProfileMenuOpen) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [menuState.isOpen, isProfileMenuOpen]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingThreadId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingThreadId]);

  const handleNewChat = () => {
    const newId = uuid();
    setCurrthreadId(newId);
    setPrevChat([]);
    setReply(null);
    setNewChat(true);
    setPrompt("");
    setMenuState({ isOpen: false, thread: null, position: { top: 0, left: 0 } });
    setEditingThreadId(null);
  };

  const changeThread = async (threadId) => {
    if (editingThreadId) return;
    try {
      const response = await fetch(
        `http://localhost:8080/api/thread/${threadId}`
      );
      if (!response.ok) throw new Error("Thread not found");
      const data = await response.json();
      setPrevChat(data);
      setCurrthreadId(threadId);
      setNewChat(false);
      setReply(null);
      setMenuState({ isOpen: false, thread: null, position: { top: 0, left: 0 } });
    } catch (err) {
      console.error("Failed to fetch thread:", err);
    }
  };

  // Open 3-dots dropdown menu at exact button position
  const handleOpenMenu = (thread, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    let top = rect.bottom + 4;
    let left = rect.left;
    
    if (top + 260 > window.innerHeight) {
      top = rect.top - 240;
    }
    
    setMenuState({
      isOpen: true,
      thread,
      position: { top, left },
    });
  };

  // Share action
  const handleShare = async (thread, e) => {
    if (e) e.stopPropagation();
    setMenuState({ isOpen: false, thread: null, position: { top: 0, left: 0 } });
    try {
      const shareUrl = `${window.location.origin}/chat/${thread.threadId}`;
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied to clipboard!");
    } catch (err) {
      showToast("Chat link ready to share!");
    }
  };

  // Toggle Pin / Unpin
  const handleTogglePin = async (thread, e) => {
    if (e) e.stopPropagation();
    setMenuState({ isOpen: false, thread: null, position: { top: 0, left: 0 } });
    const newPinnedStatus = !thread.pinned;

    setAllThreads((prev) => {
      const updated = prev.map((t) =>
        t.threadId === thread.threadId ? { ...t, pinned: newPinnedStatus } : t
      );
      return updated.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });
    });

    showToast(newPinnedStatus ? "Chat pinned to top" : "Chat unpinned");

    try {
      await fetch(`http://localhost:8080/api/thread/${thread.threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: newPinnedStatus }),
      });
    } catch (err) {
      console.error("Failed to update pin status:", err);
      getAllThreads();
    }
  };

  // Start Rename
  const handleStartRename = (thread, e) => {
    if (e) e.stopPropagation();
    setEditingThreadId(thread.threadId);
    setEditingTitle(thread.title || "New Chat");
    setMenuState({ isOpen: false, thread: null, position: { top: 0, left: 0 } });
  };

  // Save Rename
  const handleSaveRename = async (threadId, e) => {
    if (e) e.stopPropagation();
    const finalTitle = editingTitle.trim() || "Untitled Chat";

    setAllThreads((prev) =>
      prev.map((t) =>
        t.threadId === threadId ? { ...t, title: finalTitle } : t
      )
    );
    setEditingThreadId(null);
    showToast("Chat renamed successfully");

    try {
      await fetch(`http://localhost:8080/api/thread/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: finalTitle }),
      });
    } catch (err) {
      console.error("Failed to save renamed title:", err);
      getAllThreads();
    }
  };

  // Cancel Rename
  const handleCancelRename = (e) => {
    if (e) e.stopPropagation();
    setEditingThreadId(null);
    setEditingTitle("");
  };

  // Archive Chat
  const handleArchive = (thread, e) => {
    if (e) e.stopPropagation();
    setMenuState({ isOpen: false, thread: null, position: { top: 0, left: 0 } });
    showToast("Chat archived");
  };

  // Move to Project
  const handleMoveToProject = (thread, e) => {
    if (e) e.stopPropagation();
    setMenuState({ isOpen: false, thread: null, position: { top: 0, left: 0 } });
    showToast("Moved to Project");
  };

  // Delete Thread
  const handleDeleteThread = async (threadId, e) => {
    if (e) e.stopPropagation();
    setMenuState({ isOpen: false, thread: null, position: { top: 0, left: 0 } });

    const remaining = allThreads.filter((t) => t.threadId !== threadId);
    setAllThreads(remaining);
    showToast("Chat deleted");

    if (currthreadId === threadId) {
      if (remaining.length > 0) {
        changeThread(remaining[0].threadId);
      } else {
        handleNewChat();
      }
    }

    try {
      await fetch(`http://localhost:8080/api/thread/${threadId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete thread:", err);
      getAllThreads();
    }
  };

  // Filter threads by search query
  const filteredThreads = allThreads.filter((t) =>
    (t.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedThreads = filteredThreads.filter((t) => t.pinned);
  const recentThreads = filteredThreads.filter((t) => !t.pinned);

  const renderThreadItem = (thread, isPinnedSection = false) => {
    const isActive = thread.threadId === currthreadId;
    const isEditing = thread.threadId === editingThreadId;
    const isMenuOpen = menuState.isOpen && menuState.thread?.threadId === thread.threadId;

    if (isEditing) {
      return (
        <li
          key={thread.threadId}
          className="threadItem editingItem"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={editInputRef}
            type="text"
            className="renameInput"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveRename(thread.threadId, e);
              if (e.key === "Escape") handleCancelRename(e);
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="editActions">
            <button
              className="actionIconBtn saveBtn"
              onClick={(e) => handleSaveRename(thread.threadId, e)}
            >
              <i className="fa-solid fa-check"></i>
            </button>
            <button
              className="actionIconBtn cancelBtn"
              onClick={(e) => handleCancelRename(e)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </li>
      );
    }

    return (
      <li
        key={thread.threadId}
        onClick={() => changeThread(thread.threadId)}
        className={`threadItem ${isActive ? "activeThread" : ""} ${isMenuOpen ? "activeMenuThread" : ""}`}
      >
        <div className="threadLeft">
          {isPinnedSection && (
            <span className="pinnedBadgeIcon">
              <i className="fa-solid fa-thumbtack"></i>
            </span>
          )}
          <span className="threadTitle">{thread.title || "New Chat"}</span>
        </div>

        {/* Hover / Active Actions */}
        <div
          className={`threadActions ${isMenuOpen ? "forceVisible" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Pin / Unpin Button */}
          <button
            className="actionIconBtn"
            onClick={(e) => handleTogglePin(thread, e)}
          >
            <i
              className={`fa-solid fa-thumbtack ${
                thread.pinned ? "pinnedActive" : ""
              }`}
            ></i>
          </button>

          {/* Three Dots More Menu Button */}
          <button
            className="actionIconBtn"
            onClick={(e) => handleOpenMenu(thread, e)}
          >
            <i className="fa-solid fa-ellipsis"></i>
          </button>
        </div>
      </li>
    );
  };

  return (
    <aside className="Sidebar">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toastNotification">
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="sidebarTop">
        <div className="brandRow">
          <div className="brandName" onClick={handleNewChat}>
            <span>ChatGPT</span>
          </div>
          <div className="brandIcons">
            {!user && (
              <button
                className="headerLoginBtn"
                onClick={() => openAuthModal("login")}
              >
                Log in
              </button>
            )}
            <button
              className={`iconBtn ${showSearch ? "activeIconBtn" : ""}`}
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setSearchQuery("");
              }}
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
            <button className="iconBtn" onClick={handleNewChat}>
              <i className="fa-regular fa-pen-to-square"></i>
            </button>
          </div>
        </div>

        {/* Search Bar (Collapsible) */}
        {showSearch && (
          <div className="searchContainer">
            <i className="fa-solid fa-magnifying-glass searchIcon"></i>
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                className="clearSearchBtn"
                onClick={() => setSearchQuery("")}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        )}
      </div>

      {/* History List */}
      <div className="historyContainer">
        {/* Pinned Chats Section */}
        {pinnedThreads.length > 0 && (
          <div className="historySection">
            <div className="sectionHeading">Pinned</div>
            <ul className="historyList">
              {pinnedThreads.map((thread) => renderThreadItem(thread, true))}
            </ul>
          </div>
        )}

        {/* Recents Section */}
        <div className="historySection">
          {(pinnedThreads.length > 0 || recentThreads.length > 0) && (
            <div className="sectionHeading">Recents</div>
          )}
          <ul className="historyList">
            {recentThreads.length > 0 ? (
              recentThreads.map((thread) => renderThreadItem(thread, false))
            ) : pinnedThreads.length === 0 ? (
              <li className="noHistory">
                {searchQuery
                  ? "No matching chats found"
                  : "No chat history yet"}
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      {/* Floating ChatGPT 3-Dots Dropdown Menu */}
      {menuState.isOpen && menuState.thread && (
        <div
          ref={menuRef}
          className="chatgptDropdown"
          style={{
            top: `${menuState.position.top}px`,
            left: `${menuState.position.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Share */}
          <button
            className="dropdownItem"
            onClick={(e) => handleShare(menuState.thread, e)}
          >
            <i className="fa-solid fa-arrow-up-from-bracket"></i>
            <span>Share</span>
          </button>

          {/* Rename */}
          <button
            className="dropdownItem"
            onClick={(e) => handleStartRename(menuState.thread, e)}
          >
            <i className="fa-regular fa-pen-to-square"></i>
            <span>Rename</span>
          </button>

          <div className="dropdownDivider"></div>

          {/* Pin / Unpin */}
          <button
            className="dropdownItem"
            onClick={(e) => handleTogglePin(menuState.thread, e)}
          >
            <i className="fa-solid fa-thumbtack"></i>
            <span>{menuState.thread.pinned ? "Unpin chat" : "Pin chat"}</span>
          </button>

          {/* Archive */}
          <button
            className="dropdownItem"
            onClick={(e) => handleArchive(menuState.thread, e)}
          >
            <i className="fa-solid fa-box-archive"></i>
            <span>Archive</span>
          </button>

          {/* Delete */}
          <button
            className="dropdownItem deleteItem"
            onClick={(e) => handleDeleteThread(menuState.thread.threadId, e)}
          >
            <i className="fa-regular fa-trash-can"></i>
            <span>Delete</span>
          </button>

          <div className="dropdownDivider"></div>

          {/* Move to project */}
          <button
            className="dropdownItem projectItem"
            onClick={(e) => handleMoveToProject(menuState.thread, e)}
          >
            <div className="projectItemLeft">
              <i className="fa-regular fa-folder"></i>
              <span>Move to project</span>
            </div>
            <i className="fa-solid fa-chevron-right projectChevron"></i>
          </button>
        </div>
      )}

      {/* Profile Card & ChatGPT Profile Popup Menu */}
      <div className="sidebarFooter">
        <div
          className={`userProfileCard ${isProfileMenuOpen ? "activeProfileCard" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (user) {
              setIsProfileMenuOpen(!isProfileMenuOpen);
            } else {
              openAuthModal("signup");
            }
          }}
        >
          <div className={`userAvatar ${!user ? "guestAvatar" : ""}`}>
            {user ? getInitials(user.name) : "G"}
          </div>
          <div className="userInfo">
            <span className="userName">{user ? user.name : "Guest User"}</span>
            <span className="userPlan">
              {user ? (
                user.plan || "Free"
              ) : isGuestExpired ? (
                <span className="trialExpiredText">Trial Expired (Sign up)</span>
              ) : (
                <span className="trialBadge">Trial: {formatTimer(guestTimeRemaining)}</span>
              )}
            </span>
          </div>
          {user && (
            <i className="fa-solid fa-ellipsis profileMoreIcon"></i>
          )}
        </div>

        {/* ChatGPT Profile Popover Menu */}
        {isProfileMenuOpen && user && (
          <div ref={profileMenuRef} className="profilePopoverMenu">
            <div className="profileMenuHeader">
              <div className="userAvatar">{getInitials(user.name)}</div>
              <div className="profileHeaderText">
                <span className="profileHeaderName">{user.name}</span>
                <span className="profileHeaderEmail">{user.email}</span>
              </div>
            </div>

            <div className="dropdownDivider"></div>

            <button
              className="dropdownItem logoutItem"
              onClick={() => {
                setIsProfileMenuOpen(false);
                logout();
                showToast("Logged out successfully");
              }}
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
