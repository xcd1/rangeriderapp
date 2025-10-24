import React, { useContext, useState } from 'react';
import { AppContext } from '../App';

const FolderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5 text-yellow-400"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);

const Sidebar: React.FC = () => {
  const context = useContext(AppContext);
  const [newNotebookName, setNewNotebookName] = useState('');

  if (!context) return null;
  const { notebooks, addNotebook, deleteNotebook, activeNotebookId, setActiveNotebookId, searchTerm, setSearchTerm, user, logout } = context;

  const handleAddNotebook = async () => {
    if (newNotebookName.trim() === '') return;
    try {
        await addNotebook(newNotebookName.trim());
        setNewNotebookName('');
        // setActiveNotebookId will be set by the hook's return value eventually
    } catch(e) {
        console.error("Failed to add notebook:", e);
    }
  };

  const handleDeleteNotebook = async (e: React.MouseEvent, notebookId: string, notebookName: string) => {
    e.stopPropagation();
    e.preventDefault();
    if(window.confirm(`Tem certeza que deseja excluir o caderno "${notebookName}"? Esta ação não pode ser desfeita.`)) {
        try {
            await deleteNotebook(notebookId);
            if (activeNotebookId === notebookId) {
                setActiveNotebookId(null);
            }
        } catch(e) {
            console.error("Failed to delete notebook", e);
        }
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleAddNotebook();
    }
  }

  return (
    <aside className="w-64 bg-gray-800 p-4 border-r border-gray-700 flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Range Rider</h1>
        <div className="mb-4 relative">
            <SearchIcon />
            <input
              type="text"
              placeholder="Pesquisar cenários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
        <div className="mb-4">
          <div className="flex">
              <input
                type="text"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Novo caderno..."
                className="flex-grow bg-gray-700 text-white rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddNotebook}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-r-md text-sm transition-colors flex items-center"
              >
                <PlusIcon />
              </button>
          </div>
        </div>
      </div>
      <nav className="flex-grow overflow-y-auto">
        <ul>
          {notebooks.map(notebook => (
            <li key={notebook.id} className="mb-1 group">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveNotebookId(notebook.id); }}
                className={`flex items-center justify-between p-2 text-sm rounded-md transition-colors ${
                  activeNotebookId === notebook.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center truncate">
                    <FolderIcon />
                    <span className="truncate">{notebook.name}</span>
                </div>
                <button 
                    onClick={(e) => handleDeleteNotebook(e, notebook.id, notebook.name)}
                    className="text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title={`Excluir caderno ${notebook.name}`}
                >
                    <TrashIcon />
                </button>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="mb-2">
            <span className="text-xs text-gray-400">Usuário:</span>
            <p className="text-sm font-semibold text-white truncate" title={user.email || 'Usuário'}>{user.email || 'Usuário Anônimo'}</p>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center bg-red-600/20 hover:bg-red-600/40 text-red-300 font-semibold py-2 px-3 rounded-md text-sm transition-colors">
            <LogoutIcon/>
            Sair
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;