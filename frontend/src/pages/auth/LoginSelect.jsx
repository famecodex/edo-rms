import React from "react";
import { Link } from "react-router-dom";

export default function LoginSelect(){
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Sign in as</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/login/ministry" className="p-3 rounded bg-edoBlue text-white">Ministry</Link>
          <Link to="/login/principal" className="p-3 rounded bg-edoBlue text-white">Principal</Link>
          <Link to="/login/teacher" className="p-3 rounded bg-edoBlue text-white">Teacher</Link>
          <Link to="/login/student" className="p-3 rounded bg-edoBlue text-white">Student</Link>
        </div>
      </div>
    </div>
  );
}
