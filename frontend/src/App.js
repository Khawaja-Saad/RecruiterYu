import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginSignup from './components/Auth/LoginSignup';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminCustomers from './components/Admin/AdminCustomers';
import RecruiterDashboard from './components/Recruiter/RecruiterDashboard';
import RecruiterProgress from './components/Recruiter/RecruiterProgress';
import RecruiterJobCreation from './components/Recruiter/RecruiterJobCreation';
import CandidateDashboard from './components/Candidate/CandidateDashboard';
import CandidateJobSearch from './components/Candidate/CandidateJobSearch';
import CandidateProfile from './components/Candidate/CandidateProfile';
import CandidateSettings from './components/Candidate/CandidateSettings';
import ProtectedRoute from './components/Common/ProtectedRoute';
import AdminSettings from './components/Admin/AdminSettings';
import RecruiterSettings from './components/Recruiter/RecruiterSettings';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<LoginSignup />} />
            <Route path="/" element={<Navigate to="/auth" replace />} />

            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/customers" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCustomers />
                </ProtectedRoute>
              } 
            />

            {/* Recruiter Routes */}
            <Route 
              path="/recruiter/dashboard" 
              element={
                <ProtectedRoute requiredRole="recruiter">
                  <RecruiterDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recruiter/progress" 
              element={
                <ProtectedRoute requiredRole="recruiter">
                  <RecruiterProgress />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recruiter/job-creation" 
              element={
                <ProtectedRoute requiredRole="recruiter">
                  <RecruiterJobCreation />
                </ProtectedRoute>
              } 
            />

            {/* Candidate Routes */}
            <Route 
              path="/candidate/dashboard" 
              element={
                <ProtectedRoute requiredRole="candidate">
                  <CandidateDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/candidate/search-jobs" 
              element={
                <ProtectedRoute requiredRole="candidate">
                  <CandidateJobSearch />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/candidate/profile" 
              element={
                <ProtectedRoute requiredRole="candidate">
                  <CandidateProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/candidate/settings" 
              element={
                <ProtectedRoute requiredRole="candidate">
                  <CandidateSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recruiter/settings" 
              element={
                <ProtectedRoute requiredRole="recruiter">
                  <RecruiterSettings />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;