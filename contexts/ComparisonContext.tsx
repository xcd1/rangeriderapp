import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ComparisonContextType {
  scenariosToCompare: string[];
  addScenarioToCompare: (scenarioId: string) => void;
  removeScenarioFromCompare: (scenarioId: string) => void;
  removeMultipleScenariosFromCompare: (scenarioIds: string[]) => void;
  clearComparison: () => void;
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

export const ComparisonProvider: React.FC<ComparisonProviderProps> = ({ children }) => {
  const [scenariosToCompare, setScenariosToCompare] = useState<string[]>([]);

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
  }, []);

  const value = {
    scenariosToCompare,
    addScenarioToCompare,
    removeScenarioFromCompare,
    removeMultipleScenariosFromCompare,
    clearComparison,
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
};