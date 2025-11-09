import React, { useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";

export default function Gradebook(){
  const { api, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ studentId: "", courseId: "", score: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      const [sRes, cRes] = await Promise.all([
        api.get(`/api/students?schoolId=${user.schoolId}`),
        api.get(`/api/courses?teacherId=${user._id}`),
      ]);
      setStudents(sRes.data || []);
      setCourses(cRes.data || []);
    } catch (e) {
      console.error('Failed to load gradebook data:', e);
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.schoolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.courseId) {
      alert("Select student and course");
      return;
    }
    
    try {
      setSubmitting(true);
      // send courseId so backend can resolve subject
      await api.post("/api/grades", { ...form, teacherId: user._id });
      alert("Grade saved");
      setForm({ studentId: "", courseId: "", score: "" });
    } catch (error) {
      alert(error.response?.data?.message || "Error saving grade");
    } finally {
      setSubmitting(false);
    }
  }, [form, user._id]);

  return (
    <Layout title="Gradebook">
      {loading ? <Loader/> : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="font-semibold mb-2">Submit Grade</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select 
                value={form.studentId} 
                onChange={(e) => {
                  e.preventDefault();
                  setForm(prev => ({...prev, studentId: e.target.value}));
                }} 
                className="w-full p-2 border rounded"
              >
                <option value="">Select student</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
              <select 
                value={form.courseId} 
                onChange={(e) => {
                  e.preventDefault();
                  setForm(prev => ({...prev, courseId: e.target.value}));
                }} 
                className="w-full p-2 border rounded"
              >
                <option value="">Select course</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name || c.title}
                  </option>
                ))}
              </select>
              <input 
                type="number"
                min="0"
                max="100"
                value={form.score} 
                onChange={(e) => {
                  e.preventDefault();
                  setForm(prev => ({...prev, score: e.target.value}));
                }} 
                placeholder="Score (0-100)" 
                className="w-full p-2 border rounded" 
              />
              <button 
                type="submit"
                disabled={submitting || !form.studentId || !form.courseId || !form.score} 
                className="px-3 py-2 bg-edoBlue text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : "Submit"}
              </button>
            </form>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-2">Quick Student List</h3>
            <div className="space-y-2">
              {students.map(s => <div key={s._id} className="p-2 border rounded">{s.firstName} {s.lastName}</div>)}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
