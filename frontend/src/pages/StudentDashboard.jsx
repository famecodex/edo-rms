import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../context/AuthContext";

export default function StudentDashboard(){
  const { user, logout } = useContext(AuthContext);
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [schools, setSchools] = useState([]);
  const [toSchool, setToSchool] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sRes, gRes, schoolRes] = await Promise.all([
          api.get(`/students?schoolId=${user.schoolId}`), // optional adjust if user linked to student doc
          api.get(`/grades?schoolId=${user.schoolId}`),
          api.get("/schools")
        ]);
        // find current student record by matching user email or studentId — backend should return linked student
        setGrades(gRes.data.filter(g => String(g.studentId?.user) === String(user._id) || g.studentId?.studentId === user.studentId));
        setSchools(schoolRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    if(user) fetch();
  }, [user]);

  const applyTransfer = async () => {
    if (!toSchool || !reason) return alert("Pick school and give reason");
    try {
      // backend expects /students/:id/transfer-request — student must have a student record id
      // here we assume user.studentRecordId available; if not adjust flow or fetch student id first
      const studentId = user.studentRecordId || user._id; // <-- adapt to how backend links user->student
      await api.post(`/students/${studentId}/transfer-request`, { toSchoolId: toSchool, reason });
      alert("Transfer requested");
    } catch (err) { console.error(err); alert("Request failed"); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Student — {user.name}</h1>
        <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold">Your Grades</h2>
        {grades.length === 0 ? <p>No grades yet</p> : (
          <table className="w-full mt-3">
            <thead className="bg-gray-100"><tr><th className="p-2">Subject</th><th className="p-2">Score</th></tr></thead>
            <tbody>
              {grades.map(g => <tr key={g._id}><td className="p-2">{g.subject}</td><td className="p-2">{g.score}</td></tr>)}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Apply for Transfer</h2>
        <select value={toSchool} onChange={(e)=>setToSchool(e.target.value)} className="p-2 border rounded mb-2 w-full">
          <option value="">Select school</option>
          {schools.map(s => <option key={s._id} value={s._id}>{s.schoolName}</option>)}
        </select>
        <textarea placeholder="Reason" value={reason} onChange={(e)=>setReason(e.target.value)} className="p-2 border rounded w-full mb-2" />
        <button onClick={applyTransfer} className="bg-blue-600 text-white px-3 py-1 rounded">Apply</button>
      </div>
    </div>
  );
}
