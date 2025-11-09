import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";
import { Users, GraduationCap, Send, School } from "lucide-react";

export default function PrincipalDashboard() {
  const { user, api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    school: null,
    stats: {
      totalStudents: 0,
      totalTeachers: 0,
      pendingTransfers: 0
    }
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ensure we pass the raw school id (if user.schoolId is an object, use its _id)
        const schoolId = user?.schoolId?._id || user?.schoolId;

        // Load school details and statistics. If endpoints fail, treat as empty arrays.
        // Individual requests with better error handling
        const [studentsRes, teachersRes, transfersRes, schoolRes] = await Promise.all([
          api.get(`/api/students?schoolId=${schoolId}`).catch(err => {
            console.error('Failed to load students:', err);
            return { data: [] };
          }),
          api.get(`/api/teachers?schoolId=${schoolId}`).catch(err => {
            console.error('Failed to load teachers:', err);
            return { data: [] };
          }),
          api.get(`/api/transfer`).catch(err => {
            console.error('Failed to load transfers:', err);
            return { data: [] };
          }),
          api.get(`/api/schools/${schoolId}`).catch(err => {
            console.error('Failed to load school:', err?.response?.data || err);
            return { data: null };
          })
        ]);

        // Filter pending transfers from this school on the client side
        const allTransfers = transfersRes.data || [];
        
        // Outgoing: pending transfers FROM this school
        const pendingFromThisSchool = allTransfers.filter(t => {
          const fromSchoolId = t.fromSchool?._id || t.fromSchool;
          return String(fromSchoolId) === String(schoolId) && t.status === 'pending';
        });

        // Incoming: ministry-approved transfers TO this school awaiting acceptance
        const incomingToThisSchool = allTransfers.filter(t => {
          const toSchoolId = t.toSchool?._id || t.toSchool;
          return String(toSchoolId) === String(schoolId) && t.status === 'ministry_approved';
        });

        // Total pending = outgoing pending + incoming awaiting acceptance
        const totalPending = pendingFromThisSchool.length + incomingToThisSchool.length;

        setData({
          school: schoolRes.data,
          stats: {
            totalStudents: (studentsRes.data || []).length,
            totalTeachers: (teachersRes.data || []).length,
            pendingTransfers: totalPending
          }
        });
      } catch (err) {
        console.error('Dashboard loading error:', err);
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.schoolId) {
      loadDashboardData();
    } else {
      // No schoolId — stop loading and show message
      setLoading(false);
      setError('No school assigned to your account.');
    }
  }, [user?.schoolId]);

  if (loading) return <Layout title="Principal Dashboard"><Loader /></Layout>;
  if (error) return (
    <Layout title="Principal Dashboard">
      <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
    </Layout>
  );

  return (
    <Layout title="Principal Dashboard">
      <div className="space-y-6">
        {/* Welcome & School Info */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Welcome, {user?.name}</h2>
              <p className="text-gray-600">{data.school?.schoolName || 'School information not available'}</p>
            </div>
            <School className="text-edoBlue" size={32} />
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Total Students</div>
                <div className="text-2xl font-semibold">{data.stats.totalStudents}</div>
              </div>
              <Users className="text-edoBlue" size={24} />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Total Teachers</div>
                <div className="text-2xl font-semibold">{data.stats.totalTeachers}</div>
              </div>
              <GraduationCap className="text-edoBlue" size={24} />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Pending Transfers</div>
                <div className="text-2xl font-semibold">{data.stats.pendingTransfers}</div>
              </div>
              <Send className="text-edoBlue" size={24} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button onClick={() => window.location.href = '/principal/students'} className="p-4 border rounded-md hover:bg-gray-50 transition-colors text-left">
              <div className="font-medium">Manage Students</div>
              <div className="text-sm text-gray-500">Add, edit, or view student records</div>
            </button>
            <button onClick={() => window.location.href = '/principal/teachers'} className="p-4 border rounded-md hover:bg-gray-50 transition-colors text-left">
              <div className="font-medium">Manage Teachers</div>
              <div className="text-sm text-gray-500">Assign subjects and manage teachers</div>
            </button>
            <button onClick={() => window.location.href = '/principal/transfers'} className="p-4 border rounded-md hover:bg-gray-50 transition-colors text-left">
              <div className="font-medium">View Transfers</div>
              <div className="text-sm text-gray-500">Review and handle transfer requests</div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}