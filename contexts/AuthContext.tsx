import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  UserCredential,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { UserProfile } from '../types';

// --- SIMULATED BACKEND LOGIC FOR CODE VERIFICATION ---
// In a real application, this logic would live in a secure backend (e.g., Firebase Functions).
// We use sessionStorage here for a client-only simulation.

const generateCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const storeCode = (email: string, purpose: string, code: string) => {
  const key = `verificationCode_${purpose}_${email.toLowerCase()}`;
  const data = { code, expires: Date.now() + 10 * 60 * 1000 }; // 10 minute expiry
  sessionStorage.setItem(key, JSON.stringify(data));
  alert(`(APENAS SIMULAÇÃO - NENHUM E-MAIL FOI ENVIADO)\n\nSeu código de verificação para ${email} é: ${code}`);
};

const verifyCode = (email: string, purpose: string, code: string): boolean => {
  const key = `verificationCode_${purpose}_${email.toLowerCase()}`;
  const dataStr = sessionStorage.getItem(key);
  if (!dataStr) return false;

  const data = JSON.parse(dataStr);
  if (data.code === code && Date.now() < data.expires) {
    sessionStorage.removeItem(key); // Code can only be used once
    return true;
  }
  return false;
};

// --- END OF SIMULATED BACKEND LOGIC ---


type AppUser = (User & Partial<UserProfile>);

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signup: (email: string, password: string, rememberMe: boolean) => Promise<UserCredential>;
  login: (email: string, password: string, rememberMe: boolean) => Promise<UserCredential>;
  loginWithGoogle: (rememberMe: boolean) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string, phone: string) => Promise<void>;
  
  // New code-based functions
  sendSignupVerificationCode: () => Promise<void>;
  completeSignupVerification: (code: string) => Promise<void>;
  sendPasswordResetCode: (email: string) => Promise<void>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<void>;
  sendChangePasswordCode: () => Promise<void>;
  changePasswordWithCode: (code: string, newPassword: string) => Promise<void>;
  changePasswordWithOldPassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener handles both auth state changes and Firestore profile updates
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // User is logged in, now listen for profile changes in Firestore
        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubProfile = onSnapshot(userDocRef, (doc) => {
          const profileData = doc.data() as UserProfile;
          setUser({ ...authUser, ...profileData });
          setLoading(false);
        });
        return () => unsubProfile(); // Cleanup profile listener on logout
      } else {
        // User is logged out
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup auth listener on unmount
  }, []);
  
  const signup = async (email: string, password: string, rememberMe: boolean) => {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userDocRef, { isVerified: false, firstName: '', lastName: '', phone: '' });

    return userCredential;
  }

  const login = async (email: string, password:string, rememberMe: boolean) => {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    return signInWithEmailAndPassword(auth, email, password);
  }

  const loginWithGoogle = async (rememberMe: boolean) => {
      const provider = new GoogleAuthProvider();
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      const result = await signInWithPopup(auth, provider);

      // On first Google login, create their Firestore profile
      const userDocRef = doc(db, 'users', result.user.uid);
      await setDoc(userDocRef, { 
        isVerified: true, // Google accounts are considered verified
        firstName: result.user.displayName?.split(' ')[0] || '',
        lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
        phone: result.user.phoneNumber || ''
      }, { merge: true });

      return result;
  }
  
  const updateUserProfile = async (displayName: string, phone: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Usuário não autenticado.");
    
    // Update Firebase Auth profile
    await updateProfile(currentUser, { displayName });
    
    // Update Firestore profile
    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, { phone }, { merge: true });
  };
  
  // --- New Code Verification Functions ---
  
  const sendSignupVerificationCode = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error("Usuário não encontrado para enviar código.");
    const code = generateCode();
    storeCode(currentUser.email, 'signup', code);
  };
  
  const completeSignupVerification = async (code: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error("Usuário não encontrado para verificar.");

    if (verifyCode(currentUser.email, 'signup', code)) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { isVerified: true }, { merge: true });
    } else {
      throw new Error("Código inválido.");
    }
  };

  const sendPasswordResetCode = async (email: string) => {
    const code = generateCode();
    storeCode(email, 'reset', code);
  };
  
  const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
    if (verifyCode(email, 'reset', code)) {
      // In a real app, you would call a Firebase Function here
      // which uses the Admin SDK to update the user's password, bypassing the need for the old one.
      // e.g., admin.auth().updateUser(uid, { password: newPassword });
      // For this simulation, we'll just log success.
      console.log(`(Simulação) Senha para ${email} alterada com sucesso.`);
      alert(`(Simulação) Senha para ${email} alterada com sucesso! Você já pode fazer login com a nova senha.`);
    } else {
      throw new Error("Código inválido.");
    }
  };

  const sendChangePasswordCode = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error("Usuário não encontrado para enviar código.");
    const code = generateCode();
    storeCode(currentUser.email, 'change', code);
  };
  
  const changePasswordWithCode = async (code: string, newPassword: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error("Usuário não encontrado.");
    
    if (verifyCode(currentUser.email, 'change', code)) {
      // Firebase's client-side `updatePassword` is a sensitive operation and
      // requires recent re-authentication with the OLD password.
      // A custom code flow like this requires a backend (Firebase Function with Admin SDK)
      // to bypass that requirement securely. We are simulating the success case here.
      console.log(`(Simulação) Senha para ${currentUser.email} alterada com sucesso via código.`);
      alert(`(Simulação) Senha para ${currentUser.email} alterada com sucesso.`);
    } else {
      throw new Error("Código inválido.");
    }
  };

  const changePasswordWithOldPassword = async (oldPassword: string, newPassword: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error("Usuário não autenticado.");

    const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
    
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  };


  const value = {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout: () => signOut(auth),
    updateUserProfile,
    sendSignupVerificationCode,
    completeSignupVerification,
    sendPasswordResetCode,
    resetPasswordWithCode,
    sendChangePasswordCode,
    changePasswordWithCode,
    changePasswordWithOldPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};