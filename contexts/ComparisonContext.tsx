import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// This type is used by ComparisonView, so it's defined here where the state lives.
export interface CardState {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

export interface ComparisonLayoutState {
    isSimpleMode: boolean;
    // Store scenario IDs to reconstruct the order. `null` for empty slots.
    orderedScenarios: (string | null)[];
    gridCols: number | null;
    zoomLevel: number;
    cardStates: CardState[];
    // A signature to detect when the list of scenarios to compare has changed.
    scenarioIdsSignature: string;
}

interface ComparisonContextType {
  scenariosToCompare: string[];
  addScenarioToCompare: (scenarioId: string) => void;
  removeScenarioFromCompare: (scenarioId: string) => void;
  removeMultipleScenariosFromCompare: (scenarioIds: string[]) => void;
  clearComparison: () => void;
  
  // Changed API for multi-layout support
  getLayoutState: (key: string) => ComparisonLayoutState;
  setLayoutState: (key: string, updater: React.SetStateAction<ComparisonLayoutState>) => void;
}

const ComparisonContext = createContext<ComparisonContextType | null>(null);

export const useComparison = (): ComparisonContextType => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
};

interface ComparisonProviderProps {
  children: ReactNode;
}

const defaultLayoutState: ComparisonLayoutState = {
    isSimpleMode: false,
    orderedScenarios: [],
    gridCols: null,
    zoomLevel: 1,
    cardStates: [],
    scenarioIdsSignature: '',
};

export const ComparisonProvider: React.FC<ComparisonProviderProps> = ({ children }) => {
  const [scenariosToCompare, setScenariosToCompare] = useState<string[]>([]);
  // State is now an object holding layouts for different comparison contexts (keyed by notebookId or "global")
  const [layoutStates, setLayoutStates] = useState<Record<string, ComparisonLayoutState>>({});

  const addScenarioToCompare = useCallback((scenarioId: string) => {
    // FIX: Explicitly type `prev` to avoid type pollution.
    setScenariosToCompare((prev: string[]) => {
      if (prev.includes(scenarioId)) return prev;
      return [...prev, scenarioId];
    });
  }, []);

  const removeScenarioFromCompare = useCallback((scenarioId: string) => {
    // FIX: Explicitly type `prev` to avoid type pollution.
    setScenariosToCompare((prev: string[]) => prev.filter(id => id !== scenarioId));
  }, []);

  const removeMultipleScenariosFromCompare = useCallback((scenarioIds: string[]) => {
    const idsToRemove = new Set(scenarioIds);
    // FIX: Explicitly type `prev` to avoid type pollution.
    setScenariosToCompare((prev: string[]) => prev.filter(id => !idsToRemove.has(id)));
  }, []);
  
  const clearComparison = useCallback(() => {
    setScenariosToCompare([]);
    // The layout state is intentionally NOT reset here.
    // It will be reset in ComparisonView if a new set of scenarios is compared.
  }, []);

  const getLayoutState = useCallback((key: string): ComparisonLayoutState => {
    return layoutStates[key] || defaultLayoutState;
  }, [layoutStates]);

  const setLayoutState = useCallback((key: string, updater: React.SetStateAction<ComparisonLayoutState>) => {
    setLayoutStates(prevStates => {
        const currentForKey = prevStates[key] || defaultLayoutState;
        const newState = typeof updater === 'function' ? updater(currentForKey) : updater;
        return {
            ...prevStates,
            [key]: newState
        };
    });
  }, []);

  const value = {
    scenariosToCompare,
    addScenarioToCompare,
    removeScenarioFromCompare,
    removeMultipleScenariosFromCompare,
    clearComparison,
    getLayoutState,
    setLayoutState,
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
};
