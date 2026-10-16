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
      emergency: false,
      emergencyReasons: [],
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

  const rawPetType =
    typeof data.petType === 'string'
      ? data.petType.trim()
      : '';

  const knownPetTypes = [
    'Kedi',
    'Köpek',
    'Kuş',
    'Kemirgen',
    'Tavşan',
    'Balık',
    'Sürüngen',
  ];

  const petType =
    knownPetTypes.find(type =>
      rawPetType === type ||
      rawPetType.startsWith(`${type} -`) ||
      rawPetType.startsWith(`${type} –`) ||
      rawPetType.startsWith(`${type}:`)
    ) || rawPetType;

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
      emergency: false,
      emergencyReasons: [],
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
    Tavşan: 2,

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
    petTypeBaseScores[petType] || 0;

  // =====================================================
  // 12. HAYVAN TÜRÜ + SEMPTOM ETKİSİ
  // =====================================================

  const speciesModifiers =
    speciesProblemModifiers[petType] || {};

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
  // 15. TAKİP CEVAPLARI
  //
  // Follow-up cevapları varsa mevcut temel skoru
  // daha anlamlı hale getiriyoruz.
  // =====================================================

  const followUp =
    data.followUpAnswers || {};

  // Acil uyarı işaretleri risk puanından bağımsız değerlendirilir.
  // Kullanıcının eski urgency alanı hiçbir şekilde puanlamaya katılmaz.
  const normalize = value =>
    String(value || '').trim().toLocaleLowerCase('tr-TR');

  const vomitingFrequency = normalize(followUp.vomitingFrequency);
  const vomitAppearance = normalize(followUp.vomitAppearance);
  const canKeepWaterAnswer = normalize(followUp.canKeepWater);
  const abdominalPainAnswer = normalize(followUp.abdominalPain);
  const energyLevelAnswer = normalize(followUp.energyLevel);
  const canWalkAnswer = normalize(followUp.canWalkNormally);
  const foreignBodyAnswer = normalize(followUp.foreignBodyRisk);
  const waterIntakeAnswer = normalize(followUp.waterIntake);

  const emergencyReasons = [];

  if (
    vomitAppearance.includes('kan') ||
    vomitAppearance.includes('kahve telvesi') ||
    vomitAppearance.includes('yabancı madde')
  ) {
    emergencyReasons.push('Kusmukta kan, koyu içerik veya yabancı madde bildirilmesi');
  }

  if (
    vomitingFrequency.includes('4+') ||
    vomitingFrequency.includes('4 kez') ||
    vomitingFrequency.includes('5')
  ) {
    emergencyReasons.push('Tekrarlayan/çok sık kusma');
  }

  if (canKeepWaterAnswer === 'hayır' || canKeepWaterAnswer.includes('tutam')) {
    emergencyReasons.push('Suyu tutamama');
  }

  if (
    abdominalPainAnswer === 'evet' ||
    abdominalPainAnswer.includes('şiddetli') ||
    abdominalPainAnswer.includes('var')
  ) {
    emergencyReasons.push('Karın ağrısı veya şişlik belirtisi');
  }

  if (
    energyLevelAnswer.includes('çok halsiz') ||
    energyLevelAnswer.includes('belirgin şekilde azaldı')
  ) {
    emergencyReasons.push('Belirgin halsizlik');
  }

  if (
    canWalkAnswer === 'hayır' ||
    canWalkAnswer.includes('yürüyem')
  ) {
    emergencyReasons.push('Normal yürüyememe');
  }

  if (
    foreignBodyAnswer === 'evet' ||
    foreignBodyAnswer.includes('yabancı cisim')
  ) {
    emergencyReasons.push('Yabancı cisim yutma ihtimali');
  }

  if (
    waterIntakeAnswer.includes('hiç içmiyor')
  ) {
    emergencyReasons.push('Su içmeme');
  }

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
    'Evcil hayvanını gözlemle; belirtiler devam eder veya kötüleşirse veteriner hekime danış.';

  // Acil uyarı işaretleri puandan bağımsız önceliklidir.
  if (emergencyReasons.length > 0) {
    riskLevel = 'Acil';
    action =
      'Ciddi bir uyarı işareti bildirdin. Risk puanı düşük olsa bile vakit kaybetmeden acil veteriner hizmetiyle iletişime geç.';
  } else if (score >= 80) {
    riskLevel = 'Yüksek';
    action =
      'Belirtiler önemli olabilir; gecikmeden veteriner hekimle görüşmen önerilir.';
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
    emergency: emergencyReasons.length > 0,
    emergencyReasons,
    canEvaluate: true,
  };
}

module.exports = {
  calculateRisk,
};