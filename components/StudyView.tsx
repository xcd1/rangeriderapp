import React, { useContext, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AppContext, useHistory } from '../App';
import type { SpotType, Scenario, ScenarioTemplate } from '../types';
import { SPOT_TYPES, JARGON_DEFINITIONS } from '../constants';
import ScenarioEditor from './ScenarioEditor';
import ComparisonView from './ComparisonView';
import ConfirmationModal from './ConfirmationModal';
import { useComparison } from '../contexts/ComparisonContext';
import NotebookNotesEditor from './NotebookNotesEditor';
import InfoTooltip from './InfoTooltip';
import TemplateModal from './TemplateModal';

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const TemplateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
);


type ComparisonStateObject = { scenarioIds: string[]; fromSpot: SpotType | null; isComparing: boolean };
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

const setComparisonState = (uid: string, notebookId: string, scenarioIds: string[], fromSpot: SpotType | null, isComparing?: boolean) => {
    if (!uid) return;
    try {
        const state = getComparisonState(uid);
        if (scenarioIds.length > 0) {
            const currentlyComparing = state[notebookId]?.isComparing ?? false;
            state[notebookId] = { scenarioIds, fromSpot, isComparing: isComparing ?? currentlyComparing };
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
    const { pushToHistory, undoLastAction, redoLastAction, canUndo, canRedo } = useHistory();
    const { 
        removeScenarioFromCompare: removeIntelligentCompare, 
        removeMultipleScenariosFromCompare: removeMultipleIntelligentCompare 
    } = useComparison();

    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [isDeleteSelectionModalOpen, setIsDeleteSelectionModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

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
        deleteMultipleScenarios,
        updateNotebook
    } = context;

    const uid = user?.uid;

    const activeNotebook = useMemo(() => {
        return notebooks.find(n => n.id === activeNotebookId);
    }, [notebooks, activeNotebookId]);

    const initialComparisonState = useMemo(() => {
        if (activeNotebook && uid) {
            const comparisonStates = getComparisonState(uid);
            const savedComparison = comparisonStates[activeNotebook.id];
            if (savedComparison && savedComparison.scenarioIds.length > 0) {
                return {
                    isComparing: savedComparison.isComparing,
                    scenariosToCompare: new Set<string>(savedComparison.scenarioIds),
                };
            }
        }
        return { isComparing: false, scenariosToCompare: new Set<string>() };
    }, [activeNotebook, uid]);

    const [isComparing, setIsComparing] = useState<boolean>(initialComparisonState.isComparing);
    const [scenariosToCompare, setScenariosToCompare] = useState<Set<string>>(initialComparisonState.scenariosToCompare);

    const [view, setView] = useState<'spots' | 'notes'>(() => activeNotebook?.defaultSpot === 'notes' ? 'notes' : 'spots');
    const [activeSpot, setActiveSpot] = useState<SpotType | null>(() => {
        if (activeNotebook?.defaultSpot && activeNotebook.defaultSpot !== 'notes') {
            return activeNotebook.defaultSpot as SpotType;
        }
        return null;
    });
    
    const initialCollapsedState = useMemo(() => {
        if (activeNotebook && uid && activeSpot) {
             try {
                const key = `collapsedScenarios-${uid}-${activeNotebook.id}-${activeSpot}`;
                const saved = localStorage.getItem(key);
                return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
            } catch (e) {
                console.error("Failed to load collapsed scenarios:", e);
                return new Set<string>();
            }
        }
        return new Set<string>();
    }, [activeNotebook, uid, activeSpot]);

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

    const handleCreateScenarioFromTemplate = (template: ScenarioTemplate) => {
        if (!activeNotebook) return;
        const newScenario: Scenario = {
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            spotType: template.spotType,
            rangeAction: template.rangeAction,
            raiserPos: template.raiserPos ?? null,
            heroPos: template.heroPos ?? null,
            blindWarPosition: template.blindWarPosition ?? null,
            blindWarAction: template.blindWarAction ?? null,
            coldCallerPos: null,
            aggressorPos: null,
            gameScenario: null,
            manualTitle: null,
            printSpotImage: null,
            rpImage: null,
            tableViewImage: null,
            plusInfoImage: null,
            rangeImage: null,
            frequenciesImage: null,
            raiseSmallText: '',
            raiseBigText: '',
            callText: '',
            notes: '',
        };
        addScenario(activeNotebook.id, newScenario);
        pushToHistory({
            undo: () => deleteScenario(activeNotebook.id, newScenario.id),
            redo: () => addScenario(activeNotebook.id, newScenario)
        });
        
        // Directly navigate to the spot of the created template
        setActiveSpot(template.spotType);
        setIsTemplateModalOpen(false);
    };

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
        pushToHistory({
          undo: () => deleteScenario(activeNotebook.id, newScenario.id),
          redo: () => addScenario(activeNotebook.id, newScenario),
        });
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
            pushToHistory({
                undo: () => addScenario(activeNotebook.id, scenarioToDelete),
                redo: () => deleteScenario(activeNotebook.id, scenarioId),
            });
            // Update quick compare
            // FIX: Explicitly type the `prev` parameter in the state setter to prevent type pollution.
            // Untyped `prev` can be inferred as `unknown`, causing downstream type errors.
            setScenariosToCompare((prev: Set<string>) => {
                const newSet = new Set(prev);
                newSet.delete(scenarioId);
                return newSet;
            });
            // Update intelligent compare
            removeIntelligentCompare(scenarioId);
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
        pushToHistory({
            undo: () => deleteScenario(activeNotebook.id, duplicatedScenario.id),
            redo: () => addScenario(activeNotebook.id, duplicatedScenario)
        });
    };
    
    const handleDeleteAll = () => {
        if (!activeNotebook || filteredScenarios.length === 0 || !uid) return;
        
        const scenariosToDelete = [...filteredScenarios];
        const scenarioIdsToDelete = scenariosToDelete.map(s => s.id);
        
        deleteMultipleScenarios(activeNotebook.id, scenarioIdsToDelete);
        pushToHistory({
            undo: () => addMultipleScenarios(activeNotebook.id, scenariosToDelete),
            redo: () => deleteMultipleScenarios(activeNotebook.id, scenarioIdsToDelete)
        });
        
        // Update intelligent compare
        removeMultipleIntelligentCompare(scenarioIdsToDelete);
        
        setActiveSpot(null); // Go back to spot selection
        setIsDeleteAllModalOpen(false);
    };
    
    const handleDeleteSelection = () => {
        if (!activeNotebook || scenariosToCompare.size === 0 || !uid) return;

        const scenariosToDelete = activeNotebook.scenarios.filter(s => scenariosToCompare.has(s.id));
        const scenarioIdsToDelete = Array.from(scenariosToCompare);

        deleteMultipleScenarios(activeNotebook.id, scenarioIdsToDelete);
        pushToHistory({
            undo: () => addMultipleScenarios(activeNotebook.id, scenariosToDelete),
            redo: () => deleteMultipleScenarios(activeNotebook.id, scenarioIdsToDelete)
        });

        // Update intelligent compare
        removeMultipleIntelligentCompare(scenarioIdsToDelete);

        // FIX: Explicitly type new Set() to avoid type pollution that causes downstream errors.
        setScenariosToCompare(new Set<string>());
        setIsDeleteSelectionModalOpen(false);

        const remainingScenarios = filteredScenarios.filter(s => !scenarioIdsToDelete.includes(s.id));
        if (remainingScenarios.length === 0) {
            setActiveSpot(null); // Go back to spot selection
        }
    };

    const toggleCompare = (scenarioId: string) => {
        // FIX: Explicitly type `prev` to avoid it being inferred as `unknown` in some TypeScript configurations, which was causing type pollution.
        setScenariosToCompare((prev: Set<string>) => {
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
        // FIX: Explicitly type `prev` to avoid it being inferred as `unknown` in some TypeScript configurations.
        setCollapsedScenarios((prev: Set<string>) => {
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
        // FIX: Explicitly specify the type for the new Set to avoid type inference issues.
        setScenariosToCompare(new Set<string>());
        if (activeNotebookId && uid) {
            setComparisonState(uid, activeNotebookId, [], null);
        }
    };

    const handleSelectAll = () => {
        const allScenarioIds = new Set(filteredScenarios.map(s => s.id));
        setScenariosToCompare(allScenarioIds);
    };

    const scenariosForComparisonView = activeNotebook?.scenarios?.filter(s => scenariosToCompare.has(s.id)) || [];
    
    const handleSelectSpot = (spot: SpotType) => {
        if (activeNotebook) {
            updateNotebook(activeNotebook.id, { defaultSpot: spot });
        }
        setActiveSpot(spot);
        setScenariosToCompare(new Set<string>());
    };

    const handleSelectNotesView = () => {
        if (activeNotebook) {
            updateNotebook(activeNotebook.id, { defaultSpot: 'notes' });
        }
        setView('notes');
    };
    
    const handleBackToSpots = () => {
        if (activeNotebook) {
            updateNotebook(activeNotebook.id, { defaultSpot: null });
        }
        setActiveSpot(null);
        setView('spots');
        setScenariosToCompare(new Set<string>());
        if (activeNotebookId && uid) {
            setComparisonState(uid, activeNotebookId, [], null);
        }
    };

    const handleStartComparison = () => {
        if (activeNotebookId && uid && scenariosToCompare.size >= 2) {
            setComparisonState(uid, activeNotebookId, Array.from(scenariosToCompare), activeSpot, true);
            setIsComparing(true);
        }
    };

    const handleBackFromComparison = () => {
        setIsComparing(false);
        if (activeNotebookId && uid) {
            const comparisonStates = getComparisonState(uid);
            const savedComparison = comparisonStates[activeNotebookId];
            
            if (savedComparison) {
                // Persist the selection but mark as not comparing
                setComparisonState(
                    uid,
                    activeNotebookId,
                    savedComparison.scenarioIds,
                    savedComparison.fromSpot,
                    false
                );
                // Restore the spot to return to the scenario list
                if (savedComparison.fromSpot) {
                    setActiveSpot(savedComparison.fromSpot);
                } else {
                    setActiveSpot(null);
                    setView('spots');
                }
            } else {
                 // Fallback
                setActiveSpot(null);
                setView('spots');
            }
        }
    };
    
    const handleSaveNotes = useCallback(async (notebookId: string, updates: { notes: string }) => {
        if (!context) return;
        await context.updateNotebook(notebookId, updates);
    }, [context]);

    if (!activeNotebook) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-brand-text-muted">
                <h2 className="text-3xl font-bold text-brand-text mb-2">Bem-vindo ao Range Rider!</h2>
                <p className="text-lg mb-6">Para começar, crie ou selecione um caderno na barra lateral.</p>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce-horizontal"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                 <style>{`
                    @keyframes bounce-horizontal {
                        0%, 100% { transform: translateX(0); }
                        50% { transform: translateX(-15px); }
                    }
                    .animate-bounce-horizontal { animation: bounce-horizontal 2s infinite; }
                `}</style>
            </div>
        );
    }

    if (isComparing) {
        return <ComparisonView scenarios={scenariosForComparisonView} onBack={handleBackFromComparison} />;
    }

    if (view === 'notes') {
        return (
            <NotebookNotesEditor
                notebookId={activeNotebook.id}
                initialContent={activeNotebook.notes || ''}
                onSave={handleSaveNotes}
                onBack={handleBackToSpots}
            />
        );
    }

    if (!activeSpot) {
        return (
            <div className="text-center flex flex-col items-center justify-start h-full pt-8">
                <h2 className="text-3xl font-bold mb-2 text-brand-text">{activeNotebook.name}</h2>
                <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="mb-8 bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-secondary font-bold py-4 px-5 rounded-lg text-lg transition-transform transform hover:scale-105 flex items-center"
                >
                    <TemplateIcon />
                    Criar a partir de um Modelo
                </button>
        
                <div className="w-full max-w-4xl mx-auto mb-10">
                    <div className="flex items-center justify-center mb-6">
                        <p className="text-lg text-brand-text-muted mr-2">What do you wanna master?</p>
                        <InfoTooltip text="Spots são situações de poker comuns. Escolha uma categoria para começar a adicionar seus cenários de estudo." />
                    </div>
                    <div className="flex justify-center gap-6">
                        {['Rfi', 'Facing 2bet', 'Blind War'].map(spot => (
                            <button key={spot} onClick={() => handleSelectSpot(spot as SpotType)} className="group relative bg-brand-primary hover:bg-brand-bg text-brand-text font-bold py-8 px-4 rounded-lg text-xl transition-all transform hover:-translate-y-1 shadow-lg w-52">
                                {spot}
                                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 text-xs font-normal text-brand-text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal bg-brand-bg px-2 py-1 rounded shadow-lg z-10">
                                  {JARGON_DEFINITIONS[spot]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
        
                <div className="w-full max-w-4xl mx-auto mb-10">
                    <p className="text-lg text-brand-text-muted mb-6">GTO Factory</p>
                    <div className="flex justify-center gap-6">
                         <button key={'HRC Enviroment'} onClick={() => handleSelectSpot('HRC Enviroment')} className="group relative bg-brand-primary hover:bg-brand-bg text-brand-text font-bold py-8 px-4 rounded-lg text-xl transition-all transform hover:-translate-y-1 shadow-lg w-52">
                            HRC Enviroment
                            <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 text-xs font-normal text-brand-text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal bg-brand-bg px-2 py-1 rounded shadow-lg z-10">
                              {JARGON_DEFINITIONS['HRC Enviroment']}
                            </span>
                        </button>
                    </div>
                </div>
                
                <div className="w-full max-w-4xl mx-auto">
                    <p className="text-lg text-brand-text-muted mb-6">Notes Section</p>
                    <div className="flex justify-center">
                        <button onClick={handleSelectNotesView} className="bg-brand-primary hover:bg-brand-bg text-brand-text font-bold py-8 px-4 rounded-lg text-xl transition-all transform hover:-translate-y-1 shadow-lg w-52">
                            Anotações
                        </button>
                    </div>
                </div>
                <TemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} onSelect={handleCreateScenarioFromTemplate} />
            </div>
        );
    }

    // --- MAIN VIEW (WITH SCENARIOS) ---
    return (
        <div>
            <div className="sticky top-0 z-10 bg-brand-bg pb-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <button onClick={handleBackToSpots} className="text-sm font-bold text-brand-secondary hover:underline mb-2 inline-block">&larr; Voltar para Spots</button>
                        <h2 className="text-2xl font-bold text-brand-text">{activeNotebook.name} / {activeSpot}</h2>
                    </div>
                </div>
                
                {/* --- CONTROL BAR --- */}
                <div className="flex justify-between items-center flex-wrap gap-4 border-y border-brand-primary py-3">
                    {/* LEFT GROUP */}
                    <div className="flex items-center flex-wrap gap-4">
                        <button
                            onClick={handleAddNewScenario}
                            className="bg-white hover:bg-gray-200 text-brand-primary font-bold py-2.5 px-4 rounded-md transition-colors flex items-center"
                        >
                            Novo Cenário
                        </button>

                        {/* --- Progressive Disclosure: Buttons shown only when items are selected --- */}
                        {scenariosToCompare.size > 0 && (
                            <>
                                <button
                                    onClick={handleStartComparison}
                                    disabled={scenariosToCompare.size < 2}
                                    className="bg-white hover:bg-gray-200 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-brand-primary/70"
                                >
                                    Comparar ({scenariosToCompare.size})
                                </button>
                                <div className="relative" ref={expandDropdownRef}>
                                    <button onClick={() => setExpandDropdownOpen(p => !p)} className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors text-sm">
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
                                    <button onClick={() => setCollapseDropdownOpen(p => !p)} className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm">
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
                                <button onClick={handleClearCompare} className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                                    Desmarcar Todos
                                </button>
                                <button onClick={() => setIsDeleteSelectionModalOpen(true)} className="bg-orange-700 hover:bg-orange-800 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                                    Excluir Seleção
                                </button>
                            </>
                        )}
                    </div>

                    {/* RIGHT GROUP */}
                    <div className="flex items-center flex-wrap gap-4">
                       {filteredScenarios.length > 1 && scenariosToCompare.size === 0 && (
                            <button onClick={handleSelectAll} className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors text-sm">
                                Selecionar Todos
                            </button>
                        )}
                        {filteredScenarios.length > 0 && (
                            <>
                                <button onClick={undoLastAction} disabled={!canUndo} className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed" title="Desfazer (Ctrl+Z)">
                                    Desfazer
                                </button>
                                <button onClick={redoLastAction} disabled={!canRedo} className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed" title="Refazer (Ctrl+Y)">
                                    Refazer
                                </button>
                                <button onClick={() => setIsDeleteAllModalOpen(true)} className="bg-orange-700 hover:bg-orange-800 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm" title="Excluir todos os cenários neste spot">
                                    Excluir Tudo
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
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
                    <h3 className="text-xl font-semibold text-brand-text mb-4">Este spot está vazio.</h3>
                    <p className="mb-6">Adicione seu primeiro cenário para começar a estudar.</p>
                    <button
                        onClick={handleAddNewScenario}
                        className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 mx-auto text-lg transform hover:scale-105"
                    >
                        <PlusIcon />
                        Adicionar Novo Cenário
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