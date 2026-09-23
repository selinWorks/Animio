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
      ownerId: pet.ownerId || uid,

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
        petMembers:
          firestore.FieldValue.arrayUnion(
            uid,
          ),

        lastAcceptedInvitationCode:
          normalizedCode,

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

/* =========================================================
   PET INVITATIONS
========================================================= */

/*
 * 6 haneli davet kodu üretir.
 */
const generateInviteCode = () => {
  const characters =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(
      Math.random() * characters.length,
    );

    code += characters[randomIndex];
  }

  return code;
};


/*
 * Pet için aile üyesi daveti oluşturur.
 */
export const createPetInvitation = async (
  pet,
  inviterId,
  inviteeEmail,
) => {
  if (!pet?.id || !inviterId) {
    throw new Error(
      'Davet oluşturmak için pet ve kullanıcı bilgisi gerekli.',
    );
  }

  const normalizedEmail =
    (inviteeEmail || '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      'Davet edilecek e-posta adresi gerekli.',
    );
  }

  const code = generateInviteCode();

  const invitationRef = firestore()
    .collection('petInvitations')
    .doc(code);

  const now =
    firestore.FieldValue.serverTimestamp();

  const expiresAt =
    firestore.Timestamp.fromDate(
      new Date(
        Date.now() +
          7 * 24 * 60 * 60 * 1000,
      ),
    );

  await invitationRef.set({
    petId: pet.id,
    petName: pet.name || '',
    inviterId,
    inviteeEmail: normalizedEmail,
    code,
    status: 'pending',
    createdAt: now,
    expiresAt,
  });

  return {
    code,
    invitationId: code,
  };
};

/* =========================================================
   GET PET INVITATION
========================================================= */

/*
 * 6 haneli davet koduna göre daveti getirir.
 */
export const getPetInvitationByCode = async code => {
  const normalizedCode =
    (code || '')
      .trim()
      .toUpperCase();

  if (!normalizedCode) {
    throw new Error(
      'Davet kodu gerekli.',
    );
  }

  const invitationRef = firestore()
    .collection('petInvitations')
    .doc(normalizedCode);

  const snapshot =
    await invitationRef.get();

  if (!snapshot.exists) {
    throw new Error(
      'Bu kodla eşleşen bir davet bulunamadı.',
    );
  }

  const data = snapshot.data() || {};

  /*
   * Davetin süresi dolmuş mu?
   */
  if (
    data.expiresAt &&
    data.expiresAt.toDate &&
    data.expiresAt.toDate().getTime() <
      Date.now()
  ) {
    throw new Error(
      'Bu davetin süresi dolmuş.',
    );
  }

  /*
   * Daha önce kullanılmış davet tekrar
   * kullanılamaz.
   */
  if (data.status !== 'pending') {
    throw new Error(
      'Bu davet artık geçerli değil.',
    );
  }

  return {
    id: snapshot.id,
    ...data,
  };
};


/* =========================================================
   ACCEPT PET INVITATION
========================================================= */

/*
 * Daveti kabul eder ve mevcut kullanıcıyı
 * petMembers içerisine ekler.
 */
export const acceptPetInvitation = async (
  code,
  uid,
) => {
  const normalizedCode =
    (code || '').trim().toUpperCase();

  if (!normalizedCode || !uid) {
    throw new Error(
      'Davet kodu ve kullanıcı bilgisi gerekli.',
    );
  }

  const invitationRef = firestore()
    .collection('petInvitations')
    .doc(normalizedCode);

  /*
   * Önce daveti okuyoruz.
   * Kullanıcı davet edilen e-posta hesabıyla
   * giriş yaptıysa güvenlik kuralları buna izin veriyor.
   */
  const invitationSnapshot =
    await invitationRef.get();

  if (!invitationSnapshot.exists) {
    throw new Error(
      'Bu kodla eşleşen bir davet bulunamadı.',
    );
  }

  const invitation =
    invitationSnapshot.data() || {};

  if (invitation.status !== 'pending') {
    throw new Error(
      'Bu davet artık geçerli değil.',
    );
  }

  if (
    invitation.expiresAt &&
    invitation.expiresAt.toDate &&
    invitation.expiresAt
      .toDate()
      .getTime() < Date.now()
  ) {
    throw new Error(
      'Bu davetin süresi dolmuş.',
    );
  }

  if (!invitation.petId) {
    throw new Error(
      'Bu davet geçerli bir pet profiline bağlı değil.',
    );
  }

  /*
   * Kullanıcının davet edilen e-posta adresiyle
   * eşleşmesini kontrol ediyoruz.
   */
  const currentUserEmail =
    (firestore().app.auth().currentUser?.email || '')
      .trim()
      .toLowerCase();

  const invitedEmail =
    (invitation.inviteeEmail || '')
      .trim()
      .toLowerCase();

  if (
    invitedEmail &&
    currentUserEmail &&
    invitedEmail !== currentUserEmail
  ) {
    throw new Error(
      'Bu davet farklı bir e-posta adresine gönderilmiş.',
    );
  }

  /*
   * PET DOKÜMANINI OKUMUYORUZ.
   *
   * Kullanıcı henüz pet üyesi olmadığı için
   * pet'i okumaya çalışmak PERMISSION_DENIED
   * oluşturuyordu.
   *
   * Bunun yerine batch kullanıyoruz.
   */

  const petRef = firestore()
    .collection('pets')
    .doc(invitation.petId);

  const batch = firestore().batch();

  batch.update(petRef, {
    petMembers:
      firestore.FieldValue.arrayUnion(uid),

    lastAcceptedInvitationCode:
      normalizedCode,

    updatedAt:
      firestore.FieldValue.serverTimestamp(),
  });

  batch.update(invitationRef, {
    status: 'accepted',

    inviteeUid: uid,

    acceptedAt:
      firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    success: true,
    code: normalizedCode,
    petId: invitation.petId,
  };
};