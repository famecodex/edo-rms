import React from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
export default function TeacherDashboard(){ const { user } = useAuth(); return <Layout title={`Teacher • ${user?.name}`}> <div className="card p-4">Use the Gradebook and My Subjects menus to manage courses and grades.</div></Layout>; }
