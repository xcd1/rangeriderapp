

import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext, useHistory } from '../App';
import type { SpotType, Scenario } from '../types';
import { SPOT_TYPES } from '../constants';
import ScenarioEditor from './ScenarioEditor';
import ComparisonView from './ComparisonView';
import ConfirmationModal from './ConfirmationModal';

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const StudyView: React.FC = () => {
    const context = useContext(AppContext);
    const { pushToHistory } = useHistory();
    const [activeSpot, setActiveSpot] = useState<SpotType | null>(null);
    const [scenariosToCompare, setScenariosToCompare] = useState<Set<string>>(new Set());
    const [isComparing, setIsComparing] = useState(false);
    const [collapsedScenarios, setCollapsedScenarios] = useState<Set<string>>(new Set());
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [isDeleteSelectionModalOpen, setIsDeleteSelectionModalOpen] = useState(false);


    if (!context) return null;
    const { 
        notebooks, 
        activeNotebookId, 
        setActiveNotebookId,
        addScenario, 
        updateScenario, 
        deleteScenario,
        addMultipleScenarios,
        deleteMultipleScenarios
    } = context;

    const activeNotebook = useMemo(() => {
        return notebooks.find(n => n.id === activeNotebookId);
    }, [notebooks, activeNotebookId]);
    
    // Quando o caderno ativo muda, volta para a tela de seleção de spots
    const [previousNotebookId, setPreviousNotebookId] = useState(activeNotebookId);
    useEffect(() => {
        if(activeNotebookId !== previousNotebookId) {
            setActiveSpot(null);
            setPreviousNotebookId(activeNotebookId);
        }
    }, [activeNotebookId, previousNotebookId]);

    const filteredScenarios = useMemo(() => {
        if (!activeNotebook) return [];
        
        return activeNotebook.scenarios
            .filter(s => s.spotType === activeSpot)
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
            gameScenario: null,
            rangeImage: null,
            frequenciesImage: null,
            raiseSmallText: '',
            raiseBigText: '',
            callText: '',
            notes: '',
        };
        addScenario(activeNotebook.id, newScenario);
        pushToHistory(() => deleteScenario(activeNotebook.id, newScenario.id));
    };

    const handleUpdateScenario = (updatedScenario: Scenario) => {
        if (!activeNotebook) return;
        updateScenario(activeNotebook.id, updatedScenario);
    };
    
    const handleDeleteScenario = (scenarioId: string) => {
        if (!activeNotebook) return;
        const scenarioToDelete = activeNotebook.scenarios.find(s => s.id === scenarioId);
        if (scenarioToDelete) {
            deleteScenario(activeNotebook.id, scenarioId);
            pushToHistory(() => addScenario(activeNotebook.id, scenarioToDelete));
        }
    };
    
    const handleDeleteAll = () => {
        if (!activeNotebook || filteredScenarios.length === 0) return;
        
        const scenariosToDelete = [...filteredScenarios];
        const scenarioIdsToDelete = scenariosToDelete.map(s => s.id);
        
        deleteMultipleScenarios(activeNotebook.id, scenarioIdsToDelete);
        pushToHistory(() => addMultipleScenarios(activeNotebook.id, scenariosToDelete));
        
        setIsDeleteAllModalOpen(false);
    };
    
    const handleDeleteSelection = () => {
        if (!activeNotebook || scenariosToCompare.size === 0) return;

        const scenariosToDelete = activeNotebook.scenarios.filter(s => scenariosToCompare.has(s.id));
        const scenarioIdsToDelete = Array.from(scenariosToCompare);

        deleteMultipleScenarios(activeNotebook.id, scenarioIdsToDelete);
        pushToHistory(() => addMultipleScenarios(activeNotebook.id, scenariosToDelete));

        setScenariosToCompare(new Set()); // Clear selection
        setIsDeleteSelectionModalOpen(false);
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
    
    const handleCollapseAll = () => {
        setCollapsedScenarios(new Set(filteredScenarios.map(s => s.id)));
    };
    
    const handleExpandAll = () => {
        setCollapsedScenarios(new Set());
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
        setScenariosToCompare(new Set());
    };

    if (!activeNotebook) {
        return (
            <div className="flex items-center justify-center h-full text-brand-text-muted">
                <p>Selecione ou crie um caderno para começar.</p>
            </div>
        );
    }
    
    if (isComparing) {
        return <ComparisonView scenarios={scenariosForComparisonView} onBack={() => setIsComparing(false)} spotType={activeSpot} />;
    }

    if (!activeSpot) {
        return (
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-6 text-brand-text">{activeNotebook.name}</h2>
                <p className="text-lg text-brand-text-muted mb-8">Selecione o tipo de spot a ser estudado:</p>
                <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                    {SPOT_TYPES.map(spot => (
                        <button
                            key={spot}
                            onClick={() => handleSelectSpot(spot)}
                            className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-bold py-8 px-4 rounded-lg text-xl transition-transform transform hover:scale-105 flex items-center justify-center"
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
                    <button onClick={() => { setActiveSpot(null); setScenariosToCompare(new Set()); }} className="text-sm font-bold text-brand-secondary hover:underline mb-2 inline-block">&larr; Voltar para Spots</button>
                    <h2 className="text-2xl font-bold text-brand-text">{activeNotebook.name} / {activeSpot}</h2>
                </div>
            </div>
            
            {filteredScenarios.length > 0 && (
                <div className="flex items-center flex-wrap gap-4 mb-6 border-y border-brand-primary py-3">
                    <button
                        onClick={() => setIsComparing(true)}
                        disabled={scenariosToCompare.size < 2}
                        className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors disabled:bg-brand-secondary/50 disabled:cursor-not-allowed disabled:text-brand-primary/70"
                    >
                        Comparar ({scenariosToCompare.size})
                    </button>
                    {filteredScenarios.length > 1 && (
                        <button
                            onClick={handleSelectAll}
                            className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            Selecionar todos
                        </button>
                    )}
                    {scenariosToCompare.size > 0 && (
                            <button
                            onClick={handleClearCompare}
                            className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            Desmarcar todos
                        </button>
                    )}
                    
                    {scenariosToCompare.size > 0 && (
                        <button
                            onClick={() => setIsDeleteSelectionModalOpen(true)}
                            className="bg-red-800 hover:bg-red-900 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                            title="Excluir os cenários selecionados"
                        >
                            Excluir Seleção
                        </button>
                    )}

                    {filteredScenarios.length > 0 && (
                        <button
                            onClick={() => setIsDeleteAllModalOpen(true)}
                            className="bg-red-800 hover:bg-red-900 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                            title="Excluir todos os cenários visíveis"
                        >
                            Excluir tudo
                        </button>
                    )}
                    
                    <div className="ml-auto flex items-center gap-4">
                        {filteredScenarios.length > 1 && (
                            <>
                                <button
                                    onClick={handleCollapseAll}
                                    className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                                >
                                    Recolher todos
                                </button>
                                <button
                                    onClick={handleExpandAll}
                                    className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                                >
                                    Expandir todos
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleAddNewScenario}
                            className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors flex items-center gap-2"
                        >
                            <PlusIcon />
                            Novo Cenário
                        </button>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredScenarios
                 .map(scenario => (
                    <ScenarioEditor
                        key={scenario.id}
                        scenario={scenario}
                        onUpdate={handleUpdateScenario}
                        onDelete={handleDeleteScenario}
                        isSelectedForCompare={scenariosToCompare.has(scenario.id)}
                        onToggleCompare={toggleCompare}
                        isCollapsed={collapsedScenarios.has(scenario.id)}
                        onToggleCollapse={toggleScenarioCollapse}
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