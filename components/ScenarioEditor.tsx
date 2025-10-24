import React, { useRef, useEffect } from 'react';
import type { Scenario, Position, GameScenario, RangeAction } from '../types';
import { POSITIONS, GAME_SCENARIOS, RANGE_ACTIONS, POSITION_ORDER, BLIND_WAR_ACTIONS, BLIND_WAR_POSITIONS } from '../constants';
import ImageUploader from './ImageUploader';
import { useHistory } from '../App';


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
    const { pushToHistory } = useHistory();
    const scenarioRef = useRef(scenario);

    useEffect(() => {
        scenarioRef.current = scenario;
    }, [scenario]);
    
    const handleUpdate = <K extends keyof Scenario,>(key: K, value: Scenario[K]) => {
        const oldScenarioState = { ...scenario };
        const newScenario = { ...scenario, [key]: value };

        if (key === 'rangeAction' && value === 'RFI') {
            newScenario.heroPos = null;
        }

        if (key === 'blindWarPosition') {
            const newPosition = value as Scenario['blindWarPosition'];
            const currentAction = newScenario.blindWarAction;

            // When switching to SB, if current action is Limp or Raise, clear it.
            if (newPosition === 'SB' && (currentAction === 'vs. Limp' || currentAction === 'vs. raise')) {
                newScenario.blindWarAction = null;
            }
            // When switching to BB, if current action is ISO, clear it.
            if (newPosition === 'BB' && currentAction === 'vs. ISO') {
                newScenario.blindWarAction = null;
            }
        }

        onUpdate(newScenario);
        pushToHistory(() => onUpdate(oldScenarioState));
    };
    
    const handleTextUpdate = (key: keyof Scenario, value: string) => {
        const currentScenario = scenarioRef.current;
        const oldScenarioState = { ...currentScenario };
        // Don't push to history if value hasn't changed
        if (oldScenarioState[key] === value) return;
        
        onUpdate({ ...currentScenario, [key]: value });
        pushToHistory(() => onUpdate(oldScenarioState));
    };

    const getHeroPositions = (raiserPos: Position | null): Position[] => {
        if (!raiserPos) return POSITIONS.filter(p => p !== 'UTG');
        const raiserIndex = POSITION_ORDER[raiserPos];
        return POSITIONS.filter(p => POSITION_ORDER[p] > raiserIndex);
    };

    const heroPositions = getHeroPositions(scenario.raiserPos);

    const scenarioTitle = (() => {
        if (scenario.spotType === 'Blind War') {
            const { blindWarPosition, blindWarAction, gameScenario } = scenario;
            if (!blindWarPosition || !blindWarAction) return "Novo Cenário (Blind War)";
            return gameScenario
                ? `Blind War: ${blindWarPosition} ${blindWarAction} [${gameScenario}]`
                : `Blind War: ${blindWarPosition} ${blindWarAction}`;
        }

        const { rangeAction, raiserPos, heroPos, gameScenario } = scenario;

        if (!rangeAction) return "Novo Cenário";
        
        if (rangeAction === 'RFI') {
            return raiserPos && gameScenario
                ? `RFI: ${raiserPos} [${gameScenario}]`
                : "Novo Cenário (RFI)";
        }

        if (rangeAction === 'F2bet') {
            return raiserPos && heroPos && gameScenario
                ? `F2bet: ${heroPos} vs ${raiserPos} [${gameScenario}]`
                : "Novo Cenário (F2bet)";
        }

        return "Novo Cenário";
    })();

    return (
        <div className="bg-brand-primary rounded-lg p-1 border border-brand-bg">
            <div className="bg-brand-bg rounded-t-md p-3 flex justify-between items-center cursor-pointer" onClick={() => onToggleCollapse(scenario.id)}>
                 <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={isSelectedForCompare}
                        onChange={() => onToggleCompare(scenario.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 mr-4 bg-brand-primary border-brand-bg rounded text-brand-secondary focus:ring-brand-secondary"
                    />
                    <h3 className="font-bold text-lg text-brand-text">{scenarioTitle}</h3>
                </div>
                <div className="flex items-center gap-4">
                     <button onClick={(e) => { e.stopPropagation(); onDelete(scenario.id); }} className="text-red-400 hover:text-red-500 p-1 rounded-full hover:bg-brand-primary">
                        <TrashIcon />
                    </button>
                    <button className="text-brand-text-muted hover:text-brand-text">
                        {isCollapsed ? '▼' : '▲'}
                    </button>
                </div>
            </div>
            
            {!isCollapsed && (
                <div className="p-4 space-y-6">
                    {/* Conditional Controls based on SpotType */}
                    {scenario.spotType === 'Blind War' ? (
                        <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-4">
                            <div>
                                <label className="block text-center text-sm font-medium text-brand-text-muted mb-2">Position</label>
                                <div className="flex gap-2 flex-wrap justify-center">
                                    {BLIND_WAR_POSITIONS.map(pos => (
                                        <button key={pos} onClick={() => handleUpdate('blindWarPosition', pos)} className={`px-4 py-2 rounded-md ${scenario.blindWarPosition === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{pos}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-center text-sm font-medium text-brand-text-muted mb-2">Action</label>
                                <div className="flex gap-2 flex-wrap justify-center">
                                    {BLIND_WAR_ACTIONS.map(action => {
                                        const isVsLimpDisabled = scenario.blindWarPosition === 'SB' && action === 'vs. Limp';
                                        const isVsRaiseDisabled = scenario.blindWarPosition === 'SB' && action === 'vs. raise';
                                        const isVsIsoDisabled = scenario.blindWarPosition === 'BB' && action === 'vs. ISO';
                                        const isDisabled = isVsLimpDisabled || isVsRaiseDisabled || isVsIsoDisabled;
                                        
                                        return (
                                            <button
                                                key={action}
                                                onClick={() => handleUpdate('blindWarAction', action)}
                                                disabled={isDisabled}
                                                className={`px-4 py-2 rounded-md transition-opacity ${
                                                    scenario.blindWarAction === action
                                                        ? 'bg-brand-secondary text-brand-primary font-bold'
                                                        : 'bg-brand-bg hover:brightness-125'
                                                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {action}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="block text-center text-sm font-medium text-brand-text-muted mb-2">Cenário</label>
                                <div className="flex gap-2 flex-wrap justify-center">
                                    {GAME_SCENARIOS.map(gs => (
                                        <button key={gs} onClick={() => handleUpdate('gameScenario', gs)} className={`px-4 py-2 rounded-md ${scenario.gameScenario === gs ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{gs}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text-muted mb-2">Action</label>
                                <div className="flex gap-2 flex-wrap">
                                    {RANGE_ACTIONS.map(action => (
                                        <button key={action} onClick={() => handleUpdate('rangeAction', action)} className={`px-3.5 py-1.5 text-sm rounded-md ${scenario.rangeAction === action ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{action}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-text-muted mb-2">
                                {scenario.rangeAction === 'RFI' ? 'Posição' : 'First Raiser Position'}
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {POSITIONS.filter(p => p !== 'BB').map(pos => (
                                        <button key={pos} onClick={() => handleUpdate('raiserPos', pos)} className={`px-3.5 py-1.5 text-sm rounded-md ${scenario.raiserPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{pos}</button>
                                    ))}
                                </div>
                            </div>
                            {scenario.rangeAction !== 'RFI' && (
                                <div>
                                    <label className="block text-sm font-medium text-brand-text-muted mb-2">Hero Position</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {heroPositions.map(pos => (
                                            <button key={pos} onClick={() => handleUpdate('heroPos', pos)} className={`px-3.5 py-1.5 text-sm rounded-md ${scenario.heroPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{pos}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-brand-text-muted mb-2">Cenário</label>
                                <div className="flex gap-2 flex-wrap">
                                    {GAME_SCENARIOS.map(gs => (
                                        <button key={gs} onClick={() => handleUpdate('gameScenario', gs)} className={`px-3.5 py-1.5 text-sm rounded-md ${scenario.gameScenario === gs ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{gs}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Data Inputs */}
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
                        <div className="lg:col-span-7 space-y-4">
                            <ImageUploader title="Range" imageData={scenario.rangeImage} onUpload={(data) => handleUpdate('rangeImage', data)} className="aspect-[20/17]" />
                            <ImageUploader title="Frequências" imageData={scenario.frequenciesImage} onUpload={(data) => handleUpdate('frequenciesImage', data)} className="aspect-[6/1]" />
                            <div className="grid grid-cols-3 gap-2">
                                <textarea defaultValue={scenario.raiseSmallText} onBlur={e => handleTextUpdate('raiseSmallText', e.target.value)} placeholder="raise small" className="h-12 bg-brand-bg text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                                <textarea defaultValue={scenario.raiseBigText} onBlur={e => handleTextUpdate('raiseBigText', e.target.value)} placeholder="raise big" className="h-12 bg-brand-bg text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                                <textarea defaultValue={scenario.callText} onBlur={e => handleTextUpdate('callText', e.target.value)} placeholder="call" className="h-12 bg-brand-bg text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                            </div>
                        </div>
                        <div className="lg:col-span-3">
                            <textarea defaultValue={scenario.notes} onBlur={e => handleTextUpdate('notes', e.target.value)} placeholder="Anotações..." className="h-full bg-brand-bg rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none min-h-[240px]"></textarea>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ScenarioEditor;