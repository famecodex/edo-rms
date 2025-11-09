import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";

export default function MinistrySchools(){
  const { api } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(()=>{ (async ()=>{ try { setLoading(true); const res = await api.get("/api/schools"); setSchools(res.data || []); } catch(e){console.error(e)} finally{setLoading(false)} })(); },[]);

  const create = async (e) => {
    e.preventDefault();
    const name = e.target.schoolName.value.trim();
    if(!name) return alert("Enter name");
    setCreating(true);
    await api.post("/api/schools", { schoolName: name });
    e.target.reset();
    const res = await api.get("/api/schools");
    setSchools(res.data || []);
    setCreating(false);
  };

  return (
    <Layout title="Schools">
      {loading ? <Loader /> : (
        <>
          <div className="card p-4 mb-4">
            <h3 className="font-semibold mb-2">Create School</h3>
            <form onSubmit={create} className="flex gap-2">
              <input name="schoolName" placeholder="School name" className="p-2 border rounded flex-1" />
              <button className="px-3 py-2 bg-edoBlue text-white rounded">{creating ? "Creating..." : "Create"}</button>
            </form>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-2">All Schools</h3>
            <ul className="space-y-2">
              {schools.map(s=> <li key={s._id} className="p-2 border rounded">{s.schoolName}</li>)}
            </ul>
          </div>
        </>
      )}
    </Layout>
  );
}
