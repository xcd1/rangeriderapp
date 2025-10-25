

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
import type { Notebook, Scenario } from '../types';
import { POSITIONS, GAME_SCENARIOS, SPOT_TYPES, RANGE_ACTIONS, BLIND_WAR_ACTIONS, BLIND_WAR_POSITIONS } from '../constants';

interface FirestoreNotebooksResult {
    notebooks: Notebook[];
    loading: boolean;
    addNotebook: (name: string) => Promise<void>;
    deleteNotebook: (notebookId: string) => Promise<void>;
    updateNotebookName: (notebookId: string, newName: string) => Promise<void>;
    addScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
    updateScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
    deleteScenario: (notebookId: string, scenarioId: string) => Promise<void>;
    addMultipleScenarios: (notebookId: string, scenariosToAdd: Scenario[]) => Promise<void>;
    deleteMultipleScenarios: (notebookId: string, scenarioIds: string[]) => Promise<void>;
}

// Helper to check if a value is a valid member of an enum-like constant array.
const isValidValue = (value: any, validValues: readonly any[]) => validValues.includes(value);

// Helper to ensure scenario objects are clean for Firestore. It validates
// property values, converts `undefined` to `null` for nullable fields, and 
// provides defaults. This prevents "invalid nested entity" errors by ensuring
// every object in the scenarios array is a valid, serializable POJO.
const cleanScenario = (scenario: any): Scenario => {
    const s = (typeof scenario === 'object' && scenario !== null) ? scenario : {};

    return {
        id: typeof s.id === 'string' && s.id ? s.id : crypto.randomUUID(),
        spotType: isValidValue(s.spotType, SPOT_TYPES) ? s.spotType : 'Facing 2bet',
        
        rangeAction: isValidValue(s.rangeAction, RANGE_ACTIONS) ? s.rangeAction : null,
        raiserPos: isValidValue(s.raiserPos, POSITIONS) ? s.raiserPos : null,
        heroPos: isValidValue(s.heroPos, POSITIONS) ? s.heroPos : null,
        blindWarPosition: isValidValue(s.blindWarPosition, BLIND_WAR_POSITIONS) ? s.blindWarPosition : null,
        blindWarAction: isValidValue(s.blindWarAction, BLIND_WAR_ACTIONS) ? s.blindWarAction : null,
        
        coldCallerPos: isValidValue(s.coldCallerPos, POSITIONS) ? s.coldCallerPos : null,
        aggressorPos: isValidValue(s.aggressorPos, POSITIONS) ? s.aggressorPos : null,
        printSpotImage: typeof s.printSpotImage === 'string' ? s.printSpotImage : null,
        rpImage: typeof s.rpImage === 'string' ? s.rpImage : null,

        gameScenario: isValidValue(s.gameScenario, GAME_SCENARIOS) ? s.gameScenario : null,
        
        rangeImage: typeof s.rangeImage === 'string' ? s.rangeImage : null,
        frequenciesImage: typeof s.frequenciesImage === 'string' ? s.frequenciesImage : null,

        raiseSmallText: typeof s.raiseSmallText === 'string' ? s.raiseSmallText : '',
        raiseBigText: typeof s.raiseBigText === 'string' ? s.raiseBigText : '',
        callText: typeof s.callText === 'string' ? s.callText : '',
        notes: typeof s.notes === 'string' ? s.notes : '',
    };
};


const useFirestoreNotebooks = (uid: string | undefined, activeNotebookId: string | null): FirestoreNotebooksResult => {
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [loadingNotebooks, setLoadingNotebooks] = useState(true);
    const [loadingScenarios, setLoadingScenarios] = useState(false);
    const scenariosUnsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!uid) {
            setNotebooks([]);
            setLoadingNotebooks(false);
            return;
        }

        setLoadingNotebooks(true);
        const q = query(collection(db, 'users', uid, 'notebooks'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const notebooksData: Notebook[] = [];
            querySnapshot.forEach((doc) => {
                notebooksData.push({ id: doc.id, ...doc.data(), scenarios: [] } as Notebook);
            });
            setNotebooks(notebooksData);
            setLoadingNotebooks(false);
        }, (error) => {
            console.error("Error fetching notebooks:", error);
            setLoadingNotebooks(false);
        });

        return () => unsubscribe();
    }, [uid]);
    
    useEffect(() => {
        if (scenariosUnsubscribeRef.current) {
            scenariosUnsubscribeRef.current();
            scenariosUnsubscribeRef.current = null;
        }

        if (!uid || !activeNotebookId) {
            return;
        }

        setLoadingScenarios(true);
        const scenariosQuery = query(collection(db, 'users', uid, 'notebooks', activeNotebookId, 'scenarios'));
        
        scenariosUnsubscribeRef.current = onSnapshot(scenariosQuery, (snapshot) => {
            const scenariosData: Scenario[] = [];
            snapshot.forEach(doc => {
                scenariosData.push(doc.data() as Scenario);
            });
            
            setNotebooks(prevNotebooks => 
                prevNotebooks.map(notebook => 
                    notebook.id === activeNotebookId 
                    ? { ...notebook, scenarios: scenariosData } 
                    : notebook
                )
            );
            setLoadingScenarios(false);
        }, (error) => {
            console.error(`Error fetching scenarios for notebook ${activeNotebookId}:`, error);
            setLoadingScenarios(false);
        });

        return () => {
             if (scenariosUnsubscribeRef.current) {
                scenariosUnsubscribeRef.current();
                scenariosUnsubscribeRef.current = null;
            }
        };
    }, [uid, activeNotebookId]);


    const addNotebook = useCallback(async (name: string) => {
        if (!uid) throw new Error("User not authenticated");
        await addDoc(collection(db, 'users', uid, 'notebooks'), {
            name,
        });
    }, [uid]);

    const updateNotebookName = useCallback(async (notebookId: string, newName: string) => {
        if (!uid) throw new Error("User not authenticated");
        if (!newName.trim()) throw new Error("Notebook name cannot be empty");
        const notebookRef = doc(db, 'users', uid, 'notebooks', notebookId);
        await updateDoc(notebookRef, {
            name: newName.trim()
        });
    }, [uid]);

    const deleteNotebook = useCallback(async (notebookId: string) => {
        if (!uid) throw new Error("User not authenticated");
        const notebookRef = doc(db, 'users', uid, 'notebooks', notebookId);
        const scenariosRef = collection(notebookRef, 'scenarios');
        const scenariosSnapshot = await getDocs(scenariosRef);

        const batch = writeBatch(db);

        scenariosSnapshot.forEach((scenarioDoc) => {
            batch.delete(scenarioDoc.ref);
        });

        batch.delete(notebookRef);

        await batch.commit();
    }, [uid]);

    const addScenario = useCallback(async (notebookId: string, scenario: Scenario) => {
        if (!uid) throw new Error("User not authenticated");
        const scenarioRef = doc(db, 'users', uid, 'notebooks', notebookId, 'scenarios', scenario.id);
        await setDoc(scenarioRef, cleanScenario(scenario));
    }, [uid]);

    const updateScenario = useCallback(async (notebookId: string, updatedScenario: Scenario) => {
        if (!uid) throw new Error("User not authenticated");
        const scenarioRef = doc(db, 'users', uid, 'notebooks', notebookId, 'scenarios', updatedScenario.id);
        await updateDoc(scenarioRef, cleanScenario(updatedScenario));
    }, [uid]);

    const deleteScenario = useCallback(async (notebookId: string, scenarioId: string) => {
        if (!uid) throw new Error("User not authenticated");
        const scenarioRef = doc(db, 'users', uid, 'notebooks', notebookId, 'scenarios', scenarioId);
        await deleteDoc(scenarioRef);
    }, [uid]);
    
    const addMultipleScenarios = useCallback(async (notebookId: string, scenariosToAdd: Scenario[]) => {
        if (!uid) throw new Error("User not authenticated");
        const batch = writeBatch(db);
        scenariosToAdd.forEach(scenario => {
            const scenarioRef = doc(db, 'users', uid, 'notebooks', notebookId, 'scenarios', scenario.id);
            batch.set(scenarioRef, cleanScenario(scenario));
        });
        await batch.commit();
    }, [uid]);
    
    const deleteMultipleScenarios = useCallback(async (notebookId: string, scenarioIds: string[]) => {
        if (!uid) throw new Error("User not authenticated");
        const batch = writeBatch(db);
        scenarioIds.forEach(scenarioId => {
            const scenarioRef = doc(db, 'users', uid, 'notebooks', notebookId, 'scenarios', scenarioId);
            batch.delete(scenarioRef);
        });
        await batch.commit();
    }, [uid]);

    return { notebooks, loading: loadingNotebooks || loadingScenarios, addNotebook, deleteNotebook, updateNotebookName, addScenario, updateScenario, deleteScenario, addMultipleScenarios, deleteMultipleScenarios };
};

export default useFirestoreNotebooks;