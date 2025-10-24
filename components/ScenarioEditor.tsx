
import React from 'react';
import type { Scenario, Position, GameScenario, RangeAction } from '../types';
import { POSITIONS, GAME_SCENARIOS, RANGE_ACTIONS, POSITION_ORDER } from '../constants';
import ImageUploader from './ImageUploader';


interface ScenarioEditorProps {
    scenario: Scenario;
    onUpdate: (scenario: Scenario) => void;
    onDelete: (scenarioId: string) => void;
    isSelectedForCompare: boolean;
    onToggleCompare: (scenarioId: string) => void;
    isCollapsed: boolean;
    onToggleCollapse: (scenarioId: string) => void;
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);


const ScenarioEditor: React.FC<ScenarioEditorProps> = ({ 
    scenario, 
    onUpdate, 
    onDelete, 
    isSelectedForCompare, 
    onToggleCompare,
    isCollapsed,
    onToggleCollapse
}) => {
    
    const handleUpdate = <K extends keyof Scenario,>(key: K, value: Scenario[K]) => {
        onUpdate({ ...scenario, [key]: value });
    };

    const getHeroPositions = (raiserPos: Position | null): Position[] => {
        if (!raiserPos) return POSITIONS.filter(p => p !== 'UTG');
        const raiserIndex = POSITION_ORDER[raiserPos];
        return POSITIONS.filter(p => POSITION_ORDER[p] > raiserIndex);
    };

    const heroPositions = getHeroPositions(scenario.raiserPos);

    const scenarioTitle = scenario.raiserPos && scenario.heroPos && scenario.gameScenario && scenario.rangeAction
        ? `${scenario.rangeAction}: ${scenario.heroPos} vs ${scenario.raiserPos} [${scenario.gameScenario}]`
        : "Novo Cenário";

    return (
        <div className="bg-gray-800 rounded-lg p-1 border border-gray-700">
            <div className="bg-gray-700 rounded-t-md p-3 flex justify-between items-center cursor-pointer" onClick={() => onToggleCollapse(scenario.id)}>
                 <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={isSelectedForCompare}
                        onChange={() => onToggleCompare(scenario.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 mr-4 bg-gray-600 border-gray-500 rounded text-blue-500 focus:ring-blue-500"
                    />
                    <h3 className="font-bold text-lg text-white">{scenarioTitle}</h3>
                </div>
                <div className="flex items-center gap-4">
                     <button onClick={(e) => { e.stopPropagation(); onDelete(scenario.id); }} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-600">
                        <TrashIcon />
                    </button>
                    <button className="text-gray-300 hover:text-white">
                        {isCollapsed ? '▼' : '▲'}
                    </button>
                </div>
            </div>
            
            {!isCollapsed && (
            <div className="p-4 space-y-4">
                {/* Top Controls */}
                <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Ação do Range</label>
                        <div className="flex gap-2 flex-wrap">
                            {RANGE_ACTIONS.map(action => (
                                <button key={action} onClick={() => handleUpdate('rangeAction', action)} className={`px-3 py-1 text-sm rounded-md ${scenario.rangeAction === action ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{action}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Posição do Vilão (Raiser)</label>
                        <div className="flex gap-2 flex-wrap">
                            {POSITIONS.filter(p => p !== 'BB').map(pos => (
                                <button key={pos} onClick={() => handleUpdate('raiserPos', pos)} className={`px-3 py-1 text-sm rounded-md ${scenario.raiserPos === pos ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{pos}</button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Posição do Herói</label>
                        <div className="flex gap-2 flex-wrap">
                            {heroPositions.map(pos => (
                                <button key={pos} onClick={() => handleUpdate('heroPos', pos)} className={`px-3 py-1 text-sm rounded-md ${scenario.heroPos === pos ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{pos}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Cenário do Jogo</label>
                        <div className="flex gap-2 flex-wrap">
                            {GAME_SCENARIOS.map(gs => (
                                <button key={gs} onClick={() => handleUpdate('gameScenario', gs)} className={`px-3 py-1 text-sm rounded-md ${scenario.gameScenario === gs ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{gs}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Data Inputs */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-3 space-y-4">
                        <ImageUploader title="Range" imageData={scenario.rangeImage} onUpload={(data) => handleUpdate('rangeImage', data)} className="aspect-square" />
                        <ImageUploader title="Frequências" imageData={scenario.frequenciesImage} onUpload={(data) => handleUpdate('frequenciesImage', data)} className="aspect-[3/1]" />
                        <div className="grid grid-cols-3 gap-2">
                             <textarea value={scenario.raiseSmallText} onChange={e => handleUpdate('raiseSmallText', e.target.value)} placeholder="raise small" className="h-20 bg-gray-900 text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full resize-none"></textarea>
                             <textarea value={scenario.raiseBigText} onChange={e => handleUpdate('raiseBigText', e.target.value)} placeholder="raise big" className="h-20 bg-gray-900 text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full resize-none"></textarea>
                             <textarea value={scenario.callText} onChange={e => handleUpdate('callText', e.target.value)} placeholder="call" className="h-20 bg-gray-900 text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full resize-none"></textarea>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                         <textarea value={scenario.notes} onChange={e => handleUpdate('notes', e.target.value)} placeholder="Anotações..." className="h-full bg-gray-900 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full resize-none min-h-[240px]"></textarea>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}

export default ScenarioEditor;