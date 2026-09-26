import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/* =========================================================
   PETS
========================================================= */

export const addPetToFirestore = async (pet, uid) => {
  if (!uid) {
    throw new Error('Kullanıcı bilgisi gerekli.');
  }

  const now = firestore.FieldValue.serverTimestamp();

  const docRef = await firestore()
    .collection('pets')
    .add({
      ownerId: uid,

      /*
       * Pet'i oluşturan kullanıcı otomatik
       * olarak üye olur.
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
  if (!pet?.id || !uid) {
    throw new Error(
      'Pet ve kullanıcı bilgisi gerekli.',
    );
  }

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

      weightHistory:
        Array.isArray(pet.weightHistory)
          ? pet.weightHistory
          : [],

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
   * Kullanıcının üye olduğu petler.
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
   * Eski sistem kayıtları.
   *
   * petMembers alanı olmayan eski petlerin
   * kaybolmaması için ownerId sorgusu da yapılıyor.
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
   * Aynı pet iki sorgudan da gelebileceği için
   * Map kullanarak tekilleştiriyoruz.
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

        weightHistory:
          Array.isArray(data.weightHistory)
            ? data.weightHistory
            : [],

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
   DELETE / LEAVE / TRANSFER PET
========================================================= */

export const deletePetFromFirestore = async (
  id,
  uid,
  newOwnerId = null,
  forceDelete = false,
) => {
  if (!id || !uid) {
    throw new Error(
      'Pet ve kullanıcı bilgisi gerekli.',
    );
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

      const data =
        snapshot.data() || {};

      const currentMembers =
        Array.isArray(data.petMembers)
          ? data.petMembers
          : data.ownerId
            ? [data.ownerId]
            : [];

      const currentOwnerId =
        data.ownerId || '';

      /*
       * Kullanıcı pet'in üyesi değilse
       * hiçbir işlem yapamaz.
       */
      if (!currentMembers.includes(uid)) {
        throw new Error(
          'Bu dost için işlem yapma yetkiniz yok.',
        );
      }

      const isOwner =
        currentOwnerId === uid;

      if (forceDelete) {
        if (!isOwner) {
          throw new Error(
            'Bu dostu sadece yönetici silebilir.',
          );
        }

        transaction.delete(petRef);
        return;
      }

      /*
       * Kullanıcının üyelikten ayrıldıktan
       * sonra kalan üyeleri.
       */
      const remainingMembers =
        currentMembers.filter(
          memberId => memberId !== uid,
        );

      /* =====================================================
         OWNER
      ===================================================== */

      if (isOwner) {

        /*
         * Owner tek başınaysa ve ayrılıyorsa
         * geriye yönetici kalamayacağı için
         * profil tamamen silinir.
         */
        if (remainingMembers.length === 0) {
          transaction.delete(petRef);
          return;
        }

        /*
         * Owner başka üyeler varken ayrılıyorsa
         * yeni owner seçilmiş olmak zorunda.
         */
        if (!newOwnerId) {
          throw new Error(
            'Ayrılmadan önce yeni bir yönetici seçmelisiniz.',
          );
        }

        /*
         * Seçilen yeni yönetici mevcut aile
         * üyelerinden biri olmalı.
         */
        if (
          !remainingMembers.includes(
            newOwnerId,
          )
        ) {
          throw new Error(
            'Seçilen kullanıcı bu dostun aile üyesi değil.',
          );
        }

        /*
         * Eski owner çıkarılır,
         * seçilen aile üyesi yeni owner olur.
         */
        transaction.update(petRef, {
          petMembers:
            remainingMembers,

          ownerId:
            newOwnerId,

          updatedAt:
            firestore.FieldValue.serverTimestamp(),
        });

        return;
      }

      /* =====================================================
         NORMAL AİLE ÜYESİ
      ===================================================== */

      /*
       * Normal aile üyesi sadece kendisini
       * aileden çıkarabilir.
       *
       * Owner değişmez.
       */
      transaction.update(petRef, {
        petMembers:
          remainingMembers,

        ownerId:
          currentOwnerId,

        updatedAt:
          firestore.FieldValue.serverTimestamp(),
      });
    },
  );
};

/* =========================================================
   WEIGHT HISTORY
========================================================= */

/*
 * Yeni kilo kaydı ekler.
 *
 * Firestore yapısı:
 *
 * pets
 *   └── petId
 *        └── weightHistory
 *             └── recordId
 *
 * Her kayıt:
 *
 * {
 *   weight: 6.4,
 *   date: '2026-09-24',
 *   createdBy: uid,
 *   createdAt: Timestamp
 * }
 */
export const addWeightRecordToFirestore = async (
  petId,
  weight,
  date,
  uid,
) => {
  if (!petId) {
    throw new Error(
      'Pet bilgisi gerekli.',
    );
  }

  if (!uid) {
    throw new Error(
      'Kullanıcı bilgisi gerekli.',
    );
  }

  const numericWeight =
    typeof weight === 'number'
      ? weight
      : Number(
          String(weight)
            .replace(',', '.'),
        );

  if (
    !Number.isFinite(numericWeight) ||
    numericWeight <= 0
  ) {
    throw new Error(
      'Geçerli bir kilo değeri girin.',
    );
  }

  const recordDate =
    date ||
    new Date()
      .toISOString()
      .split('T')[0];

  const now =
    firestore.FieldValue.serverTimestamp();

  const petRef = firestore()
    .collection('pets')
    .doc(petId);

  const weightRef = petRef
    .collection('weightHistory')
    .doc();

  /*
   * Kilo geçmişine kayıt eklenirken pet'in
   * güncel kilosunu da aynı anda güncelliyoruz.
   *
   * Böylece iki veri birbirinden kopmuyor.
   */
  const batch =
    firestore().batch();

  batch.set(weightRef, {
    weight:
      numericWeight,

    date:
      recordDate,

    createdBy:
      uid,

    createdAt:
      now,

    updatedAt:
      now,
  });

  batch.update(petRef, {
    weight:
      String(numericWeight),

    updatedAt:
      now,
  });

  await batch.commit();

  return weightRef.id;
};

/* =========================================================
   GET WEIGHT HISTORY
========================================================= */

export const getWeightHistoryFromFirestore = async (
  petId,
) => {
  if (!petId) {
    return [];
  }

  const snapshot = await firestore()
    .collection('pets')
    .doc(petId)
    .collection('weightHistory')
    .get();

  const records = snapshot.docs
    .map(doc => {
      const data =
        doc.data() || {};

      return {
        id:
          doc.id,

        weight:
          typeof data.weight === 'number'
            ? data.weight
            : Number(data.weight) || 0,

        date:
          data.date || '',

        createdBy:
          data.createdBy || '',

        createdAt:
          data.createdAt || null,

        updatedAt:
          data.updatedAt || null,
      };
    })
    .sort((a, b) => {
      /*
       * YYYY-MM-DD formatı olduğu için
       * string karşılaştırması yeterli.
       */
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }

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

  return records;
};

/* =========================================================
   DELETE WEIGHT RECORD
========================================================= */

export const deleteWeightRecordFromFirestore = async (
  petId,
  recordId,
) => {
  if (!petId || !recordId) {
    throw new Error(
      'Pet ve kilo kaydı bilgisi gerekli.',
    );
  }

  const petRef = firestore()
    .collection('pets')
    .doc(petId);

  const weightRef = petRef
    .collection('weightHistory')
    .doc(recordId);

  /*
   * Önce kayıt silinir.
   */
  await weightRef.delete();

  /*
   * Kalan kilo kayıtlarını alıyoruz.
   *
   * Eğer silinen kayıt en güncel kayıtsa
   * pet.weight değerinin de önceki kayda
   * dönmesi gerekir.
   */
  const remainingHistory =
    await getWeightHistoryFromFirestore(
      petId,
    );

  if (remainingHistory.length > 0) {
    const latestRecord =
      remainingHistory[0];

    await petRef.update({
      weight:
        String(latestRecord.weight),

      updatedAt:
        firestore.FieldValue.serverTimestamp(),
    });
  } else {
    /*
     * Hiç kilo kaydı kalmadıysa güncel
     * kilo alanını boşaltıyoruz.
     */
    await petRef.update({
      weight:
        '',

      updatedAt:
        firestore.FieldValue.serverTimestamp(),
    });
  }
};

/* =========================================================
   UPDATE WEIGHT RECORD
========================================================= */

export const updateWeightRecordInFirestore = async (
  petId,
  recordId,
  weight,
  date,
) => {
  if (!petId || !recordId) {
    throw new Error(
      'Pet ve kilo kaydı bilgisi gerekli.',
    );
  }

  const numericWeight =
    typeof weight === 'number'
      ? weight
      : Number(
          String(weight)
            .replace(',', '.'),
        );

  if (
    !Number.isFinite(numericWeight) ||
    numericWeight <= 0
  ) {
    throw new Error(
      'Geçerli bir kilo değeri girin.',
    );
  }

  const weightRef = firestore()
    .collection('pets')
    .doc(petId)
    .collection('weightHistory')
    .doc(recordId);

  await weightRef.update({
    weight:
      numericWeight,

    date:
      date || '',

    updatedAt:
      firestore.FieldValue.serverTimestamp(),
  });

  /*
   * Güncellemeden sonra en güncel kaydı tekrar
   * bulup pet.weight alanını senkronize ediyoruz.
   */
  const history =
    await getWeightHistoryFromFirestore(
      petId,
    );

  if (history.length > 0) {
    await firestore()
      .collection('pets')
      .doc(petId)
      .update({
        weight:
          String(history[0].weight),

        updatedAt:
          firestore.FieldValue.serverTimestamp(),
      });
  }
};

/* =========================================================
   CARE EVENTS
========================================================= */

export const getCareEventsFromFirestore = async uid => {
  if (!uid) {
    return [];
  }

  const snapshot = await firestore()
    .collection('careEvents')
    .where(
      'ownerId',
      '==',
      uid,
    )
    .get();

  const events = snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .sort((a, b) => {
      const aDate =
        a.date || '';

      const bDate =
        b.date || '';

      return aDate.localeCompare(bDate);
    });

  return events;
};

export const addCareEventToFirestore = async (
  event,
  uid,
) => {
  if (!uid) {
    throw new Error(
      'Kullanıcı bilgisi gerekli.',
    );
  }

  const now =
    firestore.FieldValue.serverTimestamp();

  const docRef = await firestore()
    .collection('pets')
    .add({
      ownerId: uid,

      petMembers: [uid],

      name: pet.name || '',
      type: pet.type || '',
      birthYear: pet.birthYear || null,
      gender: pet.gender || '',

      weight: pet.weight || '',

      weightHistory:
        Array.isArray(pet.weightHistory)
          ? pet.weightHistory
          : [],

      vaccines: pet.vaccines || '',
      lastVetVisit: pet.lastVetVisit || '',
      notes: pet.notes || '',
      photoUrl: pet.photoUrl || '',

      createdAt: now,
      updatedAt: now,
    });

  return docRef.id;
};

export const deleteCareEventFromFirestore = async (
  eventId,
) => {
  if (!eventId) {
    return;
  }

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
  if (!uid) {
    throw new Error(
      'Kullanıcı bilgisi gerekli.',
    );
  }

  const now =
    firestore.FieldValue.serverTimestamp();

  const docRef = await firestore()
    .collection('feedbacks')
    .add({
      ownerId:
        uid,

      email:
        email || '',

      message:
        feedback || '',

      createdAt:
        now,

      updatedAt:
        now,
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
  if (!uid) {
    throw new Error(
      'Kullanıcı bilgisi gerekli.',
    );
  }

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
  if (!uid) {
    return null;
  }

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
  if (!uid) {
    throw new Error(
      'Kullanıcı bilgisi gerekli.',
    );
  }

  const now =
    firestore.FieldValue.serverTimestamp();

  const problemTypes =
    Array.isArray(chat.problemTypes)
      ? chat.problemTypes
      : chat.problemType
        ? [chat.problemType]
        : [];

  const problemType =
    chat.problemType ||
    problemTypes[0] ||
    '';

  const title =
    `${chat.petType || ''} - ${
      problemTypes.length > 0
        ? problemTypes.join(', ')
        : problemType
    }`;

  const docRef = await firestore()
    .collection('assistantChats')
    .add({
      ownerId:
        uid,

      email:
        email || '',

      petType:
        chat.petType || '',

      /*
       * Eski kayıtlarla uyumluluk
       */
      problemType,

      /*
       * Çoklu semptom sistemi
       */
      problemTypes,

      duration:
        chat.duration || '',

      urgency:
        chat.urgency || '',

      followUpAnswers:
        chat.followUpAnswers || {},

      result:
        chat.result || '',

      aiMessage:
        chat.aiMessage || '',

      title,

      createdAt:
        now,

      updatedAt:
        now,
    });

  return docRef.id;
};

export const getAssistantChatsFromFirestore = async uid => {
  if (!uid) {
    return [];
  }

  const snapshot = await firestore()
    .collection('assistantChats')
    .where(
      'ownerId',
      '==',
      uid,
    )
    .get();

  const chats = snapshot.docs
    .map(doc => ({
      id:
        doc.id,

      ...doc.data(),
    }))
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

  return chats;
};

export const deleteAssistantChatFromFirestore = async (
  chatId,
) => {
  if (!chatId) {
    return;
  }

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
 *
 * Karışabilecek karakterleri kullanmıyoruz:
 * I, O, 0, 1
 */
const generateInviteCode = () => {
  const characters =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex =
      Math.floor(
        Math.random() *
          characters.length,
      );

    code +=
      characters[randomIndex];
  }

  return code;
};

/* =========================================================
   CREATE PET INVITATION
========================================================= */

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
    (inviteeEmail || '')
      .trim()
      .toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      'Davet edilecek e-posta adresi gerekli.',
    );
  }

  /*
   * Kullanıcı kendisini davet edemez.
   */
  const currentUserEmail =
    (auth().currentUser?.email || '')
      .trim()
      .toLowerCase();

  if (
    currentUserEmail &&
    normalizedEmail === currentUserEmail
  ) {
    throw new Error(
      'Kendi e-posta adresinizi davet edemezsiniz.',
    );
  }

  /*
   * Benzersiz davet kodu oluştur.
   */
  let code = '';
  let invitationRef = null;

  for (
    let attempt = 0;
    attempt < 10;
    attempt++
  ) {
    const generatedCode =
      generateInviteCode();

    const candidateRef =
      firestore()
        .collection('petInvitations')
        .doc(generatedCode);

    const existingInvitation =
      await candidateRef.get();

    if (!existingInvitation.exists) {
      code =
        generatedCode;

      invitationRef =
        candidateRef;

      break;
    }
  }

  if (!code || !invitationRef) {
    throw new Error(
      'Davet kodu oluşturulamadı. Lütfen tekrar deneyin.',
    );
  }

  const now =
    firestore.FieldValue.serverTimestamp();

  /*
   * Davet 7 gün geçerli.
   */
  const expiresAt =
    firestore.Timestamp.fromDate(
      new Date(
        Date.now() +
          7 *
            24 *
            60 *
            60 *
            1000,
      ),
    );

  await invitationRef.set({
    petId:
      pet.id,

    petName:
      pet.name || '',

    inviterId,

    inviteeEmail:
      normalizedEmail,

    code,

    status:
      'pending',

    createdAt:
      now,

    expiresAt,
  });

  return {
    code,
    invitationId:
      code,
  };
};

/* =========================================================
   GET PET INVITATION
========================================================= */

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

  const invitationRef =
    firestore()
      .collection('petInvitations')
      .doc(normalizedCode);

  const snapshot =
    await invitationRef.get();

  if (!snapshot.exists) {
    throw new Error(
      'Bu kodla eşleşen bir davet bulunamadı.',
    );
  }

  const data =
    snapshot.data() || {};

  /*
   * Davet süresi dolmuş mu?
   */
  if (
    data.expiresAt &&
    data.expiresAt.toDate &&
    data.expiresAt
      .toDate()
      .getTime() < Date.now()
  ) {
    throw new Error(
      'Bu davetin süresi dolmuş.',
    );
  }

  /*
   * Kullanılmış / iptal edilmiş davetler
   * tekrar kullanılamaz.
   */
  if (data.status !== 'pending') {
    throw new Error(
      'Bu davet artık geçerli değil.',
    );
  }

  return {
    id:
      snapshot.id,

    ...data,
  };
};

/* =========================================================
   ACCEPT PET INVITATION
========================================================= */

export const acceptPetInvitation = async (
  code,
  uid,
) => {
  const normalizedCode =
    (code || '')
      .trim()
      .toUpperCase();

  if (!normalizedCode || !uid) {
    throw new Error(
      'Davet kodu ve kullanıcı bilgisi gerekli.',
    );
  }

  const invitationRef =
    firestore()
      .collection('petInvitations')
      .doc(normalizedCode);

  /*
   * Önce sadece daveti okuyoruz.
   *
   * Kullanıcı henüz petMembers içinde olmadığı için
   * pet dokümanını okumak Firestore Rules tarafından
   * engellenebilir.
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

  if (
    invitation.status !== 'pending'
  ) {
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
   * Giriş yapılan hesabın e-posta adresiyle
   * davetin gönderildiği adres eşleşmeli.
   */
  const currentUserEmail =
    (auth().currentUser?.email || '')
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

  if (
    invitedEmail &&
    !currentUserEmail
  ) {
    throw new Error(
      'Kullanıcı e-posta bilgisi alınamadı.',
    );
  }

  const petRef =
    firestore()
      .collection('pets')
      .doc(invitation.petId);

  /*
   * Pet üyeliğini ve davet durumunu
   * tek batch içerisinde güncelliyoruz.
   */
  const batch =
    firestore().batch();

  batch.update(petRef, {
    petMembers:
      firestore.FieldValue.arrayUnion(
        uid,
      ),

    lastAcceptedInvitationCode:
      normalizedCode,

    updatedAt:
      firestore.FieldValue.serverTimestamp(),
  });

  batch.update(invitationRef, {
    status:
      'accepted',

    inviteeUid:
      uid,

    acceptedAt:
      firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    success:
      true,

    code:
      normalizedCode,

    petId:
      invitation.petId,
  };
};