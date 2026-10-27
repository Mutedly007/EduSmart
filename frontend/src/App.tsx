import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PersonnesPage } from './pages/PersonnesPage';
import { CompetencesPage } from './pages/CompetencesPage';
import { FormationsPage } from './pages/FormationsPage';
import { EtablissementsPage } from './pages/EtablissementsPage';
import { NLSearchPage } from './pages/NLSearchPage';
import { SPARQLExplorerPage } from './pages/SPARQLExplorerPage';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { OntologyOverviewPage } from './pages/OntologyOverviewPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="personnes" element={<PersonnesPage />} />
          <Route path="competences" element={<CompetencesPage />} />
          <Route path="formations" element={<FormationsPage />} />
          <Route path="etablissements" element={<EtablissementsPage />} />
          <Route path="search" element={<NLSearchPage />} />
          <Route path="sparql" element={<SPARQLExplorerPage />} />
          <Route path="graph" element={<KnowledgeGraphPage />} />
          <Route path="data" element={<DataManagementPage />} />
          <Route path="ontology" element={<OntologyOverviewPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
