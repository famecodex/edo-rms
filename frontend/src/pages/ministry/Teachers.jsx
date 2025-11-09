import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";

export default function MinistryTeachers() {
  const { api } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Fetch all teachers, schools, and courses
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, sRes, cRes] = await Promise.all([
        api.get("/api/users?role=teacher"),
        api.get("/api/schools"),
        api.get("/api/courses"),
      ]);
      setTeachers(tRes.data || []);
      setSchools(sRes.data || []);
      setCourses(cRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create teacher by Ministry
  const createTeacher = async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();
    const schoolId = e.target.schoolId.value.trim();
    const courseId = e.target.courseId.value.trim();

    if (!name || !email || !password || !schoolId || !courseId)
      return alert("Please fill all fields.");

    try {
      setCreating(true);
      await api.post("/api/users/create", {
        name,
        email,
        password,
        role: "teacher",
        schoolId,
        courseId, // add subject assignment
      });
      alert("✅ Teacher created successfully!");
      e.target.reset();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create teacher");
    } finally {
      setCreating(false);
    }
  };

  // Transfer teacher to another school
  const transfer = async (id, toSchool) => {
    if (!confirm("Transfer teacher to another school?")) return;
    try {
      await api.put(`/api/users/${id}/transfer`, { toSchoolId: toSchool });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Transfer failed");
    }
  };

  return (
    <Layout title="Teachers">
      {loading ? (
        <Loader />
      ) : (
        <>
          {/* Create Teacher Form */}
          <div className="card p-4 mb-6 shadow-md border border-gray-200">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">
              ➕ Create New Teacher
            </h2>
            <form
              onSubmit={createTeacher}
              className="grid grid-cols-1 md:grid-cols-5 gap-4"
            >
              <input
                name="name"
                placeholder="Full Name"
                className="p-2 border rounded"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="p-2 border rounded"
                required
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                className="p-2 border rounded"
                required
              />
              <select
                name="schoolId"
                className="p-2 border rounded"
                defaultValue=""
                required
              >
                <option value="">Select School</option>
                {schools.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.schoolName}
                  </option>
                ))}
              </select>

              <select
                name="courseId"
                className="p-2 border rounded"
                defaultValue=""
                required
              >
                <option value="">Assign Course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={creating}
                className="col-span-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium mt-2"
              >
                {creating ? "Creating..." : "Create Teacher"}
              </button>
            </form>
          </div>

          {/* Teacher List Section */}
              <div className="card p-4 shadow-md border border-gray-200">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">
              👩‍🏫 All Teachers
            </h2>
            <div className="space-y-3">
              {teachers.length === 0 ? (
                <p className="text-gray-500">
                  No teachers found.
                </p>
              ) : (
                teachers.map((t) => (
                  <div
                    key={t._id}
                    className="flex justify-between items-center p-3 border rounded-md"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {t.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t.email} •{" "}
                        {t.schoolId?.schoolName || "No School Assigned"}
                      </p>
                      <p className="text-xs text-gray-500 italic">
                        Subject:{" "}
                        {t.courseId?.title
                          ? t.courseId.title
                          : "Not Assigned"}
                      </p>
                    </div>

                    <select
                      defaultValue=""
                      onChange={(e) => transfer(t._id, e.target.value)}
                      className="p-2 border rounded"
                    >
                      <option value="">Transfer to...</option>
                      {schools.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.schoolName}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
