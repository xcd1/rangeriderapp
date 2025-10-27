
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Scenario, SpotType } from '../types';

const getScenarioTitle = (scenario: Scenario): string => {
    if (scenario.manualTitle) {
        return scenario.manualTitle;
    }

    const { spotType, gameScenario } = scenario;
    const gsSuffix = gameScenario ? ` [${gameScenario}]` : '';

    if (spotType === 'Blind War') {
        const { blindWarPosition, blindWarAction } = scenario;
        if (!blindWarPosition || !blindWarAction) return `Blind War (Incompleto)${gsSuffix}`;
        return `Blind War: ${blindWarPosition} ${blindWarAction}${gsSuffix}`;
    }
    
    if (spotType === 'HRC Enviroment') {
        const { rangeAction, raiserPos, heroPos, coldCallerPos, aggressorPos } = scenario;
        if (!rangeAction) return `HRC Enviroment (Incompleto)${gsSuffix}`;

        let baseTitle = `${rangeAction}`;
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

    // Default to "Facing 2bet" / "Rfi" logic
    const { rangeAction, raiserPos, heroPos } = scenario;
    if (!rangeAction) return `Cenário Incompleto${gsSuffix}`;
    if (rangeAction === 'RFI') {
        return raiserPos ? `RFI: ${raiserPos}${gsSuffix}` : `RFI (Incompleto)${gsSuffix}`;
    }
    if (rangeAction === 'F2bet') {
        return raiserPos && heroPos ? `F2bet: ${heroPos} vs ${raiserPos}${gsSuffix}` : `F2bet (Incompleto)${gsSuffix}`;
    }
    
    return `${rangeAction} (Incompleto)${gsSuffix}`;
};

// --- RangeZoomModal Component (for main range images) ---
interface RangeZoomModalProps {
    imageSrc: string;
    onClose: () => void;
}
const RangeZoomModal: React.FC<RangeZoomModalProps> = ({ imageSrc, onClose }) => {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const imgRef = useRef<HTMLImageElement>(null);
    const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });

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
        e.currentTarget.style.cursor = 'grab';
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!dragInfo.current.isDragging) return;
        const dx = (e.clientX - dragInfo.current.startX) / scale;
        const dy = (e.clientY - dragInfo.current.startY) / scale;
        setOffset({ x: dragInfo.current.initialX + dx, y: dragInfo.current.initialY + dy });
    };
    
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) handleZoomIn();
        else handleZoomOut();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-[10000]" onClick={onClose}>
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-brand-bg p-2 rounded-lg">
                <button onClick={(e) => { e.stopPropagation(); handleZoomOut(); }} className="w-8 h-8 rounded-md bg-brand-primary text-lg font-bold">-</button>
                <button onClick={(e) => { e.stopPropagation(); handleZoomIn(); }} className="w-8 h-8 rounded-md bg-brand-primary text-lg font-bold">+</button>
                <button onClick={(e) => { e.stopPropagation(); handleZoomReset(); }} className="h-8 px-3 rounded-md bg-brand-primary text-sm">Reset</button>
                <button onClick={onClose} className="w-8 h-8 rounded-md bg-red-700 text-lg font-bold">&times;</button>
            </div>
            <div className="w-full h-full flex items-center justify-center overflow-hidden" onWheel={handleWheel}>
                <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Range ampliado"
                    className="max-w-none max-h-none transition-transform duration-100"
                    style={{ 
                        transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
                        cursor: scale > 1 ? 'grab' : 'default'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves image
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
};


// --- DraggableImageViewer Component ---
interface DraggableImageViewerProps {
  id: string;
  title: string;
  imageSrc: string;
  zIndex: number;
  initialPosition: { x: number; y: number };
  onClose: (id: string) => void;
  onBringToFront: (id: string) => void;
}

const DraggableImageViewer: React.FC<DraggableImageViewerProps> = ({ id, title, imageSrc, zIndex, initialPosition, onClose, onBringToFront }) => {
    const [position, setPosition] = useState(initialPosition);
    const [size, setSize] = useState({ width: 560, height: 490 });
    const stateRef = useRef({
        isDragging: false,
        isResizing: false,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
        initialW: 0,
        initialH: 0,
    });

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (stateRef.current.isDragging) {
            const dx = event.clientX - stateRef.current.startX;
            const dy = event.clientY - stateRef.current.startY;
            setPosition({ x: stateRef.current.initialX + dx, y: stateRef.current.initialY + dy });
        }
        if (stateRef.current.isResizing) {
            const dx = event.clientX - stateRef.current.startX;
            const dy = event.clientY - stateRef.current.startY;
            setSize({
                width: Math.max(300, stateRef.current.initialW + dx),
                height: Math.max(250, stateRef.current.initialH + dy),
            });
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        stateRef.current.isDragging = false;
        stateRef.current.isResizing = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = '';

        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault(); // Prevent text selection
        onBringToFront(id);
        stateRef.current = {
            ...stateRef.current,
            isDragging: true,
            isResizing: false,
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y,
        };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'move';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        onBringToFront(id);
        stateRef.current = {
            ...stateRef.current,
            isDragging: false,
            isResizing: true,
            startX: e.clientX,
            startY: e.clientY,
            initialW: size.width,
            initialH: size.height,
        };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'se-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    useEffect(() => {
        // Safety cleanup on unmount
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return (
        <div 
            className="fixed bg-brand-primary rounded-lg shadow-2xl border-2 border-brand-secondary/50 flex flex-col"
            style={{ 
                left: position.x, 
                top: position.y, 
                zIndex: zIndex,
                width: `${size.width}px`,
                height: `${size.height}px`,
             }}
            onMouseDown={() => onBringToFront(id)}
        >
            <div 
                className="bg-brand-bg text-brand-text p-2 rounded-t-lg flex justify-between items-center cursor-move"
                onMouseDown={handleDragMouseDown}
            >
                <span className="text-sm font-bold truncate pr-2">{title}</span>
                <button 
                    onClick={() => onClose(id)}
                    className="text-white bg-red-600 hover:bg-red-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0"
                >
                    &times;
                </button>
            </div>
            <div className="p-2 flex-grow flex items-center justify-center relative overflow-hidden bg-brand-bg/20">
                <img src={imageSrc} alt={title} className="max-w-full max-h-full object-contain"/>
            </div>
             <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100"
                onMouseDown={handleResizeMouseDown}
                title="Redimensionar"
                style={{
                  borderBottom: '4px solid #f5c339',
                  borderRight: '4px solid #f5c339',
                  borderBottomRightRadius: '4px',
                }}
             />
        </div>
    );
};


// --- ComparisonView Component ---
interface OpenModal {
  id: string;
  title: string;
  imageSrc: string;
  zIndex: number;
  position: { x: number; y: number };
}

interface ComparisonViewProps {
    scenarios: Scenario[];
    onBack: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ scenarios, onBack }) => {
    const [openModals, setOpenModals] = useState<OpenModal[]>([]);
    const [zIndexCounter, setZIndexCounter] = useState(100);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const lastModalPosition = useRef({ x: 50, y: 50 });

    // State for reordering functionality
    const [orderedScenarios, setOrderedScenarios] = useState(scenarios);
    const [originalOrder, setOriginalOrder] = useState(scenarios);
    const [history, setHistory] = useState<Scenario[][]>([]);
    const dragItem = useRef<string | null>(null);
    const [placeholderIndex, setPlaceholderIndex] = useState<number | null>(null);

    // FIX: This effect synchronizes the component's internal state with the `scenarios`
    // prop. This is crucial because the prop may initially be an empty or incomplete
    // array while data is loading asynchronously. Without this, the component would
    // hold onto stale data, causing issues like missing images when restoring a session.
    useEffect(() => {
        setOrderedScenarios(scenarios);
        setOriginalOrder(scenarios);
        setHistory([]); // Reset history when the source data changes
    }, [scenarios]);


    // Undo handler
    const handleUndo = useCallback(() => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setOrderedScenarios(lastState);
        setHistory(prev => prev.slice(0, prev.length - 1));
    }, [history]);

    // Effect for Ctrl+Z keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                event.preventDefault();
                handleUndo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleUndo]);

    // Reset to original layout
    const handleResetLayout = () => {
        if (JSON.stringify(orderedScenarios) !== JSON.stringify(originalOrder)) {
            setHistory(prev => [...prev, orderedScenarios]);
            setOrderedScenarios(originalOrder);
        }
    };
    
    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        dragItem.current = id;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        e.preventDefault();
        const draggedItemId = dragItem.current;
        if (!draggedItemId || draggedItemId === id) return;

        const overItemIndex = orderedScenarios.findIndex(s => s.id === id);
        if (overItemIndex === -1) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const isOverTopHalf = e.clientY < rect.top + rect.height / 2;
        
        const draggedItemIndex = orderedScenarios.findIndex(s => s.id === draggedItemId);
        
        let newIndex = isOverTopHalf ? overItemIndex : overItemIndex + 1;
        
        if (draggedItemIndex !== -1 && draggedItemIndex < newIndex) {
            newIndex--;
        }

        if (placeholderIndex !== newIndex) {
            setPlaceholderIndex(newIndex);
        }
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        setPlaceholderIndex(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        
        const draggedItemId = dragItem.current;
        if (!draggedItemId || placeholderIndex === null) {
            handleDragEnd();
            return;
        }
        
        const dragItemIndex = orderedScenarios.findIndex(item => item.id === draggedItemId);
        if (dragItemIndex === -1 || dragItemIndex === placeholderIndex) {
            handleDragEnd();
            return;
        }

        setHistory(prev => [...prev, orderedScenarios]);

        const newOrderedScenarios = [...orderedScenarios];
        const [reorderedItem] = newOrderedScenarios.splice(dragItemIndex, 1);
        newOrderedScenarios.splice(placeholderIndex, 0, reorderedItem);

        setOrderedScenarios(newOrderedScenarios);
        handleDragEnd();
    };


    const handleOpenImage = (scenario: Scenario, type: 'printSpotImage' | 'rpImage' | 'tableViewImage' | 'plusInfoImage') => {
        const modalId = `${scenario.id}-${type}`;
        const existingModal = openModals.find(m => m.id === modalId);

        const newZIndex = zIndexCounter + 1;
        setZIndexCounter(newZIndex);

        if (existingModal) {
            handleBringToFront(modalId);
        } else {
            const imageSrc = scenario[type];
            if (!imageSrc) return;

            let buttonLabel = '';
            switch(type) {
                case 'printSpotImage': buttonLabel = 'HRC Table View'; break;
                case 'rpImage': buttonLabel = 'RP'; break;
                case 'tableViewImage': buttonLabel = 'Table View'; break;
                case 'plusInfoImage': buttonLabel = '+Info'; break;
            }

            const title = `${getScenarioTitle(scenario)} - ${buttonLabel}`;
            
            // Cascading position logic
            const newPos = { 
                x: lastModalPosition.current.x + 30, 
                y: lastModalPosition.current.y + 30 
            };
            
            // Wrap around if it goes off screen
            if (newPos.x > window.innerWidth - 400 || newPos.y > window.innerHeight - 400) {
                lastModalPosition.current = { x: 50, y: 50 };
                newPos.x = lastModalPosition.current.x + 30;
                newPos.y = lastModalPosition.current.y + 30;
            }
            lastModalPosition.current = newPos;

            setOpenModals(current => [...current, { id: modalId, title, imageSrc, zIndex: newZIndex, position: newPos }]);
        }
    };
    
    const handleCloseImage = (id: string) => {
        setOpenModals(current => current.filter(m => m.id !== id));
    };

    const handleBringToFront = (id: string) => {
        const newZIndex = zIndexCounter + 1;
        setZIndexCounter(newZIndex);
        setOpenModals(current => 
            current.map(m => m.id === id ? { ...m, zIndex: newZIndex } : m)
        );
    };

    const handleCloseAll = () => setOpenModals([]);
    
    const isDragging = dragItem.current && placeholderIndex !== null;
    const visualScenarios = isDragging 
        ? (() => {
            const scenariosCopy = [...orderedScenarios];
            const draggedItemIndex = scenariosCopy.findIndex(s => s.id === dragItem.current);
            if (draggedItemIndex > -1) {
                scenariosCopy.splice(draggedItemIndex, 1);
            }
            const placeholderItem = { id: 'placeholder-card' } as Scenario; // Dummy item
            scenariosCopy.splice(placeholderIndex!, 0, placeholderItem);
            return scenariosCopy;
          })() 
        : orderedScenarios;


    return (
        <div>
            {openModals.length > 1 && (
                <button 
                    onClick={handleCloseAll}
                    className="fixed top-6 right-6 z-[9999] bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform hover:scale-105"
                >
                    Fechar Tudo
                </button>
            )}
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-brand-text">Comparação de Ranges</h2>
                 <div className="flex items-center gap-4">
                    <button 
                        onClick={handleUndo} 
                        disabled={history.length === 0}
                        className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Desfazer (Ctrl+Z)"
                    >
                        Desfazer
                    </button>
                    <button 
                        onClick={handleResetLayout}
                        className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors"
                    >
                        Layout Original
                    </button>
                    <button onClick={onBack} className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors">
                        &larr; Voltar
                    </button>
                </div>
            </div>
            {scenarios.length < 2 ? (
                 <div className="text-center py-12 text-brand-text-muted">
                    <p>Selecione 2 ou mais cenários para comparar.</p>
                </div>
            ) : (
                <div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    {visualScenarios.map(scenario => {
                        if (scenario.id === 'placeholder-card') {
                            return (
                                <div 
                                    key="placeholder"
                                    className="bg-brand-primary/50 border-2 border-dashed border-brand-secondary rounded-lg"
                                />
                            );
                        }
                        
                        const title = getScenarioTitle(scenario);
                        const isBeingDragged = dragItem.current === scenario.id;
                        
                        return (
                            <div 
                                key={scenario.id}
                                id={`comp-card-${scenario.id}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, scenario.id)}
                                onDragOver={(e) => handleDragOver(e, scenario.id)}
                                onDragEnd={handleDragEnd}
                                className={`bg-brand-primary rounded-lg p-4 border border-brand-bg cursor-move transition-opacity ${isBeingDragged ? 'opacity-20' : ''}`}
                            >
                                <div
                                    draggable="false"
                                    onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    className="flex flex-col gap-4 cursor-default"
                                >
                                    <h3 className="font-bold text-center text-brand-text truncate" title={title}>
                                        {title}
                                    </h3>
                                    
                                    <div 
                                        className="bg-brand-bg aspect-[7/6] rounded flex items-center justify-center relative"
                                    >
                                        {scenario.rangeImage ? (
                                            <>
                                                <img src={scenario.rangeImage} alt="Range" className="max-w-full max-h-full object-contain"/>
                                                <div
                                                    className="absolute w-1/2 h-1/2 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-zoom-in"
                                                    onClick={() => scenario.rangeImage && setZoomedImage(scenario.rangeImage)}
                                                    title="Ampliar imagem"
                                                />
                                            </>
                                        ) : (
                                            <span className="text-gray-500 text-sm">Sem Imagem de Range</span>
                                        )}
                                    </div>
                                    
                                    {scenario.frequenciesImage && (
                                        <div 
                                            className="bg-brand-bg aspect-[6/1] rounded flex items-center justify-center relative"
                                        >
                                            <img src={scenario.frequenciesImage} alt="Frequências" className="max-w-full max-h-full object-contain"/>
                                            <div
                                                className="absolute w-1/2 h-1/2 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-zoom-in"
                                                onClick={() => setZoomedImage(scenario.frequenciesImage)}
                                                title="Ampliar imagem"
                                            />
                                        </div>
                                    )}

                                    {(scenario.printSpotImage || scenario.rpImage || scenario.tableViewImage || scenario.plusInfoImage) && (
                                        <div className="flex justify-center flex-wrap gap-2 mt-auto pt-2">
                                            {scenario.printSpotImage && (
                                                <button 
                                                    onClick={() => handleOpenImage(scenario, 'printSpotImage')}
                                                    className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1.5 px-3 rounded-md transition-colors text-sm"
                                                >
                                                    HRC Table View
                                                </button>
                                            )}
                                            {scenario.rpImage && (
                                                <button 
                                                    onClick={() => handleOpenImage(scenario, 'rpImage')}
                                                    className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1.5 px-3 rounded-md transition-colors text-sm"
                                                >
                                                    RP
                                                </button>
                                            )}
                                            {scenario.tableViewImage && (
                                                <button 
                                                    onClick={() => handleOpenImage(scenario, 'tableViewImage')}
                                                    className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1.5 px-3 rounded-md transition-colors text-sm"
                                                >
                                                    Table View
                                                </button>
                                            )}
                                            {scenario.plusInfoImage && (
                                                <button 
                                                    onClick={() => handleOpenImage(scenario, 'plusInfoImage')}
                                                    className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1.5 px-3 rounded-md transition-colors text-sm"
                                                >
                                                    +Info
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            
            {openModals.map(modal => (
                <DraggableImageViewer
                    key={modal.id}
                    id={modal.id}
                    title={modal.title}
                    imageSrc={modal.imageSrc}
                    zIndex={modal.zIndex}
                    initialPosition={modal.position}
                    onClose={handleCloseImage}
                    onBringToFront={handleBringToFront}
                />
            ))}
            {zoomedImage && (
                <RangeZoomModal imageSrc={zoomedImage} onClose={() => setZoomedImage(null)} />
            )}
        </div>
    );
};

export default ComparisonView;