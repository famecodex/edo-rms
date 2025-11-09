import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";

export default function MinistryPrincipals(){
  const { api } = useAuth();
  const [principals, setPrincipals] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(()=>{ 
    (async ()=>{ 
      try { 
        setLoading(true);
        setError(null);
        const [pRes, sRes] = await Promise.all([
          api.get("/api/users?role=principal"), 
          api.get("/api/schools")
        ]); 
        console.log('Principal Response:', pRes.data);
        console.log('Schools Response:', sRes.data);
        setPrincipals(pRes.data || []); 
        setSchools(sRes.data || []); 
      } catch(e){
        console.error('API Error:', e.response?.data || e.message);
        setError(e.response?.data?.message || "Failed to load data");
      } finally{
        setLoading(false)
      } 
    })(); 
  },[]);

  const transfer = async (id, toSchool) => {
    try {
      if(!confirm("Transfer principal?")) return;
      await api.put(`/api/users/${id}/transfer`, { toSchoolId: toSchool });
      const pRes = await api.get("/api/users?role=principal");
      setPrincipals(pRes.data || []);
      alert("Principal transferred successfully");
    } catch(err) {
      console.error('Transfer Error:', err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to transfer principal");
    }
  };

  const createPrincipal = async (e) => {
    e.preventDefault();
    try {
      const name = e.target.name.value.trim();
      const email = e.target.email.value.trim();
      const password = e.target.password.value.trim();
      const schoolId = e.target.schoolId.value;

      if (!name || !email || !password || !schoolId) {
        return alert("Please fill all fields");
      }

      await api.post("/api/users/create", {
        name,
        email,
        password,
        role: "principal",
        schoolId,
      });
      
      alert("Principal created successfully");
      e.target.reset();

      // Refresh the list
      const pRes = await api.get("/api/users?role=principal");
      setPrincipals(pRes.data || []);
    } catch(err) {
      console.error('Create Error:', err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to create principal");
    }
  };

  return (
    <Layout title="Principals">
      {loading ? (
        <Loader/>
      ) : error ? (
        <div className="p-4 text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Create Principal Form */}
          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-4">Add New Principal</h3>
            <form onSubmit={createPrincipal} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                name="name"
                placeholder="Full Name"
                className="p-2 border rounded"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="p-2 border rounded"
                required
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                className="p-2 border rounded"
                required
              />
              <select
                name="schoolId"
                className="p-2 border rounded"
                required
                defaultValue=""
              >
                <option value="">Select School</option>
                {schools.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.schoolName}
                  </option>
                ))}
              </select>
              <button type="submit" className="col-span-full bg-edoBlue text-white py-2 rounded hover:bg-blue-700">
                Create Principal
              </button>
            </form>
          </div>

          {/* Principals List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Principals</h3>
            {principals.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No principals found. Create one using the form above.
              </div>
            ) : principals.map(p => (
              <div key={p._id} className="card p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-500">{p.email} • {p.schoolId?.schoolName || "No School Assigned"}</div>
                </div>
                <select 
                  defaultValue="" 
                  onChange={(e)=>transfer(p._id, e.target.value)} 
                  className="p-2 border rounded"
                >
                  <option value="">Transfer to...</option>
                  {schools.map(s=> (
                    <option key={s._id} value={s._id} disabled={s._id === p.schoolId?._id}>
                      {s.schoolName}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
