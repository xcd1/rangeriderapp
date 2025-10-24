import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import type { Notebook, Scenario } from '../types';

interface FirestoreNotebooksResult {
    notebooks: Notebook[];
    loading: boolean;
    addNotebook: (name: string) => Promise<void>;
    deleteNotebook: (notebookId: string) => Promise<void>;
    addScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
    updateScenario: (notebookId: string, scenario: Scenario) => Promise<void>;
    deleteScenario: (notebookId: string, scenarioId: string) => Promise<void>;
}

const useFirestoreNotebooks = (uid: string | undefined): FirestoreNotebooksResult => {
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setNotebooks([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(collection(db, 'users', uid, 'notebooks'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const notebooksData: Notebook[] = [];
            querySnapshot.forEach((doc) => {
                notebooksData.push({ id: doc.id, ...doc.data() } as Notebook);
            });
            setNotebooks(notebooksData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notebooks:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [uid]);

    const addNotebook = useCallback(async (name: string) => {
        if (!uid) throw new Error("User not authenticated");
        await addDoc(collection(db, 'users', uid, 'notebooks'), {
            name,
            scenarios: [],
        });
    }, [uid]);

    const deleteNotebook = useCallback(async (notebookId: string) => {
        if (!uid) throw new Error("User not authenticated");
        await deleteDoc(doc(db, 'users', uid, 'notebooks', notebookId));
    }, [uid]);

    const addScenario = useCallback(async (notebookId: string, scenario: Scenario) => {
        if (!uid) throw new Error("User not authenticated");
        const notebookRef = doc(db, 'users', uid, 'notebooks', notebookId);
        await updateDoc(notebookRef, {
            scenarios: arrayUnion(scenario)
        });
    }, [uid]);

    const updateScenario = useCallback(async (notebookId: string, updatedScenario: Scenario) => {
        if (!uid) throw new Error("User not authenticated");
        const notebookRef = doc(db, 'users', uid, 'notebooks', notebookId);
        const notebookSnap = await getDoc(notebookRef);
        if (notebookSnap.exists()) {
            const existingNotebook = notebookSnap.data() as Notebook;
            const updatedScenarios = (existingNotebook.scenarios || []).map(s =>
                s.id === updatedScenario.id ? updatedScenario : s
            );
            await updateDoc(notebookRef, { scenarios: updatedScenarios });
        }
    }, [uid]);

    const deleteScenario = useCallback(async (notebookId: string, scenarioId: string) => {
        if (!uid) throw new Error("User not authenticated");
        const notebookRef = doc(db, 'users', uid, 'notebooks', notebookId);
        const notebookSnap = await getDoc(notebookRef);
         if (notebookSnap.exists()) {
            const existingNotebook = notebookSnap.data() as Notebook;
            const scenarioToDelete = (existingNotebook.scenarios || []).find(s => s.id === scenarioId);
            if (scenarioToDelete) {
                await updateDoc(notebookRef, {
                    scenarios: arrayRemove(scenarioToDelete)
                });
            }
        }
    }, [uid]);

    return { notebooks, loading, addNotebook, deleteNotebook, addScenario, updateScenario, deleteScenario };
};

export default useFirestoreNotebooks;