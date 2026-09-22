import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {Pet} from '../types/Pet';
import {
  getPetsFromFirestore,
  deletePetFromFirestore,
  updatePetInFirestore,
} from '../services/firestore';
import {useAuth} from './AuthContext';

type PetContextType = {
  pets: Pet[];
  addPet: (pet: Pet) => void;
  removePet: (id: string) => Promise<void>;
  updatePet: (updatedPet: Pet) => Promise<void>;
  reloadPets: () => Promise<void>;
};

const PetContext = createContext<PetContextType | undefined>(undefined);

export const PetProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const {user} = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);

  const loadPets = useCallback(async () => {
    try {
      if (!user?.uid) {
        setPets([]);
        return;
      }

      const data = await getPetsFromFirestore(user.uid);
      setPets(data);
    } catch (error) {
      console.log('Petler yüklenemedi:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const addPet = (pet: Pet) => {
    setPets(prev => [...prev, pet]);
  };

  const removePet = async (id: string) => {
    try {
      if (!user?.uid) {
        return;
      }

      await deletePetFromFirestore(id);
      setPets(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.log('Silme hatası:', error);
    }
  };

  const updatePet = async (updatedPet: Pet) => {
    try {
      if (!user?.uid) {
        return;
      }

      await updatePetInFirestore(updatedPet, user.uid);

      setPets(prev =>
        prev.map(p =>
          p.id === updatedPet.id ? updatedPet : p,
        ),
      );
    } catch (error) {
      console.log('Güncelleme hatası:', error);
      throw error;
    }
  };

  return (
    <PetContext.Provider
      value={{
        pets,
        addPet,
        removePet,
        updatePet,
        reloadPets: loadPets,
      }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePets = () => {
  const ctx = useContext(PetContext);

  if (!ctx) {
    throw new Error('usePets must be used within PetProvider');
  }

  return ctx;
};
