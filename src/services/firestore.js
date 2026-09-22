import firestore from '@react-native-firebase/firestore';
import notifee, {TriggerType, AndroidImportance} from '@notifee/react-native';

export const addPetToFirestore = async (pet, uid) => {
  const docRef = await firestore()
    .collection('pets')
    .add({
      ownerId: uid,
      name: pet.name,
      type: pet.type,
      birthYear: pet.birthYear,
      gender: pet.gender || '',
      weight: pet.weight || '',
      vaccines: pet.vaccines || '',
      lastVetVisit: pet.lastVetVisit || '',
      notes: pet.notes || '',
      photoUrl: pet.photoUrl || '',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

  return docRef.id;
};

export const updatePetInFirestore = async (pet, uid) => {
  await firestore()
    .collection('pets')
    .doc(pet.id)
    .update({
      ownerId: uid,
      name: pet.name,
      type: pet.type,
      birthYear: pet.birthYear || null,
      gender: pet.gender || '',
      weight: pet.weight || '',
      vaccines: pet.vaccines || '',
      lastVetVisit: pet.lastVetVisit || '',
      notes: pet.notes || '',
      photoUrl: pet.photoUrl || '',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
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
      birthYear:
        typeof data.birthYear === 'number'
          ? data.birthYear
          : undefined,
      age:
        typeof data.age === 'number'
          ? data.age
          : undefined,
      gender: data.gender || '',
      weight: data.weight || '',
      vaccines: data.vaccines || '',
      lastVetVisit: data.lastVetVisit || '',
      notes: data.notes || '',
      photoUrl: data.photoUrl || '',
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
  const docRef = await firestore()
    .collection('careEvents')
    .add({
      ownerId: uid,
      title: event.title,
      date: event.date,
      time: event.time || '',
      type: event.type || 'Custom',
      petName: event.petName || '',
      note: event.note || '',
      color: event.color || '#C4B5FD',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

  return docRef.id;
};

export const deleteCareEventFromFirestore = async eventId => {
  await firestore()
    .collection('careEvents')
    .doc(eventId)
    .delete();
};

export const addFeedbackToFirestore = async (
  feedback,
  uid,
  email,
) => {
  const docRef = await firestore()
    .collection('feedbacks')
    .add({
      ownerId: uid,
      email: email || '',
      message: feedback,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

  return docRef.id;
};

export const saveUserSettingsToFirestore = async (
  uid,
  settings,
) => {
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
  const doc = await firestore()
    .collection('userSettings')
    .doc(uid)
    .get();

  if (!doc.exists) {
    return null;
  }

  return doc.data();
};

export const addAssistantChatToFirestore = async (
  chat,
  uid,
  email,
) => {
  const docRef = await firestore()
    .collection('assistantChats')
    .add({
      ownerId: uid,
      email: email || '',
      petType: chat.petType || '',
      problemType: chat.problemType || '',
      problemTypes: Array.isArray(chat.problemTypes)
        ? chat.problemTypes
        : chat.problemType
          ? [chat.problemType]
          : [],
      duration: chat.duration || '',
      urgency: chat.urgency || '',
      followUpAnswers: chat.followUpAnswers || {},
      result: chat.result || '',
      aiMessage: chat.aiMessage || '',
      title: `${chat.petType || ''} - ${
        Array.isArray(chat.problemTypes)
          ? chat.problemTypes.join(', ')
          : chat.problemType || ''
      }`,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

  return docRef.id;
};

export const getAssistantChatsFromFirestore = async uid => {
  const snapshot = await firestore()
    .collection('assistantChats')
    .where('ownerId', '==', uid)
    .get();

  const chats = snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : 0;

      const bTime = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : 0;

      return bTime - aTime;
    });

  return chats;
};

export const deleteAssistantChatFromFirestore = async chatId => {
  await firestore()
    .collection('assistantChats')
    .doc(chatId)
    .delete();
};
