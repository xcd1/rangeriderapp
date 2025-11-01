import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  setDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import type { Notebook, Scenario, Folder } from '../types';
import { POSITIONS, GAME_SCENARIOS, SPOT_TYPES, RANGE_ACTIONS, BLIND_WAR_ACTIONS, BLIND_WAR_POSITIONS } from '../constants';

interface FirestoreNotebooksResult {
    notebooks: Notebook[];
    folders: Folder[];
    loading: boolean;
    addNotebook: (name: string) => Promise<void>;
    deleteNotebook: (notebookId: string) => Promise<void>;
    updateNotebook: (notebookId: string, updates: Partial<Pick<Notebook, 'name' | 'folderId' | 'notes' | 'defaultSpot'>>) => Promise<void>;
    duplicateNotebook: (notebookId: string) => Promise<void>;
    addFolder: (name: string, parentId?: string | null) => Promise<void>;
    deleteFolder: (folderId: string) => Promise<void>;
    updateFolder: (folderId: string, updates: Partial<Pick<Folder, 'name' | 'parentId'>>) => Promise<void>;
    addScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
    updateScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
    deleteScenario: (notebookId: string, scenarioId: string) => Promise<void>;
    addMultipleScenarios: (notebookId: string, scenariosToAdd: Scenario[]) => Promise<void>;
    deleteMultipleScenarios: (notebookId: string, scenarioIds: string[]) => Promise<void>;
    swapItemsOrder: (item1: { id: string, type: 'notebook' | 'folder', createdAt: number }, item2: { id: string, type: 'notebook' | 'folder', createdAt: number }) => Promise<void>;
}

const isValidValue = (value: any, validValues: readonly any[]) => validValues.includes(value);

const cleanScenario = (scenario: any): Scenario => {
    const s = (typeof scenario === 'object' && scenario !== null) ? scenario : {};

    return {
        id: typeof s.id === 'string' && s.id ? s.id : crypto.randomUUID(),
        spotType: isValidValue(s.spotType, SPOT_TYPES) ? s.spotType : 'Facing 2bet',
        manualTitle: typeof s.manualTitle === 'string' ? s.manualTitle : null,
        
        rangeAction: isValidValue(s.rangeAction, RANGE_ACTIONS) ? s.rangeAction : null,
        raiserPos: isValidValue(s.raiserPos, POSITIONS) ? s.raiserPos : null,
        heroPos: isValidValue(s.heroPos, POSITIONS) ? s.heroPos : null,
        blindWarPosition: isValidValue(s.blindWarPosition, BLIND_WAR_POSITIONS) ? s.blindWarPosition : null,
        blindWarAction: isValidValue(s.blindWarAction, BLIND_WAR_ACTIONS) ? s.blindWarAction : null,
        
        coldCallerPos: isValidValue(s.coldCallerPos, POSITIONS) ? s.coldCallerPos : null,
        aggressorPos: isValidValue(s.aggressorPos, POSITIONS) ? s.aggressorPos : null,
        printSpotImage: typeof s.printSpotImage === 'string' ? s.printSpotImage : null,
        rpImage: typeof s.rpImage === 'string' ? s.rpImage : null,
        tableViewImage: typeof s.tableViewImage === 'string' ? s.tableViewImage : null,
        plusInfoImage: typeof s.plusInfoImage === 'string' ? s.plusInfoImage : null,
        evImage: typeof s.evImage === 'string' ? s.evImage : null,

        gameScenario: isValidValue(s.gameScenario, GAME_SCENARIOS) ? s.gameScenario : null,
        rpMode: typeof s.rpMode === 'boolean' ? s.rpMode : false,
        startingBounties: typeof s.startingBounties === 'number' ? s.startingBounties : null,
        startingStacks: typeof s.startingStacks === 'number' ? s.startingStacks : null,
        
        rangeImage: typeof s.rangeImage === 'string' ? s.rangeImage : null,
        frequenciesImage: typeof s.frequenciesImage === 'string' ? s.frequenciesImage : null,

        raiseSmallText: typeof s.raiseSmallText === 'string' ? s.raiseSmallText : '',
        raiseBigText: typeof s.raiseBigText === 'string' ? s.raiseBigText : '',
        callText: typeof s.callText === 'string' ? s.callText : '',
        notes: typeof s.notes === 'string' ? s.notes : '',
        createdAt: typeof s.createdAt === 'number' ? s.createdAt : Date.now(),
        showFrequenciesInCompare: typeof s.showFrequenciesInCompare === 'boolean' ? s.showFrequenciesInCompare : false,
        showEvInCompare: typeof s.showEvInCompare === 'boolean' ? s.showEvInCompare : false,
    };
};


const useFirestoreNotebooks = (uid: string | undefined): Omit<FirestoreNotebooksResult, 'addScenario' | 'updateScenario' | 'deleteScenario' | 'addMultipleScenarios' | 'deleteMultipleScenarios' | 'updateNotebook'> & {
    addScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
    updateScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
    deleteScenario: (notebookId: string, scenarioId: string) => Promise<void>;
    addMultipleScenarios: (notebookId: string, scenariosToAdd: Scenario[]) => Promise<void>;
    deleteMultipleScenarios: (notebookId: string, scenarioIds: string[]) => Promise<void>;
    updateNotebook: (notebookId: string, updates: Partial<Pick<Notebook, 'name' | 'folderId' | 'notes' | 'defaultSpot'>>) => Promise<void>;
    swapItemsOrder: (item1: { id: string, type: 'notebook' | 'folder', createdAt: number }, item2: { id: string, type: 'notebook' | 'folder', createdAt: number }) => Promise<void>;
} => {
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const scenariosUnsubscribersRef = useRef<Map<string, () => void>>(new Map());

    useEffect(() => {
        if (!uid) {
            setNotebooks([]);
            setFolders([]);
            setLoading(false);
            scenariosUnsubscribersRef.current.forEach(unsubscribe => unsubscribe());
            scenariosUnsubscribersRef.current.clear();
            return;
        }

        setLoading(true);

        const notebooksQuery = query(collection(db, 'users', uid, 'notebooks'));
        const foldersQuery = query(collection(db, 'users', uid, 'folders'));

        const notebooksUnsubscribe = onSnapshot(notebooksQuery, (notebooksSnapshot) => {
            const notebooksFromDb = notebooksSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt || 0,
                    modifiedAt: data.modifiedAt || data.createdAt || 0,
                    notes: data.notes || '',
                } as Omit<Notebook, 'scenarios'>;
            });


            const newNotebooksMap = new Map(notebooksFromDb.map(n => [n.id, n]));
            const currentSubs = scenariosUnsubscribersRef.current;

            // Unsubscribe from scenarios of deleted notebooks
            for (const notebookId of currentSubs.keys()) {
                if (!newNotebooksMap.has(notebookId)) {
                    currentSubs.get(notebookId)?.();
                    currentSubs.delete(notebookId);
                }
            }

            // Update notebooks list, preserving existing scenarios to prevent UI flicker
            // FIX: Explicitly typed `prevNotebooks` to prevent it from being inferred as `unknown[]`,
            // which was causing a downstream type error in StudyView.tsx.
            setNotebooks((prevNotebooks: Notebook[]) => {
                const prevNotebooksMap = new Map(prevNotebooks.map(n => [n.id, n]));
                return notebooksFromDb.map(newNotebook => ({
                    ...newNotebook,
                    scenarios: prevNotebooksMap.get(newNotebook.id)?.scenarios || []
                })) as Notebook[];
            });

            // Subscribe to scenarios for new notebooks
            for (const notebook of notebooksFromDb) {
                if (!currentSubs.has(notebook.id)) {
                    const scenariosQuery = query(collection(db, 'users', uid, 'notebooks', notebook.id, 'scenarios'));
                    const unsubscribe = onSnapshot(scenariosQuery, (scenariosSnapshot) => {
                        const scenariosData = scenariosSnapshot.docs.map(doc => cleanScenario(doc.data()))
                            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                        
                        // Update the specific notebook with its scenarios
                        // FIX: Explicitly typed `prev` to prevent it from being inferred as `unknown[]`,
                        // which was causing a downstream type error in StudyView.tsx.
                        setNotebooks((prev: Notebook[]) => prev.map(n => 
                            n.id === notebook.id ? { ...n, scenarios: scenariosData } : n
                        ));
                    }, (error) => {
                        console.error(`Error fetching scenarios for notebook ${notebook.id}:`, error);
                    });
                    currentSubs.set(notebook.id, unsubscribe);
                }
            }
            
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notebooks:", error);
            setLoading(false);
        });

        const foldersUnsubscribe = onSnapshot(foldersQuery, (snapshot) => {
            const foldersData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt || 0,
                    modifiedAt: data.modifiedAt || data.createdAt || 0,
                } as Folder;
            });
            setFolders(foldersData);
        }, (error) => {
            console.error("Error fetching folders:", error);
        });
        
        return () => {
            notebooksUnsubscribe();
            foldersUnsubscribe();
            scenariosUnsubscribersRef.current.forEach(unsubscribe => unsubscribe());
            scenariosUnsubscribersRef.current.clear();
        };
    }, [uid]);

    const addNotebook = useCallback(async (name: string) => {
        if (!uid) throw new Error("User not authenticated");
        const now = Date.now();
        await addDoc(collection(db, 'users', uid, 'notebooks'), { name, folderId: null, createdAt: now, modifiedAt: now, notes: '' });
    }, [uid]);

    const duplicateNotebook = useCallback(async (notebookId: string) => {
        if (!uid) throw new Error("User not authenticated");
        
        const notebookToDuplicate = notebooks.find(n => n.id === notebookId);
        if (!notebookToDuplicate) {
            console.error("Notebook not found for duplication");
            return;
        }

        const now = Date.now();
        const newNotebookData = {
            name: `${notebookToDuplicate.name} (Cópia)`,
            folderId: notebookToDuplicate.folderId || null,
            createdAt: now,
            modifiedAt: now,
            notes: notebookToDuplicate.notes || '',
            defaultSpot: notebookToDuplicate.defaultSpot || null,
        };
        
        const newNotebookRef = await addDoc(collection(db, 'users', uid, 'notebooks'), newNotebookData);
        
        const batch = writeBatch(db);

        if (notebookToDuplicate.scenarios.length > 0) {
            notebookToDuplicate.scenarios.forEach(scenario => {
                const newId = crypto.randomUUID();
                const newScenarioData = { ...scenario, id: newId };
                const scenarioRef = doc(db, 'users', uid, 'notebooks', newNotebookRef.id, 'scenarios', newId);
                batch.set(scenarioRef, cleanScenario(newScenarioData));
            });
        }
        
        // Update parent folder modification date
        if (newNotebookData.folderId) {
            const folderRef = doc(db, 'users', uid, 'folders', newNotebookData.folderId);
            batch.update(folderRef, { modifiedAt: now });
        }

        await batch.commit();
    }, [uid, notebooks]);

    const updateNotebook = useCallback(async (notebookId: string, updates: Partial<Pick<Notebook, 'name' | 'folderId' | 'notes' | 'defaultSpot'>>) => {
        if (!uid) throw new Error("User not authenticated");

        const isJustRename = Object.keys(updates).length === 1 && 'name' in updates;
        const notebookRef = doc(db, 'users', uid, 'notebooks', notebookId);
        
        if (isJustRename) {
            // Just rename, don't update modifiedAt
            await updateDoc(notebookRef, { ...updates });
            return;
        }

        // For other updates (content or structural changes), update modifiedAt
        const batch = writeBatch(db);
        const now = Date.now();
        
        batch.update(notebookRef, { ...updates, modifiedAt: now });

        const notebookBeforeUpdate = notebooks.find(n => n.id === notebookId);
        const oldFolderId = notebookBeforeUpdate?.folderId;
        const newFolderId = updates.folderId;

        // Logic for updating folder's modifiedAt timestamp
        if (newFolderId !== undefined && newFolderId !== oldFolderId) {
            // Notebook moved between folders, update both
            if (oldFolderId) {
                const oldFolderRef = doc(db, 'users', uid, 'folders', oldFolderId);
                batch.update(oldFolderRef, { modifiedAt: now });
            }
            if (newFolderId) {
                const newFolderRef = doc(db, 'users', uid, 'folders', newFolderId);
                batch.update(newFolderRef, { modifiedAt: now });
            }
        } else if (oldFolderId) {
            // Content within the notebook changed, so update the parent folder
            const currentFolderRef = doc(db, 'users', uid, 'folders', oldFolderId);
            batch.update(currentFolderRef, { modifiedAt: now });
        }

        await batch.commit();
    }, [uid, notebooks]);

    const deleteNotebook = useCallback(async (notebookId: string) => {
        if (!uid) throw new Error("User not authenticated");

        const notebookToDelete = notebooks.find(n => n.id === notebookId);
        
        const notebookRef = doc(db, 'users', uid, 'notebooks', notebookId);
        const scenariosRef = collection(notebookRef, 'scenarios');
        const scenariosSnapshot = await getDocs(scenariosRef);
        
        const batch = writeBatch(db);
        scenariosSnapshot.forEach((scenarioDoc) => batch.delete(scenarioDoc.ref));
        batch.delete(notebookRef);

        if (notebookToDelete?.folderId) {
            const folderRef = doc(db, 'users', uid, 'folders', notebookToDelete.folderId);
            batch.update(folderRef, { modifiedAt: Date.now() });
        }
        
        await batch.commit();
        
        if (scenariosUnsubscribersRef.current.has(notebookId)) {
            scenariosUnsubscribersRef.current.get(notebookId)?.();
            scenariosUnsubscribersRef.current.delete(notebookId);
        }
    }, [uid, notebooks]);

    const addFolder = useCallback(async (name: string, parentId: string | null = null) => {
        if (!uid) throw new Error("User not authenticated");
        const now = Date.now();
        await addDoc(collection(db, 'users', uid, 'folders'), { name, parentId: parentId || null, createdAt: now, modifiedAt: now });
    }, [uid]);
    
    const updateFolder = useCallback(async (folderId: string, updates: Partial<Pick<Folder, 'name' | 'parentId'>>) => {
        if (!uid) throw new Error("User not authenticated");

        const isJustRename = Object.keys(updates).length === 1 && 'name' in updates;
        const folderRef = doc(db, 'users', uid, 'folders', folderId);

        if (isJustRename) {
            // Just rename, don't update modifiedAt
            await updateDoc(folderRef, { ...updates });
            return;
        }

        // For moving the folder, update timestamps
        const batch = writeBatch(db);
        const now = Date.now();
        
        batch.update(folderRef, { ...updates, modifiedAt: now });

        const folderBeforeUpdate = folders.find(f => f.id === folderId);
        const oldParentId = folderBeforeUpdate?.parentId;
        const newParentId = updates.parentId;

        if (newParentId !== undefined && newParentId !== oldParentId) {
            // Folder was moved, update old and new parents
            if (oldParentId) {
                const oldParentRef = doc(db, 'users', uid, 'folders', oldParentId);
                batch.update(oldParentRef, { modifiedAt: now });
            }
            if (newParentId) {
                const newParentRef = doc(db, 'users', uid, 'folders', newParentId);
                batch.update(newParentRef, { modifiedAt: now });
            }
        }

        await batch.commit();
    }, [uid, folders]);


    const deleteFolder = useCallback(async (folderId: string) => {
        if (!uid) throw new Error("User not authenticated");
        const batch = writeBatch(db);
        const now = Date.now();

        const q = query(collection(db, 'users', uid, 'notebooks'));
        const notebooksSnapshot = await getDocs(q);
        notebooksSnapshot.forEach(notebookDoc => {
            if (notebookDoc.data().folderId === folderId) {
                batch.update(notebookDoc.ref, { folderId: null });
            }
        });

        const foldersSnapshot = await getDocs(collection(db, 'users', uid, 'folders'));
        const folderToDelete = folders.find(f => f.id === folderId);
        
        foldersSnapshot.forEach(folderDoc => {
            if (folderDoc.data().parentId === folderId) {
                batch.update(folderDoc.ref, { parentId: null });
            }
        });

        if (folderToDelete?.parentId) {
            const parentFolderRef = doc(db, 'users', uid, 'folders', folderToDelete.parentId);
            batch.update(parentFolderRef, { modifiedAt: now });
        }

        batch.delete(doc(db, 'users', uid, 'folders', folderId));
        await batch.commit();
    }, [uid, folders]);
    
    const updateTimestamps = (batch: ReturnType<typeof writeBatch>, notebookId: string, now: number) => {
        if (!uid) return;
        const notebookRef = doc(db, 'users', uid, 'notebooks', notebookId);
        batch.update(notebookRef, { modifiedAt: now });
        const notebook = notebooks.find(n => n.id === notebookId);
        if (notebook?.folderId) {
            const folderRef = doc(db, 'users', uid, 'folders', notebook.folderId);
            batch.update(folderRef, { modifiedAt: now });
        }
    };

    const addScenario = useCallback(async (notebookId: string, scenario: Scenario) => {
        if (!uid) throw new Error("User not authenticated");
        const batch = writeBatch(db);
        const now = Date.now();
        const scenarioRef = doc(db, 'users', uid, 'notebooks', notebookId, 'scenarios', scenario.id);
        batch.set(scenarioRef, cleanScenario(scenario));
        updateTimestamps(batch, notebookId, now);
        await batch.commit();
    }, [uid, notebooks]);

    const updateScenario = useCallback(async (notebookId: string, updatedScenario: Scenario) => {
        if (!uid) throw new Error("User not authenticated");
        const batch = writeBatch(db);
        const now = Date.now();
        const scenarioRef = doc(db, 'users', uid, 'notebooks', notebookId, 'scenarios', updatedScenario.id);
        batch.update(scenarioRef, cleanScenario(updatedScenario));
        updateTimestamps(batch, notebookId, now);
        await batch.commit();
    }, [uid, notebooks]);

    const deleteScenario = useCallback(async (notebookId: string, scenarioId: string) => {
        if (!uid) throw new Error("User not authenticated");
        const batch = writeBatch(db);
        const now = Date.now();
        const scenarioRef = doc(db, 'users', uid, 'notebooks', notebookId, 'scenarios', scenarioId);
        batch.delete(scenarioRef);
        updateTimestamps(batch, notebookId, now);
        await batch.commit();
    }, [uid, notebooks]);
    
    const addMultipleScenarios = useCallback(async (notebookId: string, scenariosToAdd: Scenario[]) => {
        if (!uid) throw new Error("User not authenticated");
        const batch = writeBatch(db);
        const now = Date.now();
        scenariosToAdd.forEach(s => batch.set(doc(db, 'users', uid, 'notebooks', notebookId, 'scenarios', s.id), cleanScenario(s)));
        updateTimestamps(batch, notebookId, now);
        await batch.commit();
    }, [uid, notebooks]);
    
    const deleteMultipleScenarios = useCallback(async (notebookId: string, scenarioIds: string[]) => {
        if (!uid) throw new Error("User not authenticated");
        const batch = writeBatch(db);
        const now = Date.now();
        scenarioIds.forEach(id => batch.delete(doc(db, 'users', uid, 'notebooks', notebookId, 'scenarios', id)));
        updateTimestamps(batch, notebookId, now);
        await batch.commit();
    }, [uid, notebooks]);

    const swapItemsOrder = useCallback(async (
        item1: { id: string, type: 'notebook' | 'folder', createdAt: number },
        item2: { id: string, type: 'notebook' | 'folder', createdAt: number }
    ) => {
        if (!uid) throw new Error("User not authenticated");

        const batch = writeBatch(db);

        const doc1Ref = doc(db, 'users', uid, item1.type === 'notebook' ? 'notebooks' : 'folders', item1.id);
        batch.update(doc1Ref, { createdAt: item2.createdAt });

        const doc2Ref = doc(db, 'users', uid, item2.type === 'notebook' ? 'notebooks' : 'folders', item2.id);
        batch.update(doc2Ref, { createdAt: item1.createdAt });

        await batch.commit();
    }, [uid]);

    return { 
        notebooks, folders, loading, 
        addNotebook, deleteNotebook, updateNotebook, duplicateNotebook,
        addFolder, deleteFolder, updateFolder, 
        addScenario, updateScenario, deleteScenario, 
        addMultipleScenarios, deleteMultipleScenarios,
        swapItemsOrder
    };
};

export default useFirestoreNotebooks;