import React, { createContext, useState, useEffect } from "react";
import api from "../api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", user.token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [user]);

  const login = async (email, password) => {
    const res = await api.post("/users/login", { email, password });
    // expected response contains token and user details
    const payload = res.data;
    // some backends return token at top-level or set cookie — adapt if needed
    setUser(payload);
    return payload;
  };

  const logout = () => {
    setUser(null);
    // optionally hit backend logout route
    try { api.post("/users/logout"); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
