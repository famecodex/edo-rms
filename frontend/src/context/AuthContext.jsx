import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

export const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

// Log API base for debugging
console.log('API Base URL:', API_BASE);

const getStoredUser = () => {
  try {
    // Try getting from sessionStorage first (temporary)
    const sessionUser = sessionStorage.getItem("edo_user");
    if (sessionUser) return JSON.parse(sessionUser);

    // Fall back to localStorage (remember me)
    const localUser = localStorage.getItem("edo_user");
    if (localUser) {
      const userData = JSON.parse(localUser);
      // Check if stored data has expired (30 days)
      if (userData.expiry && Date.now() > userData.expiry) {
        localStorage.removeItem("edo_user");
        return null;
      }
      return userData;
    }
    
    return null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [theme, setTheme] = useState(() => localStorage.getItem("edo_theme") || "light");
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("edo_remember") === "true");

  const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
  });

  // Get role-specific inactivity timeout
  const getInactivityTimeout = (role) => {
    const timeouts = {
      ministry: 15 * 60 * 1000, // 15 minutes
      principal: 30 * 60 * 1000, // 30 minutes
      teacher: 60 * 60 * 1000, // 1 hour
      student: 120 * 60 * 1000, // 2 hours
    };
    return timeouts[role] || 30 * 60 * 1000;
  };

  // Check for token expiration and handle auth header
  useEffect(() => {
    if (user?.token) {
      // Check if user session has expired
      if (user.expiry && Date.now() > user.expiry) {
        console.log('Session expired, logging out...');
        logout();
        return;
      }

      // Check for inactivity
      const inactiveTime = Date.now() - (user.lastActivity || Date.now());
      if (inactiveTime > getInactivityTimeout(user.role)) {
        console.log('Session inactive, logging out...');
        logout();
        return;
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }

    // Set up interval to check session status
    const checkInterval = setInterval(() => {
      if (!user) return;

      // Check expiration
      if (user.expiry && Date.now() > user.expiry) {
        console.log('Session expired, logging out...');
        logout();
        return;
      }

      // Check inactivity
      const inactiveTime = Date.now() - (user.lastActivity || Date.now());
      if (inactiveTime > getInactivityTimeout(user.role)) {
        console.log('Session inactive, logging out...');
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [user]);

  useEffect(() => {
    if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("edo_theme", theme);
  }, [theme]);

  const getRoleSpecificExpiry = (role, remember) => {
    const day = 24 * 60 * 60 * 1000;
    
    // Define role-specific session durations
    const durations = {
      ministry: remember ? 7 * day : 4 * 60 * 60 * 1000, // 7 days or 4 hours
      principal: remember ? 14 * day : 8 * 60 * 60 * 1000, // 14 days or 8 hours
      teacher: remember ? 30 * day : 12 * 60 * 60 * 1000, // 30 days or 12 hours
      student: remember ? 30 * day : 24 * 60 * 60 * 1000, // 30 days or 24 hours
    };

    return Date.now() + (durations[role] || 24 * 60 * 60 * 1000);
  };

  const storeUserData = (userData, remember = false) => {
    const payload = {
      ...userData,
      expiry: getRoleSpecificExpiry(userData.role, remember),
      lastActivity: Date.now(),
      lastLogin: new Date().toISOString(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };

    // Store in memory
    setUser(payload);

    // Store in browser storage based on remember me
    if (remember) {
      localStorage.setItem("edo_user", JSON.stringify(payload));
      sessionStorage.removeItem("edo_user");
    } else {
      sessionStorage.setItem("edo_user", JSON.stringify(payload));
      localStorage.removeItem("edo_user");
    }

    // Store remember me preference
    localStorage.setItem("edo_remember", remember.toString());
  };

  const login = async (email, password, remember = false) => {
    try {
      console.log('Attempting login to:', API_BASE + '/api/users/login');
      const res = await api.post("/api/users/login", { email, password });
      if (!res.data || !res.data._id) {
        throw new Error('Invalid response from server');
      }
      const d = res.data;
      
      // Prepare user data
      const userData = {
        _id: d._id,
        name: d.name,
        email: d.email,
        role: d.role,
        schoolId: d.schoolId?._id || d.schoolId || null,
        approved: d.approved ?? true,
        token: d.token || null,
        lastLogin: d.lastLogin || new Date().toISOString()
      };

      // Update remember me preference
      setRememberMe(remember);
      
      // Store user data
      storeUserData(userData, remember);

      return userData;
    } catch (error) {
      // Enhanced error handling
      if (!error.response) {
        throw new Error('Network error. Please check your internet connection.');
      }
      if (error.response.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      if (error.response.status === 403 && error.response.data?.message?.includes('approval')) {
        throw new Error('Your account is pending approval. Please contact the administrator.');
      }
      if (error.response.status === 401) {
        throw new Error('Invalid email or password.');
      }
      if (error.response.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Login failed. Please try again later.');
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/users/logout");
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear all auth data
    setUser(null);
    localStorage.removeItem("edo_user");
    sessionStorage.removeItem("edo_user");
    localStorage.removeItem("edo_remember");

    // Clear auth header
    delete api.defaults.headers.common["Authorization"];
  };

  // Update last activity timestamp
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      const updatedUser = {
        ...user,
        lastActivity: Date.now()
      };
      setUser(updatedUser);

      // Update storage
      const storage = localStorage.getItem("edo_remember") === "true" ? localStorage : sessionStorage;
      storage.setItem("edo_user", JSON.stringify(updatedUser));
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, updateActivity));

    return () => {
      events.forEach(event => document.removeEventListener(event, updateActivity));
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, api, theme, setTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

// Re-export the hook for convenience so other modules can import { useAuth } from './context/AuthContext'
// Provide the hook directly from this module for convenience and compatibility
export const useAuth = () => useContext(AuthContext);
