

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Scenario } from '../types';

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
        <div className="fixed inset-0 flex flex-col justify-center items-center z-[10000] bg-black/80" onClick={onClose}>
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-brand-bg p-2 rounded-lg">
                <button onClick={(e) => { e.stopPropagation(); handleZoomOut(); }} className="w-8 h-8 rounded-md bg-brand-primary text-lg font-bold">-</button>
                <button onClick={(e) => { e.stopPropagation(); handleZoomIn(); }} className="w-8 h-8 rounded-md bg-brand-primary text-lg font-bold">+</button>
                <button onClick={(e) => { e.stopPropagation(); handleZoomReset(); }} className="h-8 px-3 rounded-md bg-brand-primary text-sm">Reset</button>
                <button onClick={onClose} className="w-8 h-8 rounded-md bg-red-700 text-lg font-bold">&times;</button>
            </div>
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

const getNumCols = (gridElement: HTMLElement | null): number => {
    if (gridElement) {
        const gridComputedStyle = window.getComputedStyle(gridElement);
        const gridTemplateColumns = gridComputedStyle.getPropertyValue('grid-template-columns');
        return gridTemplateColumns.split(' ').length;
    }
    // Fallback based on window width if element isn't available yet.
    // These breakpoints should match the Tailwind config.
    // md: 768px, xl: 1280px, 2xl: 1536px
    const width = window.innerWidth;
    if (width >= 1536) return 5;
    if (width >= 1280) return 4;
    if (width >= 768) return 3;
    return 2;
};

const layouts = [
    { type: 'single', label: '2x2', rows: 2, cols: 2 },
    { type: 'single', label: '3x3', rows: 3, cols: 3 },
    { type: 'dual', labels: ['2', '3'], layouts: [{ rows: 2, cols: 3 }, { rows: 3, cols: 2 }] },
    { type: 'dual', labels: ['2', '4'], layouts: [{ rows: 2, cols: 4 }, { rows: 4, cols: 2 }] },
    { type: 'dual', labels: ['2', '5'], layouts: [{ rows: 2, cols: 5 }, { rows: 5, cols: 2 }] },
    { type: 'dual', labels: ['3', '4'], layouts: [{ rows: 3, cols: 4 }, { rows: 4, cols: 3 }] },
    { type: 'dual', labels: ['3', '5'], layouts: [{ rows: 3, cols: 5 }, { rows: 5, cols: 3 }] },
];

// Helper function to determine if a layout button should be enabled
const isLayoutEnabled = (rows: number, cols: number, count: number): boolean => {
    const totalSlots = rows * cols;
    if (totalSlots === 0) return false;
    
    // The rule is: the grid should be mostly full.
    // For smaller grids (<= 6 slots), allow one empty slot.
    // For larger grids (> 6 slots), allow up to two empty slots.
    const min = totalSlots <= 6 ? totalSlots - 1 : totalSlots - 2;
    const max = totalSlots;
    
    return count >= min && count <= max;
};

const gridColClassMap: { [key: number]: string } = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
};

const ComparisonView: React.FC<ComparisonViewProps> = ({ scenarios, onBack }) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const [openModals, setOpenModals] = useState<OpenModal[]>([]);
    const [zIndexCounter, setZIndexCounter] = useState(100);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const lastModalPosition = useRef({ x: 50, y: 50 });

    const [orderedScenarios, setOrderedScenarios] = useState<(Scenario | null)[]>([]);
    const [originalOrder, setOriginalOrder] = useState<Scenario[]>([]);
    const [history, setHistory] = useState<(Scenario | null)[][]>([]);
    
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<{ index: number; position: 'top' | 'bottom' | 'left' | 'right' } | null>(null);
    const [isOverEmpty, setIsOverEmpty] = useState<number | null>(null);

    const [gridCols, setGridCols] = useState<number | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));

    const displayItems = useMemo(() => {
        const items = [...orderedScenarios];
        const numCols = gridCols ?? getNumCols(gridRef.current);
        if (numCols === 0) return items; // Avoid division by zero on initial render

        // Calculate rows needed for content
        // The effective length is the index of the last non-null item + 1
        let effectiveLength = 0;
        for (let i = items.length - 1; i >= 0; i--) {
            if (items[i]) {
                effectiveLength = i + 1;
                break;
            }
        }

        const contentRows = effectiveLength > 0 ? Math.ceil(effectiveLength / numCols) : 0;
        
        // Add a few extra rows to provide ample drop space
        const extraRows = 3;
        const totalRows = contentRows + extraRows;
        const desiredLength = totalRows * numCols;

        // Pad the array with nulls to fill the grid
        while (items.length < desiredLength) {
            items.push(null);
        }
        return items;
    }, [orderedScenarios, gridCols]);

    useEffect(() => {
        const initial = [...scenarios];
        setOrderedScenarios(initial);
        setOriginalOrder(initial);
        setHistory([]);
    }, [scenarios]);


    const pushToHistory = useCallback((currentState: (Scenario | null)[]) => {
        setHistory(prev => [...prev.slice(-19), currentState]);
    }, []);

    const handleUndo = useCallback(() => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setOrderedScenarios(lastState);
        setHistory(prev => prev.slice(0, prev.length - 1));
    }, [history]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                event.preventDefault();
                handleUndo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo]);

    const handleResetLayout = () => {
        if (JSON.stringify(orderedScenarios) !== JSON.stringify(originalOrder)) {
            pushToHistory(orderedScenarios);
            setOrderedScenarios([...originalOrder]);
        }
        setGridCols(null);
    };

    const handleAdjustLayout = () => {
        const compacted = orderedScenarios.filter(s => s !== null);
        if (compacted.length !== orderedScenarios.length) {
            pushToHistory(orderedScenarios);
            setOrderedScenarios(compacted);
        }
    };
    
    const handleExpressLayout = useCallback((rows: number, cols: number) => {
        const activeScenarios = orderedScenarios.filter((s): s is Scenario => !!s);
        
        const newLayout: (Scenario | null)[] = Array(rows * cols).fill(null);
        
        activeScenarios.forEach((scenario, index) => {
            if (index < newLayout.length) {
                newLayout[index] = scenario;
            }
        });

        pushToHistory(orderedScenarios);
        setOrderedScenarios(newLayout);
        setGridCols(cols);
    }, [orderedScenarios, pushToHistory]);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id); // Necessary for Firefox
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();

        const targetEl = e.currentTarget as HTMLDivElement;
        const scenarioAtTarget = displayItems[index];
        
        if (scenarioAtTarget && scenarioAtTarget.id !== draggedId) {
            setIsOverEmpty(null);
            const rect = targetEl.getBoundingClientRect();
            
            const relX = e.clientX - rect.left;
            const relY = e.clientY - rect.top;

            const proximityToV = Math.abs(relY - rect.height / 2) / (rect.height / 2);
            const proximityToH = Math.abs(relX - rect.width / 2) / (rect.width / 2);

            let position: 'top' | 'bottom' | 'left' | 'right';

            if (proximityToV > proximityToH) {
                 position = relY < rect.height / 2 ? 'top' : 'bottom';
            } else {
                 position = relX < rect.width / 2 ? 'left' : 'right';
            }

            if (!dropTarget || dropTarget.index !== index || dropTarget.position !== position) {
                setDropTarget({ index, position });
            }
        } else if (!scenarioAtTarget) { // It's an empty slot
            setDropTarget(null);
            if (isOverEmpty !== index) {
                setIsOverEmpty(index);
            }
        }
    };


    const handleDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
             setDropTarget(null);
             setIsOverEmpty(null);
        }
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDropTarget(null);
        setIsOverEmpty(null);
    };
    
    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
    
        if (!draggedId) {
            handleDragEnd();
            return;
        }
    
        // The array that is currently rendered on screen.
        const currentLayout = [...displayItems];
        const sourceIndex = currentLayout.findIndex(s => s?.id === draggedId);
        
        // Ensure the dragged item is found and it's not dropped on itself.
        if (sourceIndex === -1) { // Removed sourceIndex === dropIndex check to allow re-ordering into same cell for compaction
            handleDragEnd();
            return;
        }
    
        pushToHistory(orderedScenarios);
        const draggedItem = currentLayout[sourceIndex];
        if (!draggedItem) {
            handleDragEnd();
            return;
        }
    
        let newLayout: (Scenario | null)[] = [];
    
        // --- Determine action: MOVE or INSERT ---
        
        // MOVE: If dropping on an empty slot.
        if (isOverEmpty === dropIndex) {
            newLayout = [...currentLayout];
            // Swap the item and the empty slot.
            newLayout[dropIndex] = draggedItem;
            newLayout[sourceIndex] = null;
        } 
        // INSERT: If dropping on an existing item.
        else if (dropTarget?.index === dropIndex) {
            const targetItem = currentLayout[dropIndex];
            if(!targetItem) {
                handleDragEnd();
                return;
            }
    
            // Create a new compact array without the dragged item to calculate insertion point.
            const compactedItems = orderedScenarios.filter(s => s && s.id !== draggedId);
            
            // Find where to insert relative to the target item in the compacted list.
            let insertionIndex = compactedItems.findIndex(s => s?.id === targetItem.id);
            if(insertionIndex === -1) insertionIndex = compactedItems.length; // Failsafe
    
            const numCols = getNumCols(gridRef.current);
            switch (dropTarget.position) {
                case 'right':
                    insertionIndex += 1;
                    break;
                case 'left':
                    // Splice will insert before, which is correct.
                    break;
                case 'bottom': {
                     // Find the effective index of the target in a "compacted" grid view
                    let targetCompactIndex = -1;
                    let currentCompactIndex = 0;
                    for(let i=0; i<orderedScenarios.length; i++) {
                        if (orderedScenarios[i]) {
                           if (orderedScenarios[i]?.id === targetItem.id) {
                                targetCompactIndex = currentCompactIndex;
                                break;
                           }
                           currentCompactIndex++;
                        }
                    }
                    if (targetCompactIndex === -1) break; // Failsafe
                    
                    const targetRow = Math.floor(targetCompactIndex / numCols);
                    // Insert at the start of the next row.
                    insertionIndex = (targetRow + 1) * numCols;
                    break;
                }
                case 'top': {
                     // Find the effective index of the target in a "compacted" grid view
                    let targetCompactIndex = -1;
                    let currentCompactIndex = 0;
                    for(let i=0; i<orderedScenarios.length; i++) {
                        if (orderedScenarios[i]) {
                           if (orderedScenarios[i]?.id === targetItem.id) {
                                targetCompactIndex = currentCompactIndex;
                                break;
                           }
                           currentCompactIndex++;
                        }
                    }
                    if (targetCompactIndex === -1) break; // Failsafe

                    const targetRow = Math.floor(targetCompactIndex / numCols);
                    // Insert at the start of the current row.
                    insertionIndex = targetRow * numCols;
                    break;
                }
            }
            
            compactedItems.splice(insertionIndex, 0, draggedItem);
            newLayout = compactedItems;
        } else {
            // Invalid drop, do nothing.
            handleDragEnd();
            return;
        }
    
        // --- Finalize state update ---
    
        // Trim trailing nulls from the new layout before saving to state.
        // This keeps the `orderedScenarios` state clean.
        let lastItemIndex = -1;
        for (let i = newLayout.length - 1; i >= 0; i--) {
            if (newLayout[i] !== null) {
                lastItemIndex = i;
                break;
            }
        }
        
        const finalState = lastItemIndex === -1 ? [] : newLayout.slice(0, lastItemIndex + 1);
        setOrderedScenarios(finalState);
        setGridCols(null); // Revert to responsive layout after manual drag/drop
    
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
            
            const newPos = { 
                x: lastModalPosition.current.x + 30, 
                y: lastModalPosition.current.y + 30 
            };
            
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
    
    const numActiveScenarios = useMemo(() => orderedScenarios.filter(s => !!s).length, [orderedScenarios]);
    
    const imageAspectRatioClass = useMemo(() => {
        if (gridCols && gridCols >= 4) {
            // For wide, fixed layouts (e.g., 2x4, 2x5), use a wider aspect ratio
            // to make cards shorter and fit more rows vertically.
            return 'aspect-video';
        }
        if (!gridCols) { // For responsive layout
            // Match the aspect ratio change to the responsive grid column change.
            // `xl:` corresponds to when the grid becomes 4 columns wide.
            return 'aspect-square xl:aspect-video';
        }
        // Default for narrower layouts (2 or 3 columns)
        return 'aspect-square';
    }, [gridCols]);

    const gridClassName = gridCols 
        ? gridColClassMap[gridCols] ?? 'grid-cols-4' 
        : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
    
    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 mb-6 p-3 rounded-lg bg-brand-primary border border-brand-bg">
                {/* Left side: Title */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-brand-text">Análises/Comparações:</h2>
                </div>

                {/* Middle section: All controls, centered */}
                <div className="flex-grow flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                    {/* Control buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-brand-text-muted mr-2">Controles:</span>
                        <button 
                            onClick={handleAdjustLayout}
                            disabled={!orderedScenarios.some(s => s === null)}
                            className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            title="Remover espaços vazios e ajustar o grid"
                        >
                            Ajustar
                        </button>
                        <button 
                            onClick={handleUndo} 
                            disabled={history.length === 0}
                            className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            title="Desfazer (Ctrl+Z)"
                        >
                            Desfazer
                        </button>
                        <button 
                            onClick={handleResetLayout}
                            className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-2 px-3 rounded-md transition-colors text-sm"
                        >
                            Layout Original
                        </button>
                    </div>

                    {/* Express layout buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-brand-text-muted mr-2">Layouts:</span>
                        {layouts.map((layout) => {
                            if (layout.type === 'single') {
                                const enabled = isLayoutEnabled(layout.rows, layout.cols, numActiveScenarios);
                                return (
                                    <button
                                        key={layout.label}
                                        onClick={() => handleExpressLayout(layout.rows, layout.cols)}
                                        disabled={!enabled}
                                        className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        title={enabled ? `Organizar em ${layout.label}` : `Requer um número diferente de cenários`}
                                    >
                                        {layout.label}
                                    </button>
                                );
                            }

                            if (layout.type === 'dual') {
                                const enabled1 = isLayoutEnabled(layout.layouts[0].rows, layout.layouts[0].cols, numActiveScenarios);
                                const enabled2 = isLayoutEnabled(layout.layouts[1].rows, layout.layouts[1].cols, numActiveScenarios);
                                
                                const title1 = enabled1 ? `Organizar em ${layout.layouts[0].rows}x${layout.layouts[0].cols}` : 'Requer um número diferente de cenários';
                                const title2 = enabled2 ? `Organizar em ${layout.layouts[1].rows}x${layout.layouts[1].cols}` : 'Requer um número diferente de cenários';
                                
                                return (
                                    <div
                                        key={`${layout.labels[0]}x${layout.labels[1]}`}
                                        className={`flex items-center justify-center bg-brand-bg text-brand-text font-semibold rounded-md transition-colors text-sm ${(!enabled1 && !enabled2) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span
                                            onClick={(e) => {
                                                if (enabled1) {
                                                    e.stopPropagation();
                                                    handleExpressLayout(layout.layouts[0].rows, layout.layouts[0].cols);
                                                }
                                            }}
                                            className={`py-1.5 px-3 rounded-l-md ${enabled1 ? 'hover:bg-brand-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                            title={title1}
                                        >
                                            {layout.labels[0]}
                                        </span>
                                        <span className="text-brand-text-muted text-xs select-none">x</span>
                                        <span
                                            onClick={(e) => {
                                                if (enabled2) {
                                                    e.stopPropagation();
                                                    handleExpressLayout(layout.layouts[1].rows, layout.layouts[1].cols);
                                                }
                                            }}
                                            className={`py-1.5 px-3 rounded-r-md ${enabled2 ? 'hover:bg-brand-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                            title={title2}
                                        >
                                            {layout.labels[1]}
                                        </span>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                    
                    {/* Zoom Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-brand-text-muted mr-2">Zoom:</span>
                        <button
                            onClick={handleZoomOut}
                            className="bg-brand-bg hover:brightness-125 text-brand-text font-bold w-8 h-8 rounded-md transition-colors text-lg flex items-center justify-center"
                            title="Diminuir zoom"
                        >
                            -
                        </button>
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.01"
                            value={zoomLevel}
                            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                            className="w-32 h-2 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-secondary"
                            title={`Zoom: ${Math.round(zoomLevel * 100)}%`}
                        />
                        <button
                            onClick={handleZoomIn}
                            className="bg-brand-bg hover:brightness-125 text-brand-text font-bold w-8 h-8 rounded-md transition-colors text-lg flex items-center justify-center"
                            title="Aumentar zoom"
                        >
                            +
                        </button>
                    </div>

                </div>

                {/* Right side: Back button */}
                <div className="flex items-center flex-shrink-0 gap-4">
                    {openModals.length > 1 && (
                        <button 
                            onClick={handleCloseAll}
                            className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-md shadow-lg transition-transform hover:scale-105"
                        >
                            Fechar Tudo
                        </button>
                    )}
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
                    style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top left',
                        transition: 'transform 0.2s ease-out',
                    }}
                >
                    <div
                        ref={gridRef}
                        className={`grid ${gridClassName} gap-4`}
                        onDragEnd={handleDragEnd}
                    >
                        {displayItems.map((scenario, index) => {
                            const isBeingDragged = draggedId === scenario?.id;
                            
                            // RENDER CARD
                            if (scenario) {
                                return (
                                    <div
                                        key={scenario.id}
                                        className="relative"
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragLeave={handleDragLeave}
                                    >
                                        <div className={`absolute -top-1 left-0 right-0 h-2 bg-brand-secondary rounded-full transition-transform duration-150 origin-center z-10 ${dropTarget?.index === index && dropTarget.position === 'top' ? 'scale-x-100' : 'scale-x-0'}`} />
                                        <div className={`absolute -bottom-1 left-0 right-0 h-2 bg-brand-secondary rounded-full transition-transform duration-150 origin-center z-10 ${dropTarget?.index === index && dropTarget.position === 'bottom' ? 'scale-x-100' : 'scale-x-0'}`} />
                                        <div className={`absolute -left-1 top-0 bottom-0 w-2 bg-brand-secondary rounded-full transition-transform duration-150 origin-center z-10 ${dropTarget?.index === index && dropTarget.position === 'left' ? 'scale-y-100' : 'scale-y-0'}`} />
                                        <div className={`absolute -right-1 top-0 bottom-0 w-2 bg-brand-secondary rounded-full transition-transform duration-150 origin-center z-10 ${dropTarget?.index === index && dropTarget.position === 'right' ? 'scale-y-100' : 'scale-y-0'}`} />
                                        
                                        <div
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, scenario.id)}
                                            className={`w-full h-full bg-brand-primary rounded-lg p-3 border border-brand-bg cursor-move transition-opacity flex flex-col ${isBeingDragged ? 'opacity-20' : ''}`}
                                        >
                                            <h3 className="font-bold text-center text-brand-text truncate mb-2 flex-shrink-0" title={getScenarioTitle(scenario)}>
                                                {getScenarioTitle(scenario)}
                                            </h3>
                                            
                                            <div className={`bg-brand-bg ${imageAspectRatioClass} rounded flex items-center justify-center relative flex-shrink-0`}>
                                                {scenario.rangeImage ? (
                                                <>
                                                    <img src={scenario.rangeImage} alt="Range" className="max-w-full max-h-full object-contain"/>
                                                    <div
                                                    className="absolute inset-0 cursor-zoom-in"
                                                    onClick={() => scenario.rangeImage && setZoomedImage(scenario.rangeImage)}
                                                    title="Ampliar imagem"
                                                    />
                                                </>
                                                ) : (
                                                <span className="text-gray-500 text-sm">Sem Imagem</span>
                                                )}
                                            </div>
                                            
                                            {scenario.frequenciesImage && (
                                                <div className="bg-brand-bg aspect-[6/1] rounded flex items-center justify-center relative mt-2 flex-shrink-0">
                                                <img src={scenario.frequenciesImage} alt="Frequências" className="max-w-full max-h-full object-contain"/>
                                                <div
                                                    className="absolute inset-0 cursor-zoom-in"
                                                    onClick={() => setZoomedImage(scenario.frequenciesImage)}
                                                    title="Ampliar imagem"
                                                />
                                                </div>
                                            )}

                                            <div className="mt-auto pt-2 flex-shrink-0">
                                                {(scenario.printSpotImage || scenario.rpImage || scenario.tableViewImage || scenario.plusInfoImage) && (
                                                    <div className="flex justify-center flex-wrap gap-1.5">
                                                    {scenario.printSpotImage && <button onClick={() => handleOpenImage(scenario, 'printSpotImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">HRC Table View</button>}
                                                    {scenario.rpImage && <button onClick={() => handleOpenImage(scenario, 'rpImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">RP</button>}
                                                    {scenario.tableViewImage && <button onClick={() => handleOpenImage(scenario, 'tableViewImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">Table View</button>}
                                                    {scenario.plusInfoImage && <button onClick={() => handleOpenImage(scenario, 'plusInfoImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">+Info</button>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                            
                            // RENDER EMPTY CELL
                            return (
                                <div
                                    key={`empty-${index}`}
                                    className={`w-full min-h-[250px] rounded-lg transition-colors duration-150 ${isOverEmpty === index ? 'bg-brand-secondary/10 border-2 border-dashed border-brand-secondary' : ''}`}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragLeave={handleDragLeave}
                                />
                            )
                        })}
                    </div>
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