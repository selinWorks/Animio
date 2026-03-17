import React, {createContext, useContext, useState} from 'react';
import {Pet} from '../types/Pet';

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

  const addPet = (pet: Pet) => {
    setPets(prev => [...prev, pet]);
  };

  const removePet = (id: string) => {
    setPets(prev => prev.filter(p => p.id !== id));
  };

  const updatePet = (updatedPet: Pet) => {
    setPets(prev => prev.map(p => (p.id === updatedPet.id ? updatedPet : p)));
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