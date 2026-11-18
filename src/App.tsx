import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SelectionsProvider } from './contexts/SelectionsContext';
import { ViewStateProvider } from './contexts/ViewStateProvider';
import { LoginForm } from './components/Auth/LoginForm';
import { AdminLoginForm } from './components/Auth/AdminLoginForm';
import { Header } from './components/Layout/Header';
import { AdminRoute } from './components/Layout/AdminRoute';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { PlantsPage } from './pages/PlantsPage';
import { StonesPage } from './pages/StonesPage';
import { SelectionsPage } from './pages/SelectionsPage';
import { AdminPage } from './pages/AdminPage';
import { PlantDetailPage } from './pages/PlantDetailPage';
import { StoneDetailPage } from './pages/StoneDetailPage';
import { PublicStoneDetail } from './pages/PublicStoneDetail';
import { ZoneMapPage } from './pages/ZoneMapPage';
import { AdditionalInformationPage } from './pages/AdditionalInformationPage';
import { TicketsPage } from './pages/TicketsPage';
import { TreeBenefitsPage } from './pages/TreeBenefitsPage';
import { BloomCalendarListPage } from './pages/BloomCalendarListPage';
import { BloomCalendarEditorPage } from './pages/BloomCalendarEditorPage';
import { LibraryPage } from './pages/LibraryPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Routes>
      <Route path="/stone/:id" element={<PublicStoneDetail />} />
      <Route path="/login" element={<LoginForm />} />
      <Route
        path="/admin"
        element={user ? (
          <div className="min-h-screen">
            <Header />
            <AdminRoute><AdminPage /></AdminRoute>
          </div>
        ) : <AdminLoginForm />}
      />
      <Route
        path="/admin/plant/:id"
        element={user ? (
          <div className="min-h-screen">
            <Header />
            <AdminRoute><PlantDetailPage /></AdminRoute>
          </div>
        ) : <AdminLoginForm />}
      />
      <Route
        path="/admin/stone/:id"
        element={user ? (
          <div className="min-h-screen">
            <Header />
            <AdminRoute><StoneDetailPage /></AdminRoute>
          </div>
        ) : <AdminLoginForm />}
      />
      <Route path="*" element={
        user ? (
          <div className="min-h-screen">
            <Header />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/zone-map"
                element={
                  <ProtectedRoute>
                    <ZoneMapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plants"
                element={
                  <ProtectedRoute>
                    <PlantsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stones"
                element={
                  <ProtectedRoute>
                    <StonesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/additional-information"
                element={
                  <ProtectedRoute>
                    <AdditionalInformationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/selections"
                element={
                  <ProtectedRoute>
                    <SelectionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets"
                element={
                  <ProtectedRoute>
                    <TicketsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tree-benefits"
                element={
                  <ProtectedRoute>
                    <TreeBenefitsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/library"
                element={
                  <ProtectedRoute>
                    <LibraryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/plant/:id"
                element={
                  <AdminRoute>
                    <PlantDetailPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/stone/:id"
                element={
                  <AdminRoute>
                    <StoneDetailPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/bluehkalender"
                element={
                  <ProtectedRoute>
                    <BloomCalendarListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bluehkalender/:id"
                element={
                  <ProtectedRoute>
                    <BloomCalendarEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        ) : (
          <LoginForm />
        )
      } />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SelectionsProvider>
          <ViewStateProvider>
            <AppContent />
          </ViewStateProvider>
        </SelectionsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
