import { lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));

function App() {
  const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

  return (
    <Router>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-white to-green-50/30 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Loading...</p>
            </div>
          </div>
        }
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <Students />
              </ProtectedRoute>
            }
          />

          {/* Redirect home to dashboard - ProtectedRoute will handle directing to login if not authenticated */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
