function calculateRisk(
  data,
  aiEvaluationAvailable = true,
) {
  // =====================================================
  // AI DEĞERLENDİRMESİ YOKSA RİSK HESAPLANMAZ
  // =====================================================

  if (!aiEvaluationAvailable) {
    return {
      riskScore: null,
      riskLevel: null,
      action: null,
      canEvaluate: false,
      reason: 'AI_EVALUATION_UNAVAILABLE',
    };
  }

  let score = 0;

  // =====================================================
  // 1. PROBLEM TÜRLERİ
  // =====================================================

  const problemTypes = Array.isArray(data.problemTypes)
    ? data.problemTypes
    : data.problemType
      ? [data.problemType]
      : [];

  // =====================================================
  // 2. DİĞER AÇIKLAMASI
  // =====================================================

  const otherDetails =
    typeof data.followUpAnswers?.otherDetails === 'string'
      ? data.followUpAnswers.otherDetails.trim()
      : '';

  // =====================================================
  // 3. SADECE "DİĞER" SEÇİLDİYSE
  // =====================================================

  const onlyOtherSelected =
    problemTypes.length === 1 &&
    problemTypes[0] === 'Diğer';

  if (onlyOtherSelected && !otherDetails) {
    return {
      riskScore: null,
      riskLevel: null,
      action: null,
      canEvaluate: false,
      reason: 'OTHER_DETAILS_REQUIRED',
    };
  }

  // =====================================================
  // 4. TEMEL PROBLEM PUANLARI
  //
  // Puanlar uygulama içi heuristik değerlerdir.
  // Tanı veya klinik olasılık değildir.
  // =====================================================

  const problemScores = {
    'Kusma': 28,
    'Halsizlik': 25,
    'İştahsızlık': 18,
    'Beslenme': 8,
    'Aşı / Bakım': 4,
    'Diğer': 10,
  };

  // =====================================================
  // 5. SÜRE PUANLARI
  // =====================================================

  const durationScores = {
    bugun: 0,
    '1-2_gundur': 7,
    '1_hafta': 14,
    uzun: 18,
  };

  // =====================================================
  // 6. KULLANICININ ACİLİYET BEYANI
  // =====================================================

  const urgencyScores = {
    Evet: 15,
    'Emin değilim': 7,
    Hayır: 0,
  };

  // =====================================================
  // 7. HAYVAN TÜRÜ
  //
  // Buradaki değerler doğrudan "hastalık riski" değildir.
  // Türün değerlendirme bağlamındaki ağırlığını sınırlı
  // şekilde değiştirir.
  // =====================================================

  const petTypeBaseScores = {
    Kedi: 0,
    Köpek: 0,
    Kuş: 4,

    Balık: 2,
    Kemirgen: 2,
    Sürüngen: 2,
    'Çiftlik Hayvanı': 2,
    Amfibi: 2,
    Omurgasız: 1,
    'Diğer Memeliler': 2,

    'Küçük Hayvan': 2,
    Diğer: 0,
  };

  // =====================================================
  // 8. HAYVAN TÜRÜ + PROBLEM KOMBİNASYONLARI
  //
  // Bunlar küçük ek ağırlıklardır.
  // Amaç türü tek başına risk sebebi yapmak değildir.
  // =====================================================

  const speciesProblemModifiers = {
    Kuş: {
      Kusma: 3,
      Halsizlik: 3,
      İştahsızlık: 3,
      Beslenme: 1,
      'Aşı / Bakım': 0,
      Diğer: 2,
    },

    Balık: {
      Kusma: 0,
      Halsizlik: 2,
      İştahsızlık: 3,
      Beslenme: 2,
      'Aşı / Bakım': 0,
      Diğer: 2,
    },

    Kemirgen: {
      Kusma: 0,
      Halsizlik: 3,
      İştahsızlık: 3,
      Beslenme: 1,
      'Aşı / Bakım': 0,
      Diğer: 2,
    },

    Sürüngen: {
      Kusma: 1,
      Halsizlik: 2,
      İştahsızlık: 2,
      Beslenme: 2,
      'Aşı / Bakım': 0,
      Diğer: 2,
    },

    'Çiftlik Hayvanı': {
      Kusma: 0,
      Halsizlik: 2,
      İştahsızlık: 2,
      Beslenme: 2,
      'Aşı / Bakım': 0,
      Diğer: 2,
    },

    Amfibi: {
      Kusma: 0,
      Halsizlik: 2,
      İştahsızlık: 2,
      Beslenme: 1,
      'Aşı / Bakım': 0,
      Diğer: 2,
    },

    Omurgasız: {
      Kusma: 0,
      Halsizlik: 1,
      İştahsızlık: 1,
      Beslenme: 1,
      'Aşı / Bakım': 0,
      Diğer: 1,
    },

    'Diğer Memeliler': {
      Kusma: 1,
      Halsizlik: 2,
      İştahsızlık: 2,
      Beslenme: 1,
      'Aşı / Bakım': 0,
      Diğer: 2,
    },

    Kedi: {
      Kusma: 2,
      Halsizlik: 2,
      İştahsızlık: 2,
      Beslenme: 1,
      'Aşı / Bakım': 0,
      Diğer: 1,
    },

    Köpek: {
      Kusma: 2,
      Halsizlik: 2,
      İştahsızlık: 2,
      Beslenme: 1,
      'Aşı / Bakım': 0,
      Diğer: 1,
    },
  };

  // =====================================================
  // 9. SEMPTOMLARI PUANLA
  //
  // Birinci problem tam,
  // ikinci %50,
  // sonraki problemler %25 katkı yapar.
  //
  // Böylece 4-5 problem seçildiğinde skor gereksiz
  // şekilde patlamaz.
  // =====================================================

  problemTypes.forEach((problemType, index) => {
    const baseScore =
      problemScores[problemType] || 0;

    let weight = 1;

    if (index === 1) {
      weight = 0.5;
    } else if (index >= 2) {
      weight = 0.25;
    }

    score += Math.round(
      baseScore * weight,
    );
  });

  // =====================================================
  // 10. SEMPTOM KOMBİNASYONLARI
  // =====================================================

  const has = symptom =>
    problemTypes.includes(symptom);

  // Kusma + halsizlik
  if (
    has('Kusma') &&
    has('Halsizlik')
  ) {
    score += 10;
  }

  // Kusma + iştahsızlık
  if (
    has('Kusma') &&
    has('İştahsızlık')
  ) {
    score += 8;
  }

  // Halsizlik + iştahsızlık
  if (
    has('Halsizlik') &&
    has('İştahsızlık')
  ) {
    score += 8;
  }

  // Üçlü kombinasyon
  if (
    has('Kusma') &&
    has('Halsizlik') &&
    has('İştahsızlık')
  ) {
    score += 8;
  }

  // Beslenme problemi başka bir belirtiyle birlikteyse
  if (
    has('Beslenme') &&
    (
      has('Kusma') ||
      has('Halsizlik') ||
      has('İştahsızlık')
    )
  ) {
    score += 4;
  }

  // =====================================================
  // 11. HAYVAN TÜRÜ TEMEL PUANI
  // =====================================================

  score +=
    petTypeBaseScores[data.petType] || 0;

  // =====================================================
  // 12. HAYVAN TÜRÜ + SEMPTOM ETKİSİ
  // =====================================================

  const speciesModifiers =
    speciesProblemModifiers[data.petType] || {};

  problemTypes.forEach((problemType, index) => {
    const modifier =
      speciesModifiers[problemType] || 0;

    if (!modifier) {
      return;
    }

    let weight = 1;

    if (index === 1) {
      weight = 0.5;
    } else if (index >= 2) {
      weight = 0.25;
    }

    score += Math.round(
      modifier * weight,
    );
  });

  // =====================================================
  // 13. SÜRE
  // =====================================================

  score +=
    durationScores[data.duration] || 0;

  // =====================================================
  // 14. ACİLİYET
  // =====================================================

  score +=
    urgencyScores[data.urgency] || 0;

  // =====================================================
  // 15. TAKİP CEVAPLARI
  //
  // Follow-up cevapları varsa mevcut temel skoru
  // daha anlamlı hale getiriyoruz.
  // =====================================================

  const followUp =
    data.followUpAnswers || {};

  // -----------------------------------------------------
  // Kusma sıklığı
  // -----------------------------------------------------

  if (has('Kusma')) {
    const vomitingFrequency =
      String(
        followUp.vomitingFrequency || '',
      )
        .trim()
        .toLocaleLowerCase('tr-TR');

    if (
      vomitingFrequency.includes('çok') ||
      vomitingFrequency.includes('fazla') ||
      vomitingFrequency.includes('3') ||
      vomitingFrequency.includes('4') ||
      vomitingFrequency.includes('5')
    ) {
      score += 8;
    }
  }

  // -----------------------------------------------------
  // Suyu tutamama
  // -----------------------------------------------------

  if (has('Kusma')) {
    const canKeepWater =
      String(
        followUp.canKeepWater || '',
      )
        .trim()
        .toLocaleLowerCase('tr-TR');

    if (
      canKeepWater.includes('hayır') ||
      canKeepWater.includes('tutam')
    ) {
      score += 10;
    }
  }

  // -----------------------------------------------------
  // Karın ağrısı / şişlik
  // -----------------------------------------------------

  const abdominalPain =
    String(
      followUp.abdominalPain || '',
    )
      .trim()
      .toLocaleLowerCase('tr-TR');

  if (
    abdominalPain === 'evet' ||
    abdominalPain.includes('var')
  ) {
    score += 10;
  }

  // -----------------------------------------------------
  // Enerji seviyesi
  // -----------------------------------------------------

  const energyLevel =
    String(
      followUp.energyLevel || '',
    )
      .trim()
      .toLocaleLowerCase('tr-TR');

  if (
    energyLevel.includes('çok düşük') ||
    energyLevel.includes('çok halsiz') ||
    energyLevel.includes('zor')
  ) {
    score += 10;
  }

  // -----------------------------------------------------
  // Normal yürüyebilme
  // -----------------------------------------------------

  const canWalkNormally =
    String(
      followUp.canWalkNormally || '',
    )
      .trim()
      .toLocaleLowerCase('tr-TR');

  if (
    canWalkNormally.includes('hayır') ||
    canWalkNormally.includes('yürüyem')
  ) {
    score += 15;
  }

  // =====================================================
  // 16. "DİĞER" ALANI
  // =====================================================
  //
  // Burada metni kelime kelime risk puanına çevirmiyoruz.
  //
  // Çünkü openaiService.js zaten bu metnin anlamlı olup
  // olmadığını AI ile değerlendiriyor.
  //
  // Anlamlı "Diğer" bilgisi varsa temel +10 puan korunur.
  // =====================================================

  if (
    has('Diğer') &&
    otherDetails
  ) {
    score += 2;
  }

  // =====================================================
  // 17. SKORU 0-100 ARASINDA SINIRLA
  // =====================================================

  score = Math.min(
    Math.max(score, 0),
    100,
  );

  // =====================================================
  // 18. RİSK SEVİYESİ
  // =====================================================

  let riskLevel = 'Düşük';
  let action =
    'Evcil hayvanını gözlemlemeye devam edebilirsin.';

  if (score >= 80) {
    riskLevel = 'Acil';

    action =
      'Belirtiler ciddi olabileceğinden gecikmeden veteriner hekime başvurman önerilir.';
  } else if (score >= 60) {
    riskLevel = 'Yüksek';

    action =
      'Durumun kısa süre içinde veteriner hekim tarafından değerlendirilmesi önerilir.';
  } else if (score >= 35) {
    riskLevel = 'Orta';

    action =
      'Evcil hayvanını yakından takip et. Belirtiler devam eder veya kötüleşirse veteriner hekime danış.';
  }

  // =====================================================
  // 19. SONUÇ
  // =====================================================

  return {
    riskScore: score,
    riskLevel,
    action,
    canEvaluate: true,
  };
}

module.exports = {
  calculateRisk,
};