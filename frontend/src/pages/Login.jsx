import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      // redirect by role
      if (user.role === "ministry") nav("/ministry");
      else if (user.role === "principal") nav("/principal");
      else if (user.role === "teacher") nav("/teacher");
      else if (user.role === "student") nav("/student");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4 text-center">Edo RMS Login</h1>
        <input type="email" placeholder="Email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full p-2 border rounded mb-3" />
        <input type="password" placeholder="Password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full p-2 border rounded mb-4" />
        <button className="w-full bg-blue-600 text-white py-2 rounded">{loading ? "Logging in..." : "Login"}</button>
      </form>
    </div>
  );
}
