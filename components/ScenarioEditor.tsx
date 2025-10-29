import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import type { Scenario, Position, GameScenario, RangeAction } from '../types';
import { POSITIONS, GAME_SCENARIOS, FACING_2BET_ACTIONS, HRC_ACTIONS, POSITION_ORDER, BLIND_WAR_ACTIONS, BLIND_WAR_POSITIONS } from '../constants';
import ImageUploader from './ImageUploader';
import ConfirmationModal from './ConfirmationModal';
import { useHistory } from '../App';
import { useComparison } from '../contexts/ComparisonContext';


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

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);

const BrushIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M9.06 11.9 3 18v3h3l6.94-6.94a1 1 0 0 0 0-1.41z"/><path d="m14 6-1-1-4 4 1 1"/><path d="M3 21h18"/><path d="M12.59 7.41a1 1 0 0 0 0 1.41l4 4a1 1 0 0 0 1.41 0l1.18-1.18a1 1 0 0 0 0-1.41l-4-4a1 1 0 0 0-1.41 0Z"/></svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const ClearImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9"/><path d="M7 12.5 9.5 10l2.5 2.5L17 8"/><path d="m21.5 2.5-6 6"/><path d="m15.5 2.5 6 6"/></svg>
);

const ClearTxtIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9.5 12.5 5 5"/><path d="m14.5 12.5-5 5"/></svg>
);

const ClearNotesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><polyline points="15 3 15 8 20 8"/><path d="m11.5 12.5 5 5"/><path d="m16.5 12.5-5 5"/></svg>
);

interface ButtonGroupProps {
    label: string;
    children: React.ReactNode;
    onClear: () => void;
    hasSelection: boolean;
    isDisabled?: boolean;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ label, children, onClear, hasSelection, isDisabled = false }) => (
    <div className={`${isDisabled ? 'opacity-50' : ''}`}>
        <div className="flex items-center mb-1.5">
            <label className="block text-sm font-medium text-brand-text-muted mr-2">{label}</label>
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
                className="absolute top-4 right-4 text-white bg-black/50 hover:bg-red-700 p-2 rounded-full shadow-lg z-[51] transition-all hover:scale-110"
                onClick={onClose}
                title="Fechar (Esc)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                <img 
                    src={imageSrc} 
                    alt="Imagem ampliada" 
                    className="block max-w-full max-h-full object-contain rounded-lg"
                />
                {onDelete && (
                    <button
                        className="absolute top-4 left-4 text-white bg-black/50 hover:bg-red-700 p-2 rounded-full shadow-lg z-10 transition-all hover:scale-110"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        title="Excluir imagem"
                    >
                        <TrashIcon />
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
                <button onClick={(e) => { e.stopPropagation(); handleZoomOut(); }} className="w-8 h-8 rounded-md bg-brand-primary text-lg font-bold">-</button>
                <button onClick={(e) => { e.stopPropagation(); handleZoomIn(); }} className="w-8 h-8 rounded-md bg-brand-primary text-lg font-bold">+</button>
                <button onClick={(e) => { e.stopPropagation(); handleZoomReset(); }} className="h-8 px-3 rounded-md bg-brand-primary text-sm">Reset</button>
                <button onClick={onClose} className="w-8 h-8 rounded-md bg-brand-primary text-lg font-bold">&times;</button>
            </div>
            {onDelete && imgBounds && (
                <button
                    className="absolute text-white bg-black/50 hover:bg-red-700 p-2 rounded-full shadow-lg z-[61] transition-all hover:scale-110"
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
                    <TrashIcon />
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
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
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
    const [zoomedImage, setZoomedImage] = useState<{ src: string; type: 'rangeImage' | 'frequenciesImage' } | null>(null);
    const [textInputs, setTextInputs] = useState({
        raiseSmallText: scenario.raiseSmallText,
        raiseBigText: scenario.raiseBigText,
        callText: scenario.callText,
        notes: scenario.notes,
    });
    const [manualTitleInput, setManualTitleInput] = useState(scenario.manualTitle || '');
    const [openSections, setOpenSections] = useState<Set<string>>(new Set());
    const [isClearMenuOpen, setIsClearMenuOpen] = useState(false);
    const clearMenuRef = useRef<HTMLDivElement>(null);
    
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
                setOpenSections(new Set(['params', 'media', 'notes']));
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
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
    const toggleSection = (sectionName: string) => {
        setOpenSections(prev => {
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
        setTextInputs(prev => ({...prev, [name]: value}));
    };
    
    const handleTextInputBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target as { name: keyof Scenario; value: string };
        handleTextUpdateOnBlur(name, value);
    };

    const handleClearImages = () => {
        if (!scenario.rangeImage && !scenario.frequenciesImage) return;
        handleUpdateWithHistory({ ...scenario, rangeImage: null, frequenciesImage: null });
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


    const initialImageDataForModal = uploaderTarget ? scenario[uploaderTarget] : null;
    
    const dropEquity =
        scenario.rpMode &&
        scenario.gameScenario?.startsWith('Bounty') &&
        typeof scenario.startingBounties === 'number' && scenario.startingBounties > 0 &&
        typeof scenario.startingStacks === 'number' && scenario.startingStacks > 0
            ? (scenario.startingBounties / scenario.startingStacks) / 0.2
            : null;

    const renderInserirButtons = () => (
        <div className="mt-4">
            <label className="block text-sm font-medium text-brand-text-muted mb-1.5 text-center">Inserir</label>
            <div className="flex justify-center gap-2 flex-wrap">
                <button 
                    onClick={() => scenario.printSpotImage ? setViewingImage({ key: 'printSpotImage', src: scenario.printSpotImage }) : setUploaderTarget('printSpotImage')}
                    className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${scenario.printSpotImage ? 'bg-brand-secondary/80 hover:bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125 text-brand-text'}`}
                    title={scenario.printSpotImage ? 'Clique para ver a imagem' : 'Clique para adicionar uma imagem'}
                >
                    HRC Table View {scenario.printSpotImage ? <span className="ml-1">✓</span> : ''}
                </button>
                <button 
                    onClick={() => scenario.rpImage ? setViewingImage({ key: 'rpImage', src: scenario.rpImage }) : setUploaderTarget('rpImage')}
                    className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${scenario.rpImage ? 'bg-brand-secondary/80 hover:bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125 text-brand-text'}`}
                    title={scenario.rpImage ? 'Clique para ver a imagem' : 'Clique para adicionar uma imagem'}
                >
                    RP {scenario.rpImage ? <span className="ml-1">✓</span> : ''}
                </button>
                <button 
                    onClick={() => scenario.tableViewImage ? setViewingImage({ key: 'tableViewImage', src: scenario.tableViewImage }) : setUploaderTarget('tableViewImage')}
                    className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${scenario.tableViewImage ? 'bg-brand-secondary/80 hover:bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125 text-brand-text'}`}
                    title={scenario.tableViewImage ? 'Clique para ver a imagem' : 'Clique para adicionar uma imagem'}
                >
                    Table View {scenario.tableViewImage ? <span className="ml-1">✓</span> : ''}
                </button>
                <button 
                    onClick={() => scenario.plusInfoImage ? setViewingImage({ key: 'plusInfoImage', src: scenario.plusInfoImage }) : setUploaderTarget('plusInfoImage')}
                    className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${scenario.plusInfoImage ? 'bg-brand-secondary/80 hover:bg-brand-secondary text-brand-primary' : 'bg-brand-bg hover:brightness-125 text-brand-text'}`}
                    title={scenario.plusInfoImage ? 'Clique para ver a imagem' : 'Clique para adicionar uma imagem'}
                >
                    +Info {scenario.plusInfoImage ? <span className="ml-1">✓</span> : ''}
                </button>
            </div>
        </div>
    );

    const BountyControls = () => (
        <>
            {scenario.gameScenario?.startsWith('Bounty') && (
                <div className="flex flex-col items-center gap-2 mt-2 p-3 bg-brand-bg/50 rounded-lg">
                    <div className="flex items-center self-start gap-2">
                        <input
                            type="checkbox"
                            id={`rp-mode-${scenario.id}`}
                            checked={!!scenario.rpMode}
                            onChange={(e) => handleUpdate('rpMode', e.target.checked)}
                            disabled={isManualMode}
                            className="h-4 w-4 text-brand-secondary bg-brand-bg border-brand-bg rounded focus:ring-brand-secondary disabled:opacity-50"
                        />
                        <label htmlFor={`rp-mode-${scenario.id}`} className="text-sm font-medium text-brand-text">
                            RP Mode
                        </label>
                    </div>

                    {scenario.rpMode && (
                        <div className="w-full">
                            <div className="flex flex-wrap items-start justify-center gap-x-4 gap-y-2 mt-2">
                                {/* Bi Counter */}
                                <div className="relative group">
                                    <label className="text-sm font-medium text-brand-text-muted block text-center mb-1 cursor-help">Bi:</label>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => handleBountyUpdate(Math.max(1, (scenario.startingBounties || 1) - 0.5))}
                                            disabled={isManualMode}
                                            className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-lg bg-brand-bg rounded-md hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            -
                                        </button>
                                        <input 
                                            type="number"
                                            step="0.5"
                                            min="1"
                                            value={scenario.startingBounties ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                handleUpdate('startingBounties', val === '' ? null : parseFloat(val));
                                            }}
                                            onBlur={(e) => {
                                                const value = parseFloat(e.target.value);
                                                if (isNaN(value) || value < 1) {
                                                    alert("Bounty inicial deve ser >= 1");
                                                    handleBountyUpdate(1);
                                                }
                                            }}
                                            disabled={isManualMode}
                                            className="w-14 text-center bg-brand-bg rounded-md py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <button
                                            onClick={() => handleBountyUpdate((scenario.startingBounties || 0) + 0.5)}
                                            disabled={isManualMode}
                                            className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-lg bg-brand-bg rounded-md hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-brand-bg text-brand-text text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        Bountys Iniciais
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-brand-bg"></div>
                                    </div>
                                </div>
                                {/* Si Counter */}
                                <div className="relative group">
                                    <label className="text-sm font-medium text-brand-text-muted block text-center mb-1 cursor-help">Si:</label>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => handleStacksUpdate(Math.max(0.5, (scenario.startingStacks || 0.5) - 0.5))}
                                            disabled={isManualMode}
                                            className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-lg bg-brand-bg rounded-md hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            -
                                        </button>
                                        <input 
                                            type="number"
                                            step="0.5"
                                            min="0.5"
                                            value={scenario.startingStacks ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                handleUpdate('startingStacks', val === '' ? null : parseFloat(val));
                                            }}
                                            onBlur={(e) => {
                                                const value = parseFloat(e.target.value);
                                                if (isNaN(value) || value <= 0) {
                                                    alert("Stack inicial deve ser > 0");
                                                    handleStacksUpdate(0.5);
                                                }
                                            }}
                                            disabled={isManualMode}
                                            className="w-14 text-center bg-brand-bg rounded-md py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <button
                                            onClick={() => handleStacksUpdate((scenario.startingStacks || 0) + 0.5)}
                                            disabled={isManualMode}
                                            className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-lg bg-brand-bg rounded-md hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-brand-bg text-brand-text text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        Stacks Iniciais
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-brand-bg"></div>
                                    </div>
                                </div>
                            </div>
                            {/* DE Display */}
                            {dropEquity !== null && (
                                <div className="mt-2 text-center flex items-center justify-center gap-2">
                                    <span className="text-sm font-medium text-brand-text-muted">Drop Equity: </span>
                                    <span className="text-lg font-bold text-brand-secondary">{dropEquity.toFixed(1)}%</span>
                                    <div className="relative flex items-center group">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-text-muted cursor-help">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                        </svg>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-brand-bg text-brand-text text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-normal">
                                            O cálculo da Drop Equity através desta metodologia (Bounty Power) é mais indicado para Early Stages.
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-brand-bg"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );

    const buttonClass = "px-3 py-1.5 text-xs font-semibold rounded-md transition-all";

    return (
        <>
            <div className="bg-brand-primary rounded-lg border border-brand-bg overflow-hidden">
                <div className="bg-brand-bg p-3">
                     <div className="flex items-center justify-between gap-2 cursor-pointer" onClick={() => onToggleCollapse(scenario.id)}>
                        <div className="flex items-center min-w-0 flex-1">
                            <input
                                type="checkbox"
                                checked={isSelectedForCompare}
                                onChange={() => onToggleCompare(scenario.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 mr-4 bg-brand-primary border-brand-bg rounded text-brand-secondary focus:ring-brand-secondary flex-shrink-0"
                                title="Selecionar para comparação rápida (neste spot)"
                            />
                            {isManualMode ? (
                                <input
                                    type="text"
                                    value={manualTitleInput}
                                    onChange={handleManualTitleChange}
                                    onBlur={handleManualTitleBlur}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') e.currentTarget.blur();
                                        if (e.key === 'Escape') {
                                            setManualTitleInput(scenario.manualTitle || '');
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Digite o título do cenário"
                                    className="font-bold text-lg text-brand-text bg-brand-primary rounded px-2 py-1 w-full min-w-0 focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                                />
                            ) : (
                                <h3 className="font-bold text-lg text-brand-text truncate py-1" title={scenarioTitle}>{scenarioTitle}</h3>
                            )}
                        </div>
                        <button className="text-brand-text-muted hover:text-brand-text w-7 h-7 flex-shrink-0 flex items-center justify-center">
                            {isCollapsed ? '▼' : '▲'}
                        </button>
                    </div>
                    <div className="mt-2 py-1 flex items-center justify-center flex-wrap gap-2">
                        <button 
                            onClick={handleToggleIntelligentCompare} 
                            className={`${buttonClass} border ${isSelectedForIntelligentCompare ? 'bg-brand-secondary/20 text-brand-secondary border-brand-secondary' : 'bg-transparent text-white hover:bg-white/10 border-white/50'}`} 
                            title="Adicionar ou remover da Comparação Inteligente"
                        >
                            Compare +
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleManualMode(); }} 
                            className={`${buttonClass} bg-transparent text-blue-400 hover:bg-blue-400/10 border border-blue-400/50`} 
                            title={isManualMode ? "Voltar para título automático" : "Editar título manualmente"}
                        >
                            Editar Título
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDuplicate(scenario.id); }} 
                            className={`${buttonClass} bg-transparent text-brand-secondary hover:bg-brand-secondary/10 border border-brand-secondary/50`} 
                            title="Duplicar cenário"
                        >
                            Duplicar Cenário
                        </button>
                        
                        <div className="relative" ref={clearMenuRef}>
                            <button 
                                onClick={() => setIsClearMenuOpen(p => !p)} 
                                className={`${buttonClass} bg-transparent text-sky-400 hover:bg-sky-400/10 border border-sky-400/50`} 
                                title="Opções de limpeza"
                            >
                                Limpeza
                            </button>
                            {isClearMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-brand-bg rounded-md shadow-lg z-10 border border-brand-primary overflow-hidden">
                                    <ul>
                                        {scenario.spotType === 'HRC Enviroment' && (
                                            <li><button onClick={(e) => { e.stopPropagation(); handleClearAllSelections(); setIsClearMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-brand-text-muted hover:bg-brand-primary flex items-center gap-2 disabled:opacity-50" disabled={isManualMode}><BrushIcon /> Limpar Botões</button></li>
                                        )}
                                        <li><button onClick={(e) => { e.stopPropagation(); handleClearImages(); setIsClearMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-brand-text-muted hover:bg-brand-primary flex items-center gap-2"><ClearImageIcon /> Limpar Imagens</button></li>
                                        <li><button onClick={(e) => { e.stopPropagation(); handleClearTexts(); setIsClearMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-brand-text-muted hover:bg-brand-primary flex items-center gap-2"><ClearTxtIcon /> Limpar .txt's</button></li>
                                        <li><button onClick={(e) => { e.stopPropagation(); handleClearNotes(); setIsClearMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-brand-text-muted hover:bg-brand-primary flex items-center gap-2"><ClearNotesIcon /> Limpar Anotações</button></li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(scenario.id); }} 
                            className={`${buttonClass} bg-transparent text-orange-500 hover:bg-orange-500/10 border border-orange-500/50`} 
                            title="Excluir cenário"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
                
                {!isCollapsed && (
                    <div className="bg-brand-primary">
                        <CollapsibleSection title="Parâmetros" isOpen={openSections.has('params')} onToggle={() => toggleSection('params')}>
                             {/* HRC Enviroment */}
                            {scenario.spotType === 'HRC Enviroment' && (
                                <div className="flex items-start gap-4">
                                    <div className="flex-grow space-y-4">
                                        <ButtonGroup label="Action/Response" onClear={() => handleUpdate('rangeAction', null)} hasSelection={!!scenario.rangeAction} isDisabled={isManualMode}>
                                            {HRC_ACTIONS.map(action => (
                                                <button key={action} onClick={() => handleUpdate('rangeAction', action)} disabled={isManualMode} className={`px-3 py-1 text-xs rounded-md ${scenario.rangeAction === action ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode ? 'cursor-not-allowed' : ''}`}>{action}</button>
                                            ))}
                                        </ButtonGroup>

                                        {isF3betSelected ? (
                                            <>
                                                <ButtonGroup label="First Raiser Position" onClear={() => handleUpdate('raiserPos', null)} hasSelection={!!scenario.raiserPos} isDisabled={isManualMode}>
                                                    {POSITIONS.filter(p => p !== 'BB').map(pos => (
                                                        <button key={pos} onClick={() => handleUpdate('raiserPos', pos)} disabled={isManualMode} className={`px-3 py-1 text-xs rounded-md ${scenario.raiserPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode ? 'cursor-not-allowed' : ''}`}>{pos}</button>
                                                    ))}
                                                </ButtonGroup>
                                                <ButtonGroup label="3bettor Position" onClear={() => handleUpdate('aggressorPos', null)} hasSelection={!!scenario.aggressorPos} isDisabled={isManualMode || !scenario.raiserPos}>
                                                    {aggressorPositionsForF3bet.map(pos => (
                                                        <button key={pos} onClick={() => handleUpdate('aggressorPos', pos)} disabled={isManualMode || !scenario.raiserPos} className={`px-3 py-1 text-xs rounded-md ${scenario.aggressorPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode || !scenario.raiserPos ? 'cursor-not-allowed' : ''}`}>{pos}</button>
                                                    ))}
                                                </ButtonGroup>
                                                <ButtonGroup label="Hero Position" onClear={() => handleUpdate('heroPos', null)} hasSelection={!!scenario.heroPos} isDisabled={isManualMode || !scenario.aggressorPos}>
                                                    {heroPositionsForF3bet.map(pos => (
                                                        <button key={pos} onClick={() => handleUpdate('heroPos', pos)} disabled={isManualMode || !scenario.aggressorPos} className={`px-3 py-1 text-xs rounded-md ${scenario.heroPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode || !scenario.aggressorPos ? 'cursor-not-allowed' : ''}`}>{pos}</button>
                                                    ))}
                                                </ButtonGroup>
                                            </>
                                        ) : (
                                            <>
                                                <ButtonGroup label="First Raiser Position" onClear={() => handleUpdate('raiserPos', null)} hasSelection={!!scenario.raiserPos} isDisabled={isManualMode}>
                                                    {POSITIONS.filter(p => p !== 'BB').map(pos => (
                                                        <button key={pos} onClick={() => handleUpdate('raiserPos', pos)} disabled={isManualMode} className={`px-3 py-1 text-xs rounded-md ${scenario.raiserPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode ? 'cursor-not-allowed' : ''}`}>{pos}</button>
                                                    ))}
                                                </ButtonGroup>
                                                <ButtonGroup label="Hero Position" onClear={() => handleUpdate('heroPos', null)} hasSelection={!!scenario.heroPos} isDisabled={isRfiSelected || isManualMode}>
                                                    {heroPositions.map(pos => (
                                                        <button key={pos} onClick={() => handleUpdate('heroPos', pos)} disabled={isRfiSelected || isManualMode} className={`px-3 py-1 text-xs rounded-md ${scenario.heroPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isRfiSelected || isManualMode ? 'cursor-not-allowed' : ''}`}>{pos}</button>
                                                    ))}
                                                </ButtonGroup>
                                                {!isRfiSelected && !isF2betSelected && (
                                                    <>
                                                        <ButtonGroup label="Cold Caller Position (CC)" onClear={() => handleUpdate('coldCallerPos', null)} hasSelection={!!scenario.coldCallerPos} isDisabled={isManualMode}>
                                                            {coldCallerPositions.map(pos => (
                                                                <button key={pos} onClick={() => handleUpdate('coldCallerPos', pos)} disabled={isManualMode} className={`px-3 py-1 text-xs rounded-md ${scenario.coldCallerPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode ? 'cursor-not-allowed' : ''}`}>{pos}</button>
                                                            ))}
                                                        </ButtonGroup>
                                                        <ButtonGroup label="3bettor/4bettor/5bettor/Squeezer Position" onClear={() => handleUpdate('aggressorPos', null)} hasSelection={!!scenario.aggressorPos} isDisabled={isManualMode}>
                                                            {aggressorPositions.map(pos => (
                                                                <button key={pos} onClick={() => handleUpdate('aggressorPos', pos)} disabled={isManualMode} className={`px-3 py-1 text-xs rounded-md ${scenario.aggressorPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode ? 'cursor-not-allowed' : ''}`}>{pos}</button>
                                                            ))}
                                                        </ButtonGroup>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0 w-48">
                                        <div className={`${isManualMode ? 'opacity-50' : ''}`}>
                                            <div className="mb-2">
                                                <div className="flex items-center justify-center mb-1.5">
                                                    <label className="block text-sm font-medium text-brand-text-muted mr-2">Modalidade</label>
                                                    {!!scenario.gameScenario && !isManualMode && (
                                                        <button onClick={() => handleGameScenarioUpdate(null)} className="text-brand-text-muted hover:text-brand-text p-1 rounded-full hover:bg-brand-bg" title="Limpar seleção">
                                                            <XIcon />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {HRC_GAME_SCENARIOS_ORDER.map(gs => (
                                                        <button key={gs} onClick={() => handleGameScenarioUpdate(gs)} disabled={isManualMode} className={`w-full truncate text-center px-2 py-1 text-xs rounded-md ${scenario.gameScenario === gs ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode ? 'cursor-not-allowed' : ''}`}>{gs}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <BountyControls />
                                        </div>
                                        {renderInserirButtons()}
                                    </div>
                                </div>
                            )}
                             {/* Blind War */}
                            {scenario.spotType === 'Blind War' && (
                                <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-4">
                                    <ButtonGroup label="Position" onClear={() => handleUpdate('blindWarPosition', null)} hasSelection={!!scenario.blindWarPosition} isDisabled={isManualMode}>
                                        {BLIND_WAR_POSITIONS.map(pos => (
                                            <button key={pos} onClick={() => handleUpdate('blindWarPosition', pos)} disabled={isManualMode} className={`px-4 py-2 rounded-md ${scenario.blindWarPosition === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode ? 'cursor-not-allowed' : ''}`}>{pos}</button>
                                        ))}
                                    </ButtonGroup>
                                    <ButtonGroup label="Action" onClear={() => handleUpdate('blindWarAction', null)} hasSelection={!!scenario.blindWarAction} isDisabled={isManualMode || !scenario.blindWarPosition}>
                                        {BLIND_WAR_ACTIONS.map(action => {
                                            if (action === 'em Gap' && scenario.blindWarPosition !== 'SB') return null;
                                            const isVsLimpDisabled = scenario.blindWarPosition === 'SB' && action === 'vs. Limp';
                                            const isVsRaiseDisabled = scenario.blindWarPosition === 'SB' && action === 'vs. raise';
                                            const isVsIsoDisabled = scenario.blindWarPosition === 'BB' && action === 'vs. ISO';
                                            const isVs3betDisabled = scenario.blindWarPosition === 'BB' && action === 'vs. 3bet';
                                            const baseDisabled = isVsLimpDisabled || isVsRaiseDisabled || isVsIsoDisabled || isVs3betDisabled || isManualMode || !scenario.blindWarPosition;
                                            return (
                                                <button key={action} onClick={() => handleUpdate('blindWarAction', action)} disabled={baseDisabled} className={`px-4 py-2 rounded-md transition-opacity ${scenario.blindWarAction === action ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${baseDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>{action}</button>
                                            );
                                        })}
                                    </ButtonGroup>
                                    <div>
                                        <ButtonGroup label="Modalidade" onClear={() => handleGameScenarioUpdate(null)} hasSelection={!!scenario.gameScenario} isDisabled={isManualMode}>
                                            {GAME_SCENARIOS.map(gs => (
                                                <button key={gs} onClick={() => handleGameScenarioUpdate(gs)} disabled={isManualMode} className={`px-4 py-2 rounded-md ${scenario.gameScenario === gs ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode ? 'cursor-not-allowed' : ''}`}>{gs}</button>
                                            ))}
                                        </ButtonGroup>
                                        <BountyControls />
                                        {renderInserirButtons()}
                                    </div>
                                </div>
                            )}
                            {/* Facing 2bet & Rfi */}
                            {(scenario.spotType === 'Facing 2bet' || scenario.spotType === 'Rfi') && (
                                <div className={`flex flex-wrap items-start gap-x-6 gap-y-4`}>
                                    {scenario.spotType === 'Facing 2bet' && (
                                        <ButtonGroup label="Action" onClear={() => handleUpdate('rangeAction', null)} hasSelection={!!scenario.rangeAction} isDisabled={isManualMode}>
                                            {FACING_2BET_ACTIONS.map(action => (
                                                <button key={action} onClick={() => handleUpdate('rangeAction', action)} disabled={isManualMode} className={`px-3.5 py-1.5 text-sm rounded-md ${scenario.rangeAction === action ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode ? 'cursor-not-allowed' : ''}`}>{action}</button>
                                            ))}
                                        </ButtonGroup>
                                    )}
                                    <ButtonGroup label={scenario.rangeAction === 'RFI' ? 'Posição' : 'First Raiser Position'} onClear={() => handleUpdate('raiserPos', null)} hasSelection={!!scenario.raiserPos} isDisabled={isManualMode}>
                                        {POSITIONS.filter(p => p !== 'BB').map(pos => (
                                            <button key={pos} onClick={() => handleUpdate('raiserPos', pos)} disabled={isManualMode} className={`px-3.5 py-1.5 text-sm rounded-md ${scenario.raiserPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode ? 'cursor-not-allowed' : ''}`}>{pos}</button>
                                        ))}
                                    </ButtonGroup>
                                    {scenario.rangeAction !== 'RFI' && (
                                        <ButtonGroup label="Hero Position" onClear={() => handleUpdate('heroPos', null)} hasSelection={!!scenario.heroPos} isDisabled={isManualMode}>
                                            {heroPositions.map(pos => (
                                                <button key={pos} onClick={() => handleUpdate('heroPos', pos)} disabled={isManualMode} className={`px-3.5 py-1.5 text-sm rounded-md ${scenario.heroPos === pos ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode ? 'cursor-not-allowed' : ''}`}>{pos}</button>
                                            ))}
                                        </ButtonGroup>
                                    )}
                                    <div>
                                        <ButtonGroup label="Modalidade" onClear={() => handleGameScenarioUpdate(null)} hasSelection={!!scenario.gameScenario} isDisabled={isManualMode}>
                                            {GAME_SCENARIOS.map(gs => (
                                                <button key={gs} onClick={() => handleGameScenarioUpdate(gs)} disabled={isManualMode} className={`px-3.5 py-1.5 text-sm rounded-md ${scenario.gameScenario === gs ? 'bg-brand-secondary text-brand-primary font-bold' : 'bg-brand-bg hover:brightness-125'} ${isManualMode ? 'cursor-not-allowed' : ''}`}>{gs}</button>
                                            ))}
                                        </ButtonGroup>
                                        <BountyControls />
                                        {renderInserirButtons()}
                                    </div>
                                </div>
                            )}
                        </CollapsibleSection>
                        
                        <CollapsibleSection title="Mídia & Arquivos" isOpen={openSections.has('media')} onToggle={() => toggleSection('media')}>
                            {scenario.spotType === 'HRC Enviroment' ? (
                                <div className="space-y-4">
                                    <ImageUploader title="Range" imageData={scenario.rangeImage} onUpload={(data) => handleUpdate('rangeImage', data)} className="aspect-[5/3]" onZoom={(src) => setZoomedImage({ src, type: 'rangeImage' })} />
                                    <div className="grid grid-cols-3 gap-2">
                                        <textarea name="raiseSmallText" value={textInputs.raiseSmallText} onChange={handleTextInputChange} onBlur={handleTextInputBlur} placeholder="raise small" className="h-10 bg-brand-bg text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                                        <textarea name="raiseBigText" value={textInputs.raiseBigText} onChange={handleTextInputChange} onBlur={handleTextInputBlur} placeholder="raise big" className="h-10 bg-brand-bg text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                                        <textarea name="callText" value={textInputs.callText} onChange={handleTextInputChange} onBlur={handleTextInputBlur} placeholder="call" className="h-10 bg-brand-bg text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <ImageUploader title="Range" imageData={scenario.rangeImage} onUpload={(data) => handleUpdate('rangeImage', data)} className="aspect-video" onZoom={(src) => setZoomedImage({ src, type: 'rangeImage' })} />
                                    <ImageUploader title="Frequências" imageData={scenario.frequenciesImage} onUpload={(data) => handleUpdate('frequenciesImage', data)} className="aspect-[6/1]" size="small" onZoom={(src) => setZoomedImage({ src, type: 'frequenciesImage' })} />
                                    <div className="grid grid-cols-3 gap-2">
                                        <textarea name="raiseSmallText" value={textInputs.raiseSmallText} onChange={handleTextInputChange} onBlur={handleTextInputBlur} placeholder="raise small" className="h-12 bg-brand-bg text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                                        <textarea name="raiseBigText" value={textInputs.raiseBigText} onChange={handleTextInputChange} onBlur={handleTextInputBlur} placeholder="raise big" className="h-12 bg-brand-bg text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                                        <textarea name="callText" value={textInputs.callText} onChange={handleTextInputChange} onBlur={handleTextInputBlur} placeholder="call" className="h-12 bg-brand-bg text-xs rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                                    </div>
                                </div>
                            )}
                        </CollapsibleSection>
                        
                        <CollapsibleSection title="Anotações" isOpen={openSections.has('notes')} onToggle={() => toggleSection('notes')}>
                            <textarea name="notes" value={textInputs.notes} onChange={handleTextInputChange} onBlur={handleTextInputBlur} placeholder="Anotações..." className="h-48 bg-brand-bg rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full resize-none"></textarea>
                        </CollapsibleSection>
                    </div>
                )}
            </div>
             <ImageEditModal 
                isOpen={!!uploaderTarget}
                onClose={() => setUploaderTarget(null)}
                title={`Inserir Imagem para ${
                    uploaderTarget === 'printSpotImage' ? 'HRC Table View' :
                    uploaderTarget === 'rpImage' ? 'RP' :
                    uploaderTarget === 'tableViewImage' ? 'Table View' :
                    uploaderTarget === 'plusInfoImage' ? '+Info' : ''
                }`}
                initialImageData={initialImageDataForModal}
                onSave={(data) => {
                    if (uploaderTarget) {
                        handleUpdate(uploaderTarget, data);
                    }
                }}
            />
            <ImageViewerModal 
                imageSrc={viewingImage?.src ?? null} 
                onClose={() => setViewingImage(null)}
                onDelete={() => setIsConfirmingDeleteImage(true)}
            />
             <ConfirmationModal
                isOpen={isConfirmingDeleteImage}
                onClose={() => setIsConfirmingDeleteImage(false)}
                onConfirm={performDeleteViewingImage}
                title="Confirmar Exclusão de Imagem"
                message="Deseja realmente excluir esta imagem? Esta ação não pode ser desfeita."
            />
            <RangeZoomModal 
                imageSrc={zoomedImage?.src ?? null} 
                onClose={() => setZoomedImage(null)}
                onDelete={() => setIsConfirmingDeleteZoomedImage(true)} 
            />
            <ConfirmationModal
                isOpen={isConfirmingDeleteZoomedImage}
                onClose={() => setIsConfirmingDeleteZoomedImage(false)}
                onConfirm={performDeleteZoomedImage}
                title="Confirmar Exclusão de Imagem"
                message="Deseja realmente excluir esta imagem? Esta ação não pode ser desfeita."
            />
        </>
    );
}

export default ScenarioEditor;