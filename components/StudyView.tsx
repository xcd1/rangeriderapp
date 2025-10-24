import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import type { SpotType, Scenario } from '../types';
import { SPOT_TYPES } from '../constants';
import ScenarioEditor from './ScenarioEditor';
import ComparisonView from './ComparisonView';

const StudyView: React.FC = () => {
    const context = useContext(AppContext);
    const [activeSpot, setActiveSpot] = useState<SpotType | null>(null);
    const [scenariosToCompare, setScenariosToCompare] = useState<Set<string>>(new Set());
    const [isComparing, setIsComparing] = useState(false);
    const [collapsedScenarios, setCollapsedScenarios] = useState<Set<string>>(new Set());


    if (!context) return null;
    const { 
        notebooks, 
        activeNotebookId, 
        searchTerm, 
        setSearchTerm, 
        addScenario, 
        updateScenario, 
        deleteScenario 
    } = context;

    const activeNotebook = useMemo(() => {
        return notebooks.find(n => n.id === activeNotebookId);
    }, [notebooks, activeNotebookId]);

    const searchedScenarios = useMemo(() => {
        if (!activeNotebook || !searchTerm.trim()) {
            return [];
        }

        const lowercasedQuery = searchTerm.toLowerCase();

        return (activeNotebook.scenarios || []).filter(scenario => {
            const searchableFields = [
                scenario.spotType,
                scenario.rangeAction,
                scenario.raiserPos,
                scenario.heroPos,
                scenario.gameScenario,
                scenario.notes,
                scenario.raiseSmallText,
                scenario.raiseBigText,
                scenario.callText,
            ].filter(Boolean) as string[];

            return searchableFields.some(field =>
                field.toLowerCase().includes(lowercasedQuery)
            );
        });
    }, [searchTerm, activeNotebook]);
    
    const filteredScenarios = activeNotebook?.scenarios?.filter(s => s.spotType === activeSpot) || [];

    const handleAddScenario = () => {
        if (!activeNotebook || !activeSpot) return;
        const newScenario: Scenario = {
            id: crypto.randomUUID(),
            spotType: activeSpot,
            rangeAction: null,
            raiserPos: null,
            heroPos: null,
            gameScenario: null,
            rangeImage: null,
            frequenciesImage: null,
            raiseSmallText: '',
            raiseBigText: '',
            callText: '',
            notes: '',
        };
        addScenario(activeNotebook.id, newScenario);
    };

    const handleUpdateScenario = (updatedScenario: Scenario) => {
        if (!activeNotebook) return;
        updateScenario(activeNotebook.id, updatedScenario);
    };
    
    const handleDeleteScenario = (scenarioId: string) => {
        if (!activeNotebook) return;
        deleteScenario(activeNotebook.id, scenarioId);
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

    const handleGoToScenario = (scenario: Scenario) => {
        setSearchTerm('');
        setActiveSpot(scenario.spotType);
    };

    const scenariosForComparisonView = activeNotebook?.scenarios?.filter(s => scenariosToCompare.has(s.id)) || [];

    if (!activeNotebook) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>Selecione ou crie um caderno para começar.</p>
            </div>
        );
    }

    if (searchTerm.trim()) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-white mb-6">Resultados da Pesquisa: <span className="text-blue-400">"{searchTerm}"</span></h2>
                {searchedScenarios.length > 0 ? (
                    <div className="space-y-3">
                        {searchedScenarios.map(scenario => {
                             const scenarioTitle = scenario.raiserPos && scenario.heroPos && scenario.gameScenario && scenario.rangeAction
                                ? `${scenario.rangeAction}: ${scenario.heroPos} vs ${scenario.raiserPos} [${scenario.gameScenario}]`
                                : "Cenário Incompleto";
                            return (
                                <div key={scenario.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex justify-between items-center hover:border-blue-500 transition-colors">
                                    <div>
                                        <p className="font-semibold text-white">{scenarioTitle}</p>
                                        <p className="text-sm text-gray-400">{scenario.spotType}</p>
                                    </div>
                                    <button onClick={() => handleGoToScenario(scenario)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition-colors">
                                        Ver Cenário
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-gray-400">Nenhum cenário encontrado para "{searchTerm}".</p>
                )}
            </div>
        )
    }
    
    if (isComparing) {
        return <ComparisonView scenarios={scenariosForComparisonView} onBack={() => setIsComparing(false)} />;
    }

    if (!activeSpot) {
        return (
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-6 text-white">{activeNotebook.name}</h2>
                <p className="text-lg text-gray-400 mb-8">Selecione o tipo de spot a ser estudado:</p>
                <div className="flex justify-center gap-6">
                    {SPOT_TYPES.map(spot => (
                        <button
                            key={spot}
                            onClick={() => setActiveSpot(spot)}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105"
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
            <div className="mb-4">
                <button onClick={() => setActiveSpot(null)} className="text-sm text-blue-400 hover:underline mb-2 inline-block">&larr; Voltar para Spots</button>
                <h2 className="text-3xl font-bold text-white">{activeNotebook.name} / {activeSpot}</h2>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={handleAddScenario}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center"
                >
                    Adicionar Novo Cenário
                </button>
                <button
                    onClick={() => setIsComparing(true)}
                    disabled={scenariosToCompare.size < 2}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                    Comparar ({scenariosToCompare.size})
                </button>
                {filteredScenarios.length > 1 && (
                    <>
                        <button
                            onClick={handleCollapseAll}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            Recolher todos
                        </button>
                        <button
                            onClick={handleExpandAll}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            Expandir todos
                        </button>
                    </>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredScenarios.map(scenario => (
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
        </div>
    );
};

export default StudyView;