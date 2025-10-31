import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../context/AuthContext";

export default function PrincipalDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [form, setForm] = useState({
    studentId: "",
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    currentClass: "",
    session: "",
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [sessionFilter, setSessionFilter] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students?schoolId=${user.schoolId}`);
      setStudents(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch students");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchStudents(); }, [user]);

  useEffect(() => {
    let data = [...students];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(s => (s.firstName + " " + s.lastName + " " + s.currentClass + " " + (s.session||"")).toLowerCase().includes(q));
    }
    if (sessionFilter) data = data.filter(s => s.session === sessionFilter);
    if (sort === "name") {
      data.sort((a,b) => (`${a.firstName} ${a.lastName}`).localeCompare(`${b.firstName} ${b.lastName}`, undefined, {sensitivity: "base"}));
    } else {
      data.sort((a,b) => a.currentClass.localeCompare(b.currentClass, undefined, {sensitivity: "base"}));
    }
    setFiltered(data);
  }, [students, search, sort, sessionFilter]);

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.currentClass || !form.studentId) {
      return alert("Please fill required fields");
    }
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/students/${editing._id}`, form);
        setEditing(null);
      } else {
        await api.post("/students", {...form, schoolId: user.schoolId});
      }
      setForm({ studentId: "", firstName: "", lastName: "", gender: "", dateOfBirth: "", currentClass: "", session: "" });
      await fetchStudents();
      alert("Saved");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Save failed");
    } finally { setSubmitting(false); }
  };

  const handleEdit = (s) => {
    setEditing(s);
    setForm({
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      gender: s.gender || "",
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split("T")[0] : "",
      currentClass: s.currentClass,
      session: s.session || "",
    });
    window.scrollTo(0,0);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete student?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/students/${id}`);
      await fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    } finally { setDeletingId(null); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user.name} ({user.role})</h1>
        <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
      </div>

      {/* Form */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">{editing ? "Edit Student" : "Add Student"}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input name="studentId" value={form.studentId} onChange={handleChange} placeholder="Student ID *" className="p-2 border rounded" />
          <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name *" className="p-2 border rounded" />
          <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name *" className="p-2 border rounded" />
          <input name="currentClass" value={form.currentClass} onChange={handleChange} placeholder="Class *" className="p-2 border rounded" />
          <input name="session" value={form.session} onChange={handleChange} placeholder="Session" className="p-2 border rounded" />
          <select name="gender" value={form.gender} onChange={handleChange} className="p-2 border rounded">
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>
          <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} className="p-2 border rounded" />
          <div className="col-span-full flex gap-3">
            <button disabled={submitting} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              {submitting ? "Saving..." : editing ? "Update" : "Add"}
            </button>
            {editing && <button type="button" onClick={()=>{setEditing(null); setForm({studentId:"",firstName:"",lastName:"",gender:"",dateOfBirth:"",currentClass:"",session:""})}} className="bg-gray-400 text-white px-3 py-2 rounded">Cancel</button>}
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center mb-4">
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search" className="p-2 border rounded w-1/3" />
        <select value={sort} onChange={(e)=>setSort(e.target.value)} className="p-2 border rounded">
          <option value="name">Sort by Name</option>
          <option value="class">Sort by Class</option>
        </select>
        <select value={sessionFilter} onChange={(e)=>setSessionFilter(e.target.value)} className="p-2 border rounded">
          <option value="">All sessions</option>
          {[...new Set(students.map(s=>s.session).filter(Boolean))].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow">
        {loading ? <p className="p-4">Loading...</p> : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Class</th>
                <th className="p-2 text-left">Session</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="p-2">{s.studentId}</td>
                  <td className="p-2">{s.firstName} {s.lastName}</td>
                  <td className="p-2">{s.currentClass}</td>
                  <td className="p-2">{s.session}</td>
                  <td className="p-2 text-center">
                    <button onClick={()=>handleEdit(s)} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">Edit</button>
                    <button onClick={()=>handleDelete(s._id)} disabled={deletingId===s._id} className="bg-red-500 text-white px-2 py-1 rounded">{deletingId===s._id ? "Deleting..." : "Delete"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
