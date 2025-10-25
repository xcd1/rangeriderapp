

import React, { useRef, useEffect, useState } from 'react';
import type { Scenario, Position, GameScenario, RangeAction } from '../types';
import { POSITIONS, GAME_SCENARIOS, FACING_2BET_ACTIONS, HRC_ACTIONS, POSITION_ORDER, BLIND_WAR_ACTIONS, BLIND_WAR_POSITIONS } from '../constants';
import ImageUploader from './ImageUploader';
import ConfirmationModal from './ConfirmationModal';
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
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);

const BrushIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M9.06 11.9 3 18v3h3l6.94-6.94a1 1 0 0 0 0-1.41z"/><path d="m14 6-1-1-4 4 1 1"/><path d="M3 21h18"/><path d="M12.59 7.41a1 1 0 0 0 0 1.41l4 4a1 1 0 0 0 1.41 0l1.18-1.18a1 1 0 0 0 0-1.41l-4-4a1 1 0 0 0-1.41 0Z"/></svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

interface ButtonGroupProps {
    label: string;
    children: React.ReactNode;
    onClear: () => void;
    hasSelection: boolean;
    isDisabled?: boolean;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ label, children, onClear, hasSelection, isDisabled = false }) => (
    <div className={`${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-brand-text-muted">{label}</label>
            {hasSelection && !isDisabled && (
                <button onClick={onClear} className="text-brand-text-muted hover:text-brand-text p-1 rounded-full hover:bg-brand-bg" title="Limpar seleção">
                    <XIcon />
                </button>
            )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
            {children}
        </div>
    </div>
);

interface ImageEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: string | null) => void;
    title: string;
    initialImageData: string | null;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({ isOpen, onClose, onSave, title, initialImageData }) => {
    const [imageData, setImageData] = useState<string | null>(initialImageData);

    useEffect(() => {
        if (isOpen) {
            setImageData(initialImageData);
        }
    }, [initialImageData, isOpen]);

    if (!isOpen) return null;
    
    const handleSave = () => {
        onSave(imageData);
        onClose();
    };

    return (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
          onClick={onClose}
        >
            <div 
                className="bg-brand-primary rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 border border-brand-bg flex flex-col h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-brand-secondary mb-4">{title}</h2>
                <div className="flex-grow min-h-0">
                  <ImageUploader 
                      title="Nova Imagem" 
                      imageData={imageData}
                      onUpload={setImageData}
                      className="h-full"
                  />
                </div>
                 <div className="flex justify-end gap-4 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm font-semibold bg-brand-bg hover:brightness-125 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-md text-sm font-semibold bg-brand-secondary hover:brightness-110 text-brand-primary transition-all"
                    >
                        Salvar e Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ImageViewerModalProps {
    imageSrc: string | null;
    onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ imageSrc, onClose }) => {
    if (!imageSrc) return null;

    return (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"
          onClick={onClose}
        >
            <button 
                className="absolute top-4 right-4 text-white text-3xl font-bold z-50"
                onClick={onClose}
            >
                &times;
            </button>
            <img 
                src={imageSrc} 
                alt="Imagem ampliada" 
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={e => e.stopPropagation()}
            />
        </div>
    );
};


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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [uploaderTarget, setUploaderTarget] = useState<'printSpotImage' | 'rpImage' | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    useEffect(() => {
        scenarioRef.current = scenario;
    }, [scenario]);

    useEffect(() => {
        // For RFI spots, the action is always RFI. This sets it automatically.
        if (scenario.spotType === 'Rfi' && scenario.rangeAction !== 'RFI') {
            onUpdate({ ...scenario, rangeAction: 'RFI' });
        }
    }, [scenario, onUpdate]); // Depends on scenario to re-evaluate if props change
    
    const handleUpdate = <K extends keyof Scenario,>(key: K, value: Scenario[K]) => {
        const oldScenarioState = { ...scenario };
        const newScenario = { ...scenario, [key]: value };

        if (key === 'rangeAction') {
            if (value === 'RFI') {
                newScenario.heroPos = null;
                newScenario.coldCallerPos = null;
                newScenario.aggressorPos = null;
            } else if (value === 'F2bet') {
                newScenario.coldCallerPos = null;
                newScenario.aggressorPos = null;
            }
        }

        if (key === 'blindWarPosition') {
            const newPosition = value as Scenario['blindWarPosition'];
            const currentAction = newScenario.blindWarAction;

            if (newPosition === 'SB' && (currentAction === 'vs. Limp' || currentAction === 'vs. raise')) {
                newScenario.blindWarAction = null;
            }
            if (newPosition === 'BB' && currentAction === 'vs. ISO') {
                newScenario.blindWarAction = null;
            }
        }

        onUpdate(newScenario);
        pushToHistory(() => onUpdate(oldScenarioState));
    };

    const handleClearAllSelections = () => {
        const oldScenarioState = { ...scenario };
        onUpdate({
            ...scenario,
            rangeAction: null,
            raiserPos: null,
            heroPos: null,
            coldCallerPos: null,
            aggressorPos: null,
            gameScenario: null,
        });
        pushToHistory(() => onUpdate(oldScenarioState));
    };
    
    const handleTextUpdate = (key: keyof Scenario, value: string) => {
        const currentScenario = scenarioRef.current;
        const oldScenarioState = { ...currentScenario };
        if (oldScenarioState[key] === value) return;
        
        onUpdate({ ...currentScenario, [key]: value });
        pushToHistory(() => onUpdate(oldScenarioState));
    };

    const getPositionsAfter = (raiserPos: Position | null): Position[] => {
        if (!raiserPos) return POSITIONS.filter(p => p !== 'UTG');
        const raiserIndex = POSITION_ORDER[raiserPos];
        return POSITIONS.filter(p => POSITION_ORDER[p] > raiserIndex);
    };

    const heroPositions = getPositionsAfter(scenario.raiserPos);
    const coldCallerPositions = getPositionsAfter(scenario.raiserPos);
    const aggressorPositions = getPositionsAfter(scenario.heroPos || scenario.raiserPos);

    const scenarioTitle = (() => {
        const { spotType, gameScenario } = scenario;
        const gsSuffix = gameScenario ? ` [${gameScenario}]` : '';

        if (spotType === 'Blind War') {
            const { blindWarPosition, blindWarAction } = scenario;
            if (!blindWarPosition || !blindWarAction) return "Novo Cenário (Blind War)";
            return `Blind War: ${blindWarPosition} ${blindWarAction}${gsSuffix}`;
        }
        
        if (spotType === 'HRC Enviroment') {
            const { rangeAction, raiserPos, heroPos, coldCallerPos, aggressorPos } = scenario;
            if (!rangeAction) return "Novo Cenário (HRC Enviroment)";

            let baseTitle = `Novo Cenário (${rangeAction})`;
            if (rangeAction === 'RFI' && raiserPos) {
                baseTitle = `RFI: ${raiserPos}`;
            } else if (raiserPos && heroPos) {
                baseTitle = `${rangeAction}: ${heroPos} vs ${raiserPos}`;
            }

            let title = baseTitle;
            if (coldCallerPos) title += ` (CC: ${coldCallerPos})`;
            if (aggressorPos) title += ` (Agg: ${aggressorPos})`;
            
            return `${title}${gsSuffix}`;
        }

        // Default to "Facing 2bet" logic
        const { rangeAction, raiserPos, heroPos } = scenario;
        if (!rangeAction) return "Novo Cenário";
        if (rangeAction === 'RFI') {
            return raiserPos ? `RFI: ${raiserPos}${gsSuffix}` : "Novo Cenário (RFI)";
        }
        if (rangeAction === 'F2bet') {
            return raiserPos && heroPos ? `F2bet: ${heroPos} vs ${raiserPos}${gsSuffix}` : "Novo Cenário (F2bet)";
        }
        return "Novo Cenário";
    })();

    const isRfiSelected = scenario.rangeAction === 'RFI';
    const isF2betSelected = scenario.rangeAction === 'F2bet';

    const handleDeleteConfirm = () => {
        onDelete(scenario.id);
        setIsDeleteModalOpen(false);
    };

    const initialImageDataForModal = 
        uploaderTarget === 'printSpotImage' ? scenario.printSpotImage :
        uploaderTarget === 'rpImage' ? scenario.rpImage : null;

    return (
        <>
            <div className="bg-brand-primary rounded-lg p-1 border border-brand-bg">
                <div className="bg-brand-bg rounded-t-md p-3 flex justify-between items-center cursor-pointer" onClick={() => onToggleCollapse(scenario.id)}>
                    <div className="flex items-center flex-1 min-w-0">
                        <input
                            type="checkbox"
                            checked={isSelectedForCompare}
                            onChange={() => onToggleCompare(scenario.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 mr-4 bg-brand-primary border-brand-bg rounded text-brand-secondary focus:ring-brand-secondary flex-shrink-0"
                        />
                        <h3 className="font-bold text-lg text-brand-text truncate" title={scenarioTitle}>{scenarioTitle}</h3>
                    </div>
                    <div className="flex items-center gap-3 ml-2">
                        {scenario.spotType === 'HRC Enviroment' && (
                            <button onClick={(e) => { e.stopPropagation(); handleClearAllSelections(); }} className="text-blue-300 hover:text-blue-400 p-1 rounded-full hover:bg-brand-primary/80 flex items-center justify-center" title="Limpar Botões">
                                <BrushIcon />
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setIsDeleteModalOpen(true); }} className="text-red-400 hover:text-red-500 p-1 rounded-full hover:bg-brand-primary/80 flex items-center justify-center" title="Excluir cenário">
                            <TrashIcon />
                        </button>
                        <button className="text-brand-text-muted hover:text-brand-text">
                            {isCollapsed ? '▼' : '▲'}
                        </button>
                    </div>
                </div>
                
                {!isCollapsed && (
                    <div className="p-4 space-y-6">
                        {/* HRC Enviroment */}
                        {scenario.spotType === 'HRC Enviroment' && (
                            <>
                                <div className="flex items-start gap-4">
                                    <div className="flex-grow space-y-4">
                                        <ButtonGroup label="Action/Response" onClear={() => handleUpdate('rangeAction', null)} hasSelection={!!scenario.rangeAction}>
                                            {HRC_ACTIONS.map(action => (
                                                <button key={action} onClick={() => handleUpdate('rangeAction', action)} className={`px-3 py-1 text-xs rounded-md ${scenario.rangeAction === action ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{action}</button>
                                            ))}
                                        </ButtonGroup>
                                        <ButtonGroup label="First Raiser Position" onClear={() => handleUpdate('raiserPos', null)} hasSelection={!!scenario.raiserPos}>
                                            {POSITIONS.filter(p => p !== 'BB').map(pos => (
                                                <button key={pos} onClick={() => handleUpdate('raiserPos', pos)} className={`px-3 py-1 text-xs rounded-md ${scenario.raiserPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{pos}</button>
                                            ))}
                                        </ButtonGroup>
                                        <ButtonGroup label="Hero Position" onClear={() => handleUpdate('heroPos', null)} hasSelection={!!scenario.heroPos} isDisabled={isRfiSelected}>
                                            {heroPositions.map(pos => (
                                                <button key={pos} onClick={() => handleUpdate('heroPos', pos)} disabled={isRfiSelected} className={`px-3 py-1 text-xs rounded-md ${scenario.heroPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{pos}</button>
                                            ))}
                                        </ButtonGroup>
                                        

                                        {!isRfiSelected && !isF2betSelected && (
                                            <>
                                                <ButtonGroup label="Cold Caller Position (CC)" onClear={() => handleUpdate('coldCallerPos', null)} hasSelection={!!scenario.coldCallerPos}>
                                                    {coldCallerPositions.map(pos => (
                                                        <button key={pos} onClick={() => handleUpdate('coldCallerPos', pos)} className={`px-3 py-1 text-xs rounded-md ${scenario.coldCallerPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{pos}</button>
                                                    ))}
                                                </ButtonGroup>
                                                <div className="flex items-end gap-6 pt-1">
                                                    <div className="flex-grow">
                                                        <ButtonGroup label="3bettor/4bettor/5bettor/Squeezer Position" onClear={() => handleUpdate('aggressorPos', null)} hasSelection={!!scenario.aggressorPos}>
                                                            {aggressorPositions.map(pos => (
                                                                <button key={pos} onClick={() => handleUpdate('aggressorPos', pos)} className={`px-3 py-1 text-xs rounded-md ${scenario.aggressorPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{pos}</button>
                                                            ))}
                                                        </ButtonGroup>
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        <label className="block text-sm font-medium text-brand-text-muted mb-1.5 text-center">Inserir</label>
                                                        <div className="flex justify-center gap-2">
                                                            <button 
                                                                onClick={() => scenario.printSpotImage ? setViewingImage(scenario.printSpotImage) : setUploaderTarget('printSpotImage')}
                                                                className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${scenario.printSpotImage ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-brand-bg hover:brightness-125 text-brand-text'}`}
                                                                title={scenario.printSpotImage ? 'Clique para ver a imagem' : 'Clique para adicionar uma imagem'}
                                                            >
                                                                Table Draw {scenario.printSpotImage ? '✓' : ''}
                                                            </button>
                                                            <button 
                                                                onClick={() => scenario.rpImage ? setViewingImage(scenario.rpImage) : setUploaderTarget('rpImage')}
                                                                className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${scenario.rpImage ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-brand-bg hover:brightness-125 text-brand-text'}`}
                                                                title={scenario.rpImage ? 'Clique para ver a imagem' : 'Clique para adicionar uma imagem'}
                                                            >
                                                                RP {scenario.rpImage ? '✓' : ''}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="relative mb-1.5 text-center">
                                            <label className="block text-sm font-medium text-brand-text-muted">Cenário</label>
                                            {!!scenario.gameScenario && !isRfiSelected && (
                                                <button onClick={() => handleUpdate('gameScenario', null)} className="absolute top-1/2 right-0 -translate-y-1/2 text-brand-text-muted hover:text-brand-text p-1 rounded-full hover:bg-brand-bg" title="Limpar seleção">
                                                    <XIcon />
                                                </button>
                                            )}
                                        </div>
                                        <div className={`flex flex-col gap-1.5 ${isRfiSelected ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {GAME_SCENARIOS.map(gs => (
                                                <button key={gs} onClick={() => handleUpdate('gameScenario', gs)} disabled={isRfiSelected} className={`px-3 py-1 text-xs rounded-md w-full text-left ${scenario.gameScenario === gs ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{gs}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-4">
                                    <ImageUploader title="Range" imageData={scenario.rangeImage} onUpload={(data) => handleUpdate('rangeImage', data)} className="aspect-[5/3]" />
                                    <div className="grid grid-cols-3 gap-2">
                                        <textarea defaultValue={scenario.raiseSmallText} onBlur={e => handleTextUpdate('raiseSmallText', e.target.value)} placeholder="raise small" className="h-10 bg-brand-bg text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                                        <textarea defaultValue={scenario.raiseBigText} onBlur={e => handleTextUpdate('raiseBigText', e.target.value)} placeholder="raise big" className="h-10 bg-brand-bg text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                                        <textarea defaultValue={scenario.callText} onBlur={e => handleTextUpdate('callText', e.target.value)} placeholder="call" className="h-10 bg-brand-bg text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                                    </div>
                                    <textarea defaultValue={scenario.notes} onBlur={e => handleTextUpdate('notes', e.target.value)} placeholder="Anotações..." className="h-24 bg-brand-bg rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                                </div>
                            </>
                        )}

                        {/* Blind War */}
                        {scenario.spotType === 'Blind War' && (
                            <>
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
                                <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
                                    <div className="lg:col-span-7 space-y-4">
                                        <ImageUploader title="Range" imageData={scenario.rangeImage} onUpload={(data) => handleUpdate('rangeImage', data)} className="aspect-[20/17]" />
                                        <ImageUploader title="Frequências" imageData={scenario.frequenciesImage} onUpload={(data) => handleUpdate('frequenciesImage', data)} className="aspect-[6/1]" size="small" />
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
                            </>
                        )}

                        {/* Facing 2bet & Rfi */}
                        {(scenario.spotType === 'Facing 2bet' || scenario.spotType === 'Rfi') && (
                        <>
                                <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                                    {scenario.spotType === 'Facing 2bet' && (
                                        <div>
                                            <label className="block text-sm font-medium text-brand-text-muted mb-2">Action</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {FACING_2BET_ACTIONS.map(action => (
                                                    <button key={action} onClick={() => handleUpdate('rangeAction', action)} className={`px-3.5 py-1.5 text-sm rounded-md ${scenario.rangeAction === action ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{action}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className={`block text-sm font-medium text-brand-text-muted mb-2 ${scenario.spotType === 'Rfi' ? 'text-center' : ''}`}>
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
                                        <label className={`block text-sm font-medium text-brand-text-muted mb-2 ${scenario.spotType === 'Rfi' ? 'text-center' : ''}`}>Cenário</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {GAME_SCENARIOS.map(gs => (
                                                <button key={gs} onClick={() => handleUpdate('gameScenario', gs)} className={`px-3.5 py-1.5 text-sm rounded-md ${scenario.gameScenario === gs ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'}`}>{gs}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
                                    <div className="lg:col-span-7 space-y-4">
                                        <ImageUploader title="Range" imageData={scenario.rangeImage} onUpload={(data) => handleUpdate('rangeImage', data)} className="aspect-[20/17]" />
                                        <ImageUploader title="Frequências" imageData={scenario.frequenciesImage} onUpload={(data) => handleUpdate('frequenciesImage', data)} className="aspect-[6/1]" size="small" />
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
                        </>
                        )}
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Confirmar Exclusão de Cenário"
                message={
                <>
                    Deseja realmente excluir o cenário <strong className="text-brand-secondary">{scenarioTitle}</strong>?
                    <br />
                    <span className="text-sm">Esta ação não pode ser desfeita.</span>
                </>
                }
                confirmText="Sim, excluir"
                cancelText="Cancelar"
            />
             <ImageEditModal 
                isOpen={!!uploaderTarget}
                onClose={() => setUploaderTarget(null)}
                title={`Inserir Imagem para ${uploaderTarget === 'printSpotImage' ? 'Table Draw' : 'RP'}`}
                initialImageData={initialImageDataForModal}
                onSave={(data) => {
                    if (uploaderTarget) {
                        handleUpdate(uploaderTarget, data);
                    }
                }}
            />
            <ImageViewerModal imageSrc={viewingImage} onClose={() => setViewingImage(null)} />
        </>
    );
}

export default ScenarioEditor;