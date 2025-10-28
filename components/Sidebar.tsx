import React, { useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import ConfirmationModal from './ConfirmationModal';
import type { Folder, Notebook } from '../types';

const FolderIcon = ({ isOpen }: { isOpen?: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5 text-brand-secondary flex-shrink-0">
        {isOpen ? (
            <path d="M20 12.58V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2h5.44"/>
        ) : (
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
        )}
    </svg>
);

const NotebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5 text-brand-text-muted"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);

const SpinnerIcon = () => (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ArrowUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
);

const ArrowDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
);

// Helper to prevent dropping a folder into itself or its children
const isAncestor = (draggedId: string, targetId: string | null, allFolders: Folder[]): boolean => {
    if (!targetId) return false;
    if (targetId === draggedId) return true; // Found itself
    const targetFolder = allFolders.find(f => f.id === targetId);
    if (!targetFolder || !targetFolder.parentId) return false;
    return isAncestor(draggedId, targetFolder.parentId, allFolders);
};

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
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onMove: (direction: 'up' | 'down') => void;
    isFirst: boolean;
    isLast: boolean;
}

const NotebookItem: React.FC<NotebookItemProps> = ({
    notebook, isActive, isDeleting, isEditing, isAnyItemBeingEdited, editedName,
    onSelect, onStartEditing, onCancelEditing, onSaveName, onNameChange, onNameKeyDown, onPromptDelete,
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
                    <NotebookIcon />
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
                        className={`flex items-center truncate flex-grow ${isDeleting ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <NotebookIcon />
                        <span className="truncate pr-2" title={notebook.name}>{notebook.name}</span>
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center">
                        <button
                            onClick={() => onMove('up')}
                            disabled={isFirst || isDeleting}
                            className={`p-1 rounded-full transition-opacity flex items-center justify-center w-6 h-6 disabled:opacity-20 disabled:cursor-not-allowed ${
                                isActive
                                ? 'opacity-100 text-brand-primary/70 hover:text-green-500'
                                : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-green-500'
                            }`}
                            title="Mover para cima"
                        >
                            <ArrowUpIcon />
                        </button>
                        <button
                            onClick={() => onMove('down')}
                            disabled={isLast || isDeleting}
                            className={`p-1 rounded-full transition-opacity flex items-center justify-center w-6 h-6 disabled:opacity-20 disabled:cursor-not-allowed ${
                                isActive
                                ? 'opacity-100 text-brand-primary/70 hover:text-green-500'
                                : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-green-500'
                            }`}
                            title="Mover para baixo"
                        >
                            <ArrowDownIcon />
                        </button>
                        <button 
                            onClick={onStartEditing}
                            disabled={isDeleting}
                            className={`ml-1 p-1 rounded-full transition-opacity flex items-center justify-center w-6 h-6 disabled:opacity-50 disabled:cursor-not-allowed ${
                                isActive
                                ? 'opacity-100 text-brand-primary/70 hover:text-blue-500'
                                : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500'
                            }`}
                            title={`Editar nome do caderno ${notebook.name}`}
                        >
                            <PencilIcon />
                        </button>
                        <button 
                            onClick={onPromptDelete}
                            disabled={isDeleting}
                            className={`ml-1 p-1 rounded-full transition-opacity flex items-center justify-center w-6 h-6 disabled:opacity-50 disabled:cursor-not-allowed ${
                                isActive
                                ? 'opacity-100 text-brand-primary/70 hover:text-red-500'
                                : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500'
                            }`}
                            title={`Excluir caderno ${notebook.name}`}
                        >
                            {isDeleting ? <SpinnerIcon /> : <TrashIcon />}
                        </button>
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

  const isAnyItemBeingEdited = !!editingNotebookId || !!editingFolderId;
  const isStateLoaded = useRef(false);


  if (!context) return null;
  const { 
      notebooks, folders, activeNotebookId, setActiveNotebookId, user, logout,
      addNotebook, deleteNotebook, updateNotebook,
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
    setCollapsedFolders(prev => {
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
        <div key={folder.id} 
            draggable={!isAnyItemBeingEdited}
            onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, folder.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, folder.id)}
            className={`rounded-md transition-colors ${isDropTarget ? 'bg-brand-secondary/20' : ''}`}
            style={{ marginLeft: `${level * 12}px` }}
            >
            <div className="group flex items-center justify-between p-2 text-sm rounded-md text-brand-text hover:bg-brand-bg/50 cursor-pointer" onClick={() => toggleFolderCollapse(folder.id)}>
                {isEditing ? (
                    <>
                        <FolderIcon isOpen={!isCollapsed} />
                        <input type="text" value={editedFolderName} onChange={(e) => setEditedFolderName(e.target.value)} onKeyDown={handleFolderNameKeyDown} onBlur={handleSaveFolderName} autoFocus className="flex-grow bg-brand-bg text-brand-text rounded-md px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary mx-2 w-full" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}/>
                    </>
                ) : (
                    <>
                        <div className="flex items-center truncate flex-grow">
                            <FolderIcon isOpen={!isCollapsed} />
                            <span className="truncate pr-2 font-semibold" title={folder.name}>{folder.name}</span>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleMoveItem(folder.id, 'folder', 'up'); }}
                                disabled={isFirst || isAnyItemBeingEdited}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-green-400 disabled:opacity-20 disabled:cursor-not-allowed"
                                title="Mover para cima"
                            >
                                <ArrowUpIcon />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleMoveItem(folder.id, 'folder', 'down'); }}
                                disabled={isLast || isAnyItemBeingEdited}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-green-400 disabled:opacity-20 disabled:cursor-not-allowed"
                                title="Mover para baixo"
                            >
                                <ArrowDownIcon />
                            </button>
                            <button onClick={(e) => {e.stopPropagation(); handleStartEditingFolder(folder);}} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-blue-400" title="Renomear pasta"><PencilIcon/></button>
                            <button disabled={notebooksInFolder.length > 0 || childFolders.length > 0} onClick={(e) => {e.stopPropagation(); setFolderToDelete(folder);}} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed" title={(notebooksInFolder.length > 0 || childFolders.length > 0) ? "Esvazie a pasta para excluir" : "Excluir pasta"}><TrashIcon/></button>
                            <span className="ml-2 w-4 text-center">{isCollapsed ? '▸' : '▾'}</span>
                        </div>
                    </>
                )}
            </div>
            {!isCollapsed && (
                <ul className="pl-4 border-l-2 border-brand-secondary/20 ml-2">
                    {childFolders.map((subFolder, i, arr) => renderFolderTree(subFolder, 0, i, arr))}
                    {notebooksInFolder.map((nb, i, arr) => renderNotebook(nb, i, arr))}
                    {notebooksInFolder.length === 0 && childFolders.length === 0 && <li className="text-xs text-brand-text-muted p-2">Pasta vazia</li>}
                </ul>
            )}
        </div>
    );
  };


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
                <button onClick={handleAddFolder} className="bg-brand-secondary/70 hover:brightness-110 text-brand-primary font-bold py-2 px-3 rounded-r-md text-sm transition-all flex items-center"><PlusIcon /></button>
            </div>
            <div className="flex" title="Digite o nome do caderno">
                <input type="text" value={newNotebookName} onChange={(e) => setNewNotebookName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddNotebook()} placeholder="Novo Caderno..." className="flex-grow bg-brand-bg text-brand-text rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary"/>
                <button onClick={handleAddNotebook} className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-3 rounded-r-md text-sm transition-all flex items-center"><PlusIcon /></button>
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-2 mb-4">
            <button onClick={handleCollapseAll} disabled={folders.length === 0} className="w-full text-xs bg-brand-bg hover:brightness-125 text-brand-text-muted font-semibold py-2 px-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Recolher Tudo</button>
            <button onClick={handleExpandAll} disabled={folders.length === 0} className="w-full text-xs bg-brand-bg hover:brightness-125 text-brand-text-muted font-semibold py-2 px-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Expandir Tudo</button>
        </div>
        <nav className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2">
            {rootFolders.map((folder, i, arr) => renderFolderTree(folder, 0, i, arr))}
            
            <div onDragOver={(e) => handleDragOver(e, null)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, null)}
                  className={`rounded-md min-h-[2rem] transition-colors ${draggedItem && dragOverTargetId === null ? 'bg-brand-secondary/20' : ''}`}>
                <ul className="space-y-1 pt-2">
                    {rootNotebooks.map((nb, i, arr) => renderNotebook(nb, i, arr))}
                </ul>
            </div>
        </nav>
        <div className="mt-auto pt-4 border-t border-brand-bg">
            <div className="mb-2">
              <span className="text-xs text-brand-text-muted">Usuário:</span>
              <p className="text-sm font-semibold text-brand-text truncate" title={user.email || 'Usuário'}>{user.email || 'Usuário Anônimo'}</p>
            </div>
            <button onClick={logout} className="w-full flex items-center justify-center border border-brand-secondary/50 hover:bg-brand-secondary/20 text-brand-secondary font-semibold py-2 px-3 rounded-md text-sm transition-colors">
              <LogoutIcon/> Sair
            </button>
            <p className="text-xs text-brand-text-muted text-center pt-4">powered by xcd1</p>
        </div>
      </aside>
      
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