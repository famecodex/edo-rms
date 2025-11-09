import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";

export default function TransferHistory(){
  const { api } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/api/transfer/my-requests");
        const data = Array.isArray(res.data) ? res.data : (res.data.requests || res.data);
        // Sort by date descending (newest first)
        const sortedData = [...data].sort((a, b) => 
          new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
        );
        setRequests(sortedData);
      } catch (e) {
        console.error('Failed to fetch transfer history:', e);
        setError(e.response?.data?.message || 'Failed to load transfer history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, []);

  return (
    <Layout title="Transfer History">
      {loading ? <Loader/> : error ? (
        <div className="card p-4 text-red-500">{error}</div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-4">Transfer Request History</h3>
            {requests.length === 0 ? (
              <div className="text-sm text-gray-500">No transfer requests found</div>
            ) : (
              <div className="space-y-3">
                {requests.map(r => (
                  <div key={r._id || r.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">To: {r.toSchool?.name || r.toSchool?.schoolName || r.to}</div>
                        <div className="text-sm text-gray-500">From: {r.fromSchool?.name || r.fromSchool?.schoolName || r.from}</div>
                      </div>
                      {/* Normalize backend statuses to human-friendly labels and simple badge colors */}
                      {(() => {
                        const status = r.status || '';
                        let label = status.replace(/_/g, ' ');
                        label = label.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

                        // Simplified classes for approved / rejected / pending groups
                        let classes = 'bg-gray-100 text-gray-800';
                        if (status === 'pending') classes = 'bg-yellow-100 text-yellow-800';
                        if (status === 'principal_approved' || status === 'ministry_approved') classes = 'bg-green-100 text-green-800';
                        if (status === 'principal_rejected' || status === 'ministry_rejected') classes = 'bg-red-100 text-red-800';

                        return (
                          <div className={`px-2 py-1 rounded text-sm ${classes}`}>
                            {label || 'Unknown'}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="text-sm text-gray-500">
                      Requested: {new Date(r.createdAt || r.date || Date.now()).toLocaleString()}
                    </div>
                    {r.reason && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Reason:</span> {r.reason}
                      </div>
                    )}
                    {r.notes && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Notes:</span> {r.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
