import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'recruiter':
        return <Navigate to="/recruiter/dashboard" replace />;
      case 'candidate':
        return <Navigate to="/candidate/dashboard" replace />;
      default:
        return <Navigate to="/auth" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;