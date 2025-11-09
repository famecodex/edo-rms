import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";
import CredentialsModal from "../../components/CredentialsModal";

export default function PrincipalStudents() {
  console.log('PrincipalStudents component rendering');
  const { api, user } = useAuth();
  console.log('Current user:', user);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [editError, setEditError] = useState("");
  const [newStudentCredentials, setNewStudentCredentials] = useState(null);

  const loadStudents = async () => {
    console.log('Attempting to load students');
    try {
      setLoading(true);
      setError(null);
      console.log('Making API request with schoolId:', user.schoolId);
      const res = await api.get(`/api/students?schoolId=${user.schoolId}`);
      console.log('API response:', res.data);
      setStudents(res.data || []);
    } catch (e) {
      console.error('Error loading students:', e);
      setError("Failed to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered');
    if (user?.schoolId) {
      console.log('User has schoolId, loading students');
      loadStudents();
    } else {
      console.log('No schoolId found in user object:', user);
    }
  }, [user?.schoolId]);

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError("");
    
    const formData = new FormData(e.target);
    const data = {
      firstName: formData.get("firstName").trim(),
      lastName: formData.get("lastName").trim(),
      dateOfBirth: formData.get("dateOfBirth"),
      gender: formData.get("gender"),
      currentClass: formData.get("currentClass"),
      guardianName: formData.get("guardianName").trim(),
      guardianPhone: formData.get("guardianPhone").trim(),
      guardianEmail: formData.get("guardianEmail").trim(),
      address: formData.get("address").trim()
    };

    try {
      await api.put(`/api/students/${editingStudent._id}`, data);
      setEditingStudent(null);
      setEditError("");
      await loadStudents();
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update student. Please try again.");
    }
  };

  const createStudent = async (e) => {
    e.preventDefault();
    setFormError("");
    
    const formData = new FormData(e.target);
    const data = {
      firstName: formData.get("firstName").trim(),
      lastName: formData.get("lastName").trim(),
      dateOfBirth: formData.get("dateOfBirth"),
      gender: formData.get("gender"),
      currentClass: formData.get("currentClass"),
      guardianName: formData.get("guardianName").trim(),
      guardianPhone: formData.get("guardianPhone").trim(),
      guardianEmail: formData.get("guardianEmail").trim(),
      address: formData.get("address").trim(),
      schoolId: user.schoolId
    };

    // Validation
    if (Object.values(data).some(value => !value)) {
      setFormError("Please fill in all required fields");
      return;
    }

    try {
      const response = await api.post("/api/students", data);
      e.target.reset();
      setFormError("");
      await loadStudents();
      
      // Show student account credentials in modal
      if (response.data.userAccount) {
        setNewStudentCredentials(response.data.userAccount);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create student. Please try again.");
    }
  };

  return (
    <Layout title="Students">
      <div className="space-y-6">
        {/* Create Student Form */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold mb-4">Register New Student</h3>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
              {formError}
            </div>
          )}
          <form onSubmit={createStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                name="firstName"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                name="lastName"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Class</label>
              <select
                name="currentClass"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                required
              >
                <option value="">Select Class</option>
                <option value="JSS1">JSS1</option>
                <option value="JSS2">JSS2</option>
                <option value="JSS3">JSS3</option>
                <option value="SSS1">SSS1</option>
                <option value="SSS2">SSS2</option>
                <option value="SSS3">SSS3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
              <input
                name="guardianName"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
              <input
                name="guardianPhone"
                type="tel"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Email</label>
              <input
                name="guardianEmail"
                type="email"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                required
              />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                name="address"
                rows="2"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                required
              ></textarea>
            </div>
            <div className="col-span-full">
              <button
                type="submit"
                className="w-full py-2 bg-edoBlue text-white rounded hover:bg-blue-700 transition-colors"
              >
                Register Student
              </button>
            </div>
          </form>
        </div>

        {/* Students List */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold mb-4">Students in Your School</h3>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}
          {loading ? (
            <Loader />
          ) : students.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No students registered yet.
            </div>
          ) : (
            <div className="space-y-4">
              {students.map(s => (
                <div key={s._id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  {editingStudent?._id === s._id ? (
                    <div className="card p-4">
                      <h4 className="text-lg font-semibold mb-4">Edit Student Details</h4>
                      {editError && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                          {editError}
                        </div>
                      )}
                      <form onSubmit={handleEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            name="firstName"
                            defaultValue={s.firstName}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            name="lastName"
                            defaultValue={s.lastName}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                          <input
                            type="date"
                            name="dateOfBirth"
                            defaultValue={s.dateOfBirth ? s.dateOfBirth.split('T')[0] : ''}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                          <select
                            name="gender"
                            defaultValue={s.gender}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Class</label>
                          <select
                            name="currentClass"
                            defaultValue={s.currentClass}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                            required
                          >
                            <option value="">Select Class</option>
                            <option value="JSS1">JSS1</option>
                            <option value="JSS2">JSS2</option>
                            <option value="JSS3">JSS3</option>
                            <option value="SSS1">SSS1</option>
                            <option value="SSS2">SSS2</option>
                            <option value="SSS3">SSS3</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                          <input
                            name="guardianName"
                            defaultValue={s.guardianName}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
                          <input
                            name="guardianPhone"
                            type="tel"
                            defaultValue={s.guardianPhone}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Email</label>
                          <input
                            name="guardianEmail"
                            type="email"
                            defaultValue={s.guardianEmail}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                            required
                          />
                        </div>
                        <div className="col-span-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <textarea
                            name="address"
                            defaultValue={s.address}
                            rows="2"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-edoBlue focus:border-edoBlue"
                            required
                          ></textarea>
                        </div>
                        <div className="col-span-full flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-edoBlue text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStudent(null)}
                            className="flex-1 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-lg">
                          {s.firstName} {s.lastName}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Student ID: {s.studentId || s._id}</div>
                          <div>Class: {s.currentClass || '—'}</div>
                          <div>Guardian: {s.guardianName}</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                          s.status === 'active' ? 'bg-green-100 text-green-800' :
                          s.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {s.status === 'active' ? 'Active' :
                           s.status === 'pending' ? 'Pending Approval' :
                           s.status}
                        </span>
                        <button
                          onClick={() => setEditingStudent(s)}
                          className="px-3 py-1 text-sm bg-blue-50 text-edoBlue rounded-full hover:bg-blue-100 transition-colors"
                        >
                          Edit Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Credentials Modal */}
      <CredentialsModal
        credentials={newStudentCredentials}
        onClose={() => setNewStudentCredentials(null)}
      />
    </Layout>
  );
}
