import React from "react";
import { useAuth } from "../context/AuthContext";

export default function ThemeToggle() {
  const { theme, setTheme } = useAuth();
  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  return (
    <button onClick={toggle} className="px-3 py-2 rounded border bg-white/70 hover:scale-105">
      {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
