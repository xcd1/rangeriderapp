import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Substitua o seguinte objeto pela configuração do seu projeto Firebase.
// Você pode encontrar isso nas configurações do seu projeto no console do Firebase:
// https://console.firebase.google.com/
const firebaseConfig = {
  
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID

  };


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
// Inicializa o Firebase Authentication e obtém uma referência para o serviço
export const auth = getAuth(app);
// Inicializa o Cloud Firestore e obtém uma referência para o serviço
export const db = getFirestore(app);