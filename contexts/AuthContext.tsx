import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { UserProfile } from '../types';

type AppUser = (User & Partial<UserProfile>);

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signup: (email: string, password: string, rememberMe: boolean) => Promise<UserCredential>;
  login: (email: string, password: string, rememberMe: boolean) => Promise<UserCredential>;
  loginWithGoogle: (rememberMe: boolean) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string, phone: string) => Promise<void>;
  forceReloadUser: () => void;
  sendSignupVerificationCode: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
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
    let unsubProfile = () => {};
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      unsubProfile(); // Clean up previous profile listener
      if (authUser) {
        // User is logged in, now listen for profile changes in Firestore
        const userDocRef = doc(db, 'users', authUser.uid);
        unsubProfile = onSnapshot(userDocRef, (doc) => {
          const profileData = doc.data() as UserProfile;
          // We need to merge the latest auth user object with profile data
          // because properties like `emailVerified` can change.
          const latestAuthUser = auth.currentUser;
          if (latestAuthUser) {
              setUser({ ...latestAuthUser, ...profileData });
          }
          setLoading(false);
        }, (error) => {
            console.error("Error listening to profile updates:", error);
            setLoading(false);
        });
      } else {
        // User is logged out
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe(); // Cleanup auth listener on unmount
      unsubProfile(); // Cleanup profile listener on unmount
    };
  }, []);
  
  const signup = async (email: string, password: string, rememberMe: boolean) => {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userDocRef, { firstName: '', lastName: '', phone: '' });

    // Send verification email
    await sendEmailVerification(userCredential.user);

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
  
  const forceReloadUser = useCallback(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
        // Re-fetch profile and merge with latest auth user.
        const userDocRef = doc(db, 'users', currentUser.uid);
        getDoc(userDocRef).then((docSnap) => {
            // auth.currentUser is already up-to-date from a recent reload() call.
            if (auth.currentUser) {
               const profileData = docSnap.data() as UserProfile;
               setUser({ ...auth.currentUser, ...profileData });
            }
        });
    }
  }, []);

  const sendSignupVerificationCode = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Usuário não autenticado para reenviar verificação.");
    await sendEmailVerification(currentUser);
  };
  
  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
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
    forceReloadUser,
    sendSignupVerificationCode,
    sendPasswordReset,
    changePasswordWithOldPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};