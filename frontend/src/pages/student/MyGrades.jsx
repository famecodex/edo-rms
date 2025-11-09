import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";

export default function MyGrades(){
  const { api, user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Don't pass studentId - let the backend figure it out from the logged-in user
        const res = await api.get(`/api/grades`);
        
        console.log('Grades response:', res.data);
        
        // Sort grades by subject name
        const sortedGrades = (res.data || []).sort((a, b) => 
          (a.subject || '').localeCompare(b.subject || '')
        );
        setGrades(sortedGrades);
      } catch (e) {
        console.error('Failed to fetch grades:', e);
        setError(e.response?.data?.message || 'Failed to load grades');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchGrades();
    }
  }, []);

  return (
    <Layout title="My Grades">
      {loading ? <Loader/> : error ? (
        <div className="card p-4 text-red-500">{error}</div>
      ) : (
        <div className="card p-4">
          {grades.length === 0 ? (
            <div className="text-sm text-gray-500">No grades recorded yet</div>
          ) : (
            <table className="w-full">
              <thead className="text-sm text-gray-500">
                <tr>
                  <th className="text-left py-2">Subject</th>
                  <th className="text-center py-2">Score</th>
                  <th className="text-left py-2">Teacher</th>
                  <th className="text-right py-2">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(g => (
                  <tr key={g._id} className="border-t">
                    <td className="py-2 text-left font-medium">{g.subject}</td>
                    <td className="py-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm
                        ${g.score >= 70 ? 'bg-green-100 text-green-800' :
                          g.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
                        {g.score}%
                      </span>
                    </td>
                    <td className="py-2 text-left text-sm">
                      {g.teacherId?.name || 'Unknown Teacher'}
                    </td>
                    <td className="py-2 text-right text-sm text-gray-500">
                      {new Date(g.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Layout>
  );
}