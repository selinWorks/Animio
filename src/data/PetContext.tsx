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


/* =========================================================
   CONTEXT TYPE
========================================================= */

type PetContextType = {
  pets: Pet[];

  addPet: (pet: Pet) => void;

  removePet: (id: string) => Promise<void>;

  updatePet: (
    updatedPet: Pet,
  ) => Promise<void>;

  reloadPets: () => Promise<void>;
};


/* =========================================================
   CONTEXT
========================================================= */

const PetContext =
  createContext<
    PetContextType | undefined
  >(undefined);


/* =========================================================
   PROVIDER
========================================================= */

export const PetProvider: React.FC<{
  children: React.ReactNode;
}> = ({children}) => {
  const {user} = useAuth();

  const [pets, setPets] =
    useState<Pet[]>([]);


  /* =======================================================
     LOAD PETS
  ======================================================= */

  const loadPets = useCallback(
    async () => {
      try {
        if (!user?.uid) {
          setPets([]);
          return;
        }

        const data =
          await getPetsFromFirestore(
            user.uid,
          );

        setPets(data);
      } catch (error) {
        console.log(
          'Petler yüklenemedi:',
          error,
        );
      }
    },
    [user?.uid],
  );


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadPets();
  }, [loadPets]);


  /* =======================================================
     ADD PET
  ======================================================= */

  const addPet = (pet: Pet) => {
    setPets(prev => [
      ...prev,
      pet,
    ]);
  };


  /* =======================================================
     REMOVE PET / LEAVE PET
  ======================================================= */

  const removePet = async (
    id: string,
  ) => {
    try {
      if (!user?.uid) {
        return;
      }

      /*
       * Artık kullanıcıyı petMembers listesinden
       * çıkartıyoruz.
       *
       * Eğer son üyeyse Firestore profili tamamen
       * siliyor.
       */
      await deletePetFromFirestore(
        id,
        user.uid,
      );

      /*
       * Lokal listeden de kaldır.
       */
      setPets(prev =>
        prev.filter(
          pet => pet.id !== id,
        ),
      );
    } catch (error) {
      console.log(
        'Pet üyeliğinden ayrılma hatası:',
        error,
      );
    }
  };


  /* =======================================================
     UPDATE PET
  ======================================================= */

  const updatePet = async (
    updatedPet: Pet,
  ) => {
    try {
      if (!user?.uid) {
        return;
      }

      await updatePetInFirestore(
        updatedPet,
        user.uid,
      );

      setPets(prev =>
        prev.map(p =>
          p.id === updatedPet.id
            ? {
                ...updatedPet,

                petMembers:
                  updatedPet.petMembers?.includes(
                    user.uid,
                  )
                    ? updatedPet.petMembers
                    : [
                        ...(updatedPet.petMembers ||
                          []),
                        user.uid,
                      ],
              }
            : p,
        ),
      );
    } catch (error) {
      console.log(
        'Güncelleme hatası:',
        error,
      );

      throw error;
    }
  };


  /* =======================================================
     PROVIDER
  ======================================================= */

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


/* =========================================================
   HOOK
========================================================= */

export const usePets = () => {
  const ctx =
    useContext(PetContext);

  if (!ctx) {
    throw new Error(
      'usePets must be used within PetProvider',
    );
  }

  return ctx;
};