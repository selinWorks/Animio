import React, {createContext, useContext, useEffect, useState} from 'react';
import auth from '@react-native-firebase/auth';

type AuthContextType = {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({children}: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setUser(user);
      setLoading(false);
    });

    return subscriber;
  }, []);

  const login = async (email: string, password: string) => {
    await auth().signInWithEmailAndPassword(email, password);
  };

  const register = async (email: string, password: string) => {
    await auth().createUserWithEmailAndPassword(email, password);
  };

  const logout = async () => {
    await auth().signOut();
  };

  return (
    <AuthContext.Provider value={{user, loading, login, register, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);