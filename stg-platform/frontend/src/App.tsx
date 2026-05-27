import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Ranking } from './pages/Ranking';
import { Tournaments } from './pages/Tournaments';
import { Store } from './pages/Store';
import { Players } from './pages/Players';
import { Admin } from './pages/Admin';
import { Moderation } from './pages/Moderation';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Profile } from './pages/Profile';
import { AuthCallback } from './pages/AuthCallback';
import { Community } from './pages/Community';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Landing />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/loja" element={<Store />} />
          <Route path="/store" element={<Store />} />
          <Route path="/torneios" element={<Tournaments />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/comunidade" element={<Community />} />
          <Route
            path="/preview"
            element={
              <ProtectedRoute requireAdmin>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Require Login */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireDashboardAccess>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/players"
            element={
              <ProtectedRoute>
                <Players />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute requireAdmin>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Require Admin/Moderator Role */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireDashboardAccess>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/moderation"
            element={
              <ProtectedRoute requireDashboardAccess>
                <Moderation />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
