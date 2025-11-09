import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";

export default function TeacherStudents(){
  const { api, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/students?schoolId=${user.schoolId}`);
        setStudents(res.data || []);
      } catch (e) {
        console.error('Failed to fetch students:', e);
      } finally {
        setLoading(false);
      }
    };

    if (user?.schoolId) fetchStudents();
  }, [api, user?.schoolId]);

  return (
    <Layout title="My Students">
      {loading ? <Loader/> : (
        <div className="space-y-2">
          {students.map(s => <div key={s._id} className="card p-3">{s.firstName} {s.lastName} • {s.currentClass}</div>)}
        </div>
      )}
    </Layout>
  );
}
