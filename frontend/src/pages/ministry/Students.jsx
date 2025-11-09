import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";

export default function MinistryStudents(){
  const { api } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/api/students");
        console.log('Students:', res.data);
        setStudents(res.data || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.response?.data?.message || "Failed to load students");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const approve = async (id) => {
    try {
      if(!confirm("Approve student account?")) return;
      await api.put(`/api/students/${id}/approve`);
      const res = await api.get("/api/students");
      setStudents(res.data || []);
      alert("Student approved successfully");
    } catch (err) {
      console.error('Approval failed:', err);
      alert(err.response?.data?.message || "Failed to approve student");
    }
  };

  return (
    <Layout title="Students">
      {loading ? (
        <Loader/>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>
      ) : (
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-4">Student Approval Dashboard</h3>
          <div className="space-y-4">
            {students.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No students found in the system.
              </div>
            ) : (
              students.map(s => (
                <div key={s._id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-lg">
                        {s.firstName} {s.lastName}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>Student ID: {s.studentId}</div>
                        <div>School: {s.schoolId?.schoolName || 'Not Assigned'}</div>
                        <div>Class: {s.currentClass}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="mb-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                          s.status === 'active' ? 'bg-green-100 text-green-800' :
                          s.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {s.status === 'active' ? 'Active' :
                           s.status === 'pending' ? 'Pending Approval' :
                           s.status}
                        </span>
                      </div>
                      {s.status === 'pending' && (
                        <button
                          onClick={() => approve(s._id)}
                          className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Approve Student
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
