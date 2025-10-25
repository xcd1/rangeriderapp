import React, { useState, createContext, useMemo, useCallback, ReactNode, useContext, useEffect } from 'react';
import type { Notebook, Scenario } from './types';
import type { User } from 'firebase/auth';
import useFirestoreNotebooks from './hooks/useFirestoreNotebooks';
import Sidebar from './components/Sidebar';
import StudyView from './components/StudyView';
import LoginView from './components/LoginView';
import { useAuth } from './contexts/AuthContext';

// --- History Context for Undo functionality ---
type UndoableAction = () => void;

interface HistoryContextType {
  pushToHistory: (action: UndoableAction) => void;
  undoLastAction: () => void;
}

const HistoryContext = createContext<HistoryContextType | null>(null);

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
};

const HistoryProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [historyStack, setHistoryStack] = useState<UndoableAction[]>([]);

  const pushToHistory = useCallback((undoAction: UndoableAction) => {
    setHistoryStack(prev => [undoAction, ...prev].slice(0, 20)); // Limit to 20 actions
  }, []);

  const undoLastAction = useCallback(() => {
    if (historyStack.length === 0) return;
    const [lastUndoAction, ...rest] = historyStack;
    lastUndoAction();
    setHistoryStack(rest);
  }, [historyStack]);
  
  const value = { pushToHistory, undoLastAction };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
};
// --- End History Context ---


interface AppContextType {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  setActiveNotebookId: React.Dispatch<React.SetStateAction<string | null>>;
  user: User;
  logout: () => void;
  addNotebook: (name: string) => Promise<void>;
  deleteNotebook: (notebookId: string) => Promise<void>;
  updateNotebookName: (notebookId: string, newName: string) => Promise<void>;
  addScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
  updateScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
  deleteScenario: (notebookId: string, scenarioId: string) => Promise<void>;
  addMultipleScenarios: (notebookId: string, scenariosToAdd: Scenario[]) => Promise<void>;
  deleteMultipleScenarios: (notebookId: string, scenarioIds: string[]) => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-secondary"></div>
    </div>
);


const AppContent: React.FC = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { undoLastAction } = useHistory();
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  
  const { 
    notebooks, 
    loading: dataLoading, 
    addNotebook,
    deleteNotebook,
    updateNotebookName,
    addScenario,
    updateScenario,
    deleteScenario,
    addMultipleScenarios,
    deleteMultipleScenarios
  } = useFirestoreNotebooks(user?.uid, activeNotebookId);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        undoLastAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undoLastAction]);

  const handleLogout = useCallback(async () => {
    try {
        await logout();
        setActiveNotebookId(null);
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
        user,
        logout: handleLogout,
        addNotebook,
        deleteNotebook,
        updateNotebookName,
        addScenario,
        updateScenario,
        deleteScenario,
        addMultipleScenarios,
        deleteMultipleScenarios,
    }
  }, [notebooks, activeNotebookId, user, handleLogout, addNotebook, deleteNotebook, updateNotebookName, addScenario, updateScenario, deleteScenario, addMultipleScenarios, deleteMultipleScenarios]);
  
  if (authLoading || (user && dataLoading)) {
      return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="flex h-screen font-sans bg-brand-bg text-brand-text">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <StudyView />
        </main>
      </div>
    </AppContext.Provider>
  );
};

const App: React.FC = () => (
  <HistoryProvider>
    <AppContent />
  </HistoryProvider>
);


export default App;