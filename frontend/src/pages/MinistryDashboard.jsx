import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../context/AuthContext";

export default function MinistryDashboard(){
  const { user, logout } = useContext(AuthContext);
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [schoolForm, setSchoolForm] = useState({ schoolName: "", address: "" });
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "principal", schoolId: "" });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sres, ures] = await Promise.all([api.get("/schools"), api.get("/users?role=teacher")]);
      setSchools(sres.data);
      setUsers(ures.data);
    } catch (err) {
      console.error(err);
      alert("Load failed");
    } finally { setLoading(false); }
  };

  useEffect(()=>{ if(user) fetchData(); }, [user]);

  const createSchool = async (e) => {
    e.preventDefault();
    try {
      await api.post("/schools", schoolForm);
      setSchoolForm({ schoolName:"", address:"" });
      await fetchData();
    } catch (err) { console.error(err); alert("Create school failed"); }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users/create", userForm);
      setUserForm({ name:"", email:"", password:"", role:"principal", schoolId:"" });
      await fetchData();
    } catch (err) { console.error(err); alert("Create user failed"); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ministry Dashboard</h1>
        <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Create School</h2>
          <form onSubmit={createSchool} className="flex flex-col gap-2">
            <input placeholder="School Name" value={schoolForm.schoolName} onChange={(e)=>setSchoolForm({...schoolForm, schoolName: e.target.value})} className="p-2 border rounded" />
            <input placeholder="Address" value={schoolForm.address} onChange={(e)=>setSchoolForm({...schoolForm, address: e.target.value})} className="p-2 border rounded" />
            <button className="bg-green-600 text-white px-3 py-1 rounded">Create School</button>
          </form>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Create User (Principal/Teacher)</h2>
          <form onSubmit={createUser} className="flex flex-col gap-2">
            <input placeholder="Name" value={userForm.name} onChange={(e)=>setUserForm({...userForm, name:e.target.value})} className="p-2 border rounded" />
            <input placeholder="Email" value={userForm.email} onChange={(e)=>setUserForm({...userForm, email:e.target.value})} className="p-2 border rounded" />
            <input placeholder="Password" value={userForm.password} onChange={(e)=>setUserForm({...userForm, password:e.target.value})} className="p-2 border rounded" />
            <select value={userForm.role} onChange={(e)=>setUserForm({...userForm, role:e.target.value})} className="p-2 border rounded">
              <option value="principal">Principal</option>
              <option value="teacher">Teacher</option>
            </select>
            <select value={userForm.schoolId} onChange={(e)=>setUserForm({...userForm, schoolId:e.target.value})} className="p-2 border rounded">
              <option value="">Assign to school (optional)</option>
              {schools.map(s => <option key={s._id} value={s._id}>{s.schoolName}</option>)}
            </select>
            <button className="bg-blue-600 text-white px-3 py-1 rounded">Create User</button>
          </form>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg mb-3">Schools</h2>
        {loading ? <p>Loading...</p> : (
          <ul>
            {schools.map(s => <li key={s._id} className="p-2 border-b">{s.schoolName} — {s.address || "—"}</li>)}
          </ul>
        )}
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg mb-3">Teachers (sample)</h2>
        {users.map(u => <div key={u._id} className="p-2 border-b">{u.name} — {u.email}</div>)}
      </div>
    </div>
  );
}
