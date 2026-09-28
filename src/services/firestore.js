import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/* =========================================================
   PETS
========================================================= */

/* =========================================================
   ADD PET
========================================================= */

export const addPetToFirestore = async (
  pet,
  uid,
) => {
  if (!uid) {
    throw new Error(
      'Kullanıcı bilgisi gerekli.',
    );
  }

  const now =
    firestore.FieldValue.serverTimestamp();

  /*
   * -------------------------------------------------------
   * PET
   * -------------------------------------------------------
   */

  const docRef = await firestore()
    .collection('pets')
    .add({
      ownerId:
        uid,

      /*
       * Pet'i oluşturan kullanıcı
       * otomatik olarak aile üyesidir.
       */
      petMembers: [
        uid,
      ],

      name:
        pet?.name || '',

      type:
        pet?.type || '',

      birthYear:
        pet?.birthYear || null,

      gender:
        pet?.gender || '',

      /*
       * Son / güncel kilo
       */
      weight:
        pet?.weight || '',

      vaccines:
        pet?.vaccines || '',

      lastVetVisit:
        pet?.lastVetVisit || '',

      notes:
        pet?.notes || '',

      photoUrl:
        pet?.photoUrl || '',

      createdAt:
        now,

      updatedAt:
        now,
    });

  /*
   * -------------------------------------------------------
   * INITIAL WEIGHT HISTORY
   * -------------------------------------------------------
   *
   * AddPetScreen'den gelen ilk kilo kaydını
   * weightHistory alt koleksiyonuna yazıyoruz.
   */

  const initialWeightHistory =
    Array.isArray(
      pet?.weightHistory,
    )
      ? pet.weightHistory
      : [];

  if (
    initialWeightHistory.length > 0
  ) {
    const batch =
      firestore().batch();

    initialWeightHistory.forEach(
      record => {
        /*
         * Firestore document ID.
         *
         * AddPetScreen'den id geliyorsa onu
         * kullanıyoruz.
         */
        const weightRef =
          docRef
            .collection(
              'weightHistory',
            )
            .doc(
              record?.id ||
                undefined,
            );

        const numericWeight =
          typeof record?.weight ===
          'number'
            ? record.weight
            : Number(
                String(
                  record?.weight || '',
                ).replace(',', '.'),
              );

        if (
          !Number.isFinite(
            numericWeight,
          ) ||
          numericWeight <= 0
        ) {
          return;
        }

        batch.set(
          weightRef,
          {
            weight:
              numericWeight,

            date:
              record?.date ||
              new Date()
                .toISOString()
                .split('T')[0],

            createdBy:
              uid,

            createdAt:
              now,

            updatedAt:
              now,
          },
        );
      },
    );

    await batch.commit();
  }

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

  /*
   * Güncelleme yapabilmek için kullanıcının
   * pet üyesi olması gerekir.
   */
  const petRef = firestore()
    .collection('pets')
    .doc(pet.id);

  const petSnapshot = await petRef.get();

  if (!petSnapshot.exists) {
    throw new Error(
      'Pet bulunamadı.',
    );
  }

  const existingData =
    petSnapshot.data() || {};

  const petMembers =
    Array.isArray(existingData.petMembers)
      ? existingData.petMembers
      : existingData.ownerId
        ? [existingData.ownerId]
        : [];

  if (!petMembers.includes(uid)) {
    throw new Error(
      'Bu dostu güncelleme yetkiniz yok.',
    );
  }

  await petRef.update({
    ownerId:
      existingData.ownerId || pet.ownerId || uid,

    petMembers,

    name:
      pet.name || '',

    type:
      pet.type || '',

    birthYear:
      pet.birthYear || null,

    gender:
      pet.gender || '',

    weight:
      pet.weight || '',

    vaccines:
      pet.vaccines || '',

    lastVetVisit:
      pet.lastVetVisit || '',

    notes:
      pet.notes || '',

    photoUrl:
      pet.photoUrl || '',

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
   * Map ile tekilleştiriyoruz.
   */
  const petMap = new Map();

  memberSnapshot.docs.forEach(doc => {
    petMap.set(doc.id, doc);
  });

  ownerSnapshot.docs.forEach(doc => {
    petMap.set(doc.id, doc);
  });

  /*
   * Her pet'in weightHistory alt koleksiyonunu
   * ayrıca okuyoruz.
   */
  const pets = await Promise.all(
    Array.from(petMap.values()).map(
      async doc => {
        const data = doc.data() || {};

             console.log(
                  'FIRESTORE PET:',
                  doc.id,
                  data,
             );

        /*
         * ---------------------------------------------------
         * PET MEMBERS
         * ---------------------------------------------------
         */

        const petMembers =
          Array.isArray(data.petMembers)
            ? data.petMembers
            : data.ownerId
              ? [data.ownerId]
              : [];

        /*
         * ---------------------------------------------------
         * WEIGHT HISTORY
         * ---------------------------------------------------
         */

        let weightHistory = [];

        try {
          const weightSnapshot =
            await firestore()
              .collection('pets')
              .doc(doc.id)
              .collection('weightHistory')
              .get();

          weightHistory =
            weightSnapshot.docs
              .map(weightDoc => {
                const weightData =
                  weightDoc.data() || {};

                return {
                  id:
                    weightDoc.id,

                  weight:
                    typeof weightData.weight ===
                    'number'
                      ? weightData.weight
                      : Number(
                          weightData.weight,
                        ) || 0,

                  date:
                    weightData.date || '',

                  createdBy:
                    weightData.createdBy || '',

                  createdAt:
                    weightData.createdAt ||
                    null,

                  updatedAt:
                    weightData.updatedAt ||
                    null,
                };
              })
              .sort((a, b) => {
                if (a.date !== b.date) {
                  return b.date.localeCompare(
                    a.date,
                  );
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
        } catch (weightError) {
          console.log(
            'Kilo geçmişi yüklenemedi:',
            doc.id,
            weightError,
          );

          weightHistory = [];
        }

        /*
         * ---------------------------------------------------
         * PET OBJECT
         * ---------------------------------------------------
         */

        return {
          id:
            doc.id,

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

          weightHistory,

          vaccines:
            data.vaccines || '',

          lastVetVisit:
            data.lastVetVisit || '',

          notes:
            data.notes || '',

          photoUrl:
            data.photoUrl ||
            data.photoUri ||
            '',

          photoUri:
            data.photoUri ||
            data.photoUrl ||
            '',

          createdAt:
            data.createdAt || null,

          updatedAt:
            data.updatedAt || null,
        };
      },
    ),
  );

  /*
   * En yeni oluşturulan petler üstte.
   */
  pets.sort((a, b) => {
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

      if (!currentMembers.includes(uid)) {
        throw new Error(
          'Bu dost için işlem yapma yetkiniz yok.',
        );
      }

      const isOwner =
        currentOwnerId === uid;

      /*
       * Zorla silme.
       */
      if (forceDelete) {
        if (!isOwner) {
          throw new Error(
            'Bu dostu sadece yönetici silebilir.',
          );
        }

        transaction.delete(petRef);
        return;
      }

      const remainingMembers =
        currentMembers.filter(
          memberId => memberId !== uid,
        );

      /* =====================================================
         OWNER
      ===================================================== */

      if (isOwner) {
        /*
         * Owner tek üyeyse pet tamamen silinir.
         */
        if (remainingMembers.length === 0) {
          transaction.delete(petRef);
          return;
        }

        /*
         * Yeni owner seçilmek zorunda.
         */
        if (!newOwnerId) {
          throw new Error(
            'Ayrılmadan önce yeni bir yönetici seçmelisiniz.',
          );
        }

        if (
          !remainingMembers.includes(
            newOwnerId,
          )
        ) {
          throw new Error(
            'Seçilen kullanıcı bu dostun aile üyesi değil.',
          );
        }

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
            .trim()
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

  const petRef = firestore()
    .collection('pets')
    .doc(petId);

  const petSnapshot =
    await petRef.get();

  if (!petSnapshot.exists) {
    throw new Error(
      'Pet bulunamadı.',
    );
  }

  const petData =
    petSnapshot.data() || {};

  const petMembers =
    Array.isArray(petData.petMembers)
      ? petData.petMembers
      : petData.ownerId
        ? [petData.ownerId]
        : [];

  if (!petMembers.includes(uid)) {
    throw new Error(
      'Bu pet için kilo kaydı ekleme yetkiniz yok.',
    );
  }

  const now =
    firestore.FieldValue.serverTimestamp();

  const weightRef = petRef
    .collection('weightHistory')
    .doc();

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

  const records =
    snapshot.docs
      .map(doc => {
        const data =
          doc.data() || {};

        let numericWeight = 0;

        if (
          typeof data.weight === 'number'
        ) {
          numericWeight =
            data.weight;
        } else {
          numericWeight =
            Number(
              String(
                data.weight ?? '',
              )
                .trim()
                .replace(',', '.'),
            );
        }

        return {
          id:
            doc.id,

          weight:
            Number.isFinite(
              numericWeight,
            )
              ? numericWeight
              : 0,

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
      .filter(
        record =>
          record.weight > 0,
      )
      .sort((a, b) => {
        /*
         * Önce tarihe göre yeni → eski
         */
        if (a.date !== b.date) {
          return b.date.localeCompare(
            a.date,
          );
        }

        /*
         * Aynı gündeyse oluşturulma zamanına göre
         * yeni → eski
         */
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
  uid,
) => {
  if (!petId || !recordId) {
    throw new Error(
      'Pet ve kilo kaydı bilgisi gerekli.',
    );
  }

  if (!uid) {
    throw new Error(
      'Kullanıcı bilgisi gerekli.',
    );
  }

  const petRef = firestore()
    .collection('pets')
    .doc(petId);

  const petSnapshot =
    await petRef.get();

  if (!petSnapshot.exists) {
    throw new Error(
      'Pet bulunamadı.',
    );
  }

  const petData =
    petSnapshot.data() || {};

  const petMembers =
    Array.isArray(petData.petMembers)
      ? petData.petMembers
      : petData.ownerId
        ? [petData.ownerId]
        : [];

  if (!petMembers.includes(uid)) {
    throw new Error(
      'Bu pet için kilo kaydı silme yetkiniz yok.',
    );
  }

  const weightRef = petRef
    .collection('weightHistory')
    .doc(recordId);

  const weightSnapshot =
    await weightRef.get();

  if (!weightSnapshot.exists) {
    throw new Error(
      'Kilo kaydı bulunamadı.',
    );
  }

  await weightRef.delete();

  /*
   * Silme işleminden sonra kalan kayıtları al.
   */
  const remainingHistory =
    await getWeightHistoryFromFirestore(
      petId,
    );

  /*
   * En güncel kilo kaydını pet.weight alanına yaz.
   */
  if (
    remainingHistory.length > 0
  ) {
    const latestRecord =
      remainingHistory[0];

    await petRef.update({
      weight:
        String(
          latestRecord.weight,
        ),

      updatedAt:
        firestore.FieldValue.serverTimestamp(),
    });
  } else {
    /*
     * Hiç kilo kaydı kalmadıysa
     * pet.weight temizlenir.
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
  uid,
) => {
  if (!petId || !recordId) {
    throw new Error(
      'Pet ve kilo kaydı bilgisi gerekli.',
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
            .trim()
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

  const petRef = firestore()
    .collection('pets')
    .doc(petId);

  const petSnapshot =
    await petRef.get();

  if (!petSnapshot.exists) {
    throw new Error(
      'Pet bulunamadı.',
    );
  }

  const petData =
    petSnapshot.data() || {};

  const petMembers =
    Array.isArray(petData.petMembers)
      ? petData.petMembers
      : petData.ownerId
        ? [petData.ownerId]
        : [];

  if (!petMembers.includes(uid)) {
    throw new Error(
      'Bu pet için kilo kaydı güncelleme yetkiniz yok.',
    );
  }

  const weightRef = petRef
    .collection('weightHistory')
    .doc(recordId);

  const weightSnapshot =
    await weightRef.get();

  if (!weightSnapshot.exists) {
    throw new Error(
      'Kilo kaydı bulunamadı.',
    );
  }

  await weightRef.update({
    weight:
      numericWeight,

    date:
      date || '',

    updatedAt:
      firestore.FieldValue.serverTimestamp(),
  });

  /*
   * Güncellemeden sonra tekrar sıralıyoruz.
   *
   * Örneğin eski bir kaydın tarihini bugüne
   * çekersen pet.weight de doğru kaydı alacak.
   */
  const history =
    await getWeightHistoryFromFirestore(
      petId,
    );

  if (history.length > 0) {
    await petRef.update({
      weight:
        String(
          history[0].weight,
        ),

      updatedAt:
        firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await petRef.update({
      weight:
        '',

      updatedAt:
        firestore.FieldValue.serverTimestamp(),
    });
  }
};

/* =========================================================
   CARE EVENTS
========================================================= */

/*
 * Kullanıcının erişebildiği pet ID'lerini alır.
 *
 * Hem petMembers hem ownerId sistemi desteklenir.
 */
const getUserPetIds = async uid => {
  if (!uid) {
    return [];
  }

  const memberSnapshot = await firestore()
    .collection('pets')
    .where(
      'petMembers',
      'array-contains',
      uid,
    )
    .get();

  const ownerSnapshot = await firestore()
    .collection('pets')
    .where(
      'ownerId',
      '==',
      uid,
    )
    .get();

  const petIds = new Set();

  memberSnapshot.docs.forEach(doc => {
    petIds.add(doc.id);
  });

  ownerSnapshot.docs.forEach(doc => {
    petIds.add(doc.id);
  });

  return Array.from(petIds);
};

/* =========================================================
   GET CARE EVENTS
========================================================= */

export const getCareEventsFromFirestore = async uid => {
  if (!uid) {
    return [];
  }

  /*
   * Öncelikle kullanıcının erişebildiği petleri buluyoruz.
   */
  const userPetIds =
    await getUserPetIds(uid);

  /*
   * Eski sistemde ownerId üzerinden oluşturulmuş
   * etkinlikleri de kaybetmemek için ayrıca sorguluyoruz.
   */
  const ownerSnapshot = await firestore()
    .collection('careEvents')
    .where(
      'ownerId',
      '==',
      uid,
    )
    .get();

  const eventMap = new Map();

  /*
   * OwnerId üzerinden gelen etkinlikler.
   */
  ownerSnapshot.docs.forEach(doc => {
    eventMap.set(doc.id, {
      id:
        doc.id,

      ...doc.data(),
    });
  });

  /*
   * Kullanıcının aile üyesi olduğu petlere ait
   * etkinlikleri alıyoruz.
   *
   * Firestore where-in sorgusu maksimum 10 eleman
   * sınırına sahip olabildiği için gruplara bölüyoruz.
   */
  const chunks = [];

  for (
    let i = 0;
    i < userPetIds.length;
    i += 10
  ) {
    chunks.push(
      userPetIds.slice(
        i,
        i + 10,
      ),
    );
  }

  for (const chunk of chunks) {
    if (chunk.length === 0) {
      continue;
    }

    const snapshot = await firestore()
      .collection('careEvents')
      .where(
        'petId',
        'in',
        chunk,
      )
      .get();

    snapshot.docs.forEach(doc => {
      eventMap.set(doc.id, {
        id:
          doc.id,

        ...doc.data(),
      });
    });
  }

  const events =
    Array.from(eventMap.values());

  /*
   * Tarih + saat sıralaması.
   */
  events.sort((a, b) => {
    const aDate =
      `${a.date || ''} ${
        a.time || ''
      }`;

    const bDate =
      `${b.date || ''} ${
        b.time || ''
      }`;

    return aDate.localeCompare(bDate);
  });

  return events;
};

/* =========================================================
   ADD CARE EVENT
========================================================= */

export const addCareEventToFirestore = async (
  event,
  uid,
) => {
  if (!uid) {
    throw new Error(
      'Kullanıcı bilgisi gerekli.',
    );
  }

  if (!event) {
    throw new Error(
      'Etkinlik bilgisi gerekli.',
    );
  }

  const petId =
    event.petId || '';

  /*
   * Eğer etkinlik bir pet'e bağlıysa
   * kullanıcının o pet'e erişimi olmalı.
   */
  if (petId) {
    const petRef = firestore()
      .collection('pets')
      .doc(petId);

    const petSnapshot =
      await petRef.get();

    if (!petSnapshot.exists) {
      throw new Error(
        'Etkinliğin bağlı olduğu pet bulunamadı.',
      );
    }

    const petData =
      petSnapshot.data() || {};

    const petMembers =
      Array.isArray(
        petData.petMembers,
      )
        ? petData.petMembers
        : petData.ownerId
          ? [petData.ownerId]
          : [];

    if (!petMembers.includes(uid)) {
      throw new Error(
        'Bu pet için etkinlik ekleme yetkiniz yok.',
      );
    }
  }

  const now =
    firestore.FieldValue.serverTimestamp();

  const docRef = await firestore()
    .collection('careEvents')
    .add({
      ownerId:
        uid,

      petId:
        event.petId || '',

      petName:
        event.petName || '',

      /*
       * Eski kodların name kullanma ihtimaline
       * karşı name alanını da koruyoruz.
       */
      name:
        event.name ||
        event.title ||
        '',

      title:
        event.title ||
        event.name ||
        '',

      type:
        event.type || '',

      date:
        event.date || '',

      time:
        event.time || '',

      description:
        event.description || '',

      notes:
        event.notes || '',

      completed:
        Boolean(event.completed),

      completedAt:
        event.completed ? now : null,

      completedBy:
        event.completed ? uid : '',

      createdAt:
        now,

      updatedAt:
        now,
    });

  return docRef.id;
};

/* =========================================================
   UPDATE CARE EVENT
========================================================= */

export const updateCareEventInFirestore = async (
  event,
  uid,
) => {
  if (!event?.id || !uid) {
    throw new Error(
      'Etkinlik ve kullanıcı bilgisi gerekli.',
    );
  }

  const eventRef = firestore()
    .collection('careEvents')
    .doc(event.id);

  const eventSnapshot =
    await eventRef.get();

  if (!eventSnapshot.exists) {
    throw new Error(
      'Etkinlik bulunamadı.',
    );
  }

  const existingData =
    eventSnapshot.data() || {};

  /*
   * Etkinlik sahibi güncelleyebilir.
   *
   * Pet aile üyeleri de güncelleyebilir.
   */
  let canUpdate =
    existingData.ownerId === uid;

  if (
    !canUpdate &&
    existingData.petId
  ) {
    const petSnapshot =
      await firestore()
        .collection('pets')
        .doc(existingData.petId)
        .get();

    if (petSnapshot.exists) {
      const petData =
        petSnapshot.data() || {};

      const petMembers =
        Array.isArray(
          petData.petMembers,
        )
          ? petData.petMembers
          : petData.ownerId
            ? [petData.ownerId]
            : [];

      canUpdate =
        petMembers.includes(uid);
    }
  }

  if (!canUpdate) {
    throw new Error(
      'Bu etkinliği güncelleme yetkiniz yok.',
    );
  }

  await eventRef.update({
    petId:
      event.petId ||
      existingData.petId ||
      '',

    petName:
      event.petName ||
      existingData.petName ||
      '',

    name:
      event.name ||
      event.title ||
      existingData.name ||
      '',

    title:
      event.title ||
      event.name ||
      existingData.title ||
      '',

    type:
      event.type ||
      existingData.type ||
      '',

    date:
      event.date ||
      '',

    time:
      event.time ||
      '',

    description:
      event.description ||
      '',

    notes:
      event.notes ||
      '',

    completed:
      typeof event.completed === 'boolean'
        ? event.completed
        : Boolean(existingData.completed),

    completedAt:
      typeof event.completed === 'boolean'
        ? event.completed
          ? existingData.completedAt || firestore.FieldValue.serverTimestamp()
          : null
        : existingData.completedAt || null,

    completedBy:
      typeof event.completed === 'boolean'
        ? event.completed
          ? existingData.completedBy || uid
          : ''
        : existingData.completedBy || '',

    updatedAt:
      firestore.FieldValue.serverTimestamp(),
  });
};

/* =========================================================
   DELETE CARE EVENT
========================================================= */

export const deleteCareEventFromFirestore = async (
  eventId,
  uid = null,
) => {
  if (!eventId) {
    return;
  }

  const eventRef = firestore()
    .collection('careEvents')
    .doc(eventId);

  /*
   * UID verilmezse eski kullanım şekli korunuyor.
   */
  if (!uid) {
    await eventRef.delete();
    return;
  }

  const eventSnapshot =
    await eventRef.get();

  if (!eventSnapshot.exists) {
    return;
  }

  const eventData =
    eventSnapshot.data() || {};

  let canDelete =
    eventData.ownerId === uid;

  /*
   * Pet aile üyeleri de etkinliği silebilir.
   */
  if (
    !canDelete &&
    eventData.petId
  ) {
    const petSnapshot =
      await firestore()
        .collection('pets')
        .doc(eventData.petId)
        .get();

    if (petSnapshot.exists) {
      const petData =
        petSnapshot.data() || {};

      const petMembers =
        Array.isArray(
          petData.petMembers,
        )
          ? petData.petMembers
          : petData.ownerId
            ? [petData.ownerId]
            : [];

      canDelete =
        petMembers.includes(uid);
    }
  }

  if (!canDelete) {
    throw new Error(
      'Bu etkinliği silme yetkiniz yok.',
    );
  }

  await eventRef.delete();
};

/* =========================================================
   HEALTH HISTORY
========================================================= */

const getPetAccessData = async (petId, uid) => {
  if (!petId || !uid) {
    throw new Error(
      'Pet ve kullanıcı bilgisi gerekli.',
    );
  }

  const petRef = firestore()
    .collection('pets')
    .doc(petId);

  const petSnapshot = await petRef.get();

  if (!petSnapshot.exists) {
    throw new Error(
      'Pet bulunamadı.',
    );
  }

  const petData = petSnapshot.data() || {};

  const petMembers =
    Array.isArray(petData.petMembers)
      ? petData.petMembers
      : petData.ownerId
        ? [petData.ownerId]
        : [];

  if (!petMembers.includes(uid)) {
    throw new Error(
      'Bu dost için işlem yapma yetkiniz yok.',
    );
  }

  return {
    petRef,
    petData,
  };
};

const normalizeHealthType = type =>
  String(type || '')
    .trim()
    .toLowerCase();

const isVetHealthType = type => {
  const normalized = normalizeHealthType(type);

  return (
    normalized.includes('vet') ||
    normalized.includes('veteriner') ||
    normalized.includes('kontrol') ||
    normalized.includes('muayene')
  );
};

const isVaccineHealthType = type => {
  const normalized = normalizeHealthType(type);

  return (
    normalized.includes('vaccine') ||
    normalized.includes('vaccination') ||
    normalized.includes('aşı') ||
    normalized.includes('asi')
  );
};

export const addHealthRecordToFirestore = async (
  petId,
  record,
  uid,
) => {
  if (!record) {
    throw new Error(
      'Sağlık kaydı bilgisi gerekli.',
    );
  }

  const {petRef} =
    await getPetAccessData(petId, uid);

  const now =
    firestore.FieldValue.serverTimestamp();

  const healthRef = petRef
    .collection('healthHistory')
    .doc();

  await healthRef.set({
    title:
      record.title || record.name || '',

    name:
      record.name || record.title || '',

    type:
      record.type || '',

    date:
      record.date || '',

    description:
      record.description || record.notes || '',

    notes:
      record.notes || record.description || '',

    source:
      'manual',

    sourceEventId:
      '',

    createdBy:
      uid,

    createdAt:
      now,

    updatedAt:
      now,
  });

  return healthRef.id;
};

export const getHealthHistoryFromFirestore = async (
  petId,
  uid = null,
) => {
  if (!petId) {
    return [];
  }

  if (uid) {
    await getPetAccessData(petId, uid);
  }

  const snapshot = await firestore()
    .collection('pets')
    .doc(petId)
    .collection('healthHistory')
    .get();

  return snapshot.docs
    .map(doc => ({
      id:
        doc.id,

      ...doc.data(),
    }))
    .sort((a, b) => {
      if ((a.date || '') !== (b.date || '')) {
        return (b.date || '').localeCompare(
          a.date || '',
        );
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
};

export const updateHealthRecordInFirestore = async (
  petId,
  recordId,
  record,
  uid,
) => {
  if (!recordId || !record) {
    throw new Error(
      'Sağlık kaydı bilgisi gerekli.',
    );
  }

  const {petRef} =
    await getPetAccessData(petId, uid);

  const healthRef = petRef
    .collection('healthHistory')
    .doc(recordId);

  const healthSnapshot =
    await healthRef.get();

  if (!healthSnapshot.exists) {
    throw new Error(
      'Sağlık kaydı bulunamadı.',
    );
  }

  const existingData =
    healthSnapshot.data() || {};

  await healthRef.update({
    title:
      record.title || record.name || '',

    name:
      record.name || record.title || '',

    type:
      record.type || '',

    date:
      record.date || '',

    description:
      record.description || record.notes || '',

    notes:
      record.notes || record.description || '',

    source:
      existingData.source || 'manual',

    sourceEventId:
      existingData.sourceEventId || '',

    updatedAt:
      firestore.FieldValue.serverTimestamp(),
  });
};

export const deleteHealthRecordFromFirestore = async (
  petId,
  recordId,
  uid,
) => {
  if (!recordId) {
    throw new Error(
      'Sağlık kaydı bilgisi gerekli.',
    );
  }

  const {petRef} =
    await getPetAccessData(petId, uid);

  const healthRef = petRef
    .collection('healthHistory')
    .doc(recordId);

  const healthSnapshot =
    await healthRef.get();

  if (!healthSnapshot.exists) {
    return;
  }

  await healthRef.delete();
};

const syncCompletedCareEventToHealthHistory = async (
  eventId,
  eventData,
  uid,
) => {
  if (!eventData?.petId) {
    return null;
  }

  const {petRef} = await getPetAccessData(
    eventData.petId,
    uid,
  );

  const healthRef = petRef
    .collection('healthHistory')
    .doc(`careEvent_${eventId}`);

  const now =
    firestore.FieldValue.serverTimestamp();

  await healthRef.set(
    {
      title:
        eventData.title || eventData.name || '',

      name:
        eventData.name || eventData.title || '',

      type:
        eventData.type || '',

      date:
        eventData.date || '',

      description:
        eventData.description || eventData.notes || '',

      notes:
        eventData.notes || eventData.description || '',

      source:
        'careEvent',

      sourceEventId:
        eventId,

      createdBy:
        eventData.ownerId || uid,

      completedBy:
        uid,

      completedAt:
        now,

      updatedAt:
        now,
    },
    {
      merge: true,
    },
  );

  const savedSnapshot = await healthRef.get();
  const savedData = savedSnapshot.data() || {};

  if (!savedData.createdAt) {
    await healthRef.update({
      createdAt:
        firestore.FieldValue.serverTimestamp(),
    });
  }

  return healthRef.id;
};

const removeCareEventFromHealthHistory = async (
  eventId,
  petId,
  uid,
) => {
  if (!eventId || !petId) {
    return;
  }

  const {petRef} =
    await getPetAccessData(petId, uid);

  await petRef
    .collection('healthHistory')
    .doc(`careEvent_${eventId}`)
    .delete();
};

export const setCareEventCompletedInFirestore = async (
  eventId,
  completed,
  uid,
) => {
  if (!eventId || !uid) {
    throw new Error(
      'Etkinlik ve kullanıcı bilgisi gerekli.',
    );
  }

  const eventRef = firestore()
    .collection('careEvents')
    .doc(eventId);

  const eventSnapshot =
    await eventRef.get();

  if (!eventSnapshot.exists) {
    throw new Error(
      'Etkinlik bulunamadı.',
    );
  }

  const eventData =
    eventSnapshot.data() || {};

  if (eventData.petId) {
    await getPetAccessData(
      eventData.petId,
      uid,
    );
  } else if (eventData.ownerId !== uid) {
    throw new Error(
      'Bu etkinliği güncelleme yetkiniz yok.',
    );
  }

  const now =
    firestore.FieldValue.serverTimestamp();

  await eventRef.update({
    completed:
      Boolean(completed),

    completedAt:
      completed ? now : null,

    completedBy:
      completed ? uid : '',

    updatedAt:
      now,
  });

  if (completed) {
    await syncCompletedCareEventToHealthHistory(
      eventId,
      eventData,
      uid,
    );
  } else if (eventData.petId) {
    await removeCareEventFromHealthHistory(
      eventId,
      eventData.petId,
      uid,
    );
  }
};

export const getLatestVetVisitFromFirestore = async (
  petId,
  uid = null,
) => {
  const history =
    await getHealthHistoryFromFirestore(
      petId,
      uid,
    );

  return (
    history.find(record =>
      isVetHealthType(record.type),
    ) || null
  );
};

export const getLatestVaccineFromFirestore = async (
  petId,
  uid = null,
) => {
  const history =
    await getHealthHistoryFromFirestore(
      petId,
      uid,
    );

  return (
    history.find(record =>
      isVaccineHealthType(record.type),
    ) || null
  );
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
    id:
      doc.id,

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
       * Eski kayıtlarla uyumluluk.
       */
      problemType,

      /*
       * Çoklu semptom sistemi.
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

  /*
   * Daveti sadece pet owner oluşturabilir.
   */
  const petRef = firestore()
    .collection('pets')
    .doc(pet.id);

  const petSnapshot =
    await petRef.get();

  if (!petSnapshot.exists) {
    throw new Error(
      'Pet bulunamadı.',
    );
  }

  const petData =
    petSnapshot.data() || {};

  if (
    petData.ownerId &&
    petData.ownerId !== inviterId
  ) {
    throw new Error(
      'Bu dosta aile üyesi davet etme yetkiniz yok.',
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

  code =
    generateInviteCode();

  invitationRef =
    firestore()
      .collection('petInvitations')
      .doc(code);

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
   * Önce daveti okuyoruz.
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