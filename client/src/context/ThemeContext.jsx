import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("campusfix_theme");
      if (savedTheme) {
        return savedTheme === "dark";
      }
      const studentDark = localStorage.getItem("campusfix_student_dark_mode");
      if (studentDark !== null) {
        return studentDark === "true";
      }
      return (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("campusfix_theme", darkMode ? "dark" : "light");
      localStorage.setItem("campusfix_student_dark_mode", darkMode.toString());
    } catch (e) {
      console.error("Error setting theme in localStorage:", e);
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);
  const setTheme = (mode) => setDarkMode(mode === "dark");

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        isDark: darkMode,
        theme: darkMode ? "dark" : "light",
        toggleTheme,
        setTheme,
        setDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if called outside provider
    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");
    return {
      darkMode: isDark,
      isDark,
      theme: isDark ? "dark" : "light",
      toggleTheme: () => {
        const next = !isDark;
        if (next) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("campusfix_theme", next ? "dark" : "light");
        localStorage.setItem("campusfix_student_dark_mode", next.toString());
      },
      setTheme: (mode) => {
        const isD = mode === "dark";
        if (isD) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("campusfix_theme", mode);
        localStorage.setItem("campusfix_student_dark_mode", isD.toString());
      },
      setDarkMode: (value) => {
        const isD = Boolean(value);
        if (isD) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("campusfix_theme", isD ? "dark" : "light");
        localStorage.setItem("campusfix_student_dark_mode", isD.toString());
      },
    };
  }
  return context;
}

export default ThemeContext;
