import "./Chat.css";
import { useContext, useEffect, useRef, useState } from "react";
import MyContext from "./MyContext.jsx";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

const extractText = (node) => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node.props && node.props.children) {
    return extractText(node.props.children);
  }
  return "";
};

function PreBlock({ children }) {
  const [copied, setCopied] = useState(false);

  const codeElement = Array.isArray(children) ? children[0] : children;
  const className = codeElement?.props?.className || "";
  const match = /language-(\w+)/.exec(className);
  const language = match
    ? match[1]
    : className.replace(/hljs/g, "").trim() || "code";

  const rawCode = extractText(children);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="codeBlockWrapper">
      <div className="codeHeader">
        <span className="codeLanguage">
          <i
            className="fa-solid fa-code"
            style={{ marginRight: "6px", fontSize: "0.8rem" }}
          ></i>
          {language}
        </span>
        <button className="copyBtn" onClick={handleCopy} type="button">
          {copied ? (
            <>
              <i className="fa-solid fa-check"></i> Copied!
            </>
          ) : (
            <>
              <i className="fa-regular fa-clipboard"></i> Copy code
            </>
          )}
        </button>
      </div>
      <div className="codeBody">
        <pre>{children}</pre>
      </div>
    </div>
  );
}

function Chat() {
  const { newChat, prevChat } = useContext(MyContext);
  const chatEndRef = useRef(null);

  // Auto-scroll smoothly to bottom as tokens/messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [prevChat]);

  return (
    <div className="chats">
      {newChat && (
        <div className="startNewChatDiv">
          <h1>What can I help with?</h1>
        </div>
      )}

      <div className="chatInner">
        {prevChat &&
          prevChat.map((chat, idx) => (
            <div
              className={chat.role === "user" ? "userDiv" : "gptDiv"}
              key={idx}
            >
              {chat.role === "user" ? (
                <p className="userMsg">{chat.content}</p>
              ) : (
                <div className="gptMsg">
                  <ReactMarkdown
                    rehypePlugins={[rehypeHighlight]}
                    components={{ pre: PreBlock }}
                  >
                    {chat.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}

export default Chat;
