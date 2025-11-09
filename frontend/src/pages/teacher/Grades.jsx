import React, { useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";

export default function TeacherGrades() {
  const { api, user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({}); // Track saving state per student
  const [editedGrades, setEditedGrades] = useState({}); // Track edited values

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const courseId = user.courseId?._id || user.courseId || undefined;
      const res = await api.get(`/api/grades${courseId ? `?courseId=${courseId}` : ''}`);
      setGrades(res.data || []);
    } catch (e) {
      console.error('Failed to fetch grades:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.courseId) fetchGrades();
  }, [user?.courseId?._id || user?.courseId]); // Only re-fetch when courseId changes

  const updateGrade = async (studentId, newGrade) => {
    try {
      setSaving(prev => ({ ...prev, [studentId]: true }));
      const courseId = user.courseId?._id || user.courseId || undefined;
      await api.put(`/api/grades/${studentId}`, {
        courseId,
        score: Number(newGrade), // Changed from grade to score to match backend
      });

      // Optimistically update local state so UI doesn't need a full refetch
      setGrades(prev => prev.map(g => {
        if (g.studentId._id === studentId) return { ...g, grade: Number(newGrade) };
        return g;
      }));
      
      // Clear edited state for this student
      setEditedGrades(prev => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    } catch (err) {
      alert(err.response?.data?.message || "Error updating grade");
    } finally {
      setSaving(prev => ({ ...prev, [studentId]: false }));
    }
  };

  // Handle input change
  const handleGradeChange = useCallback((studentId, value) => {
    setEditedGrades(prev => ({
      ...prev,
      [studentId]: value
    }));
  }, []);

  // Check if a grade has been edited
  const hasChanges = (studentId) => {
    return editedGrades[studentId] !== undefined;
  };

  return (
    <Layout title="My Course Grades">
      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-2">
            Subject: {user.courseId?.title || user.courseId?.courseName || "Not Assigned"}
          </h2>
          {grades.length === 0 ? (
            <p>No students found for this subject.</p>
          ) : (
            grades.map((g) => (
              <div
                key={g.studentId._id}
                className="p-3 border rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{g.studentId.name}</p>
                  <p className="text-xs text-gray-500">{g.studentId.email}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedGrades[g.studentId._id] ?? g.grade ?? ''}
                      onChange={(e) => handleGradeChange(g.studentId._id, e.target.value)}
                      className={`p-1 border rounded w-20 text-center dark:bg-gray-700 dark:text-white 
                        ${hasChanges(g.studentId._id) ? 'border-blue-500' : ''}`}
                      placeholder="Grade"
                    />
                    {hasChanges(g.studentId._id) && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          updateGrade(g.studentId._id, editedGrades[g.studentId._id]);
                        }}
                        type="button"
                        disabled={saving[g.studentId._id]}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 
                          disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving[g.studentId._id] ? 'Saving...' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
}
