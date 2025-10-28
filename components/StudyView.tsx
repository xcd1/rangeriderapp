

import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { AppContext, useHistory } from '../App';
import type { SpotType, Scenario } from '../types';
import { SPOT_TYPES } from '../constants';
import ScenarioEditor from './ScenarioEditor';
import ComparisonView from './ComparisonView';
import ConfirmationModal from './ConfirmationModal';

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 flex-shrink-0"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const getLastActiveSpots = (uid: string): Record<string, SpotType> => {
    if (!uid) return {};
    try {
        const item = localStorage.getItem(`lastActiveSpots-${uid}`);
        return item ? JSON.parse(item) : {};
    } catch (error) {
        console.error("Error reading lastActiveSpots from localStorage", error);
        return {};
    }
};

const setLastActiveSpot = (uid: string, notebookId: string, spot: SpotType | null) => {
    if (!uid) return;
    try {
        const spots = getLastActiveSpots(uid);
        if (spot) {
            spots[notebookId] = spot;
        } else {
            delete spots[notebookId];
        }
        localStorage.setItem(`lastActiveSpots-${uid}`, JSON.stringify(spots));
    } catch (error) {
        console.error("Error writing lastActiveSpots to localStorage", error);
    }
};

type ComparisonStateObject = { scenarioIds: string[]; fromSpot: SpotType | null };
type ComparisonState = Record<string, ComparisonStateObject>;

const getComparisonState = (uid: string): ComparisonState => {
    if (!uid) return {};
    try {
        const item = localStorage.getItem(`comparisonState-${uid}`);
        return item ? JSON.parse(item) : {};
    } catch (error) {
        console.error("Error reading comparisonState from localStorage", error);
        return {};
    }
};

const setComparisonState = (uid: string, notebookId: string, scenarioIds: string[], fromSpot: SpotType | null) => {
    if (!uid) return;
    try {
        const state = getComparisonState(uid);
        if (scenarioIds.length > 0) {
            state[notebookId] = { scenarioIds, fromSpot };
        } else {
            delete state[notebookId];
        }
        localStorage.setItem(`comparisonState-${uid}`, JSON.stringify(state));
    } catch (error) {
        console.error("Error writing comparisonState to localStorage", error);
    }
};


const StudyView: React.FC = () => {
    const context = useContext(AppContext);
    const { pushToHistory } = useHistory();

    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [isDeleteSelectionModalOpen, setIsDeleteSelectionModalOpen] = useState(false);

    // Dropdown states
    const [expandDropdownOpen, setExpandDropdownOpen] = useState(false);
    const [collapseDropdownOpen, setCollapseDropdownOpen] = useState(false);
    const [sectionControl, setSectionControl] = useState<{action: 'expand' | 'collapse', target: 'all' | 'params' | 'media' | 'notes', key: number} | null>(null);
    const expandDropdownRef = useRef<HTMLDivElement>(null);
    const collapseDropdownRef = useRef<HTMLDivElement>(null);


    if (!context) return null;
    const { 
        notebooks, 
        activeNotebookId, 
        user,
        addScenario, 
        updateScenario, 
        deleteScenario,
        addMultipleScenarios,
        deleteMultipleScenarios
    } = context;

    const uid = user?.uid;

    const activeNotebook = useMemo(() => {
        return notebooks.find(n => n.id === activeNotebookId);
    }, [notebooks, activeNotebookId]);

    // Synchronously determine the initial state to prevent UI flashing on notebook switch.
    const initialViewState = useMemo(() => {
        if (activeNotebook && uid) {
            const comparisonStates = getComparisonState(uid);
            const savedComparison = comparisonStates[activeNotebook.id];

            if (savedComparison && savedComparison.scenarioIds.length > 0) {
                return {
                    isComparing: true,
                    scenariosToCompare: new Set<string>(savedComparison.scenarioIds),
                    activeSpot: null as SpotType | null,
                    comparisonOriginSpot: savedComparison.fromSpot,
                };
            } else {
                const lastSpot = getLastActiveSpots(uid)[activeNotebook.id];
                return {
                    isComparing: false,
                    scenariosToCompare: new Set<string>(),
                    activeSpot: lastSpot || null,
                    comparisonOriginSpot: null as SpotType | null,
                };
            }
        }
        return {
            isComparing: false,
            scenariosToCompare: new Set<string>(),
            activeSpot: null as SpotType | null,
            comparisonOriginSpot: null as SpotType | null,
        };
    }, [activeNotebook, uid]);

    const [activeSpot, setActiveSpot] = useState<SpotType | null>(initialViewState.activeSpot);
    const [scenariosToCompare, setScenariosToCompare] = useState<Set<string>>(initialViewState.scenariosToCompare);
    const [isComparing, setIsComparing] = useState<boolean>(initialViewState.isComparing);
    const [comparisonOriginSpot, setComparisonOriginSpot] = useState<SpotType | null>(initialViewState.comparisonOriginSpot);

    const initialCollapsedState = useMemo(() => {
        if (activeNotebook && uid && initialViewState.activeSpot) {
             try {
                const key = `collapsedScenarios-${uid}-${activeNotebook.id}-${initialViewState.activeSpot}`;
                const saved = localStorage.getItem(key);
                return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
            } catch (e) {
                console.error("Failed to load collapsed scenarios:", e);
                return new Set<string>();
            }
        }
        return new Set<string>();
    }, [activeNotebook, uid, initialViewState.activeSpot]);

    const [collapsedScenarios, setCollapsedScenarios] = useState<Set<string>>(initialCollapsedState);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (expandDropdownRef.current && !expandDropdownRef.current.contains(event.target as Node)) {
                setExpandDropdownOpen(false);
            }
            if (collapseDropdownRef.current && !collapseDropdownRef.current.contains(event.target as Node)) {
                setCollapseDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSectionControl = (action: 'expand' | 'collapse', target: 'all' | 'params' | 'media' | 'notes') => {
        setSectionControl({ action, target, key: Date.now() });
        setExpandDropdownOpen(false);
        setCollapseDropdownOpen(false);
    };

    useEffect(() => {
        if (activeNotebookId && activeSpot && uid) {
            try {
                const key = `collapsedScenarios-${uid}-${activeNotebookId}-${activeSpot}`;
                localStorage.setItem(key, JSON.stringify(Array.from(collapsedScenarios)));
            } catch(e) {
                console.error("Failed to save collapsed scenarios:", e);
            }
        }
    }, [collapsedScenarios, activeNotebookId, activeSpot, uid]);


    const filteredScenarios = useMemo(() => {
        if (!activeNotebook) return [];
        
        return activeNotebook.scenarios
            .filter(s => s.spotType === activeSpot)
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    }, [activeNotebook, activeSpot]);

    const handleAddNewScenario = () => {
        if (!activeNotebook || !activeSpot) return;

        const newScenario: Scenario = {
            id: crypto.randomUUID(),
            spotType: activeSpot,
            rangeAction: null,
            raiserPos: null,
            heroPos: null,
            blindWarPosition: null,
            blindWarAction: null,
            coldCallerPos: null,
            aggressorPos: null,
            printSpotImage: null,
            rpImage: null,
            tableViewImage: null,
            plusInfoImage: null,
            gameScenario: null,
            rangeImage: null,
            frequenciesImage: null,
            raiseSmallText: '',
            raiseBigText: '',
            callText: '',
            notes: '',
            createdAt: Date.now(),
        };
        addScenario(activeNotebook.id, newScenario);
        pushToHistory(() => deleteScenario(activeNotebook.id, newScenario.id));
    };

    const handleUpdateScenario = (updatedScenario: Scenario) => {
        if (!activeNotebook || !activeSpot) return;
        updateScenario(activeNotebook.id, updatedScenario);
    };
    
    const handleDeleteScenario = (scenarioId: string) => {
        if (!activeNotebook || !activeSpot) return;
        const scenarioToDelete = activeNotebook.scenarios.find(s => s.id === scenarioId);
        if (scenarioToDelete) {
            deleteScenario(activeNotebook.id, scenarioId);
            pushToHistory(() => addScenario(activeNotebook.id, scenarioToDelete));
        }
    };
    
    const handleDuplicateScenario = (scenarioId: string) => {
        if (!activeNotebook || !activeSpot) return;
        const scenarioToDuplicate = activeNotebook.scenarios.find(s => s.id === scenarioId);
        if (!scenarioToDuplicate) return;

        const duplicatedScenario: Scenario = {
            ...scenarioToDuplicate,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
        };

        addScenario(activeNotebook.id, duplicatedScenario);
        pushToHistory(() => deleteScenario(activeNotebook.id, duplicatedScenario.id));
    };
    
    const handleDeleteAll = () => {
        if (!activeNotebook || filteredScenarios.length === 0 || !uid) return;
        
        const scenariosToDelete = [...filteredScenarios];
        const scenarioIdsToDelete = scenariosToDelete.map(s => s.id);
        
        deleteMultipleScenarios(activeNotebook.id, scenarioIdsToDelete);
        pushToHistory(() => addMultipleScenarios(activeNotebook.id, scenariosToDelete));
        
        setLastActiveSpot(uid, activeNotebook.id, null);
        setActiveSpot(null); // Go back to spot selection
        setIsDeleteAllModalOpen(false);
    };
    
    const handleDeleteSelection = () => {
        if (!activeNotebook || scenariosToCompare.size === 0 || !uid) return;

        const scenariosToDelete = activeNotebook.scenarios.filter(s => scenariosToCompare.has(s.id));
        const scenarioIdsToDelete = Array.from(scenariosToCompare);

        deleteMultipleScenarios(activeNotebook.id, scenarioIdsToDelete);
        pushToHistory(() => addMultipleScenarios(activeNotebook.id, scenariosToDelete));

        setScenariosToCompare(new Set());
        setIsDeleteSelectionModalOpen(false);

        const remainingScenarios = filteredScenarios.filter(s => !scenarioIdsToDelete.includes(s.id));
        if (remainingScenarios.length === 0) {
            setLastActiveSpot(uid, activeNotebook.id, null);
            setActiveSpot(null); // Go back to spot selection
        }
    };

    const toggleCompare = (scenarioId: string) => {
        setScenariosToCompare(prev => {
            const newSet = new Set(prev);
            if (newSet.has(scenarioId)) {
                newSet.delete(scenarioId);
            } else {
                newSet.add(scenarioId);
            }
            return newSet;
        });
    };
    
    const toggleScenarioCollapse = (scenarioId: string) => {
        setCollapsedScenarios(prev => {
            const newSet = new Set(prev);
            if (newSet.has(scenarioId)) {
                newSet.delete(scenarioId);
            } else {
                newSet.add(scenarioId);
            }
            return newSet;
        });
    };

    const handleClearCompare = () => {
        setScenariosToCompare(new Set());
    };

    const handleSelectAll = () => {
        const allScenarioIds = new Set(filteredScenarios.map(s => s.id));
        setScenariosToCompare(allScenarioIds);
    };

    const scenariosForComparisonView = activeNotebook?.scenarios?.filter(s => scenariosToCompare.has(s.id)) || [];
    
    const handleSelectSpot = (spot: SpotType) => {
        setActiveSpot(spot);
        if (activeNotebookId && uid) {
            setLastActiveSpot(uid, activeNotebookId, spot);
        }
        setScenariosToCompare(new Set());
    };
    
    const handleBackToSpots = () => {
        if (activeNotebookId && uid) {
            setLastActiveSpot(uid, activeNotebookId, null); // Clear the stored spot
        }
        setActiveSpot(null);
        setScenariosToCompare(new Set());
    };

    const handleStartComparison = () => {
        if (activeNotebookId && uid && scenariosToCompare.size >= 2) {
            setComparisonState(uid, activeNotebookId, Array.from(scenariosToCompare), activeSpot);
            setIsComparing(true);
        }
    };

    const handleBackFromComparison = () => {
        setIsComparing(false);
        if (activeNotebookId && uid) {
            setComparisonState(uid, activeNotebookId, [], null); // Limpa o estado salvo
            const lastSpot = getLastActiveSpots(uid)[activeNotebookId];
            setActiveSpot(lastSpot || null);
        } else {
            setActiveSpot(null);
        }
    };


    if (!activeNotebook) {
        return (
            <div className="flex items-center justify-center h-full text-brand-text-muted">
                <p>Selecione ou crie um caderno para começar.</p>
            </div>
        );
    }

    if (isComparing) {
        return <ComparisonView scenarios={scenariosForComparisonView} onBack={handleBackFromComparison} />;
    }

    if (!activeSpot) {
        return (
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-6 text-brand-text">{activeNotebook.name}</h2>
                <p className="text-lg text-brand-text-muted mb-8">What do you wanna master?</p>
                <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                    {SPOT_TYPES.map(spot => (
                        <button
                            key={spot}
                            onClick={() => handleSelectSpot(spot)}
                            className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-8 px-4 rounded-lg text-xl transition-transform transform hover:scale-105 flex items-center justify-center"
                        >
                            {spot}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <button onClick={handleBackToSpots} className="text-sm font-bold text-brand-secondary hover:underline mb-2 inline-block">&larr; Voltar para Spots</button>
                    <h2 className="text-2xl font-bold text-brand-text">{activeNotebook.name} / {activeSpot}</h2>
                </div>
            </div>
            
            {filteredScenarios.length > 0 && (
                <div className="flex justify-between items-center flex-wrap gap-4 mb-6 border-y border-brand-primary py-3">
                    {/* LEFT GROUP */}
                    <div className="flex items-center flex-wrap gap-4">
                        <button
                            onClick={handleStartComparison}
                            disabled={scenariosToCompare.size < 2}
                            className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors disabled:bg-brand-secondary/50 disabled:cursor-not-allowed disabled:text-brand-primary/70"
                        >
                            Comparar ({scenariosToCompare.size})
                        </button>
                        
                        {filteredScenarios.length > 1 && (
                            <>
                                <div className="relative" ref={expandDropdownRef}>
                                    <button
                                        onClick={() => setExpandDropdownOpen(p => !p)}
                                        disabled={scenariosToCompare.size === 0}
                                        className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors text-sm disabled:bg-brand-secondary/50 disabled:cursor-not-allowed disabled:text-brand-primary/70"
                                        title={scenariosToCompare.size === 0 ? "Selecione um ou mais cenários para usar esta função" : ""}
                                    >
                                        Expandir Cenários
                                    </button>
                                    {expandDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-brand-bg rounded-md shadow-lg z-10 border border-brand-primary overflow-hidden">
                                            <ul className="text-sm text-brand-text">
                                                <li><button onClick={() => handleSectionControl('expand', 'all')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Expandir Tudo</button></li>
                                                <li><button onClick={() => handleSectionControl('expand', 'params')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Parâmetros</button></li>
                                                <li><button onClick={() => handleSectionControl('expand', 'media')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Mídia</button></li>
                                                <li><button onClick={() => handleSectionControl('expand', 'notes')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Anotações</button></li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <div className="relative" ref={collapseDropdownRef}>
                                    <button
                                        onClick={() => setCollapseDropdownOpen(p => !p)}
                                        disabled={scenariosToCompare.size === 0}
                                        className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={scenariosToCompare.size === 0 ? "Selecione um ou mais cenários para usar esta função" : ""}
                                    >
                                        Recolher Cenários
                                    </button>
                                     {collapseDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-brand-bg rounded-md shadow-lg z-10 border border-brand-primary overflow-hidden">
                                            <ul className="text-sm text-brand-text">
                                                <li><button onClick={() => handleSectionControl('collapse', 'all')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Recolher Tudo</button></li>
                                                <li><button onClick={() => handleSectionControl('collapse', 'params')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Parâmetros</button></li>
                                                <li><button onClick={() => handleSectionControl('collapse', 'media')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Mídia</button></li>
                                                <li><button onClick={() => handleSectionControl('collapse', 'notes')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Anotações</button></li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {filteredScenarios.length > 1 && (
                            <button
                                onClick={handleSelectAll}
                                className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors text-sm"
                            >
                                Selecionar Todos
                            </button>
                        )}
                        {scenariosToCompare.size > 0 && (
                                <button
                                onClick={handleClearCompare}
                                className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                            >
                                Desmarcar Todos
                            </button>
                        )}
                    </div>

                    {/* RIGHT GROUP */}
                    <div className="flex items-center flex-wrap gap-4">
                        <button
                            onClick={handleAddNewScenario}
                            className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2 flex-shrink-0"
                        >
                            <PlusIcon />
                            Novo Cenário
                        </button>
                        
                        {scenariosToCompare.size > 0 && (
                            <button
                                onClick={() => setIsDeleteSelectionModalOpen(true)}
                                className="bg-orange-700 hover:bg-orange-800 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                                title="Excluir os cenários selecionados"
                            >
                                Excluir Seleção
                            </button>
                        )}

                        {filteredScenarios.length > 0 && (
                            <button
                                onClick={() => setIsDeleteAllModalOpen(true)}
                                className="bg-orange-700 hover:bg-orange-800 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                                title="Excluir todos os cenários visíveis"
                            >
                                Excluir Tudo
                            </button>
                        )}
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredScenarios.map(scenario => (
                    <ScenarioEditor
                        key={scenario.id}
                        scenario={scenario}
                        onUpdate={handleUpdateScenario}
                        onDelete={handleDeleteScenario}
                        onDuplicate={handleDuplicateScenario}
                        isSelectedForCompare={scenariosToCompare.has(scenario.id)}
                        onToggleCompare={toggleCompare}
                        isCollapsed={collapsedScenarios.has(scenario.id)}
                        onToggleCollapse={toggleScenarioCollapse}
                        sectionControl={sectionControl}
                    />
                ))}
            </div>

            {filteredScenarios.length === 0 && (
                <div className="text-center py-16 text-brand-text-muted">
                    <p>Nenhum cenário para este spot.</p>
                    <button
                        onClick={handleAddNewScenario}
                        className="mt-4 bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2 mx-auto"
                    >
                        <PlusIcon />
                        Clique aqui para começar
                    </button>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={isDeleteAllModalOpen}
                onClose={() => setIsDeleteAllModalOpen(false)}
                onConfirm={handleDeleteAll}
                title="Confirmar Exclusão de Cenários"
                message={
                  <>
                    Deseja realmente excluir <strong>{filteredScenarios.length}</strong> cenário(s) para este spot?
                    <br />
                    <span className="text-sm">Esta ação não pode ser desfeita.</span>
                  </>
                }
                confirmText="Sim, excluir tudo"
                cancelText="Cancelar"
            />

            <ConfirmationModal
                isOpen={isDeleteSelectionModalOpen}
                onClose={() => setIsDeleteSelectionModalOpen(false)}
                onConfirm={handleDeleteSelection}
                title="Confirmar Exclusão da Seleção"
                message={
                  <>
                    Deseja realmente excluir <strong>{scenariosToCompare.size}</strong> cenário(s) selecionado(s)?
                    <br />
                    <span className="text-sm">Esta ação não pode ser desfeita.</span>
                  </>
                }
                confirmText="Sim, excluir seleção"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default StudyView;