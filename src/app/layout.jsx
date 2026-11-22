if (typeof window === "undefined" && typeof global !== "undefined") {
  if (!global.localStorage) {
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }
}

import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";

export const metadata = {
  title: "CampusFix – Smart Campus Maintenance Management System",
  description: "Web-based campus maintenance management system designed to simplify reporting, tracking, and managing maintenance complaints.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
