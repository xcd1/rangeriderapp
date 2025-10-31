

import React, { useState, createContext, useMemo, useCallback, ReactNode, useContext, useEffect, useRef } from 'react';
import type { Notebook, Scenario, Folder, UserProfile } from './types';
import type { User } from 'firebase/auth';
import useFirestoreNotebooks from './hooks/useFirestoreNotebooks';
import Sidebar from './components/Sidebar';
import StudyView from './components/StudyView';
import LoginView from './components/LoginView';
import ComparisonTray from './components/ComparisonTray';
import ComparisonView from './components/ComparisonView';
import { useAuth } from './contexts/AuthContext';
import { ComparisonProvider, useComparison } from './contexts/ComparisonContext';
import VerificationBanner from './components/VerificationBanner';

// --- History Context for Undo/Redo functionality ---
export interface UndoableAction {
  undo: () => void;
  redo: () => void;
}

interface HistoryContextType {
  pushToHistory: (action: UndoableAction) => void;
  undoLastAction: () => void;
  redoLastAction: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
  const [undoStack, setUndoStack] = useState<UndoableAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoableAction[]>([]);

  const pushToHistory = useCallback((action: UndoableAction) => {
    // FIX: Explicitly type `prev` to avoid type inference issues.
    setUndoStack((prev: UndoableAction[]) => [...prev.slice(-19), action]); // Limit to 20 actions
    setRedoStack([]); // Clear redo stack on new action
  }, []);

  const undoLastAction = useCallback(() => {
    if (undoStack.length === 0) return;
    
    // FIX: Explicitly type `prevStack` and `prevRedo` to avoid type inference issues.
    setUndoStack((prevStack: UndoableAction[]) => {
      const newUndoStack = [...prevStack];
      const lastAction = newUndoStack.pop();
      if (lastAction) {
        lastAction.undo();
        setRedoStack((prevRedo: UndoableAction[]) => [lastAction, ...prevRedo]);
      }
      return newUndoStack;
    });
  }, [undoStack]);
  
  const redoLastAction = useCallback(() => {
    if (redoStack.length === 0) return;

    // FIX: Explicitly type `prevStack` and `prevUndo` to avoid type inference issues.
    setRedoStack((prevStack: UndoableAction[]) => {
      const newRedoStack = [...prevStack];
      const lastAction = newRedoStack.shift();
      if (lastAction) {
        lastAction.redo();
        setUndoStack((prevUndo: UndoableAction[]) => [...prevUndo, lastAction]);
      }
      return newRedoStack;
    });
  }, [redoStack]);
  
  const value = useMemo(() => ({
    pushToHistory,
    undoLastAction,
    redoLastAction,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  }), [pushToHistory, undoLastAction, redoLastAction, undoStack.length, redoStack.length]);

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
  user: (User & Partial<UserProfile>);
  logout: () => void;
  addNotebook: (name: string) => Promise<void>;
  deleteNotebook: (notebookId: string) => Promise<void>;
  updateNotebook: (notebookId: string, updates: Partial<Pick<Notebook, 'name' | 'folderId'>>) => Promise<void>;
  duplicateNotebook: (notebookId: string) => Promise<void>;
  addFolder: (name: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  updateFolder: (folderId: string, updates: Partial<Pick<Folder, 'name' | 'parentId'>>) => Promise<void>;
  addScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
  updateScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
  deleteScenario: (notebookId: string, scenarioId: string) => Promise<void>;
  addMultipleScenarios: (notebookId: string, scenariosToAdd: Scenario[]) => Promise<void>;
  deleteMultipleScenarios: (notebookId: string, scenarioIds: string[]) => Promise<void>;
  swapItemsOrder: (item1: { id: string; type: 'notebook' | 'folder'; createdAt: number; }, item2: { id: string; type: 'notebook' | 'folder'; createdAt: number; }) => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-secondary"></div>
    </div>
);


const AppContent: React.FC = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { undoLastAction, redoLastAction, canUndo, canRedo } = useHistory();
  const { scenariosToCompare } = useComparison();
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [isGlobalComparing, setIsGlobalComparing] = useState(false);
  
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
    duplicateNotebook,
    addFolder,
    deleteFolder,
    updateFolder,
    addScenario,
    updateScenario,
    deleteScenario,
    addMultipleScenarios,
    deleteMultipleScenarios,
    swapItemsOrder
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
      if (event.ctrlKey || event.metaKey) {
          if (event.key === 'z') {
              event.preventDefault();
              undoLastAction();
          } else if (event.key === 'y') {
              event.preventDefault();
              redoLastAction();
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undoLastAction, redoLastAction]);

  const handleLogout = useCallback(async () => {
    try {
        await logout();
        setActiveNotebookId(null);
    } catch (error) {
        console.error("Failed to log out:", error);
    }
  }, [logout]);
  
  const scenariosForGlobalComparison = useMemo(() => {
    if (!isGlobalComparing || scenariosToCompare.length === 0) return [];
    
    const scenarioMap = new Map<string, Scenario>();
    for (const notebook of notebooks) {
        for (const scenario of notebook.scenarios) {
            scenarioMap.set(scenario.id, scenario);
        }
    }
    
    return scenariosToCompare.map(id => scenarioMap.get(id)).filter((s): s is Scenario => !!s);
  }, [isGlobalComparing, scenariosToCompare, notebooks]);

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
        duplicateNotebook,
        addFolder,
        deleteFolder,
        updateFolder,
        addScenario,
        updateScenario,
        deleteScenario,
        addMultipleScenarios,
        deleteMultipleScenarios,
        swapItemsOrder,
    }
  }, [notebooks, folders, activeNotebookId, user, handleLogout, addNotebook, deleteNotebook, updateNotebook, duplicateNotebook, addFolder, deleteFolder, updateFolder, addScenario, updateScenario, deleteScenario, addMultipleScenarios, deleteMultipleScenarios, swapItemsOrder]);
  
  if (authLoading || (user && dataLoading)) {
      return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginView />;
  }
  
  if (isGlobalComparing) {
      return (
          <div className="overflow-y-auto min-w-0 h-screen">
            <ComparisonView 
                scenarios={scenariosForGlobalComparison}
                onBack={() => setIsGlobalComparing(false)}
            />
          </div>
      )
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
        <main className="flex-1 p-6 min-w-0 flex flex-col">
          {user && !user.emailVerified && <VerificationBanner />}
          <div className="flex-grow overflow-y-auto">
            <StudyView key={activeNotebookId} />
          </div>
        </main>
      </div>
      <ComparisonTray onCompare={() => setIsGlobalComparing(true)} />
    </AppContext.Provider>
  );
};

const App: React.FC = () => (
  <HistoryProvider>
    <ComparisonProvider>
      <AppContent />
    </ComparisonProvider>
  </HistoryProvider>
);


export default App;