import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";

// auth pages
import LoginSelect from "./pages/auth/LoginSelect";
import LoginMinistry from "./pages/auth/LoginMinistry";
import LoginPrincipal from "./pages/auth/LoginPrincipal";
import LoginTeacher from "./pages/auth/LoginTeacher";
import LoginStudent from "./pages/auth/LoginStudent";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// ministry pages
import MinistryDashboard from "./pages/ministry/Dashboard";
import MinistrySchools from "./pages/ministry/Schools";
import MinistryCourses from "./pages/ministry/Courses";
import MinistryTeachers from "./pages/ministry/Teachers";
import MinistryPrincipals from "./pages/ministry/Principals";
import MinistryStudents from "./pages/ministry/Students";
import MinistryTransfers from "./pages/ministry/Transfers";

// principal pages
import PrincipalDashboard from "./pages/principal/Dashboard";
import PrincipalStudents from "./pages/principal/Students";
import PrincipalTeachers from "./pages/principal/Teachers";
import PrincipalTransfers from "./pages/principal/Transfers";

// teacher pages
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherSubjects from "./pages/teacher/MySubjects";
import TeacherGradebook from "./pages/teacher/Gradebook";
import TeacherStudents from "./pages/teacher/Students";

// student pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentGrades from "./pages/student/MyGrades";
import StudentTransfer from "./pages/student/TransferRequest";
import StudentHistory from "./pages/student/TransferHistory";
import StudentProfile from "./pages/student/Profile";

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <div className="p-6">Unauthorized</div>;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginSelect />} />
          <Route path="/login/ministry" element={<LoginMinistry />} />
          <Route path="/login/principal" element={<LoginPrincipal />} />
          <Route path="/login/teacher" element={<LoginTeacher />} />
          <Route path="/login/student" element={<LoginStudent />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Ministry routes */}
          <Route path="/ministry" element={<ProtectedRoute roles={['ministry']}><MinistryDashboard /></ProtectedRoute>} />
          <Route path="/ministry/schools" element={<ProtectedRoute roles={['ministry']}><MinistrySchools /></ProtectedRoute>} />
          <Route path="/ministry/courses" element={<ProtectedRoute roles={['ministry']}><MinistryCourses /></ProtectedRoute>} />
          <Route path="/ministry/teachers" element={<ProtectedRoute roles={['ministry']}><MinistryTeachers /></ProtectedRoute>} />
          <Route path="/ministry/principals" element={<ProtectedRoute roles={['ministry']}><MinistryPrincipals /></ProtectedRoute>} />
          <Route path="/ministry/students" element={<ProtectedRoute roles={['ministry']}><MinistryStudents /></ProtectedRoute>} />
          <Route path="/ministry/transfers" element={<ProtectedRoute roles={['ministry']}><MinistryTransfers /></ProtectedRoute>} />

          {/* Principal */}
          <Route path="/principal" element={<ProtectedRoute roles={['principal']}><PrincipalDashboard /></ProtectedRoute>} />
          <Route path="/principal/students" element={<ProtectedRoute roles={['principal']}><PrincipalStudents /></ProtectedRoute>} />
          <Route path="/principal/teachers" element={<ProtectedRoute roles={['principal']}><PrincipalTeachers /></ProtectedRoute>} />
          <Route path="/principal/transfers" element={<ProtectedRoute roles={['principal']}><PrincipalTransfers /></ProtectedRoute>} />

          {/* Teacher */}
          <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/courses" element={<ProtectedRoute roles={['teacher']}><TeacherSubjects /></ProtectedRoute>} />
          <Route path="/teacher/grades" element={<ProtectedRoute roles={['teacher']}><TeacherGradebook /></ProtectedRoute>} />
          <Route path="/teacher/students" element={<ProtectedRoute roles={['teacher']}><TeacherStudents /></ProtectedRoute>} />

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/grades" element={<ProtectedRoute roles={['student']}><StudentGrades /></ProtectedRoute>} />
          <Route path="/student/transfers" element={<ProtectedRoute roles={['student']}><StudentTransfer /></ProtectedRoute>} />
          <Route path="/student/history" element={<ProtectedRoute roles={['student']}><StudentHistory /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute roles={['student']}><StudentProfile /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
