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

export const addFeedbackToFirestore = async (feedback, uid, email) => {
  const docRef = await firestore().collection('feedbacks').add({
    ownerId: uid,
    email,
    message: feedback,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  return docRef.id;
};

export const saveUserSettingsToFirestore = async (uid, settings) => {
  await firestore()
    .collection('userSettings')
    .doc(uid)
    .set(
      {
        ...settings,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
};

export const getUserSettingsFromFirestore = async uid => {
  const doc = await firestore().collection('userSettings').doc(uid).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data();
};

export const addAssistantChatToFirestore = async (chat, uid, email) => {
  const docRef = await firestore().collection('assistantChats').add({
    ownerId: uid,
    email,
    petType: chat.petType,
    problemType: chat.problemType,
    duration: chat.duration,
    urgency: chat.urgency,
    result: chat.result,
    aiMessage: chat.aiMessage,
    title: `${chat.petType} - ${chat.problemType}`,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  return docRef.id;
};

export const getAssistantChatsFromFirestore = async uid => {
  const snapshot = await firestore()
    .collection('assistantChats')
    .where('ownerId', '==', uid)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const deleteAssistantChatFromFirestore = async chatId => {
  await firestore().collection('assistantChats').doc(chatId).delete();
};