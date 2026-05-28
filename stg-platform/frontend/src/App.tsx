import './App.css';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Ranking } from './pages/Ranking';
import { Tournaments } from './pages/Tournaments';
import { Store } from './pages/Store';
import { Players } from './pages/Players';
import { Moderation } from './pages/Moderation';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Profile } from './pages/Profile';
import { AuthCallback } from './pages/AuthCallback';
import { Community } from './pages/Community';
import { News } from './pages/News';
import { Creators } from './pages/Creators';
import { ContentManagerPage } from './pages/ContentManagerPage';
import { LoadingScreen } from './components/LoadingScreen';

function App() {
  const isLoadingPreviewRoute = window.location.pathname === '/loading-preview';
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLoader(false), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoadingPreviewRoute || showLoader) {
    return <LoadingScreen />;
  }

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
          <Route path="/times" element={<Community />} />
          <Route path="/noticias" element={<News />} />
          <Route path="/criadores" element={<Creators />} />
          <Route path="/criadores/:creatorId" element={<Creators />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/creators/:creatorId" element={<Creators />} />
          <Route path="/loading-preview" element={<LoadingScreen />} />
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
              <ProtectedRoute requireDashboardAccess>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute requireDashboardAccess>
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
                <Navigate to="/configuracoes?tab=membros" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/:section"
            element={
              <ProtectedRoute requireDashboardAccess>
                <ContentManagerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes/:section"
            element={
              <ProtectedRoute requireDashboardAccess>
                <ContentManagerPage />
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
