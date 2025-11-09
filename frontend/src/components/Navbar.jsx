import React from "react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ title, onLogout }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur rounded-xl shadow">
      <h2 className="text-xl font-semibold text-edoBlue">{title}</h2>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          onClick={onLogout}
          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
