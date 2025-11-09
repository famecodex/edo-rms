import React from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
export default function StudentDashboard(){ const { user } = useAuth(); return <Layout title={`Student • ${user?.name}`}><div className="card p-4">Welcome — use the sidebar to view grades, request transfers, and view your profile.</div></Layout>; }
