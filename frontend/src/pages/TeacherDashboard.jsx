import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../context/AuthContext";

export default function TeacherDashboard(){
  const { user, logout } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students?schoolId=${user.schoolId}`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to get students");
    } finally { setLoading(false); }
  };

  useEffect(()=>{ if(user) fetchStudents(); }, [user]);

  const saveGrade = async (studentId) => {
    if (grades[studentId] === undefined || grades[studentId] === "") return alert("Enter grade");
    setSavingId(studentId);
    try {
      await api.post("/grades", { studentId, subject: "General", score: Number(grades[studentId]) });
      alert("Grade saved");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally { setSavingId(null); }
  };

  const filtered = students.filter(s => (s.firstName + " " + s.lastName + " " + s.currentClass).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teacher Panel — {user.name}</h1>
        <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
      </div>

      <div className="mb-4 flex gap-3">
        <input placeholder="Search students" value={search} onChange={(e)=>setSearch(e.target.value)} className="p-2 border rounded w-1/3" />
      </div>

      <div className="bg-white rounded shadow">
        {loading ? <p className="p-4">Loading...</p> : (
          <table className="w-full">
            <thead className="bg-gray-100"><tr><th className="p-2">ID</th><th className="p-2">Name</th><th className="p-2">Class</th><th className="p-2">Grade</th><th className="p-2">Action</th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="p-2">{s.studentId}</td>
                  <td className="p-2">{s.firstName} {s.lastName}</td>
                  <td className="p-2">{s.currentClass}</td>
                  <td className="p-2 w-28"><input type="number" min="0" max="100" value={grades[s._id]||""} onChange={(e)=>setGrades({...grades, [s._id]: e.target.value})} className="p-1 border rounded w-full" /></td>
                  <td className="p-2"><button onClick={()=>saveGrade(s._id)} disabled={savingId===s._id} className="bg-blue-600 text-white px-3 py-1 rounded">{savingId===s._id ? "Saving..." : "Save"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
