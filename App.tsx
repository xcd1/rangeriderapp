

import React, { useState, createContext, useMemo, useCallback, ReactNode, useContext, useEffect, useRef } from 'react';
import type { Notebook, Scenario, Folder } from './types';
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
  folders: Folder[];
  activeNotebookId: string | null;
  setActiveNotebookId: React.Dispatch<React.SetStateAction<string | null>>;
  user: User;
  logout: () => void;
  addNotebook: (name: string) => Promise<void>;
  deleteNotebook: (notebookId: string) => Promise<void>;
  updateNotebook: (notebookId: string, updates: Partial<Pick<Notebook, 'name' | 'folderId'>>) => Promise<void>;
  addFolder: (name: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  updateFolder: (folderId: string, updates: Partial<Pick<Folder, 'name' | 'parentId'>>) => Promise<void>;
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
  
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    const width = savedWidth ? parseInt(savedWidth, 10) : 288; // 288px is w-72
    return Math.max(200, Math.min(width, 500)); // Constrain width on initial load
  });
  const isResizing = useRef(false);
  const hasRestoredSession = useRef(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
        const newWidth = e.clientX;
        // Constrain width during resize
        if (newWidth >= 200 && newWidth <= 500) {
            setSidebarWidth(newWidth);
        }
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  const { 
    notebooks, 
    folders,
    loading: dataLoading, 
    addNotebook,
    deleteNotebook,
    updateNotebook,
    addFolder,
    deleteFolder,
    updateFolder,
    addScenario,
    updateScenario,
    deleteScenario,
    addMultipleScenarios,
    deleteMultipleScenarios
  } = useFirestoreNotebooks(user?.uid);
  
    // --- Session Persistence Effects ---
    useEffect(() => {
        // Restore session: Runs once when user data is loaded.
        if (user && !dataLoading && notebooks.length > 0 && !hasRestoredSession.current) {
            const lastId = localStorage.getItem(`lastActiveNotebookId-${user.uid}`);
            // Check if the notebook still exists before setting it as active
            if (lastId && notebooks.some(n => n.id === lastId)) {
                setActiveNotebookId(lastId);
            }
            hasRestoredSession.current = true;
        }

        // Reset the restoration flag on logout.
        if (!user) {
            hasRestoredSession.current = false;
        }
    }, [user, dataLoading, notebooks]);


    useEffect(() => {
        // Save session: Runs whenever the active notebook changes.
        // Only starts saving after the initial session has been restored.
        if (user?.uid && hasRestoredSession.current) {
            if (activeNotebookId) {
                localStorage.setItem(`lastActiveNotebookId-${user.uid}`, activeNotebookId);
            } else {
                localStorage.removeItem(`lastActiveNotebookId-${user.uid}`);
            }
        }
    }, [activeNotebookId, user?.uid]);
    // --- End Session Persistence ---


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
        folders,
        activeNotebookId,
        setActiveNotebookId,
        user,
        logout: handleLogout,
        addNotebook,
        deleteNotebook,
        updateNotebook,
        addFolder,
        deleteFolder,
        updateFolder,
        addScenario,
        updateScenario,
        deleteScenario,
        addMultipleScenarios,
        deleteMultipleScenarios,
    }
  }, [notebooks, folders, activeNotebookId, user, handleLogout, addNotebook, deleteNotebook, updateNotebook, addFolder, deleteFolder, updateFolder, addScenario, updateScenario, deleteScenario, addMultipleScenarios, deleteMultipleScenarios]);
  
  if (authLoading || (user && dataLoading)) {
      return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="flex h-screen font-sans bg-brand-bg text-brand-text">
        <Sidebar width={sidebarWidth} />
        <div 
            onMouseDown={handleMouseDown}
            className="w-1.5 cursor-col-resize bg-brand-primary hover:bg-brand-secondary transition-colors duration-200 flex-shrink-0"
            title="Arraste para redimensionar"
        />
        <main className="flex-1 p-6 overflow-y-auto min-w-0">
          <StudyView key={activeNotebookId} />
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