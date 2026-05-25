import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, officerOnly = false, passengerOnly = false }) => {
  const { isAuthenticated, isAdmin, isOfficer, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading Rail Madad AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (officerOnly && !isOfficer && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (passengerOnly && user?.role !== 'passenger') {
    // If logged in as officer, go to officer dashboard. If admin, go to admin dashboard.
    if (isOfficer) return <Navigate to="/officer" replace />;
    if (isAdmin) return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
