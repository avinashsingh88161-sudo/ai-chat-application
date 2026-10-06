import "./ChatWindow.css";

import { useState, useContext } from "react";
import Chat from "./Chat.jsx";
import { ScaleLoader } from "react-spinners";
import MyContext from "./MyContext.jsx";

function ChatWindow() {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currthreadId,
    prevChat,
    setPrevChat,
    setNewChat,
    allThreads,
    setAllThreads,
    user,
    openAuthModal,
    isGuestExpired,
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);

  // Extract initials helper
  const getInitials = (fullName) => {
    if (!fullName) return "U";
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const getReply = async () => {
    if (!prompt.trim() || loading) {
      return;
    }

    // Check if guest user has exceeded the 5-minute limit
    if (!user && isGuestExpired) {
      openAuthModal("signup");
      return;
    }

    const userMessage = prompt;
    setPrompt("");
    setNewChat(false);
    setLoading(true);

    // Immediately display user message in the chat
    setPrevChat((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
        threadId: currthreadId,
        userId: user?.id || null,
      }),
    };

    try {
      const response = await fetch("http://localhost:8080/api/chat", options);

      if (!response.ok) {
        let errorMsg = `Server error ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.error) errorMsg = errJson.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported by browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamText = "";
      let hasStarted = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.chunk) {
                streamText += data.chunk;

                if (!hasStarted) {
                  hasStarted = true;
                  setLoading(false); // Hide spinner as soon as first token streams in
                  setPrevChat((prev) => [
                    ...prev,
                    {
                      role: "assistant",
                      content: streamText,
                    },
                  ]);
                } else {
                  // Stream update assistant bubble in real-time
                  setPrevChat((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: streamText,
                    };
                    return updated;
                  });
                }
              }

              if (data.done) {
                // Update sidebar threads list and move updated thread to top of its section
                setAllThreads((prev) => {
                  const existingIndex = prev.findIndex(
                    (t) => t.threadId === currthreadId
                  );
                  const title =
                    userMessage.length > 40
                      ? userMessage.substring(0, 37) + "..."
                      : userMessage;

                  if (existingIndex === -1) {
                    const newThreadObj = {
                      threadId: currthreadId,
                      userId: user?.id || null,
                      title,
                      pinned: false,
                      updatedAt: new Date().toISOString(),
                    };
                    // Place after any pinned threads at the top of recents
                    const pinnedList = prev.filter((t) => t.pinned);
                    const unpinnedList = prev.filter((t) => !t.pinned);
                    return [...pinnedList, newThreadObj, ...unpinnedList];
                  } else {
                    const existing = prev[existingIndex];
                    const updatedItem = {
                      ...existing,
                      updatedAt: new Date().toISOString(),
                    };
                    const remaining = prev.filter(
                      (t) => t.threadId !== currthreadId
                    );
                    if (existing.pinned) {
                      const pinnedList = remaining.filter((t) => t.pinned);
                      const unpinnedList = remaining.filter((t) => !t.pinned);
                      return [updatedItem, ...pinnedList, ...unpinnedList];
                    } else {
                      const pinnedList = remaining.filter((t) => t.pinned);
                      const unpinnedList = remaining.filter((t) => !t.pinned);
                      return [...pinnedList, updatedItem, ...unpinnedList];
                    }
                  }
                });
              }
            } catch (e) {
              // Ignore partial JSON parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching reply:", error);
      setPrevChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ " +
            (error.message ||
              "Something went wrong while generating response. Please try again."),
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="chatWindow">
      <div className="navbar">
        <span className="navBrand">
          ChatGPT <i className="fa-solid fa-angle-down"></i>
        </span>

        <div className="navRight">
          {!user ? (
            <div className="navGuestActions">
              <button
                className="navLoginBtn"
                onClick={() => openAuthModal("login")}
              >
                Log in
              </button>
              <button
                className="navSignupBtn"
                onClick={() => openAuthModal("signup")}
              >
                Sign up
              </button>
            </div>
          ) : (
            <div className="userIcon" title={user.name}>
              <span className="userIconDiv">{getInitials(user.name)}</span>
            </div>
          )}
        </div>
      </div>

      <Chat />

      <ScaleLoader color="#fff" loading={loading} />

      <div className="chatInput">
        <div className="userBox">
          <input
            placeholder={
              !user && isGuestExpired
                ? "Free trial ended — Sign up to continue chatting..."
                : "Ask anything"
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                getReply();
              }
            }}
          />

          <div id="submit" onClick={getReply}>
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>

        <p className="Info">
          ChatGPT can make mistakes. Check info. See Cookie Preference.
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;
