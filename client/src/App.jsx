import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import PassengerDashboard from './pages/PassengerDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ComplaintTracking from './pages/ComplaintTracking';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />

          {/* Protected Passenger routes */}
          <Route path="/passenger" element={
            <ProtectedRoute passengerOnly>
              <PassengerDashboard />
            </ProtectedRoute>
          } />
          
          {/* Protected Officer routes */}
          <Route path="/officer" element={
            <ProtectedRoute officerOnly>
              <OfficerDashboard />
            </ProtectedRoute>
          } />

          {/* Protected Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Protected Track Ticket route */}
          <Route path="/track/:id" element={
            <ProtectedRoute>
              <ComplaintTracking />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
