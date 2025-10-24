import React from 'react';
import type { Scenario } from '../types';

interface ComparisonViewProps {
    scenarios: Scenario[];
    onBack: () => void;
}

// Helper function to generate the title based on scenario properties,
// matching the format in the ScenarioEditor.
const getScenarioTitle = (scenario: Scenario): string => {
    const { spotType, blindWarPosition, blindWarAction, gameScenario, rangeAction, raiserPos, heroPos } = scenario;
    const gameScenarioString = gameScenario ? ` [${gameScenario}]` : '';

    if (spotType === 'Blind War') {
        if (!blindWarPosition || !blindWarAction) return `Blind War (Incompleto)${gameScenarioString}`;
        return `Blind War: ${blindWarPosition} ${blindWarAction}${gameScenarioString}`;
    }

    // Facing 2bet
    if (rangeAction === 'RFI') {
        if (!raiserPos) return `RFI (Incompleto)${gameScenarioString}`;
        return `RFI: ${raiserPos}${gameScenarioString}`;
    }

    if (rangeAction === 'F2bet') {
        if (!raiserPos || !heroPos) return `F2bet (Incompleto)${gameScenarioString}`;
        return `F2bet: ${heroPos} vs ${raiserPos}${gameScenarioString}`;
    }

    return `Cenário Incompleto`;
};


const ComparisonView: React.FC<ComparisonViewProps> = ({ scenarios, onBack }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-brand-text">Comparação de Ranges</h2>
                <button onClick={onBack} className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors">
                    &larr; Voltar
                </button>
            </div>
            {scenarios.length < 2 ? (
                 <div className="text-center py-12 text-brand-text-muted">
                    <p>Selecione 2 ou mais cenários para comparar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {scenarios.map(scenario => {
                        const title = getScenarioTitle(scenario);
                        return (
                            <div key={scenario.id} className="bg-brand-primary rounded-lg p-4 border border-brand-bg flex flex-col gap-4">
                                <h3 className="font-bold text-center text-brand-text truncate" title={title}>
                                    {title}
                                </h3>
                                
                                <div className="bg-brand-bg aspect-[7/6] rounded flex items-center justify-center">
                                    {scenario.rangeImage ? (
                                        <img src={scenario.rangeImage} alt="Range" className="max-w-full max-h-full object-contain"/>
                                    ) : (
                                        <span className="text-gray-500 text-sm">Sem Imagem</span>
                                    )}
                                </div>
                                
                                <div className="bg-brand-bg aspect-[32/9] rounded flex items-center justify-center">
                                    {scenario.frequenciesImage ? (
                                        <img src={scenario.frequenciesImage} alt="Frequências" className="max-w-full max-h-full object-contain"/>
                                    ) : (
                                        <span className="text-gray-500 text-sm">Sem Imagem</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ComparisonView;
