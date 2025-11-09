import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";

export default function MinistryTransfers() {
  const { api } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/transfer");
      setRequests(res.data || []);
    } catch (e) {
      console.error("Failed to fetch transfers:", e);
      setError(e.response?.data?.message || "Failed to load transfers");
    } finally {
      setLoading(false);
    }
  };

  const decide = async (e, id, action) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`${action === "approve" ? "Approve" : "Reject"} this transfer?`))
      return;

    try {
      await api.put(`/api/transfer/${id}/ministry`, { action });

      // Update state locally (more efficient than refetching)
      setRequests((currentRequests) =>
        currentRequests.filter((req) => req._id !== id)
      );
    } catch (err) {
      console.error("Failed to process ministry decision", err);
      alert(err.response?.data?.message || "Failed to process decision");
    }
  };

  // Fetch only on mount
  useEffect(() => {
    fetchTransfers();
  }, []);

  return (
    <Layout title="Transfer Requests">
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="text-red-500 p-4">{error}</div>
      ) : (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-gray-500 p-4">
              No transfer requests awaiting ministry approval. Transfers will
              appear here after principals approve them.
            </div>
          ) : (
            requests.map((r) => (
              <div key={r._id} className="card p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {r.student?.name || r.student?.email}
                    </div>
                    <div className="text-xs text-gray-500">{r.reason}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <div>From: {r.fromSchool?.schoolName}</div>
                    <div>To: {r.toSchool?.schoolName}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => decide(e, r._id, "approve")}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Approve Transfer
                  </button>
                  <button
                    type="button"
                    onClick={(e) => decide(e, r._id, "reject")}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Reject Transfer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
}