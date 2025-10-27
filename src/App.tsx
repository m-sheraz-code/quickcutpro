import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { NewProject } from './pages/NewProject';
import { ProjectView } from './pages/ProjectView';

type Page = 'login' | 'signup' | 'forgot-password' | 'dashboard' | 'new-project' | 'project-view';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'signup') {
      return <SignUp onSignInClick={() => setCurrentPage('login')} />;
    }

    if (currentPage === 'forgot-password') {
      return <ForgotPassword onBackClick={() => setCurrentPage('login')} />;
    }

    return (
      <Login
        onSignUpClick={() => setCurrentPage('signup')}
        onForgotPasswordClick={() => setCurrentPage('forgot-password')}
      />
    );
  }

  if (currentPage === 'new-project') {
    return (
      <NewProject
        onBackClick={() => setCurrentPage('dashboard')}
        onSuccess={() => setCurrentPage('dashboard')}
      />
    );
  }

  if (currentPage === 'project-view' && selectedProjectId) {
    return (
      <ProjectView
        projectId={selectedProjectId}
        onBackClick={() => setCurrentPage('dashboard')}
      />
    );
  }

  return (
    <Dashboard
      onNewProjectClick={() => setCurrentPage('new-project')}
      onProjectClick={(projectId) => {
        setSelectedProjectId(projectId);
        setCurrentPage('project-view');
      }}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
