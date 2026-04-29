import firestore from '@react-native-firebase/firestore';

export const addPetToFirestore = async (pet, uid) => {
  const docRef = await firestore().collection('pets').add({
    ownerId: uid,
    name: pet.name,
    type: pet.type,
    age: pet.age,
    gender: pet.gender || '',
    weight: pet.weight || '',
    vaccines: pet.vaccines || '',
    lastVetVisit: pet.lastVetVisit || '',
    notes: pet.notes || '',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  return docRef.id;
};

export const getPetsFromFirestore = async uid => {
  const snapshot = await firestore()
    .collection('pets')
    .where('ownerId', '==', uid)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();

    return {
      id: doc.id,
      name: data.name || '',
      type: data.type || '',
      age: data.age || 0,
      gender: data.gender || '',
      weight: data.weight || '',
      vaccines: data.vaccines || '',
      lastVetVisit: data.lastVetVisit || '',
      notes: data.notes || '',
    };
  });
};

export const deletePetFromFirestore = async id => {
  await firestore().collection('pets').doc(id).delete();
};

export const getCareEventsFromFirestore = async uid => {
  const snapshot = await firestore()
    .collection('careEvents')
    .where('ownerId', '==', uid)
    .orderBy('date', 'asc')
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const addCareEventToFirestore = async (event, uid) => {
  const docRef = await firestore().collection('careEvents').add({
    ownerId: uid,
    title: event.title,
    date: event.date,
    type: event.type || 'Custom',
    petName: event.petName,
    note: event.note || '',
    color: event.color || '#C4B5FD',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  return docRef.id;
};

export const deleteCareEventFromFirestore = async eventId => {
  await firestore().collection('careEvents').doc(eventId).delete();
};