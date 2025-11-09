import React, { useEffect, useState, useCallback, useMemo } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";

export default function PrincipalTransfers(){
  const { api, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null); // Track which transfer is being processed

  // Memoize the fetch function
  const fetchTransfers = useCallback(async () => {
    if (loading) return; // Prevent multiple simultaneous fetches
    
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/transfer");
      setRequests(prevRequests => {
        const newData = res.data || [];
        return JSON.stringify(prevRequests) === JSON.stringify(newData) ? prevRequests : newData;
      });
    } catch (error) {
      console.error('Failed to fetch transfers:', error);
      setError(error.response?.data?.message || 'Failed to load transfer requests');
    } finally {
      setLoading(false);
    }
  }, [api, loading]);

  // Fetch on mount only
  useEffect(() => {
    fetchTransfers();
  }, []);

  const decide = useCallback(async (id, action) => {
    if (processingId) return; // Prevent multiple simultaneous approvals
    if (!confirm(`Are you sure you want to ${action} this transfer request?`)) return;
    
    try {
      setProcessingId(id);
      await api.put(`/api/transfer/${id}/principal`, { action });
      // Update the local state optimistically
      setRequests(prevRequests => 
        prevRequests.map(r => 
          r._id === id 
            ? { ...r, status: action === 'approve' ? 'principal_approved' : 'principal_rejected' }
            : r
        )
      );
    } catch (error) {
      console.error('Failed to process transfer decision:', error);
      setError('Failed to process your decision. Please try again.');
      // Refresh the list to ensure accurate state
      fetchTransfers();
    } finally {
      setProcessingId(null);
    }
  }, [api, processingId, fetchTransfers]);

  // Filter requests for current school - only show pending ones
  const myRequests = useMemo(() => 
    requests.filter(r => {
      const fromSchoolId = r.fromSchool?._id || r.fromSchool;
      return String(fromSchoolId) === String(user.schoolId) && r.status === 'pending';
    }),
    [requests, user.schoolId]
  );

  // Incoming transfers: those destined for this principal's school and cleared by ministry
  const incomingRequests = useMemo(() =>
    requests.filter(r => {
      const toSchoolId = r.toSchool?._id || r.toSchool;
      return String(toSchoolId) === String(user.schoolId) && r.status === 'ministry_approved';
    }),
    [requests, user.schoolId]
  );

  // Receiving principal action: accept or reject after ministry approval
  const receive = useCallback(async (id, action) => {
    if (processingId) return;
    if (!confirm(`Are you sure you want to ${action} this incoming transfer?`)) return;
    try {
      setProcessingId(id);
      await api.put(`/api/transfer/${id}/receive`, { action: action === 'accept' ? 'accept' : 'reject' });
      // Optimistically update local state with backend-aligned statuses
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: action === 'accept' ? 'destination_accepted' : 'destination_rejected' } : r));
      // If accepted, we might want to remove it from incoming list (student moved)
    } catch (err) {
      console.error('Failed to process receive action', err);
      setError(err.response?.data?.message || 'Failed to process action');
      // Refresh
      fetchTransfers();
    } finally {
      setProcessingId(null);
    }
  }, [api, processingId, fetchTransfers]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Layout title="Transfer Requests">
      {loading && <Loader />}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      <div className="space-y-6">
        {/* Incoming Transfers (after ministry approval) */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Incoming Transfers</h2>
          {incomingRequests.length === 0 ? (
            <div className="bg-gray-50 text-gray-600 p-6 rounded-lg text-center">
              No incoming transfers awaiting your acceptance
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map(r => (
                <div key={r._id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{r.student?.name}</div>
                        <div className="text-sm text-gray-500">ID: {r.student?._id}</div>
                        {r.studentClass && <div className="text-sm text-gray-500">Class: {r.studentClass}</div>}
                        <div className="text-sm text-gray-500">From: {r.fromSchool?.schoolName}</div>
                      </div>
                      <div className="text-sm text-gray-500">Requested: {formatDate(r.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Reason</div>
                      <div className="mt-1 p-3 bg-gray-50 rounded">{r.reason}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div />
                      <div className="flex gap-2">
                        <button onClick={() => receive(r._id, 'accept')} disabled={processingId === r._id} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Accept</button>
                        <button onClick={() => receive(r._id, 'reject')} disabled={processingId === r._id} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Reject</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Outgoing Transfers (from your school) */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Outgoing Transfers</h2>
          {myRequests.length === 0 ? (
            <div className="bg-gray-50 text-gray-600 p-6 rounded-lg text-center">No pending transfer requests from your school</div>
          ) : (
            myRequests.map(r => (
              <div key={r._id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="space-y-4">
                {/* Student Info Section */}
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {r.student?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Requesting transfer to:
                    </p>
                    {r.studentClass && <p className="text-sm text-gray-500">Current class: {r.studentClass}</p>}
                    <p className="text-md text-gray-800 font-medium">
                      {r.toSchool?.schoolName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Request Date</p>
                    <p className="text-md">{formatDate(r.createdAt)}</p>
                  </div>
                </div>

                {/* Reason Section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">
                    Reason for Transfer
                  </h4>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded">
                    {r.reason}
                  </p>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex gap-3">
                    <button
                      onClick={() => decide(r._id, 'approve')}
                      disabled={processingId === r._id}
                      className={`px-4 py-2 rounded-md text-white font-medium transition-colors
                        ${processingId === r._id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600'
                        }`}
                    >
                      {processingId === r._id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => decide(r._id, 'reject')}
                      disabled={processingId === r._id}
                      className={`px-4 py-2 rounded-md text-white font-medium transition-colors
                        ${processingId === r._id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-red-500 hover:bg-red-600'
                        }`}
                    >
                      {processingId === r._id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        </section>
      </div>
    </Layout>
  );
}