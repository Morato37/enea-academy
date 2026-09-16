import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SelectionsProvider } from './contexts/SelectionsContext';
import { ViewStateProvider } from './contexts/ViewStateProvider';
import { LoginForm } from './components/Auth/LoginForm';
import { Header } from './components/Layout/Header';
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

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Routes>
      <Route path="/stone/:id" element={<PublicStoneDetail />} />
      <Route path="/login" element={<LoginForm />} />
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
                path="/tree-benefits"
                element={
                  <ProtectedRoute adminOnly>
                    <TreeBenefitsPage />
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
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/plant/:id"
                element={
                  <ProtectedRoute>
                    <PlantDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stone/:id"
                element={
                  <ProtectedRoute>
                    <StoneDetailPage />
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
