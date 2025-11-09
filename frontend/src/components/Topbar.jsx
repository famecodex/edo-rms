import React from "react";
import { useAuth } from "../context/useAuth";

export default function Topbar({ title }) {
  const { user } = useAuth();
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="text-sm text-gray-600">Hello, {user?.name}</div>
    </div>
  );
}
