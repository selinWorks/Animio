function calculateRisk(data, aiEvaluationAvailable = true) {
  // ------------------------------------------------
  // AI DEĞERLENDİRMESİ YOKSA RİSK HESAPLANMAZ
  // ------------------------------------------------

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
  // 3. ACİLİYET
  // ------------------------------------------------

  const urgencyScores = {
    'Evet': 15,
    'Emin değilim': 8,
    'Hayır': 0,
  };

  // ------------------------------------------------
  // 4. HAYVAN TÜRÜ
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
  // 5. PROBLEM TÜRLERİ
  // ------------------------------------------------

  const problemTypes = Array.isArray(data.problemTypes)
    ? data.problemTypes
    : data.problemType
      ? [data.problemType]
      : [];

  // ------------------------------------------------
  // 6. "DİĞER" AÇIKLAMASI
  // ------------------------------------------------

  const otherDetails =
    typeof data.followUpAnswers?.otherDetails === 'string'
      ? data.followUpAnswers.otherDetails.trim()
      : '';

  // ------------------------------------------------
  // 7. SADECE "DİĞER" SEÇİLMİŞSE
  //
  // Burada sadece uzunluk kontrolü yapılmaz.
  // Anlamlılık kontrolünü openaiService.js yapar.
  // ------------------------------------------------

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

  // ------------------------------------------------
  // 8. SEMPTOM PUANLAMA
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
  // 9. SEMPTOM KOMBİNASYONLARI
  // ------------------------------------------------

  const has = symptom =>
    problemTypes.includes(symptom);

  if (has('Kusma') && has('Halsizlik')) {
    score += 10;
  }

  if (has('Kusma') && has('İştahsızlık')) {
    score += 7;
  }

  if (has('Halsizlik') && has('İştahsızlık')) {
    score += 7;
  }

  if (
    has('Kusma') &&
    has('Halsizlik') &&
    has('İştahsızlık')
  ) {
    score += 8;
  }

  // ------------------------------------------------
  // 10. SÜRE
  // ------------------------------------------------

  score += durationScores[data.duration] || 0;

  // ------------------------------------------------
  // 11. ACİLİYET
  // ------------------------------------------------

  score += urgencyScores[data.urgency] || 0;

  // ------------------------------------------------
  // 12. HAYVAN TÜRÜ
  // ------------------------------------------------

  score += petScores[data.petType] || 0;

  // ------------------------------------------------
  // 13. SKORU 0-100 ARASINDA TUT
  // ------------------------------------------------

  score = Math.min(
    Math.max(score, 0),
    100,
  );

  // ------------------------------------------------
  // 14. RİSK SEVİYESİ
  // ------------------------------------------------

  let riskLevel = 'Düşük';
  let action = 'Evde gözlemleyebilirsin.';

  if (score >= 80) {
    riskLevel = 'Acil';
    action =
      'Derhal veterinere başvurman önerilir.';
  } else if (score >= 55) {
    riskLevel = 'Yüksek';
    action =
      'En kısa sürede veterinere görünmen önerilir.';
  } else if (score >= 30) {
    riskLevel = 'Orta';
    action =
      'Durumu yakından takip et ve gerekirse veterinere danış.';
  }

  // ------------------------------------------------
  // 15. SONUÇ
  // ------------------------------------------------

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