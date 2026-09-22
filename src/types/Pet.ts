export type Pet = {
  id: string;
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
};
