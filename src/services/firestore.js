import firestore from '@react-native-firebase/firestore';

/* =========================================================
   PETS
   ========================================================= */

export const addPetToFirestore = async (pet, uid) => {
  const now = firestore.FieldValue.serverTimestamp();

  const docRef = await firestore()
    .collection('pets')
    .add({
      /*
       * Eski sistemle uyumluluk
       */
      ownerId: uid,

      /*
       * Yeni çok kullanıcılı sistem
       *
       * İlk oluşturan kullanıcı otomatik olarak
       * petMembers içerisine eklenir.
       */
      petMembers: [uid],

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


/* =========================================================
   UPDATE PET
========================================================= */

export const updatePetInFirestore = async (
  pet,
  uid,
) => {
  await firestore()
    .collection('pets')
    .doc(pet.id)
    .update({
      /*
       * Eski sistemle uyumluluk
       */
      ownerId: pet.ownerId || uid,

      /*
       * Mevcut üyeleri korur.
       *
       * Kullanıcı zaten üyeyse tekrar eklenmez.
       */
      petMembers:
        firestore.FieldValue.arrayUnion(uid),

      name: pet.name || '',
      type: pet.type || '',
      birthYear: pet.birthYear || null,
      gender: pet.gender || '',
      weight: pet.weight || '',
      vaccines: pet.vaccines || '',
      lastVetVisit: pet.lastVetVisit || '',
      notes: pet.notes || '',
      photoUrl: pet.photoUrl || '',

      updatedAt:
        firestore.FieldValue.serverTimestamp(),
    });
};


/* =========================================================
   GET PETS
========================================================= */

export const getPetsFromFirestore = async uid => {
  if (!uid) {
    return [];
  }

  /*
   * Yeni sistem:
   *
   * Kullanıcının petMembers içerisinde bulunduğu
   * tüm profilleri getirir.
   */
  const memberSnapshot = await firestore()
    .collection('pets')
    .where(
      'petMembers',
      'array-contains',
      uid,
    )
    .get();

  /*
   * Eski kayıtlar:
   *
   * Henüz petMembers alanı olmayan eski profiller
   * ownerId üzerinden de getiriliyor.
   */
  const ownerSnapshot = await firestore()
    .collection('pets')
    .where(
      'ownerId',
      '==',
      uid,
    )
    .get();

  /*
   * Aynı pet iki sorguda da bulunabilir.
   * Bu nedenle Map kullanarak ID üzerinden
   * tekilleştiriyoruz.
   */
  const petMap = new Map();

  memberSnapshot.docs.forEach(doc => {
    petMap.set(doc.id, doc);
  });

  ownerSnapshot.docs.forEach(doc => {
    petMap.set(doc.id, doc);
  });

  const pets = Array.from(petMap.values())
    .map(doc => {
      const data = doc.data();

      /*
       * Eski kayıtların petMembers alanı yoksa
       * ownerId otomatik olarak üye kabul edilir.
       */
      const petMembers = Array.isArray(
        data.petMembers,
      )
        ? data.petMembers
        : data.ownerId
          ? [data.ownerId]
          : [];

      return {
        id: doc.id,

        ownerId:
          data.ownerId || '',

        petMembers,

        name:
          data.name || '',

        type:
          data.type || '',

        birthYear:
          typeof data.birthYear === 'number'
            ? data.birthYear
            : undefined,

        gender:
          data.gender || '',

        weight:
          data.weight || '',

        vaccines:
          data.vaccines || '',

        lastVetVisit:
          data.lastVetVisit || '',

        notes:
          data.notes || '',

        photoUrl:
          data.photoUrl || '',

        createdAt:
          data.createdAt || null,

        updatedAt:
          data.updatedAt || null,
      };
    })
    .sort((a, b) => {
      const aTime =
        a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : 0;

      const bTime =
        b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : 0;

      return bTime - aTime;
    });

  return pets;
};


/* =========================================================
   DELETE PET
========================================================= */

export const deletePetFromFirestore = async (
  id,
  uid,
) => {
  if (!id || !uid) {
    return;
  }

  const petRef = firestore()
    .collection('pets')
    .doc(id);

  await firestore().runTransaction(
    async transaction => {
      const snapshot =
        await transaction.get(petRef);

      if (!snapshot.exists) {
        return;
      }

      const data = snapshot.data() || {};

      /*
       * Eski kayıt için üyelik listesi oluştur.
       */
      const currentMembers =
        Array.isArray(data.petMembers)
          ? data.petMembers
          : data.ownerId
            ? [data.ownerId]
            : [];

      /*
       * Silmek isteyen kullanıcı listede yoksa
       * herhangi bir işlem yapma.
       */
      if (!currentMembers.includes(uid)) {
        return;
      }

      const remainingMembers =
        currentMembers.filter(
          memberId => memberId !== uid,
        );

      /*
       * Son kullanıcı da ayrılıyorsa
       * profil tamamen silinir.
       */
      if (remainingMembers.length === 0) {
        transaction.delete(petRef);
        return;
      }

      /*
       * Kullanıcı ayrılıyor ama başka üyeler
       * profil üzerinde kalmaya devam ediyor.
       */
      const currentOwnerId =
        data.ownerId || '';

      let nextOwnerId =
        currentOwnerId;

      /*
       * Eski sahibi ayrıldıysa kalan ilk kullanıcı
       * yeni owner olarak atanır.
       */
      if (currentOwnerId === uid) {
        nextOwnerId =
          remainingMembers[0];
      }

      transaction.update(petRef, {
        ownerId: nextOwnerId,

        petMembers:
          remainingMembers,

        updatedAt:
          firestore.FieldValue.serverTimestamp(),
      });
    },
  );
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