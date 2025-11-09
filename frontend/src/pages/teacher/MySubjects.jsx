import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";

export default function MySubjects(){
  const { api, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ (async ()=>{ try { setLoading(true); const res = await api.get(`/api/courses?teacherId=${user._id}`); setCourses(res.data || []); } catch(e){ try { const r = await api.get("/api/courses"); setCourses((r.data || []).filter(c => !c.assignedTeacher || c.assignedTeacher === user._id || c.assignedTeacher?._id === user._id)); } catch(err){console.error(err);} } finally{setLoading(false)} })(); },[]);

  return (
    <Layout title="My Subjects">
      {loading ? <Loader/> : (
        <div className="space-y-2">
          {courses.length === 0 ? <div className="text-sm text-gray-500">No subjects assigned</div> :
            courses.map(c => <div className="card p-3" key={c._id}>{c.name || c.title}</div>)
          }
        </div>
      )}
    </Layout>
  );
}
