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
  weight?: string;
  vaccines?: string;
  lastVetVisit?: string;
  notes?: string;
  photoUrl?: string;

  createdAt?: any;
  updatedAt?: any;
};