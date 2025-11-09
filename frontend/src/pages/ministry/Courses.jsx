import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/useAuth";
import Loader from "../../components/Loader";
import { PlusCircle, Trash2 } from "lucide-react";

export default function Courses() {
  const { api } = useAuth();
  const [courses, setCourses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    courseCode: "",
    title: "",
    level: "",
    schoolId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Load schools and courses
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [schoolRes, courseRes] = await Promise.all([
          api.get("/api/schools"),
          api.get("/api/courses"),
        ]);
        setSchools(schoolRes.data || []);
        setCourses(courseRes.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handle input changes
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Submit course
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.courseCode || !form.title || !form.schoolId) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/api/courses", form);
  alert("✅ Course created successfully!");
  // backend returns { message, course }
  setCourses([...courses, res.data.course]);
      setForm({ courseCode: "", title: "", level: "", schoolId: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete course (optional future feature)
  const deleteCourse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    // You can later add an API endpoint for deletion if needed
  };

  // Filter courses
  const filtered = courses.filter((c) =>
    [c.title, c.courseCode, c.level, c.schoolId?.schoolName]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <Layout title="Courses">
      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h5 className="font-semibold text-blue-700 text-lg">🎓 Manage Courses</h5>
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-1/3 border rounded px-3 py-2"
            />
          </div>

          {/* Create Course Form */}
          <div className="p-6 shadow-md border border-gray-200 rounded">
            <h6 className="text-md font-medium mb-2">➕ Add New Course</h6>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3"
            >
              <input
                className="border rounded px-3 py-2"
                placeholder="Course Code"
                name="courseCode"
                value={form.courseCode}
                onChange={handleChange}
                required
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Course Name"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Level (optional)"
                name="level"
                value={form.level}
                onChange={handleChange}
              />

              <select
                name="schoolId"
                value={form.schoolId}
                onChange={handleChange}
                required
                className="border rounded px-3 py-2"
              >
                <option value="">Select School</option>
                {schools.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.schoolName}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={submitting}
                className="col-span-full bg-blue-600 text-white rounded px-4 py-2 flex items-center justify-center gap-2"
              >
                <PlusCircle size={16} />
                {submitting ? "Saving..." : "Add Course"}
              </button>
            </form>
          </div>

          {/* Course List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <div
                key={course._id}
                className="hover:shadow-lg transition-all duration-200 border border-gray-200 rounded bg-white"
              >
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h6 className="font-semibold text-md">{course.title}</h6>
                    <button
                      title="Delete (not active yet)"
                      onClick={() => deleteCourse(course._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600"><strong>Code:</strong> {course.courseCode}</p>
                  <p className="text-sm text-gray-600"><strong>Level:</strong> {course.level || "—"}</p>
                  <p className="text-sm text-gray-600"><strong>School:</strong> {course.schoolId?.schoolName || "—"}</p>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-gray-500">No courses found</p>
          )}
        </div>
      )}
    </Layout>
  );
}
