import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";

export default function PrincipalTeachers(){
  const { api, user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
         setError(null);
          const res = await api.get(`/api/users?role=teacher`);
          setTeachers(res.data);
      } catch (error) {
          console.error('Failed to fetch teachers:', error);
          setError(error.response?.data?.message || 'Failed to load teachers. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeachers();
  }, [api, user.schoolId]);

  return (
    <Layout title="Teachers">
      {loading ? <Loader/> : (
          <>
            {error ? (
              <div className="p-4 text-red-600 bg-red-50 rounded">
                {error}
              </div>
            ) : teachers.length === 0 ? (
              <div className="p-4 text-gray-600">
                No teachers found in your school.
              </div>
            ) : (
              <div className="space-y-2">
                {teachers.map(t => (
                  <div key={t._id} className="card p-3 hover:bg-gray-50">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-sm text-gray-600">{t.email}</div>
                  </div>
                ))}
              </div>
            )}
          </>
      )}
    </Layout>
  );
}
