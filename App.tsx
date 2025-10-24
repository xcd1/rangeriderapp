import React, { useState, createContext, useMemo, useCallback } from 'react';
import type { Notebook } from './types';
import type { User } from 'firebase/auth';
import useLocalStorage from './hooks/useLocalStorage';
import Sidebar from './components/Sidebar';
import StudyView from './components/StudyView';
import LoginView from './components/LoginView';
import { useAuth } from './contexts/AuthContext';

interface AppContextType {
  notebooks: Notebook[];
  setNotebooks: React.Dispatch<React.SetStateAction<Notebook[]>>;
  activeNotebookId: string | null;
  setActiveNotebookId: React.Dispatch<React.SetStateAction<string | null>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  user: User;
  logout: () => void;
}

export const AppContext = createContext<AppContextType | null>(null);

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);


const App: React.FC = () => {
  const { user, logout, loading } = useAuth();

  const [notebooks, setNotebooks] = useLocalStorage<Notebook[]>(
    user ? `range-rider-notebooks-${user.uid}` : null, 
    []
  );
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = useCallback(async () => {
    try {
        await logout();
        setActiveNotebookId(null);
        setSearchTerm('');
        // setNotebooks is not needed as useLocalStorage will reset on key change
    } catch (error) {
        console.error("Failed to log out:", error);
    }
  }, [logout]);

  const contextValue = useMemo(() => {
    if (!user) return null;
    return {
        notebooks,
        setNotebooks,
        activeNotebookId,
        setActiveNotebookId,
        searchTerm,
        setSearchTerm,
        user,
        logout: handleLogout,
    }
  }, [notebooks, setNotebooks, activeNotebookId, searchTerm, user, handleLogout]);
  
  if (loading) {
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
