import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PersonnesPage } from './pages/PersonnesPage';
import { CompetencesPage } from './pages/CompetencesPage';
import { ApprentissagePage } from './pages/ApprentissagePage';
import { FormationsPage } from './pages/FormationsPage';
import { EtablissementsPage } from './pages/EtablissementsPage';
import { NLSearchPage } from './pages/NLSearchPage';
import { SPARQLExplorerPage } from './pages/SPARQLExplorerPage';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { OntologyOverviewPage } from './pages/OntologyOverviewPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuth } from './context/AuthContext';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques (Vitrine & Authentification) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Routes applicatives protégées (accessibles UNIQUEMENT après connexion) */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/personnes" element={<PersonnesPage />} />
          <Route path="/competences" element={<CompetencesPage />} />
          <Route path="/apprentissage" element={<ApprentissagePage />} />
          <Route path="/formations" element={<FormationsPage />} />
          <Route path="/etablissements" element={<EtablissementsPage />} />
          <Route path="/search" element={<NLSearchPage />} />
          <Route path="/sparql" element={<SPARQLExplorerPage />} />
          <Route path="/graph" element={<KnowledgeGraphPage />} />
          <Route path="/data" element={<DataManagementPage />} />
          <Route path="/ontology" element={<OntologyOverviewPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Redirection fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
