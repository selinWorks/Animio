function calculateRisk(data) {
  let score = 0;

  // ------------------------------------------------
  // 1. TEMEL SEMPTOM PUANLARI
  // ------------------------------------------------

  const problemScores = {
    'Kusma': 28,
    'Halsizlik': 24,
    'İştahsızlık': 18,
    'Beslenme': 8,
    'Aşı / Bakım': 4,
    'Diğer': 10,
  };

  // ------------------------------------------------
  // 2. SÜRE PUANLARI
  // ------------------------------------------------

  const durationScores = {
    'bugun': 0,
    '1-2_gundur': 8,
    '1_hafta': 15,
    'uzun': 18,
  };

  // ------------------------------------------------
  // 3. KULLANICININ ACİLİYET DEĞERLENDİRMESİ
  // ------------------------------------------------

  const urgencyScores = {
    'Evet': 15,
    'Emin değilim': 8,
    'Hayır': 0,
  };

  // ------------------------------------------------
  // 4. HAYVAN TÜRÜ
  // Tür tek başına güçlü bir risk belirleyicisi değildir.
  // Bu nedenle yalnızca küçük bir ek katkı yapar.
  // ------------------------------------------------

  const petScores = {
    'Kedi': 0,
    'Köpek': 0,
    'Kuş': 3,
    'Balık': 3,
    'Küçük Hayvan': 3,
    'Diğer': 0,
  };

  // ------------------------------------------------
  // 5. ÇOKLU SEMPTOM DESTEĞİ
  //
  // Yeni sistem:
  // data.problemTypes = ['Kusma', 'Halsizlik']
  //
  // Eski sistem:
  // data.problemType = 'Kusma'
  //
  // İkisini de destekliyoruz.
  // ------------------------------------------------

  const problemTypes = Array.isArray(data.problemTypes)
    ? data.problemTypes
    : data.problemType
      ? [data.problemType]
      : [];

  // ------------------------------------------------
  // 6. SEMPTOM PUANLAMA
  //
  // İlk semptom     -> %100
  // İkinci semptom  -> %50
  // Diğerleri       -> %25
  //
  // Böylece birden fazla semptom skoru artırır ama
  // skor kontrolsüz şekilde yükselmez.
  // ------------------------------------------------

  problemTypes.forEach((problemType, index) => {
    const baseScore = problemScores[problemType] || 0;

    if (index === 0) {
      score += baseScore;
    } else if (index === 1) {
      score += Math.round(baseScore * 0.5);
    } else {
      score += Math.round(baseScore * 0.25);
    }
  });

  // ------------------------------------------------
  // 7. SEMPTOM KOMBİNASYONLARI
  // ------------------------------------------------

  const has = symptom => problemTypes.includes(symptom);

  // Kusma + Halsizlik
  if (has('Kusma') && has('Halsizlik')) {
    score += 10;
  }

  // Kusma + İştahsızlık
  if (has('Kusma') && has('İştahsızlık')) {
    score += 7;
  }

  // Halsizlik + İştahsızlık
  if (has('Halsizlik') && has('İştahsızlık')) {
    score += 7;
  }

  // Üç önemli semptom birlikte
  if (
    has('Kusma') &&
    has('Halsizlik') &&
    has('İştahsızlık')
  ) {
    score += 8;
  }

  // ------------------------------------------------
  // 8. SÜRE
  // ------------------------------------------------

  score += durationScores[data.duration] || 0;

  // ------------------------------------------------
  // 9. KULLANICININ ACİLİYET DEĞERLENDİRMESİ
  // ------------------------------------------------

  score += urgencyScores[data.urgency] || 0;

  // ------------------------------------------------
  // 10. HAYVAN TÜRÜ
  // ------------------------------------------------

  score += petScores[data.petType] || 0;

  // ------------------------------------------------
  // 11. SKORU 0-100 ARASINDA TUT
  // ------------------------------------------------

  score = Math.min(Math.max(score, 0), 100);

  // ------------------------------------------------
  // 12. RİSK SEVİYESİ
  // ------------------------------------------------

  let riskLevel = 'Düşük';
  let action = 'Evde gözlemleyebilirsin.';

  if (score >= 80) {
    riskLevel = 'Acil';
    action = 'Derhal veterinere başvurman önerilir.';
  } else if (score >= 55) {
    riskLevel = 'Yüksek';
    action = 'En kısa sürede veterinere görünmen önerilir.';
  } else if (score >= 30) {
    riskLevel = 'Orta';
    action =
      'Durumu yakından takip et ve gerekirse veterinere danış.';
  }

  // ------------------------------------------------
  // 13. SONUÇ
  // ------------------------------------------------

  return {
    riskScore: score,
    riskLevel,
    action,
  };
}

module.exports = { calculateRisk };