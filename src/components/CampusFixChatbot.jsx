"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Bot,
  Send,
  User,
  Trash2,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  Wrench,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

// ============================================================
// CampusFix AI Chatbot Component
// Powered by Gemini AI backend (/api/chatbot)
// ============================================================

const CampusFixChatbot = ({ darkMode: darkModeProp }) => {
  const { darkMode: contextDark } = useTheme();
  const darkMode =
    typeof darkModeProp === "boolean" ? darkModeProp : contextDark;

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const roleTitle = useMemo(() => {
    if (!user?.role) return "AI Assistant";
    const formatted =
      user.role.charAt(0).toUpperCase() + user.role.slice(1);
    return `${formatted} Assistant`;
  }, [user]);

  const initialMessage = useMemo(
    () => ({
      id: "initial-greeting",
      sender: "bot",
      text:
        "Hello! 👋 I am CampusFix AI.\n\nYou can ask me anything about CampusFix, filing complaints, technician assignments, block admins, maintenance tracking, or status updates.\n\nAap Hindi, English aur Hinglish mein bhi mujhse baat kar sakte ho.",
    }),
    []
  );

  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ----------------------------------------------------------
  // Quick Suggestion Questions
  // ----------------------------------------------------------
  const quickQuestions = useMemo(
    () => [
      "What is CampusFix?",
      "Complaint kaise report karu?",
      "Who handles AC complaints?",
      "Pending ka matlab kya hai?",
      "Supervisor kya karta hai?",
      "Fan complaint ka technician kaun hai?",
      "Who is the Admin for A Block?",
      "Emergency electrical hazard guidance",
    ],
    []
  );

  // ----------------------------------------------------------
  // Auto scroll to latest message
  // ----------------------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, typing]);

  // ----------------------------------------------------------
  // Send Message to Gemini AI Backend
  // ----------------------------------------------------------
  const sendMessage = async (text = input) => {
    const cleanText = text.trim();

    if (!cleanText || typing) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: cleanText,
    };

    // Filter out initial greeting so conversation starts with user turn for Gemini multi-turn format
    const history = messages
      .filter((item) => item.id !== "initial-greeting" && item.text)
      .slice(-10)
      .map((item) => ({
        role: item.sender === "user" ? "user" : "model",
        text: item.text,
      }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    try {
      const response = await api.post("/chatbot", {
        message: cleanText,
        history,
      });

      const reply =
        response.data?.reply ||
        "I could not generate a response. Please try asking again.";

      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: reply,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot API Error:", error);

      let errorText =
        error.response?.data?.message ||
        "Unable to connect to CampusFix AI. Please try again.";

      if (error.response?.status === 401) {
        errorText =
          "Your session has expired. Please log in again to use CampusFix AI.";
      } else if (error.response?.status === 503) {
        errorText =
          "AI service is currently not configured or available on the server.";
      }

      const errorMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: errorText,
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setTyping(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // ----------------------------------------------------------
  // Enter key press
  // ----------------------------------------------------------
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // ----------------------------------------------------------
  // Clear chat
  // ----------------------------------------------------------
  const clearChat = () => {
    setMessages([initialMessage]);
    setInput("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // ----------------------------------------------------------
  // Theme classes
  // ----------------------------------------------------------
  const pageBg = darkMode
    ? "bg-slate-950 text-white"
    : "bg-slate-50 text-slate-900";

  const panelBg = darkMode
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const inputBg = darkMode
    ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 focus:border-indigo-500"
    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500";

  return (
    <div className={`w-full ${pageBg}`}>
      <div
        className={`mx-auto flex min-h-[650px] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border shadow-sm ${panelBg}`}
      >
        {/* ==================================================
            Header
        ================================================== */}
        <div
          className={`flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${
            darkMode
              ? "border-slate-800 bg-slate-900"
              : "border-slate-100 bg-white"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <Bot size={28} />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">CampusFix AI</h2>
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                  {roleTitle}
                </span>
              </div>
              <p className={`mt-1 text-sm ${mutedText}`}>
                Ask anything about CampusFix maintenance & workflows
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearChat}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
              darkMode
                ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Trash2 size={16} />
            Clear Chat
          </button>
        </div>

        {/* ==================================================
            Quick Questions
        ================================================== */}
        <div
          className={`border-b px-5 py-4 ${
            darkMode
              ? "border-slate-800 bg-slate-900/70"
              : "border-slate-100 bg-slate-50/70"
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={15} className="text-indigo-500" />
            <p
              className={`text-xs font-black uppercase tracking-[0.12em] ${mutedText}`}
            >
              Try asking
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => sendMessage(question)}
                disabled={typing}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                  darkMode
                    ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-indigo-500 hover:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                } ${typing ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* ==================================================
            Chat Area
        ================================================== */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={`flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6 ${
              darkMode ? "bg-slate-950/60" : "bg-slate-50/40"
            }`}
          >
            {messages.map((message) => {
              const isUser = message.sender === "user";

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-3 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${
                        message.isError ? "bg-rose-600" : "bg-indigo-600"
                      }`}
                    >
                      {message.isError ? (
                        <AlertCircle size={18} />
                      ) : (
                        <Bot size={18} />
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[70%] ${
                      isUser
                        ? "rounded-br-md bg-indigo-600 text-white"
                        : message.isError
                        ? darkMode
                          ? "rounded-bl-md border border-rose-900/60 bg-rose-950/40 text-rose-300"
                          : "rounded-bl-md border border-rose-200 bg-rose-50 text-rose-700"
                        : darkMode
                        ? "rounded-bl-md border border-slate-700 bg-slate-900 text-slate-200"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <div className="whitespace-pre-line">{message.text}</div>
                  </div>

                  {isUser && (
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        darkMode
                          ? "bg-slate-700 text-slate-200"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      <User size={18} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {typing && (
              <div className="flex items-end gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Bot size={18} />
                </div>

                <div
                  className={`rounded-2xl rounded-bl-md border px-4 py-3 ${
                    darkMode
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ==================================================
              Helpful Info Footer
          ================================================== */}
          <div
            className={`grid grid-cols-1 gap-3 border-t px-4 py-4 sm:grid-cols-3 sm:px-6 ${
              darkMode
                ? "border-slate-800 bg-slate-900"
                : "border-slate-100 bg-white"
            }`}
          >
            <div
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                darkMode
                  ? "border-slate-800 bg-slate-950"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <MessageCircle size={17} />
              </div>
              <div>
                <p className="text-xs font-black">Natural Questions</p>
                <p className={`text-[11px] ${mutedText}`}>
                  Ask in English, Hindi, or Hinglish
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                darkMode
                  ? "border-slate-800 bg-slate-950"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck size={17} />
              </div>
              <div>
                <p className="text-xs font-black">Role-Aware AI</p>
                <p className={`text-[11px] ${mutedText}`}>
                  Tailored guidance for your role
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                darkMode
                  ? "border-slate-800 bg-slate-950"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                <Wrench size={17} />
              </div>
              <div>
                <p className="text-xs font-black">Maintenance Knowledge</p>
                <p className={`text-[11px] ${mutedText}`}>
                  Campus blocks, categories & updates
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              Input Area
          ================================================== */}
          <div
            className={`border-t p-4 sm:p-5 ${
              darkMode
                ? "border-slate-800 bg-slate-900"
                : "border-slate-100 bg-white"
            }`}
          >
            <div className="flex items-end gap-3">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={typing}
                  placeholder="Ask CampusFix AI something..."
                  className={`min-h-[50px] w-full resize-none rounded-2xl border px-4 py-3.5 pr-12 text-sm font-medium outline-none transition focus:ring-2 focus:ring-indigo-500/20 ${inputBg} ${
                    typing ? "cursor-not-allowed opacity-60" : ""
                  }`}
                />

                <div
                  className={`pointer-events-none absolute bottom-3.5 right-4 ${mutedText}`}
                >
                  <MessageCircle size={18} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || typing}
                className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={19} />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className={`text-[11px] ${mutedText}`}>
                Press Enter to send, Shift + Enter for new line
              </p>

              <p className={`text-[11px] ${mutedText}`}>CampusFix Gemini AI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusFixChatbot;

