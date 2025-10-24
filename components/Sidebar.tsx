import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import ConfirmationModal from './ConfirmationModal';

const FolderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5 text-brand-secondary"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>
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

const SpinnerIcon = () => (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const Sidebar: React.FC = () => {
  const context = useContext(AppContext);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notebookToDelete, setNotebookToDelete] = useState<{id: string; name: string} | null>(null);

  if (!context) return null;
  const { notebooks, addNotebook, deleteNotebook, activeNotebookId, setActiveNotebookId, user, logout } = context;
  
  const handleAddNotebook = async () => {
    if (newNotebookName.trim() === '') return;
    try {
        await addNotebook(newNotebookName.trim());
        setNewNotebookName('');
    } catch(e) {
        console.error("Failed to add notebook:", e);
        alert('Falha ao adicionar o caderno.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!notebookToDelete) return;
    
    const { id: notebookId } = notebookToDelete;
    setDeletingId(notebookId);
    setNotebookToDelete(null); // Fecha o modal

    try {
        await deleteNotebook(notebookId);
        if (activeNotebookId === notebookId) {
            setActiveNotebookId(null);
        }
    } catch(e) {
        console.error("Failed to delete notebook", e);
        alert('Falha ao excluir o caderno. Pode ser um problema de permissão ou conexão. Tente novamente.');
    } finally {
        setDeletingId(null);
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleAddNotebook();
    }
  }

  return (
    <>
      <aside className="w-64 bg-brand-primary p-4 border-r border-brand-bg flex flex-col">
        <div>
          <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-brand-secondary">range rider</h1>
              <p className="mt-1 text-sm text-brand-text-muted">Improve your learning skills.</p>
          </div>
          <div className="mb-4">
            <div className="flex" title="Digite o nome do caderno">
                <input
                  type="text"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Novo caderno..."
                  className="flex-grow bg-brand-bg text-brand-text rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                />
                <button
                  onClick={handleAddNotebook}
                  className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-3 rounded-r-md text-sm transition-all flex items-center"
                >
                  <PlusIcon />
                </button>
            </div>
          </div>
        </div>
        <nav className="flex-grow overflow-y-auto">
          <ul>
            {notebooks.map(notebook => (
              <li 
                key={notebook.id}
                className={`group flex items-center justify-between p-2 text-sm rounded-md transition-colors ${
                  activeNotebookId === notebook.id ? 'bg-brand-secondary text-brand-primary font-bold' : 'text-brand-text hover:bg-brand-bg'
                }`}
              >
                <div
                  onClick={() => deletingId !== notebook.id && setActiveNotebookId(notebook.id)}
                  className={`flex items-center truncate flex-grow ${deletingId === notebook.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <FolderIcon />
                  <span className="truncate pr-2">{notebook.name}</span>
                </div>
                
                <button 
                  onClick={() => setNotebookToDelete({ id: notebook.id, name: notebook.name })}
                  disabled={!!deletingId}
                  className={`ml-2 flex-shrink-0 p-1 rounded-full transition-opacity flex items-center justify-center w-6 h-6 disabled:opacity-50 disabled:cursor-not-allowed ${
                      activeNotebookId === notebook.id
                      ? 'opacity-100 text-brand-primary/70 hover:text-red-500'
                      : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500'
                  }`}
                  title={`Excluir caderno ${notebook.name}`}
                >
                  {deletingId === notebook.id ? <SpinnerIcon /> : <TrashIcon />}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto pt-4 border-t border-brand-bg">
            <div className="mb-2">
              <span className="text-xs text-brand-text-muted">Usuário:</span>
              <p className="text-sm font-semibold text-brand-text truncate" title={user.email || 'Usuário'}>{user.email || 'Usuário Anônimo'}</p>
            </div>
            <button onClick={logout} className="w-full flex items-center justify-center border border-brand-secondary/50 hover:bg-brand-secondary/20 text-brand-secondary font-semibold py-2 px-3 rounded-md text-sm transition-colors">
              <LogoutIcon/>
              Sair
            </button>
            <p className="text-xs text-brand-text-muted text-center pt-4">powered by xcd1</p>
        </div>
      </aside>
      
      <ConfirmationModal
        isOpen={!!notebookToDelete}
        onClose={() => setNotebookToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={
          <>
            Deseja realmente excluir o caderno{" "}
            <strong className="text-brand-secondary">{notebookToDelete?.name}</strong>?
            <br />
            <span className="text-sm">Esta ação não pode ser desfeita.</span>
          </>
        }
        confirmText="Sim"
        cancelText="Não"
      />
    </>
  );
};

export default Sidebar;