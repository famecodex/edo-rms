// src/lib/api.js
// lightweight helpers used by pages for common operations

export const safe = (fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (err) {
    // unwrap axios error shape if present
    const message = err?.response?.data?.message || err?.message || "Request failed";
    throw new Error(message);
  }
};

export const tryGetCoursesForTeacher = async (api, teacherId) => {
  // Try teacher-specific endpoint first (best-effort), else all courses and filter.
  try {
    const res = await api.get(`/api/courses?teacherId=${teacherId}`);
    return res.data || [];
  } catch (e) {
    // fallback
    const res = await api.get("/api/courses");
    // if backend returns courses with an assignedTeacher field, filter by that.
    return (res.data || []).filter(
      (c) =>
        !c.assignedTeacher || c.assignedTeacher === teacherId || (c.assignedTeacher?._id === teacherId)
    );
  }
};
