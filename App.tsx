import React, { useState, createContext, useMemo, useCallback } from 'react';
import type { Notebook, Scenario } from './types';
import type { User } from 'firebase/auth';
import useFirestoreNotebooks from './hooks/useFirestoreNotebooks';
import Sidebar from './components/Sidebar';
import StudyView from './components/StudyView';
import LoginView from './components/LoginView';
import { useAuth } from './contexts/AuthContext';

interface AppContextType {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  setActiveNotebookId: React.Dispatch<React.SetStateAction<string | null>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  user: User;
  logout: () => void;
  addNotebook: (name: string) => Promise<void>;
  deleteNotebook: (notebookId: string) => Promise<void>;
  addScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
  updateScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
  deleteScenario: (notebookId: string, scenarioId: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);


const App: React.FC = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { 
    notebooks, 
    loading: notebooksLoading, 
    addNotebook,
    deleteNotebook,
    addScenario,
    updateScenario,
    deleteScenario
  } = useFirestoreNotebooks(user?.uid);

  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = useCallback(async () => {
    try {
        await logout();
        setActiveNotebookId(null);
        setSearchTerm('');
    } catch (error) {
        console.error("Failed to log out:", error);
    }
  }, [logout]);

  const contextValue = useMemo(() => {
    if (!user) return null;
    return {
        notebooks,
        activeNotebookId,
        setActiveNotebookId,
        searchTerm,
        setSearchTerm,
        user,
        logout: handleLogout,
        addNotebook,
        deleteNotebook,
        addScenario,
        updateScenario,
        deleteScenario,
    }
  }, [notebooks, activeNotebookId, searchTerm, user, handleLogout, addNotebook, deleteNotebook, addScenario, updateScenario, deleteScenario]);
  
  if (authLoading || (user && notebooksLoading)) {
      return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="flex h-screen font-sans bg-gray-900 text-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <StudyView />
        </main>
      </div>
    </AppContext.Provider>
  );
};

export default App;