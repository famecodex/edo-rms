import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";

export default function Profile(){
  const { user, api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/api/students/${user._id}`);
        setStudentInfo(res.data);
      } catch (e) {
        console.error('Failed to fetch student info:', e);
        setError(e.response?.data?.message || 'Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchStudentInfo();
    }
  }, [user?._id]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Layout title="Student Profile">
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="card p-4 text-red-500">{error}</div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Student ID</div>
                <div className="font-medium">{studentInfo?.studentId}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Full Name</div>
                <div className="font-medium">{studentInfo?.firstName} {studentInfo?.lastName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{studentInfo?.user?.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Current Class</div>
                <div className="font-medium">{studentInfo?.currentClass || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Gender</div>
                <div className="font-medium">{studentInfo?.gender || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Date of Birth</div>
                <div className="font-medium">{formatDate(studentInfo?.dateOfBirth)}</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-4">School Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">School Name</div>
                <div className="font-medium">{studentInfo?.schoolId?.schoolName || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">School Location</div>
                <div className="font-medium">{studentInfo?.schoolId?.address || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Enrollment Status</div>
                <div className={`font-medium ${
                  studentInfo?.status === 'active' ? 'text-green-600' :
                  studentInfo?.status === 'pending' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {studentInfo?.status?.charAt(0).toUpperCase() + studentInfo?.status?.slice(1) || '—'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Enrollment Date</div>
                <div className="font-medium">{formatDate(studentInfo?.createdAt)}</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-4">Guardian Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Guardian Name</div>
                <div className="font-medium">{studentInfo?.guardianName || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Guardian Phone</div>
                <div className="font-medium">{studentInfo?.guardianPhone || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Guardian Email</div>
                <div className="font-medium">{studentInfo?.guardianEmail || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Address</div>
                <div className="font-medium">{studentInfo?.address || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
