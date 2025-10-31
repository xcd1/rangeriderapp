import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import type { Scenario, Position, GameScenario, RangeAction } from '../types';
import { POSITIONS, GAME_SCENARIOS, FACING_2BET_ACTIONS, HRC_ACTIONS, POSITION_ORDER, BLIND_WAR_ACTIONS, BLIND_WAR_POSITIONS, JARGON_DEFINITIONS, STATS_ANALYSIS_SCENARIOS } from '../constants';
import ImageUploader from './ImageUploader';
import ConfirmationModal from './ConfirmationModal';
import { useHistory } from '../App';
import { useComparison } from '../contexts/ComparisonContext';
import InfoTooltip from './InfoTooltip';


interface ScenarioEditorProps {
    scenario: Scenario;
    onUpdate: (scenario: Scenario) => void;
    onDelete: (scenarioId: string) => void;
    onDuplicate: (scenarioId: string) => void;
    isSelectedForCompare: boolean;
    onToggleCompare: (scenarioId: string) => void;
    isCollapsed: boolean;
    onToggleCollapse: (scenarioId: string) => void;
    sectionControl: {action: 'expand' | 'collapse', target: 'all' | 'params' | 'media' | 'notes', key: number} | null;
}

interface ButtonGroupProps {
    label: string;
    jargonKey?: keyof typeof JARGON_DEFINITIONS;
    children: React.ReactNode;
    onClear: () => void;
    hasSelection: boolean;
    isDisabled?: boolean;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ label, jargonKey, children, onClear, hasSelection, isDisabled = false }) => (
    <div className={`${isDisabled ? 'opacity-50' : ''}`}>
        <div className="flex items-center mb-1.5 gap-2">
            <label className="block text-sm font-medium text-brand-text-muted">{label}</label>
            {jargonKey && <InfoTooltip text={JARGON_DEFINITIONS[jargonKey]} direction="bottom" />}
            {hasSelection && !isDisabled && (
                <button onClick={onClear} className="px-2 py-0.5 text-xs rounded-full bg-brand-bg/50 hover:bg-brand-bg text-brand-text-muted hover:text-brand-text flex items-center justify-center gap-1" title="Limpar seleção">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    Limpar
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
    onDelete?: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ imageSrc, onClose, onDelete }) => {
    if (!imageSrc) return null;

    return (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"
          onClick={onClose}
        >
            <button 
                className="absolute top-4 right-4 text-white bg-black/50 hover:bg-red-700 w-7 h-7 rounded-full shadow-lg z-[51] transition-all hover:scale-110 flex items-center justify-center"
                onClick={onClose}
                title="Fechar (Esc)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                <img 
                    src={imageSrc} 
                    alt="Imagem ampliada" 
                    className="block max-w-full max-h-full object-contain rounded-lg"
                />
                {onDelete && (
                    <button
                        className="absolute top-4 left-4 text-white bg-black/50 hover:bg-red-700 px-3 py-1 text-sm rounded-full shadow-lg z-10 transition-all hover:scale-105 flex items-center justify-center gap-1.5"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        title="Excluir imagem"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                        Excluir
                    </button>
                )}
            </div>
        </div>
    );
};

interface RangeZoomModalProps {
    imageSrc: string | null;
    onClose: () => void;
    onDelete?: () => void;
}

const RangeZoomModal: React.FC<RangeZoomModalProps> = ({ imageSrc, onClose, onDelete }) => {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const imgRef = useRef<HTMLImageElement>(null);
    const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
    const [imgBounds, setImgBounds] = useState<DOMRect | null>(null);

    useEffect(() => {
        // Reset zoom and pan when image changes or modal is reopened
        setScale(1);
        setOffset({ x: 0, y: 0 });
    }, [imageSrc]);

    useLayoutEffect(() => {
        if (imgRef.current) {
            setImgBounds(imgRef.current.getBoundingClientRect());
        }
    }, [scale, offset, imageSrc]);

    if (!imageSrc) return null;

    const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 5));
    const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 1));
    const handleZoomReset = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

    const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
        if (scale <= 1) return;
        dragInfo.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initialX: offset.x, initialY: offset.y };
        e.currentTarget.style.cursor = 'grabbing';
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLImageElement>) => {
        dragInfo.current.isDragging = false;
        if (scale > 1) {
            e.currentTarget.style.cursor = 'grab';
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!dragInfo.current.isDragging) return;
        const dx = e.clientX - dragInfo.current.startX;
        const dy = e.clientY - dragInfo.current.startY;
        setOffset({ x: dragInfo.current.initialX + dx, y: dragInfo.current.initialY + dy });
    };
    
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) handleZoomIn();
        else handleZoomOut();
    };

    return (
        <div className="fixed inset-0 flex flex-col justify-center items-center z-[60]" onClick={onClose}>
            <div className="absolute top-4 right-4 z-[62] flex items-center gap-2 bg-brand-bg p-2 rounded-lg">
                <button onClick={(e) => { e.stopPropagation(); handleZoomOut(); }} className="w-8 h-8 rounded-md bg-brand-primary text-lg font-bold flex items-center justify-center">-</button>
                <button onClick={(e) => { e.stopPropagation(); handleZoomIn(); }} className="w-8 h-8 rounded-md bg-brand-primary text-lg font-bold flex items-center justify-center">+</button>
                <button onClick={(e) => { e.stopPropagation(); handleZoomReset(); }} className="h-8 px-3 rounded-md bg-brand-primary text-sm">Reset</button>
                <button onClick={onClose} className="w-8 h-8 rounded-md bg-brand-primary text-lg font-bold flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
            </div>
            {onDelete && imgBounds && (
                <button
                    className="absolute text-white bg-black/50 hover:bg-red-700 px-3 py-1 text-sm rounded-full shadow-lg z-[61] transition-all hover:scale-105 flex items-center justify-center gap-1.5"
                    style={{
                        top: `${Math.max(imgBounds.top, 0) + 8}px`,
                        left: `${Math.max(imgBounds.left, 0) + 8}px`,
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    title="Excluir imagem"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                    Excluir
                </button>
            )}
            <div className="w-[90vw] h-[90vh] flex items-center justify-center overflow-hidden" onWheel={handleWheel}>
                <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Range ampliado"
                    className="max-w-none max-h-none transition-transform duration-100"
                    style={{ 
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                        cursor: scale > 1 ? 'grab' : 'default'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseUp}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
};

const HRC_GAME_SCENARIOS_ORDER: GameScenario[] = ['CEv', 'Vanilla CVN', 'Bounty CVN', 'Vanilla CVD', 'Bounty CVD', 'Turbo', 'Mistery', 'Hyper'];

const CollapsibleSection: React.FC<{
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ title, isOpen, onToggle, children }) => {
    return (
        <div className="border-t border-brand-bg/50">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-3 text-left text-brand-text-muted hover:text-brand-text hover:bg-brand-bg/50 transition-colors"
                aria-expanded={isOpen}
            >
                <span className="font-semibold">{title}</span>
                <span className="text-xs font-semibold flex items-center justify-center gap-2">
                    {isOpen ? 'Recolher' : 'Expandir'}
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                </span>
            </button>
            <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                 <div className="overflow-hidden">
                    <div className="p-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};


const ScenarioEditor: React.FC<ScenarioEditorProps> = ({ 
    scenario, 
    onUpdate, 
    onDelete,
    onDuplicate,
    isSelectedForCompare, 
    onToggleCompare,
    isCollapsed,
    onToggleCollapse,
    sectionControl,
}) => {
    const { pushToHistory } = useHistory();
    const { scenariosToCompare: intelligentScenarios, addScenarioToCompare, removeScenarioFromCompare } = useComparison();
    const scenarioRef = useRef(scenario);
    const [isConfirmingDeleteImage, setIsConfirmingDeleteImage] = useState(false);
    const [isConfirmingDeleteZoomedImage, setIsConfirmingDeleteZoomedImage] = useState(false);
    const [uploaderTarget, setUploaderTarget] = useState<'printSpotImage' | 'rpImage' | 'tableViewImage' | 'plusInfoImage' | null>(null);
    const [viewingImage, setViewingImage] = useState<{ key: 'printSpotImage' | 'rpImage' | 'tableViewImage' | 'plusInfoImage', src: string } | null>(null);
    const [zoomedImage, setZoomedImage] = useState<{ src: string; type: 'rangeImage' | 'frequenciesImage' | 'evImage' } | null>(null);
    const [textInputs, setTextInputs] = useState({
        raiseSmallText: scenario.raiseSmallText,
        raiseBigText: scenario.raiseBigText,
        callText: scenario.callText,
        notes: scenario.notes,
    });
    const [manualTitleInput, setManualTitleInput] = useState(scenario.manualTitle || '');
    const [openSections, setOpenSections] = useState<Set<string>>(new Set(['params', 'media', 'textData']));
    const [isClearMenuOpen, setIsClearMenuOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const clearMenuRef = useRef<HTMLDivElement>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);
    
    const isSelectedForIntelligentCompare = intelligentScenarios.includes(scenario.id);

    const isManualMode = scenario.manualTitle !== null;

    useEffect(() => {
        scenarioRef.current = scenario;
        setTextInputs({
            raiseSmallText: scenario.raiseSmallText,
            raiseBigText: scenario.raiseBigText,
            callText: scenario.callText,
            notes: scenario.notes,
        });
        setManualTitleInput(scenario.manualTitle || '');
    }, [scenario]);
    
    useEffect(() => {
        if (!sectionControl || !isSelectedForCompare) return;

        const { action, target } = sectionControl;

        if (action === 'expand') {
            if (target === 'all') {
                setOpenSections(new Set(['params', 'media', 'textData', 'notes']));
            } else {
                setOpenSections(prev => new Set([...prev, target]));
            }
        } else { // collapse
            if (target === 'all') {
                setOpenSections(new Set());
            } else {
                setOpenSections(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(target);
                    return newSet;
                });
            }
        }
    }, [sectionControl, isSelectedForCompare]);

    useEffect(() => {
        // For RFI spots, the action is always RFI. This sets it automatically.
        if (scenario.spotType === 'Rfi' && scenario.rangeAction !== 'RFI') {
            onUpdate({ ...scenario, rangeAction: 'RFI' });
        }
    }, [scenario, onUpdate]); // Depends on scenario to re-evaluate if props change
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clearMenuRef.current && !clearMenuRef.current.contains(event.target as Node)) {
                setIsClearMenuOpen(false);
            }
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setIsActionMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
    const toggleSection = (sectionName: string) => {
        // FIX: Explicitly type `prev` to avoid type inference issues.
        setOpenSections((prev: Set<string>) => {
            const newSet = new Set(prev);
            if (newSet.has(sectionName)) {
                newSet.delete(sectionName);
            } else {
                newSet.add(sectionName);
            }
            return newSet;
        });
    };
    
    const getAutoGeneratedTitle = (s: Scenario): string => {
        const { spotType, gameScenario } = s;
        
        const dropEquity =
            s.rpMode &&
            s.gameScenario?.startsWith('Bounty') &&
            typeof s.startingBounties === 'number' && s.startingBounties > 0 &&
            typeof s.startingStacks === 'number' && s.startingStacks > 0
                ? (s.startingBounties / s.startingStacks) / 0.2
                : null;

        let gsSuffix = gameScenario ? ` [${gameScenario}]` : '';
        if (dropEquity !== null) {
            gsSuffix += ` [DE: ${dropEquity.toFixed(1)}%]`;
        }

        if (spotType === 'Stats Analysis') {
            return `Nova Análise de Stats${gsSuffix}`;
        }

        if (spotType === 'Blind War') {
            const { blindWarPosition, blindWarAction } = s;
            if (!blindWarPosition || !blindWarAction) return "Novo Cenário (Blind War)";
            return `Blind War: ${blindWarPosition} ${blindWarAction}${gsSuffix}`;
        }
        
        if (spotType === 'HRC Enviroment') {
            const { rangeAction, raiserPos, heroPos, coldCallerPos, aggressorPos } = s;
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
        const { rangeAction, raiserPos, heroPos } = s;
        if (!rangeAction) return "Novo Cenário";
        if (rangeAction === 'RFI') {
            return raiserPos ? `RFI: ${raiserPos}${gsSuffix}` : "Novo Cenário (RFI)";
        }
        if (rangeAction === 'F2bet') {
            return raiserPos && heroPos ? `F2bet: ${heroPos} vs ${raiserPos}${gsSuffix}` : "Novo Cenário (F2bet)";
        }
        return "Novo Cenário";
    };

    const scenarioTitle = scenario.manualTitle ?? getAutoGeneratedTitle(scenario);

    const handleUpdateWithHistory = (newScenarioState: Scenario) => {
      const oldScenarioState = { ...scenario };
      if (JSON.stringify(oldScenarioState) === JSON.stringify(newScenarioState)) return;

      onUpdate(newScenarioState);
      pushToHistory({
        undo: () => onUpdate(oldScenarioState),
        redo: () => onUpdate(newScenarioState),
      });
    };

    const handleToggleManualMode = () => {
        if (isManualMode) {
            handleUpdateWithHistory({ ...scenario, manualTitle: null });
        } else {
            handleUpdateWithHistory({ ...scenario, manualTitle: getAutoGeneratedTitle(scenario) });
        }
        setIsActionMenuOpen(false);
    };
    
    const handleManualTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setManualTitleInput(e.target.value);
    };

    const handleManualTitleBlur = () => {
        if (scenario.manualTitle !== manualTitleInput) {
            handleUpdateWithHistory({ ...scenario, manualTitle: manualTitleInput.trim() });
        }
    };
    
    const handleToggleIntelligentCompare = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSelectedForIntelligentCompare) {
            removeScenarioFromCompare(scenario.id);
        } else {
            addScenarioToCompare(scenario.id);
        }
        setIsActionMenuOpen(false);
    };

    const handleUpdate = <K extends keyof Scenario,>(key: K, value: Scenario[K]) => {
        const newScenario = { ...scenario, [key]: value };

        // When toggling RP Mode ON, set default values if they don't exist
        if (key === 'rpMode' && value === true) {
            if (typeof newScenario.startingBounties !== 'number' || newScenario.startingBounties <= 0) {
                newScenario.startingBounties = 1;
            }
            if (typeof newScenario.startingStacks !== 'number' || newScenario.startingStacks <= 0) {
                newScenario.startingStacks = 1;
            }
        }

        // Reset dependent positions when a primary selection changes
        if (key === 'rangeAction' && value !== scenario.rangeAction) {
            newScenario.raiserPos = null;
            newScenario.heroPos = null;
            newScenario.coldCallerPos = null;
            newScenario.aggressorPos = null;
        }

        if (scenario.spotType === 'HRC Enviroment') {
            if (key === 'raiserPos' && value !== scenario.raiserPos) {
                newScenario.heroPos = null;
                newScenario.aggressorPos = null;
                newScenario.coldCallerPos = null;
            }

            // F3bet has a different selection order: Raiser -> Aggressor -> Hero
            if (scenario.rangeAction === 'F3bet') {
                 if (key === 'aggressorPos' && value !== scenario.aggressorPos) {
                    newScenario.heroPos = null;
                }
            } 
            // Other actions have order: Raiser -> Hero -> (CC/Aggressor)
            else {
                if (key === 'heroPos' && value !== scenario.heroPos) {
                    newScenario.aggressorPos = null;
                }
            }
        }

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
            if (newPosition === 'BB' && (currentAction === 'vs. ISO' || currentAction === 'em Gap' || currentAction === 'vs. 3bet')) {
                newScenario.blindWarAction = null;
            }
        }
        handleUpdateWithHistory(newScenario);
    };

    const handleGameScenarioUpdate = (gs: GameScenario | null) => {
        const newScenario: Scenario = { ...scenario, gameScenario: gs };

        if (!gs?.startsWith('Bounty')) {
            newScenario.rpMode = false;
        }

        handleUpdateWithHistory(newScenario);
    };
    
    const handleBountyUpdate = (count: number) => {
        handleUpdate('startingBounties', count);
    };
    
    const handleStacksUpdate = (count: number) => {
        handleUpdate('startingStacks', count);
    };

    const handleClearAllSelections = () => {
        const newScenario = {
            ...scenario,
            rangeAction: null,
            raiserPos: null,
            heroPos: null,
            coldCallerPos: null,
            aggressorPos: null,
            gameScenario: null,
            createdAt: scenario.createdAt,
        };
        handleUpdateWithHistory(newScenario);
    };
    
    const handleTextUpdateOnBlur = (key: keyof Scenario, value: string) => {
        const currentScenario = scenarioRef.current;
        if (currentScenario[key] === value) return;
        
        handleUpdateWithHistory({ ...currentScenario, [key]: value });
    };

    const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // FIX: Explicitly type `prev` to avoid type inference issues.
        setTextInputs((prev: typeof textInputs) => ({...prev, [name]: value}));
    };
    
    const handleTextInputBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target as { name: keyof Scenario; value: string };
        handleTextUpdateOnBlur(name, value);
    };

    const handleClearImages = () => {
        if (!scenario.rangeImage && !scenario.frequenciesImage && !scenario.evImage) return;
        handleUpdateWithHistory({ ...scenario, rangeImage: null, frequenciesImage: null, evImage: null });
    };

    const handleClearTexts = () => {
        if (!scenario.raiseSmallText && !scenario.raiseBigText && !scenario.callText) return;
        const newScenario = { 
            ...scenario, 
            raiseSmallText: '',
            raiseBigText: '',
            callText: '' 
        };
        handleUpdateWithHistory(newScenario);
    };

    const handleClearNotes = () => {
        if (!scenario.notes) return;
        handleUpdateWithHistory({ ...scenario, notes: '' });
    };
    
    const performDeleteViewingImage = () => {
        if (!viewingImage) return;
        handleUpdate(viewingImage.key, null);
        setViewingImage(null); // Close viewer
        setIsConfirmingDeleteImage(false); // Close confirmation modal
    };

    const performDeleteZoomedImage = () => {
        if (!zoomedImage) return;
        handleUpdate(zoomedImage.type, null);
        setZoomedImage(null); // Close the modal
        setIsConfirmingDeleteZoomedImage(false);
    };

    const getPositionsAfter = (raiserPos: Position | null): Position[] => {
        if (!raiserPos) return POSITIONS.filter(p => p !== 'UTG');
        const raiserIndex = POSITION_ORDER[raiserPos];
        return POSITIONS.filter(p => POSITION_ORDER[p] > raiserIndex);
    };
    
    const isRfiSelected = scenario.rangeAction === 'RFI';
    const isF2betSelected = scenario.rangeAction === 'F2bet';
    const isF3betSelected = scenario.rangeAction === 'F3bet';

    const heroPositions = getPositionsAfter(scenario.raiserPos);
    const coldCallerPositions = getPositionsAfter(scenario.raiserPos);
    const aggressorPositions = getPositionsAfter(scenario.heroPos || scenario.raiserPos);
    // Define position options specific to the F3bet flow
    const aggressorPositionsForF3bet = getPositionsAfter(scenario.raiserPos);
    const heroPositionsForF3bet = getPositionsAfter(scenario.aggressorPos);

    const isCCDisabled = !scenario.heroPos || (scenario.rangeAction === 'F3bet' && scenario.raiserPos === 'BTN' && scenario.aggressorPos === 'SB');


    const initialImageDataForModal = uploaderTarget ? scenario[uploaderTarget] : null;
    
    const dropEquity =
        scenario.rpMode &&
        scenario.gameScenario?.startsWith('Bounty') &&
        typeof scenario.startingBounties === 'number' && scenario.startingBounties > 0 &&
        typeof scenario.startingStacks === 'number' && scenario.startingStacks > 0
            ? (scenario.startingBounties / scenario.startingStacks) / 0.2
            : null;
    
    const getGameScenarioOptions = () => {
        if (scenario.spotType === 'HRC Enviroment') return HRC_GAME_SCENARIOS_ORDER;
        if (scenario.spotType === 'Stats Analysis') return STATS_ANALYSIS_SCENARIOS;
        // For other spots, filter out the stats-specific ones
        return GAME_SCENARIOS.filter(gs => !STATS_ANALYSIS_SCENARIOS.includes(gs));
    }

    const renderInserirButtons = () => (
        <div className="mt-4">
            <label className="block text-sm font-medium text-brand-text-muted mb-1.5 text-center">Inserir</label>
            <div className="flex justify-center gap-2 flex-wrap">
                <button 
                    onClick={() => scenario.printSpotImage ? setViewingImage({ key: 'printSpotImage', src: scenario.printSpotImage }) : setUploaderTarget('printSpotImage')}
                    className={`px-3 py-2 text-xs rounded-md font-semibold transition-colors flex items-center justify-center gap-1 ${scenario.printSpotImage ? 'bg-brand-secondary/80 hover:bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125 text-brand-text'}`}
                    title={scenario.printSpotImage ? 'Clique para ver a imagem' : 'Clique para adicionar uma imagem'}
                >
                    HRC Table View {scenario.printSpotImage && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                </button>
                <button 
                    onClick={() => scenario.rpImage ? setViewingImage({ key: 'rpImage', src: scenario.rpImage }) : setUploaderTarget('rpImage')}
                    className={`px-3 py-2 text-xs rounded-md font-semibold transition-colors flex items-center justify-center gap-1 ${scenario.rpImage ? 'bg-brand-secondary/80 hover:bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125 text-brand-text'}`}
                    title={scenario.rpImage ? 'Clique para ver a imagem' : 'Clique para adicionar uma imagem'}
                >
                    RP {scenario.rpImage && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                </button>
                <button 
                    onClick={() => scenario.tableViewImage ? setViewingImage({ key: 'tableViewImage', src: scenario.tableViewImage }) : setUploaderTarget('tableViewImage')}
                    className={`px-3 py-2 text-xs rounded-md font-semibold transition-colors flex items-center justify-center gap-1 ${scenario.tableViewImage ? 'bg-brand-secondary/80 hover:bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125 text-brand-text'}`}
                    title={scenario.tableViewImage ? 'Clique para ver a imagem' : 'Clique para adicionar uma imagem'}
                >
                    Table View {scenario.tableViewImage && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                </button>
                <button 
                    onClick={() => scenario.plusInfoImage ? setViewingImage({ key: 'plusInfoImage', src: scenario.plusInfoImage }) : setUploaderTarget('plusInfoImage')}
                    className={`px-3 py-2 text-xs rounded-md font-semibold transition-colors flex items-center justify-center gap-1 ${scenario.plusInfoImage ? 'bg-brand-secondary/80 hover:bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125 text-brand-text'}`}
                    title={scenario.plusInfoImage ? 'Clique para ver a imagem' : 'Clique para adicionar uma imagem'}
                >
                    +Info {scenario.plusInfoImage && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                </button>
            </div>
        </div>
    );
    
    return (
      <div className={`bg-brand-primary rounded-lg border ${isSelectedForCompare ? 'border-brand-secondary' : 'border-brand-bg'}`}>
            {/* --- HEADER --- */}
            <div className="flex justify-between items-center p-3 bg-brand-bg/50 rounded-t-lg">
                <div className="flex items-center gap-3 flex-grow min-w-0">
                    <input 
                        type="checkbox" 
                        checked={isSelectedForCompare}
                        onChange={() => onToggleCompare(scenario.id)}
                        className="h-5 w-5 rounded bg-brand-bg text-brand-secondary focus:ring-brand-secondary border-brand-primary"
                        title="Selecionar para comparação rápida"
                    />
                    {isManualMode ? (
                         <input
                            type="text"
                            value={manualTitleInput}
                            onChange={handleManualTitleChange}
                            onBlur={handleManualTitleBlur}
                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                            className="text-lg font-bold text-brand-text bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-brand-secondary rounded px-1 -ml-1 w-full"
                         />
                    ) : (
                        <h3 className="text-lg font-bold text-brand-text truncate" title={scenarioTitle}>
                            {scenarioTitle}
                        </h3>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                     <button
                        onClick={handleToggleIntelligentCompare}
                        className={`px-3 py-1 rounded-md text-sm font-bold transition-colors ${isSelectedForIntelligentCompare ? 'bg-brand-secondary text-brand-primary' : 'bg-brand-bg text-brand-text-muted hover:text-brand-text'}`}
                        title={isSelectedForIntelligentCompare ? 'Remover da Comparação Inteligente' : 'Adicionar à Comparação Inteligente'}
                    >
                        iCompare
                    </button>
                    <div className="relative" ref={actionMenuRef}>
                        <button
                            onClick={() => setIsActionMenuOpen(p => !p)}
                            className="p-2 rounded-full hover:bg-brand-bg text-brand-text-muted hover:text-brand-text transition-colors"
                            title="Mais Ações"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>
                        {isActionMenuOpen && (
                           <div className="absolute top-full right-0 mt-2 w-56 bg-brand-bg rounded-md shadow-lg z-10 border border-brand-primary overflow-hidden">
                                <ul className="text-sm text-brand-text">
                                    <li><button onClick={() => { onDuplicate(scenario.id); setIsActionMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-brand-primary flex items-center gap-2">Duplicar Cenário</button></li>
                                    <li><button onClick={handleToggleManualMode} className="w-full text-left px-4 py-2 hover:bg-brand-primary flex items-center gap-2">{isManualMode ? 'Usar Título Automático' : 'Renomear Manualmente'}</button></li>
                                    <li><button onClick={(e) => { e.stopPropagation(); setIsClearMenuOpen(p => !p); }} className="w-full text-left px-4 py-2 hover:bg-brand-primary flex items-center gap-2">Limpar...</button></li>
                                    <li><button onClick={(e) => { onDelete(scenario.id); setIsActionMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-red-800/50 text-red-400 flex items-center gap-2">Excluir Cenário</button></li>
                                </ul>
                           </div>
                        )}
                        {isClearMenuOpen && (
                             <div className="absolute top-full right-0 mt-2 w-56 bg-brand-bg rounded-md shadow-lg z-20 border border-brand-primary overflow-hidden" ref={clearMenuRef}>
                                <p className="px-4 pt-2 pb-1 text-xs font-semibold text-brand-text-muted">Limpar Dados:</p>
                                <ul className="text-sm text-brand-text">
                                    <li><button onClick={() => { handleClearAllSelections(); setIsClearMenuOpen(false); setIsActionMenuOpen(false);}} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Limpar Seleções</button></li>
                                    <li><button onClick={() => { handleClearImages(); setIsClearMenuOpen(false); setIsActionMenuOpen(false);}} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Limpar Imagens</button></li>
                                    <li><button onClick={() => { handleClearTexts(); setIsClearMenuOpen(false); setIsActionMenuOpen(false);}} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Limpar Frequências</button></li>
                                    <li><button onClick={() => { handleClearNotes(); setIsClearMenuOpen(false); setIsActionMenuOpen(false);}} className="w-full text-left px-4 py-2 hover:bg-brand-primary">Limpar Anotações</button></li>
                                </ul>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => onToggleCollapse(scenario.id)}
                        className="p-2 rounded-full hover:bg-brand-bg text-brand-text-muted hover:text-brand-text transition-colors"
                        title={isCollapsed ? 'Expandir cenário' : 'Recolher cenário'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform transition-transform ${!isCollapsed ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>
            
            {!isCollapsed && (
                <div className="divide-y divide-brand-bg/50">
                    <CollapsibleSection title={scenario.spotType === 'Stats Analysis' ? 'Period Information' : 'Spot Informations'} isOpen={openSections.has('params')} onToggle={() => toggleSection('params')}>
                        <div className="space-y-4">
                            {scenario.spotType === 'Blind War' ? (
                                <>
                                    <ButtonGroup label="Posição" onClear={() => handleUpdate('blindWarPosition', null)} hasSelection={!!scenario.blindWarPosition}>
                                        {BLIND_WAR_POSITIONS.map(pos => (
                                            <button key={pos} onClick={() => handleUpdate('blindWarPosition', pos)} className={`px-3 py-1.5 text-xs rounded-md font-semibold ${scenario.blindWarPosition === pos ? 'bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125'}`}>{pos}</button>
                                        ))}
                                    </ButtonGroup>
                                    <ButtonGroup label="Ação" onClear={() => handleUpdate('blindWarAction', null)} hasSelection={!!scenario.blindWarAction}>
                                        {BLIND_WAR_ACTIONS.map(action => {
                                            const isDisabled = (scenario.blindWarPosition === 'SB' && (action === 'vs. Limp' || action === 'vs. raise')) ||
                                                               (scenario.blindWarPosition === 'BB' && (action === 'vs. ISO' || action === 'em Gap' || action === 'vs. 3bet'));
                                            return <button key={action} disabled={isDisabled} onClick={() => handleUpdate('blindWarAction', action)} className={`px-3 py-1.5 text-xs rounded-md font-semibold disabled:opacity-30 disabled:cursor-not-allowed ${scenario.blindWarAction === action ? 'bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125'}`}>{action}</button>
                                        })}
                                    </ButtonGroup>
                                </>
                            ) : scenario.spotType !== 'Stats Analysis' ? (
                                <>
                                   {/* Common to F2B and HRC */}
                                   <ButtonGroup label="Action/Response" jargonKey="Action/Response" onClear={() => handleUpdate('rangeAction', null)} hasSelection={!!scenario.rangeAction} isDisabled={scenario.spotType === 'Rfi'}>
                                        {(scenario.spotType === 'Facing 2bet' ? FACING_2BET_ACTIONS : HRC_ACTIONS).map(action => (
                                            <button key={action} onClick={() => handleUpdate('rangeAction', action)} className={`px-3 py-1.5 text-xs rounded-md font-semibold ${scenario.rangeAction === action ? 'bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125'}`}>{action}</button>
                                        ))}
                                    </ButtonGroup>
                                </>
                            ) : null}

                             {scenario.spotType !== 'Blind War' && scenario.spotType !== 'Stats Analysis' && (
                                <>
                                    <ButtonGroup label="First Raiser Position" jargonKey="First Raiser Position" onClear={() => handleUpdate('raiserPos', null)} hasSelection={!!scenario.raiserPos} isDisabled={!scenario.rangeAction}>
                                        {POSITIONS.filter(p => p !== 'BB').map(pos => (
                                            <button key={pos} onClick={() => handleUpdate('raiserPos', pos)} className={`px-3 py-1.5 text-xs rounded-md font-semibold ${scenario.raiserPos === pos ? 'bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125'}`}>{pos}</button>
                                        ))}
                                    </ButtonGroup>

                                    {scenario.spotType === 'HRC Enviroment' && isF3betSelected && (
                                        <ButtonGroup label="3bettor Position" jargonKey="3bettor Position" onClear={() => handleUpdate('aggressorPos', null)} hasSelection={!!scenario.aggressorPos} isDisabled={!scenario.raiserPos}>
                                            {aggressorPositionsForF3bet.map(pos => (
                                                <button key={pos} onClick={() => handleUpdate('aggressorPos', pos)} className={`px-3 py-1.5 text-xs rounded-md font-semibold ${scenario.aggressorPos === pos ? 'bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125'}`}>{pos}</button>
                                            ))}
                                        </ButtonGroup>
                                    )}

                                    {!isRfiSelected && (
                                        <ButtonGroup label="Hero Position" jargonKey="Hero Position" onClear={() => handleUpdate('heroPos', null)} hasSelection={!!scenario.heroPos} isDisabled={!scenario.raiserPos || (isF3betSelected && !scenario.aggressorPos)}>
                                            {(isF3betSelected ? heroPositionsForF3bet : heroPositions).map(pos => (
                                                <button key={pos} onClick={() => handleUpdate('heroPos', pos)} className={`px-3 py-1.5 text-xs rounded-md font-semibold ${scenario.heroPos === pos ? 'bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125'}`}>{pos}</button>
                                            ))}
                                        </ButtonGroup>
                                    )}

                                    {scenario.spotType === 'HRC Enviroment' && !isRfiSelected && !isF2betSelected && (
                                        <>
                                            {!isF3betSelected && (
                                                <ButtonGroup label="Aggressor Position" jargonKey="Aggressor Position" onClear={() => handleUpdate('aggressorPos', null)} hasSelection={!!scenario.aggressorPos} isDisabled={!scenario.heroPos}>
                                                    {aggressorPositions.map(pos => (
                                                        <button key={pos} onClick={() => handleUpdate('aggressorPos', pos)} className={`px-3 py-1.5 text-xs rounded-md font-semibold ${scenario.aggressorPos === pos ? 'bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125'}`}>{pos}</button>
                                                    ))}
                                                </ButtonGroup>
                                            )}
                                             <ButtonGroup label="Cold Caller Position" jargonKey="Cold Caller Position" onClear={() => handleUpdate('coldCallerPos', null)} hasSelection={!!scenario.coldCallerPos} isDisabled={isCCDisabled}>
                                                {coldCallerPositions.filter(p => p !== scenario.heroPos).map(pos => (
                                                    <button key={pos} onClick={() => handleUpdate('coldCallerPos', pos)} className={`px-3 py-1.5 text-xs rounded-md font-semibold ${scenario.coldCallerPos === pos ? 'bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125'}`}>{pos}</button>
                                                ))}
                                            </ButtonGroup>
                                        </>
                                    )}
                                </>
                             )}
                            
                            <ButtonGroup label="Modalidade" jargonKey="Modalidade" onClear={() => handleGameScenarioUpdate(null)} hasSelection={!!scenario.gameScenario}>
                                {getGameScenarioOptions().map(gs => (
                                    <button key={gs} onClick={() => handleGameScenarioUpdate(gs)} className={`px-3 py-1.5 text-xs rounded-md font-semibold ${scenario.gameScenario === gs ? 'bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125'}`}>{gs}</button>
                                ))}
                            </ButtonGroup>

                            {scenario.gameScenario?.startsWith('Bounty') && (
                                <div className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id={`rpMode-${scenario.id}`} checked={!!scenario.rpMode} onChange={e => handleUpdate('rpMode', e.target.checked)} className="h-4 w-4 rounded bg-brand-bg text-brand-secondary focus:ring-brand-secondary border-brand-primary" />
                                        <label htmlFor={`rpMode-${scenario.id}`} className="text-sm font-medium text-brand-text-muted">RP Mode</label>
                                        <InfoTooltip text={JARGON_DEFINITIONS['RP Mode']} />
                                    </div>
                                    {scenario.rpMode && (
                                      <div className="flex items-center gap-4">
                                          <div>
                                              <label className="text-xs text-brand-text-muted">Bounties:</label>
                                              <input type="number" value={scenario.startingBounties || ''} onChange={e => handleBountyUpdate(parseInt(e.target.value, 10))} className="w-20 bg-brand-bg text-sm rounded-md p-1 focus:ring-brand-secondary focus:outline-none" />
                                          </div>
                                          <div>
                                              <label className="text-xs text-brand-text-muted">Stacks:</label>
                                              <input type="number" value={scenario.startingStacks || ''} onChange={e => handleStacksUpdate(parseInt(e.target.value, 10))} className="w-20 bg-brand-bg text-sm rounded-md p-1 focus:ring-brand-secondary focus:outline-none" />
                                          </div>
                                           {dropEquity !== null && <div className="text-sm font-bold text-brand-secondary">DE: {dropEquity.toFixed(1)}%</div>}
                                      </div>
                                    )}
                                </div>
                            )}
                            
                            {scenario.spotType === 'HRC Enviroment' && renderInserirButtons()}

                        </div>
                    </CollapsibleSection>
                    
                     <CollapsibleSection title="Imagem/Dados" isOpen={openSections.has('media')} onToggle={() => toggleSection('media')}>
                        <div className="flex flex-col gap-4">
                            <ImageUploader title={scenario.spotType === 'Stats Analysis' ? 'Imagem' : 'Range'} imageData={scenario.rangeImage} onUpload={(data) => handleUpdate('rangeImage', data)} onZoom={(src) => setZoomedImage({src, type: 'rangeImage'})} />
                            {scenario.spotType !== 'Stats Analysis' && (
                                <>
                                    <ImageUploader title="Frequências" imageData={scenario.frequenciesImage} onUpload={(data) => handleUpdate('frequenciesImage', data)} onZoom={(src) => setZoomedImage({src, type: 'frequenciesImage'})}/>
                                    <ImageUploader title="EV" imageData={scenario.evImage} onUpload={(data) => handleUpdate('evImage', data)} onZoom={(src) => setZoomedImage({src, type: 'evImage'})} />
                                </>
                            )}
                        </div>
                    </CollapsibleSection>

                    {scenario.spotType !== 'Stats Analysis' && (
                        <CollapsibleSection title="Frequências (Texto)" isOpen={openSections.has('textData')} onToggle={() => toggleSection('textData')}>
                            <div className="grid grid-cols-3 gap-4">
                                <textarea name="raiseSmallText" value={textInputs.raiseSmallText} onChange={handleTextInputChange} onBlur={handleTextInputBlur} placeholder="Raise Small" className="bg-brand-bg text-sm rounded-md p-2 h-20 resize-none focus:ring-brand-secondary focus:outline-none"/>
                                <textarea name="raiseBigText" value={textInputs.raiseBigText} onChange={handleTextInputChange} onBlur={handleTextInputBlur} placeholder="Raise Big" className="bg-brand-bg text-sm rounded-md p-2 h-20 resize-none focus:ring-brand-secondary focus:outline-none"/>
                                <textarea name="callText" value={textInputs.callText} onChange={handleTextInputChange} onBlur={handleTextInputBlur} placeholder="Call" className="bg-brand-bg text-sm rounded-md p-2 h-20 resize-none focus:ring-brand-secondary focus:outline-none"/>
                            </div>
                        </CollapsibleSection>
                    )}
                    
                    <CollapsibleSection title="Notes" isOpen={openSections.has('notes')} onToggle={() => toggleSection('notes')}>
                         <textarea name="notes" value={textInputs.notes} onChange={handleTextInputChange} onBlur={handleTextInputBlur} placeholder="Adicione suas anotações aqui..." className="w-full bg-brand-bg text-sm rounded-md p-3 h-28 resize-y focus:ring-brand-secondary focus:outline-none"/>
                    </CollapsibleSection>
                </div>
            )}
            
            {/* --- MODALS --- */}
            <ImageEditModal 
                isOpen={!!uploaderTarget} 
                onClose={() => setUploaderTarget(null)}
                title={`Editar Imagem - ${uploaderTarget}`}
                initialImageData={initialImageDataForModal}
                onSave={(data) => {
                    if (uploaderTarget) {
                        handleUpdate(uploaderTarget, data);
                    }
                }}
            />
            <ImageViewerModal 
                imageSrc={viewingImage?.src || null}
                onClose={() => setViewingImage(null)}
                onDelete={() => setIsConfirmingDeleteImage(true)}
            />
            {zoomedImage && (
                <RangeZoomModal
                    imageSrc={zoomedImage.src}
                    onClose={() => setZoomedImage(null)}
                    onDelete={() => setIsConfirmingDeleteZoomedImage(true)}
                />
            )}
             <ConfirmationModal
                isOpen={isConfirmingDeleteImage}
                onClose={() => setIsConfirmingDeleteImage(false)}
                onConfirm={performDeleteViewingImage}
                title="Confirmar Exclusão"
                message="Deseja realmente excluir esta imagem?"
            />
             <ConfirmationModal
                isOpen={isConfirmingDeleteZoomedImage}
                onClose={() => setIsConfirmingDeleteZoomedImage(false)}
                onConfirm={performDeleteZoomedImage}
                title="Confirmar Exclusão"
                message="Deseja realmente excluir esta imagem?"
            />
      </div>
    );
};

export default ScenarioEditor;