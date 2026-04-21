import React, {createContext, useContext, useEffect, useState} from 'react';
import {Pet} from '../types/Pet';
import {getPetsFromFirestore, deletePetFromFirestore} from '../services/firestore';

type PetContextType = {
  pets: Pet[];
  addPet: (pet: Pet) => void;
  removePet: (id: string) => void;
  updatePet: (updatedPet: Pet) => void;
};

const PetContext = createContext<PetContextType | undefined>(undefined);

export const PetProvider: React.FC<{children: React.ReactNode}> = ({
                                                                     children,
                                                                   }) => {
  const [pets, setPets] = useState<Pet[]>([]);

  // 🔥 FIRESTORE'DAN YÜKLE
  const loadPets = async () => {
    try {
      const data = await getPetsFromFirestore();
      setPets(data);
    } catch (error) {
      console.log('Petler yüklenemedi:', error);
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  const addPet = (pet: Pet) => {
    setPets(prev => [...prev, pet]);
  };

  // 🔥 FIRESTORE'DAN DA SİL
  const removePet = async (id: string) => {
    try {
      await deletePetFromFirestore(id);
      setPets(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.log('Silme hatası:', error);
    }
  };

  const updatePet = (updatedPet: Pet) => {
    setPets(prev =>
      prev.map(p => (p.id === updatedPet.id ? updatedPet : p)),
    );
  };

  return (
    <PetContext.Provider value={{pets, addPet, removePet, updatePet}}>
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