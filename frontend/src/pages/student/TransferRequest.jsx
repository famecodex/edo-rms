import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";

export default function TransferRequest(){
  const { api } = useAuth();
  const [schools, setSchools] = useState([]);
  const [to, setTo] = useState("");
  const [currentClass, setCurrentClass] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(()=>{ (async ()=>{ try { setLoading(true); const res = await api.get("/api/schools"); setSchools(res.data || []); } catch(e){console.error(e)} finally{setLoading(false)} })(); },[]);
  // Debug: log schools for troubleshooting selection issues
  useEffect(() => {
    console.log('Schools loaded for transfer request:', schools);
  }, [schools]);

  const submit = async (e) => {
    e.preventDefault();
    if(!to || !reason) return alert("Select school and provide reason");
    setSending(true);
    console.log('Submitting transfer request', { to, reason });
    try {
      await api.post("/api/transfer/request", { toSchool: to, reason, currentClass });
      setTo(""); setReason("");
      setError(null);
      setSuccess('Request sent successfully');
      // lightweight user feedback
      // keep alert for now as well
      alert("Request sent");
    } catch (err) {
      console.error('Failed to send transfer request', err);
      setError(err.response?.data?.message || 'Failed to send request');
      setSuccess(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout title="Request Transfer">
      {loading ? <Loader/> : (
        <div className="card p-4">
          <form onSubmit={submit} className="space-y-3">
            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}
            <select disabled={sending} value={to} onChange={(e)=>{ setTo(e.target.value); console.log('Selected school:', e.target.value); }} className="w-full p-2 border rounded">
              <option value="">Choose school</option>
              {schools.map(s => <option key={s._id} value={s._id}>{s.schoolName}</option>)}
            </select>
            <input disabled={sending} value={currentClass} onChange={(e)=>setCurrentClass(e.target.value)} className="w-full p-2 border rounded" placeholder="Current class (e.g., SS1)" />
            <textarea disabled={sending} value={reason} onChange={(e)=>setReason(e.target.value)} className="w-full p-2 border rounded" placeholder="Reason" rows="4" />
            <button type="submit" disabled={sending} className="px-3 py-2 bg-edoBlue text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed">{sending ? "Sending..." : "Send Request"}</button>
          </form>
        </div>
      )}
    </Layout>
  );
}
