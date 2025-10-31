

import React, { useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import ConfirmationModal from './ConfirmationModal';
import type { Folder, Notebook } from '../types';
import ProfileModal from './ProfileModal';

// Helper to prevent dropping a folder into itself or its children
const isAncestor = (draggedId: string, targetId: string | null, allFolders: Folder[]): boolean => {
    if (!targetId) return false;
    if (targetId === draggedId) return true; // Found itself
    const targetFolder = allFolders.find(f => f.id === targetId);
    if (!targetFolder || !targetFolder.parentId) return false;
    return isAncestor(draggedId, targetFolder.parentId, allFolders);
};

// Action Menu Component
const ActionMenu: React.FC<{ children: React.ReactNode, isActive: boolean }> = ({ children, isActive }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(prev => !prev);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={handleButtonClick}
                className={`w-6 h-6 flex items-center justify-center rounded-full transition-opacity ${
                    isActive
                        ? 'opacity-100 text-brand-primary/70 hover:bg-black/10'
                        : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:bg-brand-primary'
                }`}
                title="Mais opções"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>
            {isOpen && (
                <div 
                    className="absolute top-full right-0 mt-2 w-48 bg-brand-bg rounded-md shadow-lg z-20 border border-brand-primary overflow-hidden"
                    onClick={() => setIsOpen(false)}
                >
                    <ul className="text-sm text-brand-text divide-y divide-brand-primary/50">
                        {children}
                    </ul>
                </div>
            )}
        </div>
    );
};

const ActionMenuItem: React.FC<{ onClick: (e: React.MouseEvent) => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className = '' }) => (
    <li>
        <button
            onClick={onClick}
            className={`w-full text-left px-3 py-2 hover:bg-brand-primary flex items-center gap-3 transition-colors ${className}`}
        >
            {children}
        </button>
    </li>
);


interface NotebookItemProps {
    notebook: Notebook;
    isActive: boolean;
    isDeleting: boolean;
    isEditing: boolean;
    isAnyItemBeingEdited: boolean;
    editedName: string;
    onSelect: () => void;
    onStartEditing: () => void;
    onCancelEditing: () => void;
    onSaveName: () => void;
    onNameChange: (name: string) => void;
    onNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onPromptDelete: () => void;
    onDuplicate: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onMove: (direction: 'up' | 'down') => void;
    isFirst: boolean;
    isLast: boolean;
}

const NotebookItem: React.FC<NotebookItemProps> = ({
    notebook, isActive, isDeleting, isEditing, isAnyItemBeingEdited, editedName,
    onSelect, onStartEditing, onCancelEditing, onSaveName, onNameChange, onNameKeyDown, onPromptDelete, onDuplicate,
    onDragStart, onDragEnd, onMove, isFirst, isLast
}) => {
    return (
        <li 
            draggable={!isAnyItemBeingEdited}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={`group flex items-center justify-between p-2 text-sm rounded-md transition-colors ${
                isActive && !isEditing ? 'bg-brand-secondary text-brand-primary font-bold' : 'text-brand-text hover:bg-brand-bg'
            } ${isDeleting ? 'opacity-50' : ''}`}
        >
            {isEditing ? (
                <>
                    <input
                        type="text"
                        value={editedName}
                        onChange={(e) => onNameChange(e.target.value)}
                        onKeyDown={onNameKeyDown}
                        onBlur={onSaveName}
                        onMouseDown={(e) => e.stopPropagation()}
                        autoFocus
                        className="flex-grow bg-brand-bg text-brand-text rounded-md px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary mx-2 w-full"
                    />
                </>
            ) : (
                <>
                    <div
                        onClick={onSelect}
                        className={`flex items-center flex-grow truncate ${isDeleting ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                            <path d="M3 8a2 2 0 012-2v8a2 2 0 01-2 2H3a2 2 0 01-2-2v-4a2 2 0 012-2h1z" />
                        </svg>
                        <span className="truncate pr-2" title={notebook.name}>{notebook.name}</span>
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center gap-1">
                        <button
                            onClick={() => onMove('up')}
                            disabled={isFirst || isDeleting}
                            className={`w-6 h-6 flex items-center justify-center rounded transition-opacity disabled:opacity-20 disabled:cursor-not-allowed ${
                                isActive
                                ? 'opacity-100 text-brand-primary/70 hover:text-green-500'
                                : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-green-500'
                            }`}
                            title="Mover para cima"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-[19px] w-[19px]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        </button>
                        <button
                            onClick={() => onMove('down')}
                            disabled={isLast || isDeleting}
                            className={`w-6 h-6 flex items-center justify-center rounded transition-opacity disabled:opacity-20 disabled:cursor-not-allowed ${
                                isActive
                                ? 'opacity-100 text-brand-primary/70 hover:text-green-500'
                                : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-green-500'
                            }`}
                            title="Mover para baixo"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-[19px] w-[19px]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                        <ActionMenu isActive={isActive}>
                            <ActionMenuItem onClick={onStartEditing}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                Renomear
                            </ActionMenuItem>
                            <ActionMenuItem onClick={onDuplicate}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M4 3a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V3z" /></svg>
                                Duplicar
                            </ActionMenuItem>
                            <ActionMenuItem onClick={onPromptDelete} className="text-red-400 hover:bg-red-800/50">
                                {isDeleting 
                                    ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400"></div> 
                                    : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                }
                                Excluir
                            </ActionMenuItem>
                        </ActionMenu>
                    </div>
                </>
            )}
        </li>
    );
};


interface SidebarProps {
  width: number;
}

const Sidebar: React.FC<SidebarProps> = ({ width }) => {
  const context = useContext(AppContext);
  // Notebook states
  const [newNotebookName, setNewNotebookName] = useState('');
  const [deletingNotebookId, setDeletingNotebookId] = useState<string | null>(null);
  const [notebookToDelete, setNotebookToDelete] = useState<{id: string; name: string} | null>(null);
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(null);
  const [editedNotebookName, setEditedNotebookName] = useState('');

  // Folder states
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editedFolderName, setEditedFolderName] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  
  // Drag & Drop states
  const [draggedItem, setDraggedItem] = useState<{ id: string, type: 'notebook' | 'folder' } | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  // Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const isAnyItemBeingEdited = !!editingNotebookId || !!editingFolderId;
  const isStateLoaded = useRef(false);


  if (!context) return null;
  const { 
      notebooks, folders, activeNotebookId, setActiveNotebookId, user, logout,
      addNotebook, deleteNotebook, updateNotebook, duplicateNotebook,
      addFolder, deleteFolder, updateFolder,
      swapItemsOrder
  } = context;
  
  // Load collapsed folders state from localStorage on mount/login
  useEffect(() => {
    if (user?.uid) {
        const saved = localStorage.getItem(`collapsedFolders-${user.uid}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setCollapsedFolders(new Set(parsed));
                }
            } catch (e) {
                console.error("Failed to parse collapsed folders from localStorage", e);
                setCollapsedFolders(new Set());
            }
        }
        // Mark state as loaded to allow saving.
        // Use a timeout to ensure this runs after the initial state is set and avoids race conditions.
        setTimeout(() => {
          isStateLoaded.current = true;
        }, 0);
    } else {
        // Reset when user logs out
        isStateLoaded.current = false;
        setCollapsedFolders(new Set());
    }
  }, [user?.uid]);
  
  // Save collapsed folders state to localStorage on change
  useEffect(() => {
    // Only save if the state has been loaded from localStorage for the current user
    if (user?.uid && isStateLoaded.current) {
        localStorage.setItem(`collapsedFolders-${user.uid}`, JSON.stringify(Array.from(collapsedFolders)));
    }
  }, [collapsedFolders, user?.uid]);

  const { rootFolders, foldersByParent, rootNotebooks, notebooksByFolder } = useMemo(() => {
    const foldersByParent: Record<string, Folder[]> = {};
    const rootFolders: Folder[] = [];
    folders.forEach(f => {
      const parentId = f.parentId;
      if (parentId && folders.some(pf => pf.id === parentId)) {
        if (!foldersByParent[parentId]) foldersByParent[parentId] = [];
        foldersByParent[parentId].push(f);
      } else {
        rootFolders.push(f);
      }
    });

    const rootNotebooks: Notebook[] = [];
    const notebooksByFolder: Record<string, Notebook[]> = {};
    notebooks.forEach(nb => {
      const folderId = nb.folderId;
      if (folderId && folders.some(f => f.id === folderId)) {
        if (!notebooksByFolder[folderId]) notebooksByFolder[folderId] = [];
        notebooksByFolder[folderId].push(nb);
      } else {
        rootNotebooks.push(nb);
      }
    });
    return { rootFolders, foldersByParent, rootNotebooks, notebooksByFolder };
  }, [notebooks, folders]);

  // --- Notebook Handlers ---
  const handleAddNotebook = async () => {
    let notebookNameToAdd = newNotebookName.trim();
    if (notebookNameToAdd === '') {
      let maxNumber = 0;
      notebooks.forEach(notebook => {
        const match = notebook.name.match(/^Caderno (\d+)$/);
        if (match) maxNumber = Math.max(maxNumber, parseInt(match[1], 10));
      });
      notebookNameToAdd = `Caderno ${maxNumber + 1}`;
    }
    await addNotebook(notebookNameToAdd);
    setNewNotebookName('');
  };

  const handleConfirmDeleteNotebook = async () => {
    if (!notebookToDelete) return;
    const { id } = notebookToDelete;
    setDeletingNotebookId(id);
    setNotebookToDelete(null); 
    await deleteNotebook(id);
    if (activeNotebookId === id) setActiveNotebookId(null);
    setDeletingNotebookId(null);
  };
  
  const handleStartEditingNotebook = useCallback((notebook: Notebook) => {
      setEditingNotebookId(notebook.id);
      setEditedNotebookName(notebook.name);
  }, []);
  
  const handleCancelEditingNotebook = useCallback(() => {
      setEditingNotebookId(null);
      setEditedNotebookName('');
  }, []);

  const handleSaveNotebookName = useCallback(async () => {
      if (!editingNotebookId) return;
      const originalNotebook = notebooks.find(n => n.id === editingNotebookId);
      if (originalNotebook && editedNotebookName.trim() && editedNotebookName.trim() !== originalNotebook.name) {
          await updateNotebook(editingNotebookId, { name: editedNotebookName.trim() });
      }
      handleCancelEditingNotebook();
  }, [editingNotebookId, editedNotebookName, notebooks, updateNotebook, handleCancelEditingNotebook]);
  
  const handleNotebookNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') { e.preventDefault(); handleSaveNotebookName(); } 
      else if (e.key === 'Escape') { e.preventDefault(); handleCancelEditingNotebook(); }
  };

  // --- Folder Handlers ---
  const handleAddFolder = async () => {
    let folderNameToAdd = newFolderName.trim();
    if (folderNameToAdd === '') {
      let maxNumber = 0;
      folders.forEach(folder => {
        const match = folder.name.match(/^Pasta (\d+)$/);
        if (match) maxNumber = Math.max(maxNumber, parseInt(match[1], 10));
      });
      folderNameToAdd = `Pasta ${maxNumber + 1}`;
    }
    await addFolder(folderNameToAdd);
    setNewFolderName('');
  };

  const handleStartEditingFolder = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditedFolderName(folder.name);
  };

  const handleCancelEditingFolder = () => {
    setEditingFolderId(null);
    setEditedFolderName('');
  };

  const handleSaveFolderName = async () => {
    if (!editingFolderId || !editedFolderName.trim()) return;
    await updateFolder(editingFolderId, { name: editedFolderName.trim() });
    handleCancelEditingFolder();
  };
  
  const handleFolderNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveFolderName();
    if (e.key === 'Escape') handleCancelEditingFolder();
  };

  const handleConfirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    await deleteFolder(folderToDelete.id);
    setFolderToDelete(null);
  };

  const toggleFolderCollapse = (folderId: string) => {
    // FIX: Explicitly type `prev` to avoid type inference issues.
    setCollapsedFolders((prev: Set<string>) => {
        const newSet = new Set(prev);
        if (newSet.has(folderId)) newSet.delete(folderId);
        else newSet.add(folderId);
        return newSet;
    });
  };
  
  const handleCollapseAll = () => {
    setCollapsedFolders(new Set(folders.map(f => f.id)));
  };

  const handleExpandAll = () => {
    setCollapsedFolders(new Set());
  };

  const handleMoveItem = useCallback(async (
      itemId: string, 
      type: 'notebook' | 'folder', 
      direction: 'up' | 'down'
  ) => {
      const isNotebook = type === 'notebook';
      const items = isNotebook ? notebooks : folders;
      
      const itemToMove = items.find(i => i.id === itemId);
      if (!itemToMove) return;

      let siblings: Array<Notebook | Folder>;
      if (isNotebook) {
          const notebook = itemToMove as Notebook;
          siblings = notebook.folderId 
              ? notebooksByFolder[notebook.folderId] || [] 
              : rootNotebooks;
      } else {
          const folder = itemToMove as Folder;
          siblings = folder.parentId 
              ? foldersByParent[folder.parentId] || [] 
              : rootFolders;
      }

      const currentIndex = siblings.findIndex(s => s.id === itemId);
      if (currentIndex === -1) return;

      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= siblings.length) return;

      const itemToSwapWith = siblings[swapIndex];

      await swapItemsOrder(
          { id: itemToMove.id, type, createdAt: itemToMove.createdAt },
          { id: itemToSwapWith.id, type, createdAt: itemToSwapWith.createdAt }
      );
  }, [notebooks, folders, rootNotebooks, notebooksByFolder, rootFolders, foldersByParent, swapItemsOrder]);

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string, type: 'notebook' | 'folder') => {
    setDraggedItem({ id, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (targetId !== dragOverTargetId) {
        setDragOverTargetId(targetId);
    }
  };

  const handleDragLeave = () => setDragOverTargetId(null);

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTargetId(null);
    if (!draggedItem) return;

    const { id: draggedId, type: draggedType } = draggedItem;

    if (draggedType === 'notebook') {
        const notebook = notebooks.find(n => n.id === draggedId);
        const currentFolderId = notebook?.folderId || null;
        if (notebook && currentFolderId !== targetFolderId) {
            await updateNotebook(draggedId, { folderId: targetFolderId });
        }
    } else if (draggedType === 'folder') {
        const folder = folders.find(f => f.id === draggedId);
        const currentParentId = folder?.parentId || null;
        if (folder && currentParentId !== targetFolderId) {
            if (isAncestor(draggedId, targetFolderId, folders)) {
                alert("Não é possível mover uma pasta para dentro de si mesma ou de uma de suas subpastas.");
                return;
            }
            await updateFolder(draggedId, { parentId: targetFolderId });
        }
    }
    
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTargetId(null);
  };

  const renderNotebook = (notebook: Notebook, index: number, list: Notebook[]) => (
      <NotebookItem
        key={notebook.id}
        notebook={notebook}
        isActive={activeNotebookId === notebook.id}
        isDeleting={deletingNotebookId === notebook.id}
        isEditing={editingNotebookId === notebook.id}
        isAnyItemBeingEdited={isAnyItemBeingEdited}
        editedName={editedNotebookName}
        onSelect={() => deletingNotebookId !== notebook.id && setActiveNotebookId(notebook.id)}
        onStartEditing={() => handleStartEditingNotebook(notebook)}
        onCancelEditing={handleCancelEditingNotebook}
        onSaveName={handleSaveNotebookName}
        onNameChange={setEditedNotebookName}
        onNameKeyDown={handleNotebookNameKeyDown}
        onPromptDelete={() => setNotebookToDelete(notebook)}
        onDuplicate={() => duplicateNotebook(notebook.id)}
        onDragStart={(e) => handleDragStart(e, notebook.id, 'notebook')}
        onDragEnd={handleDragEnd}
        onMove={(direction) => handleMoveItem(notebook.id, 'notebook', direction)}
        isFirst={index === 0}
        isLast={index === list.length - 1}
      />
  );
  
  const renderFolderTree = (folder: Folder, level: number, index: number, list: Folder[]) => {
    const isCollapsed = collapsedFolders.has(folder.id);
    const notebooksInFolder = notebooksByFolder[folder.id] || [];
    const childFolders = foldersByParent[folder.id] || [];
    const isDropTarget = dragOverTargetId === folder.id;
    const isEditing = editingFolderId === folder.id;
    const isFirst = index === 0;
    const isLast = index === list.length - 1;

    return (
        <li key={folder.id} 
            onDragOver={(e) => handleDragOver(e, folder.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, folder.id)}
            className={`rounded-md transition-colors ${isDropTarget ? 'bg-brand-secondary/20' : ''}`}
            >
             <div 
                draggable={!isAnyItemBeingEdited}
                onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
                onDragEnd={handleDragEnd}
                className="group flex items-center justify-between p-2 text-sm rounded-md text-brand-text hover:bg-brand-bg/50"
            >
                {isEditing ? (
                    <>
                        <input type="text" value={editedFolderName} onChange={(e) => setEditedFolderName(e.target.value)} onKeyDown={handleFolderNameKeyDown} onBlur={handleSaveFolderName} autoFocus className="flex-grow bg-brand-bg text-brand-text rounded-md px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary w-full" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}/>
                    </>
                ) : (
                    <>
                        <div className="flex items-center truncate flex-grow cursor-pointer" onClick={() => toggleFolderCollapse(folder.id)}>
                             <div className="w-5 h-5 flex items-center justify-center mr-2">
                                {isCollapsed ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M5 12a2 2 0 100 4h10a2 2 0 100-4H5z" />
                                        <path fillRule="evenodd" d="M3 4a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V4zm2 1v1h12V5H5z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <span className="truncate pr-2 font-semibold" title={folder.name}>{folder.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleMoveItem(folder.id, 'folder', 'up'); }}
                                disabled={isFirst || isAnyItemBeingEdited}
                                className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:text-green-400 disabled:opacity-20 disabled:cursor-not-allowed"
                                title="Mover para cima"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-[19px] w-[19px]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleMoveItem(folder.id, 'folder', 'down'); }}
                                disabled={isLast || isAnyItemBeingEdited}
                                className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:text-green-400 disabled:opacity-20 disabled:cursor-not-allowed"
                                title="Mover para baixo"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-[19px] w-[19px]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                           <ActionMenu isActive={false}>
                                <ActionMenuItem onClick={(e) => {e.stopPropagation(); handleStartEditingFolder(folder);}}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                    Renomear
                                </ActionMenuItem>
                                {folder.parentId && (
                                    <ActionMenuItem 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateFolder(folder.id, { parentId: null });
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                                        Mover para raiz
                                    </ActionMenuItem>
                                )}
                                <ActionMenuItem 
                                    onClick={(e) => {
                                        if (notebooksInFolder.length === 0 && childFolders.length === 0) {
                                            e.stopPropagation(); setFolderToDelete(folder);
                                        }
                                    }} 
                                    className={`text-red-400 hover:bg-red-800/50 ${(notebooksInFolder.length > 0 || childFolders.length > 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    Excluir
                                </ActionMenuItem>
                            </ActionMenu>
                        </div>
                    </>
                )}
            </div>
            {!isCollapsed && (
                <ul className="pl-4 ml-2 border-l border-brand-bg/30">
                    {childFolders.map((subFolder, i, arr) => renderFolderTree(subFolder, level + 1, i, arr))}
                    {notebooksInFolder.map((nb, i, arr) => renderNotebook(nb, i, arr))}
                    {notebooksInFolder.length === 0 && childFolders.length === 0 && <li className="text-xs text-brand-text-muted p-2 italic" style={{ paddingLeft: `8px` }}>Pasta vazia</li>}
                </ul>
            )}
        </li>
    );
  };

  const areAllFoldersCollapsed = folders.length > 0 && collapsedFolders.size === folders.length;

  return (
    <>
      <aside 
        style={{ width: `${width}px` }}
        className="bg-brand-primary p-4 border-r border-brand-bg flex flex-col flex-shrink-0"
      >
        <div>
          <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-brand-secondary">range rider</h1>
              <p className="mt-1 text-sm text-brand-text-muted">Improve your learning skills.</p>
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex" title="Digite o nome da pasta">
                <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddFolder()} placeholder="Nova Pasta..." className="flex-grow bg-brand-bg text-brand-text rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary"/>
                <button onClick={handleAddFolder} className="bg-brand-secondary/70 hover:bg-brand-secondary text-brand-primary font-bold px-3 py-2 rounded-r-md text-sm transition-colors flex items-center justify-center w-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                </button>
            </div>
            <div className="flex" title="Digite o nome do caderno">
                <input type="text" value={newNotebookName} onChange={(e) => setNewNotebookName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddNotebook()} placeholder="Novo Caderno..." className="flex-grow bg-brand-bg text-brand-text rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary"/>
                <button onClick={handleAddNotebook} className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold px-3 py-2 rounded-r-md text-sm transition-colors flex items-center justify-center w-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                </button>
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-2 mb-4">
            <button 
                onClick={areAllFoldersCollapsed ? handleExpandAll : handleCollapseAll} 
                disabled={folders.length === 0} 
                className="w-full text-xs bg-brand-bg hover:brightness-125 text-brand-text-muted font-semibold py-2 px-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {areAllFoldersCollapsed ? 'Expandir' : 'Recolher'}
            </button>
        </div>
        <nav 
            className={`flex-grow overflow-y-auto pr-2 -mr-2 rounded-md transition-colors ${draggedItem && dragOverTargetId === null ? 'bg-brand-secondary/20' : ''}`}
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
        >
            <ul className="space-y-1">
                {rootFolders.map((folder, i, arr) => renderFolderTree(folder, 0, i, arr))}
                {rootNotebooks.map((nb, i, arr) => renderNotebook(nb, i, arr))}
            </ul>
        </nav>
        <div className="mt-auto pt-4 border-t border-brand-bg">
            <div className="flex items-center justify-between mb-2">
                <div className="min-w-0">
                  <span className="text-xs text-brand-text-muted">Usuário:</span>
                  <p className="text-sm font-semibold text-brand-text truncate" title={user.displayName || user.email || 'Usuário'}>{user.displayName || user.email || 'Usuário Anônimo'}</p>
                </div>
                <button onClick={() => setIsProfileModalOpen(true)} className="px-3 py-1 text-sm rounded hover:bg-brand-bg text-brand-text-muted hover:text-brand-text flex-shrink-0" title="Configurações da conta">
                    Conta
                </button>
            </div>
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 border border-brand-secondary/50 hover:bg-brand-secondary/20 text-brand-secondary font-semibold py-2 px-3 rounded-md text-sm transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-[22px] w-[22px]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
              Sair
            </button>
            <p className="text-xs text-brand-text-muted text-center pt-4">powered by xcd1</p>
        </div>
      </aside>
      
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      
      <ConfirmationModal isOpen={!!notebookToDelete} onClose={() => setNotebookToDelete(null)} onConfirm={handleConfirmDeleteNotebook} title="Confirmar Exclusão"
        message={<>Deseja realmente excluir o caderno <strong className="text-brand-secondary">{notebookToDelete?.name}</strong>?<br /><span className="text-sm">Esta ação não pode ser desfeita.</span></>}
      />
      <ConfirmationModal isOpen={!!folderToDelete} onClose={() => setFolderToDelete(null)} onConfirm={handleConfirmDeleteFolder} title="Confirmar Exclusão de Pasta"
        message={<>Deseja realmente excluir a pasta <strong className="text-brand-secondary">{folderToDelete?.name}</strong>?<br /><span className="text-sm">Esta ação não pode ser desfeita e irá mover o conteúdo para a raiz.</span></>}
      />
    </>
  );
};

export default Sidebar;