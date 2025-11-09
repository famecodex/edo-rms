import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";

export default function MinistryDashboard(){
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async ()=>{
      try {
        setLoading(true);
        const [schools, teachers, principals, students] = await Promise.all([
          api.get("/api/schools"),
          api.get("/api/users?role=teacher"),
          api.get("/api/users?role=principal"),
          api.get("/api/users?role=student")
        ]);
        setStats({
          schools: (schools.data || []).length,
          teachers: (teachers.data || []).length,
          principals: (principals.data || []).length,
          students: (students.data || []).length
        });
      } catch(e){ console.error(e); }
      finally { setLoading(false); }
    })();
  },[]);

  return (
    <Layout title="Ministry Overview">
      {loading ? <Loader /> : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4"><div className="text-sm text-gray-500">Schools</div><div className="text-2xl font-bold">{stats.schools}</div></div>
          <div className="card p-4"><div className="text-sm text-gray-500">Teachers</div><div className="text-2xl font-bold">{stats.teachers}</div></div>
          <div className="card p-4"><div className="text-sm text-gray-500">Principals</div><div className="text-2xl font-bold">{stats.principals}</div></div>
          <div className="card p-4"><div className="text-sm text-gray-500">Students</div><div className="text-2xl font-bold">{stats.students}</div></div>
        </div>
      )}
    </Layout>
  );
}
