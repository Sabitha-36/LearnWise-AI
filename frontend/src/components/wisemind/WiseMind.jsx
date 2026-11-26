
import { useEffect, useRef, useState } from "react";

import {
  X,
  Send,
  Minimize2,
  Maximize2,
  Sparkles,
  Trash2,
  MessageCircle,
  LoaderCircle
} from "lucide-react";

import { sendWiseMindMessage } from "../../services/api";

import "./WiseMind.css";
import avatar from "./wisemind-avatar.gif";

const suggestions = [
  "Explain a difficult concept",
  "Help me prepare for exams",
  "Give me an example",
  "Clear my academic doubt"
];

function WiseMind() {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hii! I'm Lisa AI! ✨ Your personal learning companion. Ask me anything about your subjects, concepts or exams. Let's learn together!"
    }
  ]);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, loading, isOpen, minimized]);

  async function sendMessage(customMessage) {
    const text = (customMessage ?? message).trim();

    if (!text || loading) return;

    const userMessage = {
      role: "user",
      content: text
    };

    // Keep previous messages for Gemini conversation context.
    // Exclude the welcome message and current question.
    const history = messages.slice(1).map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      content: item.content
    }));

    setMessages((previous) => [
      ...previous,
      userMessage
    ]);

    setMessage("");
    setLoading(true);
    setIsOpen(true);
    setMinimized(false);

    try {
      const data = await sendWiseMindMessage(text, history);

      if (!data.reply) {
        throw new Error("Lisa returned an empty response.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply
        }
      ]);

    } catch (error) {
      console.error("Lisa API Error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            `Sorry! 🥺 ${error.message || "I'm having trouble connecting to my AI brain. Please try again."}`
        }
      ]);

    } finally {
      setLoading(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }

  function clearChat() {
    if (loading) return;

    setMessages([
      {
        role: "assistant",
        content:
          "New conversation started! 🌸 What would you like to learn today?"
      }
    ]);

    setMessage("");
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="wisemind-widget">

      {/* FLOATING ANIME CHARACTER */}

      {!isOpen && (
        <button
          type="button"
          className="wisemind-floating-button"
          onClick={() => {
            setIsOpen(true);
            setMinimized(false);
          }}
          aria-label="Open Lisa AI chat"
          title="Chat with Lisa AI"
        >
          <span className="wisemind-pulse"></span>

          <img
            src={avatar}
            alt="Lisa anime AI assistant"
            className="wisemind-avatar"
          />

          <span className="wisemind-online-dot"></span>

          <span className="wisemind-tooltip">
            Hey! Need help? 💜
          </span>
        </button>
      )}

      {/* CHAT WINDOW */}

      {isOpen && (
        <section
          className={`wisemind-chat-window ${
            minimized ? "wisemind-minimized" : ""
          }`}
          aria-label="Lisa AI chat"
        >

          {/* HEADER */}

          <div className="wisemind-header">

            <div className="wisemind-header-profile">
              <div className="wisemind-header-avatar">
                <img src={avatar} alt="" />
              </div>

              <div>
                <h3>
                  Lisa AI
                  <Sparkles size={14} />
                </h3>

                <span>
                  <i></i> Your personal learning buddy
                </span>
              </div>
            </div>

            <div className="wisemind-header-actions">

              <button
                type="button"
                onClick={clearChat}
                disabled={loading}
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <Trash2 size={17} />
              </button>

              <button
                type="button"
                onClick={() => setMinimized(!minimized)}
                title="Minimize chat"
                aria-label="Minimize chat"
              >
                {minimized ? (
                  <Maximize2 size={17} />
                ) : (
                  <Minimize2 size={17} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close chat"
              >
                <X size={19} />
              </button>

            </div>
          </div>

          {!minimized && (
            <>

              {/* CHAT BODY */}

              <div className="wisemind-chat-body">

                <div className="wisemind-welcome-card">

                  <img
                    src={avatar}
                    alt="Lisa AI"
                    className="wisemind-welcome-avatar"
                  />

                  <h3>Hey, Learner! 🌸</h3>

                  <p>
                    I'm here to make your learning journey
                    easier, smarter and more fun.
                  </p>

                </div>

                {messages.map((item, index) => (
                  <div
                    key={index}
                    className={`wisemind-message-row ${
                      item.role === "user"
                        ? "wisemind-user-row"
                        : "wisemind-ai-row"
                    }`}
                  >

                    {item.role === "assistant" && (
                      <div className="wisemind-small-avatar">
                        <img src={avatar} alt="" />
                      </div>
                    )}

                    <div
                      className={`wisemind-message ${
                        item.role === "user"
                          ? "wisemind-user-message"
                          : "wisemind-ai-message"
                      }`}
                    >
                      {item.content}
                    </div>

                  </div>
                ))}

                {loading && (
                  <div className="wisemind-message-row wisemind-ai-row">

                    <div className="wisemind-small-avatar">
                      <img src={avatar} alt="" />
                    </div>

                    <div className="wisemind-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>

                  </div>
                )}

                <div ref={chatEndRef}></div>

              </div>

              {/* QUICK SUGGESTIONS */}

              {messages.length === 1 && (
                <div className="wisemind-suggestions">

                  <p>Try asking me ✨</p>

                  <div>
                    {suggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        disabled={loading}
                        onClick={() => sendMessage(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                </div>
              )}

              {/* MESSAGE INPUT */}

              <div className="wisemind-input-area">

                <div className="wisemind-input-box">

                  <textarea
                    ref={inputRef}
                    rows="1"
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Lisa anything..."
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={!message.trim() || loading}
                    aria-label="Send message"
                  >
                    {loading ? (
                      <LoaderCircle
                        className="wisemind-spin"
                        size={19}
                      />
                    ) : (
                      <Send size={19} />
                    )}
                  </button>

                </div>

                <p>
                  <Sparkles size={11} />
                  Powered by LearnWise AI
                </p>

              </div>

            </>
          )}

          {minimized && (
            <button
              className="wisemind-restore-button"
              type="button"
              onClick={() => setMinimized(false)}
            >
              <MessageCircle size={17} />
              Continue your conversation
            </button>
          )}

        </section>
      )}

    </div>
  );
}

export default WiseMind;
