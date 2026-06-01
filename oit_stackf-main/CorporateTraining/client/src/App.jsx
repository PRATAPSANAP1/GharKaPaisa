import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { loadUser, logout } from './store/slices/authSlice';

import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import DashboardRedirect from './components/DashboardRedirect';
import SessionManager from './components/common/SessionManager';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

import Dashboard from './pages/student/Dashboard';
import TestList from './pages/student/TestList';
import TestStart from './pages/student/TestStart';
import TestTaking from './pages/student/TestTaking';
import TestResult from './pages/student/TestResult';
import CodingProblems from './pages/student/CodingProblems';
import CodingEditor from './pages/student/CodingEditor';
import AptitudeHub from './pages/student/AptitudeHub';
import TechnicalHub from './pages/student/TechnicalHub';
import InterviewSetup from './pages/student/InterviewSetup';
import InterviewSession from './pages/student/InterviewSession';
import InterviewResult from './pages/student/InterviewResult';
import Leaderboard from './pages/student/Leaderboard';
import Results from './pages/student/Results';
import Profile from './pages/student/Profile';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageQuestions from './pages/admin/ManageQuestions';
import AddQuestion from './pages/admin/AddQuestion';
import ManageTests from './pages/admin/ManageTests';
import CreateTest from './pages/admin/CreateTest';
import ManageCodingProblems from './pages/admin/ManageCodingProblems';
import AddCodingProblem from './pages/admin/AddCodingProblem';
import ManageCategories from './pages/admin/ManageCategories';
import ViewResults from './pages/admin/ViewResults';
import Analytics from './pages/admin/Analytics';
import AdminSubjectHub from './pages/admin/AdminSubjectHub';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(loadUser());
    } else {
      dispatch(logout());
    }
  }, [dispatch]);

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          className: 'dark:bg-slate-900 dark:text-white border dark:border-slate-800 text-xs font-semibold rounded-2xl',
        }}
      />
      <SessionManager />
      <Routes>
        {/* Redirect Root to login or dashboard */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Role Redirect Route */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Student Routes (Dashboard Layout) */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="aptitude" element={<AptitudeHub />} />
          <Route path="technical/:section" element={<TechnicalHub />} />
          <Route path="tests" element={<TestList />} />
          <Route path="tests/:id" element={<TestStart />} />
          <Route path="tests/:id/result" element={<TestResult />} />
          <Route path="coding" element={<CodingProblems />} />
          <Route path="coding/:id" element={<CodingEditor />} />
          <Route path="interview" element={<InterviewSetup />} />
          <Route path="interview/result" element={<InterviewResult />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="results" element={<Results />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Standalone Student Routes (Standalone Full-Screen Pages) */}
        <Route
          path="/student/tests/:id/take"
          element={
            <ProtectedRoute>
              <TestTaking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/interview/session"
          element={
            <ProtectedRoute>
              <InterviewSession />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes (Admin Layout) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="aptitude" element={<AdminSubjectHub group="aptitude" />} />
          <Route path="technical/:subject" element={<AdminSubjectHub group="technical" />} />
          
          <Route path="questions" element={<Navigate to="/admin/aptitude" replace />} />
          <Route path="questions/add" element={<AddQuestion />} />
          <Route path="questions/edit/:id" element={<AddQuestion />} />
          
          <Route path="tests" element={<Navigate to="/admin/aptitude" replace />} />
          <Route path="tests/create" element={<CreateTest />} />
          <Route path="tests/edit/:id" element={<CreateTest />} />
          
          <Route path="coding" element={<ManageCodingProblems />} />
          <Route path="coding/add" element={<AddCodingProblem />} />
          <Route path="coding/edit/:id" element={<AddCodingProblem />} />
          <Route path="categories" element={<ManageCategories />} />
          <Route path="results" element={<ViewResults />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* Page Not Found fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;

