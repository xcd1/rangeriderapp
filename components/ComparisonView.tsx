
import React from 'react';
import type { Scenario } from '../types';

interface ComparisonViewProps {
    scenarios: Scenario[];
    onBack: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ scenarios, onBack }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Comparação de Ranges</h2>
                <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                    &larr; Voltar
                </button>
            </div>
            {scenarios.length < 2 ? (
                 <div className="text-center py-12 text-gray-400">
                    <p>Selecione 2 ou mais cenários para comparar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {scenarios.map(scenario => (
                        <div key={scenario.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col gap-4">
                            <h3 className="font-bold text-center text-white truncate">
                                {scenario.rangeAction}: {scenario.heroPos} vs {scenario.raiserPos} [{scenario.gameScenario}]
                            </h3>
                            
                            <div>
                                <h4 className="text-sm font-semibold text-gray-400 mb-2 text-center">Range</h4>
                                <div className="bg-gray-900 aspect-square rounded flex items-center justify-center">
                                    {scenario.rangeImage ? (
                                        <img src={scenario.rangeImage} alt="Range" className="max-w-full max-h-full object-contain"/>
                                    ) : (
                                        <span className="text-gray-500 text-sm">Sem Imagem</span>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-sm font-semibold text-gray-400 mb-2 text-center">Frequências</h4>
                                <div className="bg-gray-900 aspect-video rounded flex items-center justify-center">
                                    {scenario.frequenciesImage ? (
                                        <img src={scenario.frequenciesImage} alt="Frequências" className="max-w-full max-h-full object-contain"/>
                                    ) : (
                                        <span className="text-gray-500 text-sm">Sem Imagem</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ComparisonView;
