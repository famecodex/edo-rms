import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Home, BookOpen, Users, Building2, FileText, LogOut, Send } from "lucide-react";

export default function Sidebar() {
  const { user, logout, theme, setTheme } = useAuth();
  const role = user?.role;

  const menu = {
    ministry: [
      { name: "Overview", to: "/ministry", icon: <Home size={16} /> },
      { name: "Schools", to: "/ministry/schools", icon: <Building2 size={16} /> },
      { name: "Courses", to: "/ministry/courses", icon: <BookOpen size={16} /> },
      { name: "Teachers", to: "/ministry/teachers", icon: <Users size={16} /> },
      { name: "Principals", to: "/ministry/principals", icon: <Users size={16} /> },
      { name: "Students", to: "/ministry/students", icon: <Users size={16} /> },
      { name: "Transfers", to: "/ministry/transfers", icon: <Send size={16} /> },
    ],
    principal: [
      { name: "Dashboard", to: "/principal", icon: <Home size={16} /> },
      { name: "Students", to: "/principal/students", icon: <Users size={16} /> },
      { name: "Teachers", to: "/principal/teachers", icon: <Users size={16} /> },
      { name: "Transfers", to: "/principal/transfers", icon: <Send size={16} /> },
    ],
    teacher: [
      { name: "Dashboard", to: "/teacher", icon: <Home size={16} /> },
      { name: "My Subjects", to: "/teacher/courses", icon: <BookOpen size={16} /> },
      { name: "Gradebook", to: "/teacher/grades", icon: <FileText size={16} /> },
      { name: "My Students", to: "/teacher/students", icon: <Users size={16} /> },
    ],
    student: [
      { name: "Dashboard", to: "/student", icon: <Home size={16} /> },
      { name: "My Grades", to: "/student/grades", icon: <FileText size={16} /> },
      { name: "Transfer Request", to: "/student/transfers", icon: <Send size={16} /> },
      { name: "Profile", to: "/student/profile", icon: <Users size={16} /> },
    ],
  };

  const links = menu[role] || [];

  return (
    <aside className="w-64 card p-4 h-screen sticky top-4">
      <div className="mb-6">
        <div className="text-2xl font-bold text-edoBlue">EdoRMS</div>
        <div className="text-sm text-gray-500 capitalize">{role || "guest"}</div>
      </div>

      <nav className="flex flex-col gap-2">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({isActive})=>`flex items-center gap-3 p-2 rounded ${isActive ? 'bg-edoBlue/10 text-edoBlue font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
            {l.icon}<span>{l.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={()=>setTheme(theme === 'dark' ? 'light' : 'dark')} className="px-3 py-2 rounded bg-white/70 w-full">
            {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded w-full">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
