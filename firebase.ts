import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Substitua o seguinte objeto pela configuração do seu projeto Firebase.
// Você pode encontrar isso nas configurações do seu projeto no console do Firebase:
// https://console.firebase.google.com/
const firebaseConfig = {
    apiKey: "AIzaSyBCPAPx1uHDOHXABxWBefd5GhmxyBT70IE",
    authDomain: "rangerider-a0411.firebaseapp.com",
    projectId: "rangerider-a0411",
    storageBucket: "rangerider-a0411.firebasestorage.app",
    messagingSenderId: "10265683345",
    appId: "1:10265683345:web:702a9aa42994307fd42630",
    measurementId: "G-TFNXJYZPC6"
  };


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
// Inicializa o Firebase Authentication e obtém uma referência para o serviço
export const auth = getAuth(app);
// Inicializa o Cloud Firestore e obtém uma referência para o serviço
export const db = getFirestore(app);