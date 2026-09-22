import firestore from '@react-native-firebase/firestore';

/* =========================================================
   PETS
   ========================================================= */

export const addPetToFirestore = async (pet, uid) => {
  const now = firestore.FieldValue.serverTimestamp();

  const docRef = await firestore()
    .collection('pets')
    .add({
      ownerId: uid,

      name: pet.name || '',
      type: pet.type || '',
      birthYear: pet.birthYear || null,
      gender: pet.gender || '',
      weight: pet.weight || '',
      vaccines: pet.vaccines || '',
      lastVetVisit: pet.lastVetVisit || '',
      notes: pet.notes || '',
      photoUrl: pet.photoUrl || '',

      createdAt: now,
      updatedAt: now,
    });

  return docRef.id;
};

export const updatePetInFirestore = async (pet, uid) => {
  await firestore()
    .collection('pets')
    .doc(pet.id)
    .update({
      ownerId: uid,

      name: pet.name || '',
      type: pet.type || '',
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
    .get();

  const pets = snapshot.docs
    .map(doc => {
      const data = doc.data();

      return {
        id: doc.id,

        ownerId: data.ownerId || '',

        name: data.name || '',
        type: data.type || '',

        birthYear:
          typeof data.birthYear === 'number'
            ? data.birthYear
            : undefined,

        gender: data.gender || '',
        weight: data.weight || '',
        vaccines: data.vaccines || '',
        lastVetVisit: data.lastVetVisit || '',
        notes: data.notes || '',
        photoUrl: data.photoUrl || '',

        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
      };
    })
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : 0;

      const bTime = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : 0;

      return bTime - aTime;
    });

  return pets;
};

export const deletePetFromFirestore = async id => {
  await firestore()
    .collection('pets')
    .doc(id)
    .delete();
};

/* =========================================================
   CARE EVENTS
   ========================================================= */

export const getCareEventsFromFirestore = async uid => {
  const snapshot = await firestore()
    .collection('careEvents')
    .where('ownerId', '==', uid)
    .get();

  const events = snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .sort((a, b) => {
      const aDate = a.date || '';
      const bDate = b.date || '';

      return aDate.localeCompare(bDate);
    });

  return events;
};

export const addCareEventToFirestore = async (
  event,
  uid,
) => {
  const now = firestore.FieldValue.serverTimestamp();

  const docRef = await firestore()
    .collection('careEvents')
    .add({
      ownerId: uid,

      title: event.title || '',
      date: event.date || '',
      time: event.time || '',
      type: event.type || 'Custom',
      petName: event.petName || '',
      note: event.note || '',
      color: event.color || '#C4B5FD',

      createdAt: now,
      updatedAt: now,
    });

  return docRef.id;
};

export const deleteCareEventFromFirestore = async eventId => {
  await firestore()
    .collection('careEvents')
    .doc(eventId)
    .delete();
};

/* =========================================================
   FEEDBACKS
   ========================================================= */

export const addFeedbackToFirestore = async (
  feedback,
  uid,
  email,
) => {
  const now = firestore.FieldValue.serverTimestamp();

  const docRef = await firestore()
    .collection('feedbacks')
    .add({
      ownerId: uid,
      email: email || '',

      message: feedback || '',

      createdAt: now,
      updatedAt: now,
    });

  return docRef.id;
};

/* =========================================================
   USER SETTINGS
   ========================================================= */

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

        updatedAt:
          firestore.FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      },
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

  return {
    id: doc.id,
    ...doc.data(),
  };
};

/* =========================================================
   ASSISTANT CHATS
   ========================================================= */

export const addAssistantChatToFirestore = async (
  chat,
  uid,
  email,
) => {
  const now = firestore.FieldValue.serverTimestamp();

  const problemTypes = Array.isArray(
    chat.problemTypes,
  )
    ? chat.problemTypes
    : chat.problemType
      ? [chat.problemType]
      : [];

  const problemType =
    chat.problemType ||
    problemTypes[0] ||
    '';

  const title = `${chat.petType || ''} - ${
    problemTypes.length > 0
      ? problemTypes.join(', ')
      : problemType
  }`;

  const docRef = await firestore()
    .collection('assistantChats')
    .add({
      ownerId: uid,
      email: email || '',

      petType: chat.petType || '',

      // Eski kayıtlarla uyumluluk
      problemType,

      // Yeni çoklu semptom sistemi
      problemTypes,

      duration: chat.duration || '',
      urgency: chat.urgency || '',

      // Dinamik takip sorularının cevapları
      followUpAnswers:
        chat.followUpAnswers || {},

      result: chat.result || '',
      aiMessage: chat.aiMessage || '',

      title,

      createdAt: now,
      updatedAt: now,
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