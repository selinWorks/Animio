function calculateRisk(data) {
  let score = 0;

  const problemScores = {
    'Kusma': 30,
    'Halsizlik': 25,
    'İştahsızlık': 20,
    'Beslenme': 10,
    'Aşı / Bakım': 5,
    'Diğer': 15,
  };

  const durationScores = {
    'bugun': 10,
    '1-2_gundur': 20,
    '1_hafta': 30,
    'uzun': 40,
  };

  const urgencyScores = {
    'Evet': 40,
    'Emin değilim': 20,
    'Hayır': 0,
  };

  const petScores = {
    'Kedi': 5,
    'Köpek': 5,
    'Kuş': 10,
    'Balık': 10,
    'Küçük Hayvan': 10,
    'Diğer': 5,
  };

  score += problemScores[data.problemType] || 0;
  score += durationScores[data.duration] || 0;
  score += urgencyScores[data.urgency] || 0;
  score += petScores[data.petType] || 0;

  let riskLevel = 'Düşük';
  let action = 'Evde gözlemleyebilirsin.';

  if (score >= 90) {
    riskLevel = 'Acil';
    action = 'Derhal veterinere gitmen önerilir.';
  } else if (score >= 60) {
    riskLevel = 'Yüksek';
    action = 'Veterinere görünmen önerilir.';
  } else if (score >= 30) {
    riskLevel = 'Orta';
    action = 'Durumu takip et, gerekirse veterinere danış.';
  }

  return {
    riskScore: score,
    riskLevel,
    action,
  };
}

module.exports = { calculateRisk };