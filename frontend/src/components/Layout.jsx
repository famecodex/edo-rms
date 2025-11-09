import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ title, children }) {
  return (
    <div className="min-h-screen p-6 bg-page">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <Sidebar />
        <main>
          <div className="card p-4 mb-6"><Topbar title={title} /></div>
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
