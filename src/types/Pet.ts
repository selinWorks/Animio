export type WeightRecord = {
  id: string;

  /**
   * Ölçülen kilo değeri.
   * Örn: 4.25
   */
  weight: number;

  /**
   * Kaydın oluşturulduğu / ölçümün yapıldığı tarih.
   * ISO formatında tutulur.
   *
   * Örn:
   * 2026-09-23T12:30:00.000Z
   */
  date: string;

  /**
   * Kullanıcının kilo kaydına eklediği
   * isteğe bağlı açıklama.
   */
  note?: string;
};

export type Pet = {
  id: string;

  /**
   * Eski sistemde profil sahibinin UID'si.
   * Geriye dönük uyumluluk için tutuluyor.
   */
  ownerId?: string;

  /**
   * Bu pet profiline erişebilen kullanıcıların UID'leri.
   *
   * Örnek:
   * petMembers: ['uid1', 'uid2', 'uid3']
   */
  petMembers?: string[];

  name: string;
  type: string;

  /**
   * Yeni kayıtların yaş için ana veri kaynağı.
   * Yaş ekranda güncel yıldan hesaplanır.
   */
  birthYear?: number;

  /**
   * Eski Firestore kayıtlarıyla geriye dönük uyumluluk.
   * Yeni kayıtlarda zorunlu değildir.
   */
  age?: number;

  gender?: string;

  /**
   * Güncel kilo.
   *
   * Eski sistemle uyumluluk için string
   * olarak tutulmaya devam ediyor.
   */
  weight?: string;

  /**
   * Petin geçmiş kilo kayıtları.
   *
   * En güncel kilo ayrıca weight alanında
   * tutulmaya devam eder.
   */
  weightHistory?: WeightRecord[];

  vaccines?: string;
  lastVetVisit?: string;
  notes?: string;
  photoUrl?: string;

  /**
   * Sağlık sekmesinde kullanılan alanlar.
   */
  healthStatus?: string;
  medications?: string;
  allergies?: string;
  healthNotes?: string;

  /**
   * EditPetScreen fotoğraf seçimi tarafından
   * kullanılan URI.
   */
  photoUri?: string;

  createdAt?: any;
  updatedAt?: any;
};