'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signOut: async () => {},
  isAdmin: false,
  isManager: false,
});

let cachedUser: FirebaseUser | null = null;
let cachedUserData: User | null = null;
let authInitialized = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(cachedUser);
  const [userData, setUserData] = useState<User | null>(cachedUserData);
  const [loading, setLoading] = useState(!authInitialized);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (authInitialized) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      cachedUser = firebaseUser;

      if (firebaseUser && !fetchedRef.current) {
        fetchedRef.current = true;
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = { id: userDoc.id, ...userDoc.data() } as User;
            setUserData(data);
            cachedUserData = data;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else if (!firebaseUser) {
        setUserData(null);
        cachedUserData = null;
      }
      
      setLoading(false);
      authInitialized = true;
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    cachedUser = null;
    cachedUserData = null;
    setUser(null);
    setUserData(null);
  };

  const isAdmin = userData?.role === 'admin';
  const isManager = userData?.role === 'manager';

  return (
    <AuthContext.Provider value={{ user, userData, loading, signOut, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);