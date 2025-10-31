import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="bg-white shadow p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="text-lg font-semibold text-blue-700">Edo RMS</div>
        <div className="flex items-center gap-4">
          {!user ? (
            <Link to="/" className="text-sm text-gray-700">Login</Link>
          ) : (
            <>
              {user.role === "ministry" && <Link to="/ministry" className="text-sm">Ministry</Link>}
              {user.role === "principal" && <Link to="/principal" className="text-sm">Principal</Link>}
              {user.role === "teacher" && <Link to="/teacher" className="text-sm">Teacher</Link>}
              {user.role === "student" && <Link to="/student" className="text-sm">Student</Link>}
              <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
