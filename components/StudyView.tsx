import React, { useContext, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AppContext, useHistory } from '../App';
import type { SpotType, Scenario, ScenarioTemplate } from '../types';
import { SPOT_TYPES, JARGON_DEFINITIONS } from '../constants';
import ScenarioEditor from './ScenarioEditor';
import ComparisonView from './ComparisonView';
import ConfirmationModal from './ConfirmationModal';
import { useComparison } from '../contexts/ComparisonContext';
import { NotebookNotesEditor } from './NotebookNotesEditor';
import InfoTooltip from './InfoTooltip';
import TemplateModal from './TemplateModal';

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

const getInitialSplitViewState = (uid?: string, notebookId?: string) => {
    if (!uid || !notebookId) return false;
    const saved = localStorage.getItem(`notesSplitViewOpen-${uid}-${notebookId}`);
    return saved === 'true';
}


const StudyView: React.FC = () => {
    const context = useContext(AppContext);
    const { pushToHistory, undoLastAction, redoLastAction, canUndo, canRedo } = useHistory();
    const { 
        removeScenarioFromCompare: removeIntelligentCompare, 
        removeMultipleScenariosFromCompare: removeMultipleIntelligentCompare 
    } = useComparison();

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

    const [isNotesSplitViewOpen, setIsNotesSplitViewOpen] = useState(() => getInitialSplitViewState(uid, activeNotebook?.id));
    const [notesPanelWidth, setNotesPanelWidth] = useState(() => {
        const savedWidth = localStorage.getItem('notesPanelWidth');
        const width = savedWidth ? parseInt(savedWidth, 10) : 450;
        return Math.max(300, Math.min(width, 800));
    });
    const isResizingNotesPanel = useRef(false);

    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [isDeleteSelectionModalOpen, setIsDeleteSelectionModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

    // Dropdown states
    const [expandDropdownOpen, setExpandDropdownOpen] = useState(false);
    const [collapseDropdownOpen, setCollapseDropdownOpen] = useState(false);
    const [sectionControl, setSectionControl] = useState<{action: 'expand' | 'collapse', target: 'all' | 'params' | 'media' | 'notes', key: number} | null>(null);
    const expandDropdownRef = useRef<HTMLDivElement>(null);
    const collapseDropdownRef = useRef<HTMLDivElement>(null);

    const handleNotesPanelMouseMove = useCallback((e: MouseEvent) => {
        if (isResizingNotesPanel.current) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= 300 && newWidth <= 800) {
                setNotesPanelWidth(newWidth);
            }
        }
    }, []);

    const handleNotesPanelMouseUp = useCallback(() => {
        isResizingNotesPanel.current = false;
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleNotesPanelMouseMove);
        window.removeEventListener('mouseup', handleNotesPanelMouseUp);
    }, [handleNotesPanelMouseMove]);
    
    const handleNotesPanelMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizingNotesPanel.current = true;
        document.body.style.cursor = 'col-resize';
        window.addEventListener('mousemove', handleNotesPanelMouseMove);
        window.addEventListener('mouseup', handleNotesPanelMouseUp);
    }, [handleNotesPanelMouseMove, handleNotesPanelMouseUp]);

    useEffect(() => {
        localStorage.setItem('notesPanelWidth', notesPanelWidth.toString());
    }, [notesPanelWidth]);

    useEffect(() => {
        if(uid && activeNotebook?.id) {
            localStorage.setItem(`notesSplitViewOpen-${uid}-${activeNotebook.id}`, String(isNotesSplitViewOpen));
        }
    }, [isNotesSplitViewOpen, uid, activeNotebook?.id]);

    useEffect(() => {
        // When notebook changes, update the split view state from localStorage
        setIsNotesSplitViewOpen(getInitialSplitViewState(uid, activeNotebook?.id));
    }, [activeNotebook?.id, uid]);
    

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

    const [view, setView] = useState<'spots' | 'notes' | 'performance'>(() => {
        const spot = activeNotebook?.defaultSpot;
        return (spot === 'notes' || spot === 'performance') ? spot : 'spots';
    });
    const [activeSpot, setActiveSpot] = useState<SpotType | null>(() => {
        const spot = activeNotebook?.defaultSpot;
        if (spot && spot !== 'notes' && spot !== 'performance') {
            return spot as SpotType;
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
    
    const contentIndicators = useMemo(() => {
        if (!activeNotebook) {
            return {
                spots: new Set<SpotType>(),
                hasNotes: false,
            };
        }
        // A simple check for content in notes, stripping basic HTML tags.
        const hasNotesContent = !!(activeNotebook.notes && activeNotebook.notes.replace(/<[^>]*>?/gm, '').trim());

        return {
            spots: new Set(activeNotebook.scenarios.map(s => s.spotType)),
            hasNotes: hasNotesContent,
        };
    }, [activeNotebook]);
    
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

    const isNotebookEmpty = activeNotebook ? activeNotebook.scenarios.length === 0 : true;

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
            evImage: null,
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
            evImage: null,
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

// FIX: Explicitly specify the generic type for new Set() to resolve a TypeScript type inference error where an empty set was being typed as Set<unknown>. This was causing Array.from to produce unknown[], leading to type errors in downstream functions.
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

    const scenariosForComparisonView = useMemo(() => {
        if (!activeNotebook) return [];
        // Create a map for efficient lookup.
        const scenarioMap = new Map(activeNotebook.scenarios.map(s => [s.id, s]));
        // Array.from(Set) preserves insertion order. Map over it to get scenarios in selection order.
        return Array.from(scenariosToCompare)
            .map(id => scenarioMap.get(id))
            .filter((s): s is Scenario => !!s);
    }, [activeNotebook, scenariosToCompare]);
    
    const handleSelectSpot = (spot: SpotType) => {
        if (activeNotebook) {
            updateNotebook(activeNotebook.id, { defaultSpot: spot });
        }
        setActiveSpot(spot);
// FIX: Explicitly specify the generic type for new Set() to resolve a TypeScript type inference error.
        setScenariosToCompare(new Set<string>());
    };

    const handleSelectAnalysisTool = (spot: SpotType) => {
        if (activeNotebook) {
            updateNotebook(activeNotebook.id, { defaultSpot: spot });
        }
        setActiveSpot(spot);
        setView('spots');
// FIX: Explicitly specify the generic type for new Set() to resolve a TypeScript type inference error.
        setScenariosToCompare(new Set<string>());
    };

    const handleSelectNotesView = () => {
        if (activeNotebook) {
            updateNotebook(activeNotebook.id, { defaultSpot: 'notes' });
        }
        setView('notes');
    };

    const handleSelectPerformanceView = () => {
        if (activeNotebook) {
            updateNotebook(activeNotebook.id, { defaultSpot: 'performance' });
        }
        setView('performance');
    };
    
    const handleBackToSpots = () => {
        if (activeSpot === 'Stats Analysis') {
            setActiveSpot(null);
            handleSelectPerformanceView();
        } else {
             if (activeNotebook) {
                updateNotebook(activeNotebook.id, { defaultSpot: null });
            }
            setActiveSpot(null);
            setView('spots');
        }
       
// FIX: Explicitly specify the generic type for new Set() to resolve a TypeScript type inference error.
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
        return <ComparisonView 
            scenarios={scenariosForComparisonView} 
            onBack={handleBackFromComparison} 
            comparisonKey={activeNotebook.id}
        />;
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

    if (view === 'performance') {
        return (
            <div>
                <div className="sticky top-0 z-10 bg-brand-bg pb-4">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                             <button onClick={handleBackToSpots} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center gap-2 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                               Voltar
                            </button>
                            <h2 className="text-2xl font-bold text-brand-text">{activeNotebook.name} / Performance Analysis</h2>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-6 mt-8">
                     <button onClick={() => handleSelectAnalysisTool('Stats Analysis')} className="group relative bg-brand-primary hover:bg-brand-bg text-brand-text font-bold py-6 px-4 rounded-lg text-xl transition-all transform hover:-translate-y-1 shadow-lg w-72 text-center">
                        Stats Analysis
                    </button>
                    <button className="group relative bg-brand-primary hover:bg-brand-bg text-brand-text font-bold py-6 px-4 rounded-lg text-xl transition-all transform hover:-translate-y-1 shadow-lg w-72 text-center">
                        Leak Finder
                    </button>
                    <button className="group relative bg-brand-primary hover:bg-brand-bg text-brand-text font-bold py-6 px-4 rounded-lg text-xl transition-all transform hover:-translate-y-1 shadow-lg w-72 text-center">
                        SharkScope
                    </button>
                    <button className="group relative bg-brand-primary hover:bg-brand-bg text-brand-text font-bold py-6 px-4 rounded-lg text-xl transition-all transform hover:-translate-y-1 shadow-lg w-72 text-center">
                        Report
                    </button>
                </div>
            </div>
        );
    }

    if (!activeSpot) {
        return (
            <div className="text-center flex flex-col items-center justify-start h-full pt-8">
                <h2 className="text-3xl font-bold mb-2 text-brand-text">{activeNotebook.name}</h2>
                <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="mb-8 bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-secondary font-bold py-5 px-5 rounded-lg text-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1h-1V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1H5V4zM5 7v10a2 2 0 002 2h6a2 2 0 002-2V7H5zm4 3a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" /></svg>
                    Criar a partir de um Modelo
                </button>
        
                <div className="w-full max-w-4xl mx-auto mb-12">
                    <div className="flex items-center justify-center mb-6">
                        <p className="text-lg text-brand-text-muted mr-2">What do you wanna master?</p>
                        <InfoTooltip text="Spots são situações de poker comuns. Escolha uma categoria para começar a adicionar seus cenários de estudo." />
                    </div>
                    <div className="flex justify-center gap-8">
                        {['Rfi', 'Facing 2bet', 'Blind War'].map(spot => {
                            const hasContent = contentIndicators.spots.has(spot as SpotType);
                            return (
                                <button key={spot} onClick={() => handleSelectSpot(spot as SpotType)} className={`group relative ${hasContent ? 'bg-brand-secondary text-brand-primary hover:brightness-110' : 'bg-brand-primary hover:bg-brand-bg text-brand-text'} font-bold py-6 px-4 rounded-lg text-xl transition-all transform hover:-translate-y-1 shadow-lg w-52`}>
                                    {spot}
                                    <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 text-sm font-normal text-brand-text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal bg-brand-primary border border-brand-bg p-3 rounded shadow-lg z-20">
                                      {JARGON_DEFINITIONS[spot]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
        
                <div className="w-full max-w-4xl mx-auto mb-12">
                    <p className="text-lg text-brand-text-muted mb-6">GTO Factory</p>
                    <div className="flex justify-center gap-8">
                         {(() => {
                            const hasContent = contentIndicators.spots.has('HRC Enviroment');
                            return (
                                <button key={'HRC Enviroment'} onClick={() => handleSelectSpot('HRC Enviroment')} className={`group relative ${hasContent ? 'bg-brand-secondary text-brand-primary hover:brightness-110' : 'bg-brand-primary hover:bg-brand-bg text-brand-text'} font-bold py-6 px-4 rounded-lg text-xl transition-all transform hover:-translate-y-1 shadow-lg w-52`}>
                                    GTO Mastered
                                    <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 text-sm font-normal text-brand-text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal bg-brand-primary border border-brand-bg p-3 rounded shadow-lg z-20">
                                      {JARGON_DEFINITIONS['HRC Enviroment']}
                                    </span>
                                </button>
                            );
                         })()}
                    </div>
                </div>

                <div className="w-full max-w-4xl mx-auto mb-12">
                    <p className="text-lg text-brand-text-muted mb-6">Performance</p>
                    <div className="flex justify-center">
                        {(() => {
                            const hasContent = contentIndicators.spots.has('Stats Analysis');
                            return (
                                <button onClick={handleSelectPerformanceView} className={`${hasContent ? 'bg-brand-secondary text-brand-primary hover:brightness-110' : 'bg-brand-primary hover:bg-brand-bg text-brand-text'} font-bold py-8 px-4 rounded-lg text-xl transition-all transform hover:-translate-y-1 shadow-lg w-52`}>
                                    Performance Analysis
                                </button>
                            );
                        })()}
                    </div>
                </div>
                
                <div className="w-full max-w-4xl mx-auto">
                    <p className="text-lg text-brand-text-muted mb-6">Notes Section</p>
                    <div className="flex justify-center">
                         {(() => {
                            const hasContent = contentIndicators.hasNotes;
                            return (
                                <button onClick={handleSelectNotesView} className={`${hasContent ? 'bg-brand-secondary text-brand-primary hover:brightness-110' : 'bg-brand-primary hover:bg-brand-bg text-brand-text'} font-bold py-8 px-4 rounded-lg text-xl transition-all transform hover:-translate-y-1 shadow-lg w-52`}>
                                    Notes
                                </button>
                            );
                        })()}
                    </div>
                </div>
                <TemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} onSelect={handleCreateScenarioFromTemplate} />
            </div>
        );
    }

    const emptySpotMessages = {
        'Stats Analysis': {
            title: isNotebookEmpty ? 'Crie sua primeira análise de stats com o range rider' : 'Sem análises.',
            subtitle: isNotebookEmpty ? '' : 'Adicione sua primeira análise para começar a estudar.',
            button: 'Nova Análise'
        },
        default: {
            title: isNotebookEmpty ? 'Crie seu primeiro estudo com o range rider' : 'Este spot está vazio.',
            subtitle: isNotebookEmpty ? '' : 'Adicione seu primeiro cenário para começar a estudar.',
            button: isNotebookEmpty ? 'Adicionar Novo Estudo' : 'Adicionar Novo Cenário'
        }
    };
    const emptyMessages = (activeSpot && SPOT_TYPES.includes(activeSpot) && activeSpot === 'Stats Analysis')
        ? emptySpotMessages['Stats Analysis']
        : emptySpotMessages.default;
    
    const gridLayoutClass = activeSpot === 'Stats Analysis'
        ? "grid-cols-1"
        : "grid-cols-1 md:grid-cols-2";

    const displaySpot = activeSpot === 'HRC Enviroment' ? 'GTO Mastered' : activeSpot;

    // --- MAIN VIEW (WITH SCENARIOS) ---
    return (
        <div className="flex h-full min-h-0">
            <div className="flex-1 flex flex-col min-w-0 pr-6">
                <div className="sticky top-0 z-10 bg-brand-bg pb-4">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <button onClick={handleBackToSpots} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center gap-2 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                               Voltar
                            </button>
                            <h2 className="text-2xl font-bold text-brand-text">{activeNotebook.name} / {displaySpot}</h2>
                        </div>
                    </div>
                    
                    {/* --- CONTROL BAR --- */}
                    <div className="flex justify-between items-center flex-wrap gap-4 border-y border-brand-primary py-3">
                        {/* LEFT GROUP */}
                        <div className="flex items-center flex-wrap gap-4">
                            {!isNotebookEmpty && (
                                <button
                                    onClick={handleAddNewScenario}
                                    className="bg-white hover:bg-gray-200 text-brand-primary font-bold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                    {activeSpot === 'Stats Analysis' ? 'Nova Análise' : 'Novo Cenário'}
                                </button>
                            )}
                            
                            {(activeSpot === 'Stats Analysis' && filteredScenarios.length > 1) && (
                                <button onClick={handleSelectAll} className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors text-sm">
                                    Selecionar Todas
                                </button>
                            )}
                            
                            {(activeSpot !== 'Stats Analysis' && filteredScenarios.length > 1 && scenariosToCompare.size === 0) && (
                                <button onClick={handleSelectAll} className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors text-sm">
                                    Selecionar Todos
                                </button>
                            )}

                            {/* --- Progressive Disclosure: Buttons shown only when items are selected --- */}
                            {scenariosToCompare.size > 0 && (
                                <>
                                    <button
                                        onClick={handleStartComparison}
                                        disabled={scenariosToCompare.size < 2}
                                        className="bg-white hover:bg-gray-200 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-brand-primary/70 flex items-center justify-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2-2H4a2 2 0 01-2-2V5zm14 0H4v10h12V5zM6 7a1 1 0 00-1 1v5a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v5a1 1 0 102 0V8a1 1 0 00-1-1z" /></svg>
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
                                                    <li><button onClick={() => handleSectionControl('expand', 'params')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Spot Informations</button></li>
                                                    <li><button onClick={() => handleSectionControl('expand', 'media')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Imagem/Dados</button></li>
                                                    <li><button onClick={() => handleSectionControl('expand', 'notes')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Notes</button></li>
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
                                                    <li><button onClick={() => handleSectionControl('collapse', 'params')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Spot Informations</button></li>
                                                    <li><button onClick={() => handleSectionControl('collapse', 'media')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Imagem/Dados</button></li>
                                                    <li><button onClick={() => handleSectionControl('collapse', 'notes')} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Notes</button></li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={handleClearCompare} className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                                        Desmarcar Todos
                                    </button>
                                    <button onClick={() => setIsDeleteSelectionModalOpen(true)} className="bg-orange-700 hover:bg-orange-800 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                        Excluir Seleção
                                    </button>
                                </>
                            )}
                        </div>

                        {/* RIGHT GROUP */}
                        <div className="flex items-center flex-wrap gap-4">
                            <button
                                onClick={() => setIsNotesSplitViewOpen(prev => !prev)}
                                className={`${isNotesSplitViewOpen ? 'bg-brand-secondary text-brand-primary' : 'bg-brand-primary hover:bg-brand-primary/80 text-brand-text'} font-semibold py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center gap-2`}
                                title="Abrir/Fechar painel de anotações"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M4 3a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V3z" /></svg>
                                iNotes
                            </button>

                            {filteredScenarios.length > 0 && (
                                <>
                                    <button onClick={undoLastAction} disabled={!canUndo} className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" title="Desfazer (Ctrl+Z)">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                                        Desfazer
                                    </button>
                                    <button onClick={redoLastAction} disabled={!canRedo} className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" title="Refazer (Ctrl+Y)">
                                        Refazer
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                    <button onClick={() => setIsDeleteAllModalOpen(true)} className="bg-orange-700 hover:bg-orange-800 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center gap-2" title="Excluir todos os cenários neste spot">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                        Excluir Tudo
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                    <div className={`grid ${gridLayoutClass} gap-8`}>
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
                            <h3 className="text-xl font-semibold text-brand-text mb-4">{emptyMessages.title}</h3>
                            {emptyMessages.subtitle && <p className="mb-6">{emptyMessages.subtitle}</p>}
                            <button
                                onClick={handleAddNewScenario}
                                className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto text-lg transform hover:scale-105"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                {emptyMessages.button}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isNotesSplitViewOpen && (
                <>
                    <div 
                        onMouseDown={handleNotesPanelMouseDown}
                        className="w-1.5 cursor-col-resize bg-brand-primary hover:bg-brand-secondary transition-colors duration-200 flex-shrink-0"
                        title="Arraste para redimensionar"
                    />
                    <div style={{ width: `${notesPanelWidth}px` }} className="flex-shrink-0 h-full">
                        <NotebookNotesEditor
                            notebookId={activeNotebook.id}
                            initialContent={activeNotebook.notes || ''}
                            onSave={handleSaveNotes}
                            isSplitViewMode={true}
                        />
                    </div>
                </>
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