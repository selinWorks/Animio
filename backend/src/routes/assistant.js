const express = require('express');
const { calculateRisk } = require('../services/riskScorer');
const { generatePetAdvice } = require('../services/openaiService');

const router = express.Router();

router.post('/evaluate', async (req, res) => {
  try {
    const data = req.body;
    const {
      urgency,
      ...evaluationData
    } = data || {};

    // ------------------------------------------------
    // 1. RİSKİ HAZIRLA
    //
    // Risk burada backend içinde hesaplanabilir.
    // Ancak AI değerlendirmesi başarılı olmadan
    // kullanıcıya gönderilmeyecek.
    // ------------------------------------------------


    const riskResult = calculateRisk(data);


    // ------------------------------------------------
    // 2. AI DEĞERLENDİRMESİ
    // ------------------------------------------------

    let aiResult;

    try {
      aiResult = await generatePetAdvice(
        evaluationData,
        riskResult,
      );
    } catch (aiError) {
      console.error(
        'AI değerlendirme hatası:',
        aiError,
      );

      // AI çalışmadıysa RİSK GÖNDERME
      return res.json({
        success: true,
        input: data,

        risk: {
          riskScore: null,
          riskLevel: null,
          action: null,
          canEvaluate: false,
          reason: 'AI_EVALUATION_UNAVAILABLE',
          emergency: riskResult?.emergency === true,
          emergencyReasons: Array.isArray(riskResult?.emergencyReasons)
            ? riskResult.emergencyReasons
            : [],
        },

        aiMessage: null,
      });
    }

    // ------------------------------------------------
    // 3. AI SONUCU KONTROL ET
    // ------------------------------------------------

    if (
      !aiResult ||
      aiResult.success !== true ||
      aiResult.evaluated !== true
    ) {
      return res.json({
        success: true,
        input: data,

        risk: {
          riskScore: null,
          riskLevel: null,
          action: null,
          canEvaluate: false,
          reason:
            aiResult?.evaluated === false
              ? 'AI_EVALUATION_NOT_POSSIBLE'
              : 'AI_EVALUATION_UNAVAILABLE',
          emergency: riskResult?.emergency === true,
          emergencyReasons: Array.isArray(riskResult?.emergencyReasons)
            ? riskResult.emergencyReasons
            : [],
        },

        aiMessage:
          aiResult?.message || null,
      });
    }

    // ------------------------------------------------
    // 4. AI BAŞARILI
    //
    // Artık risk kullanıcıya gösterilebilir.
    // ------------------------------------------------

    return res.json({
      success: true,
      input: evaluationData,
      risk: {
        ...riskResult,
        emergency: riskResult?.emergency === true,
        emergencyReasons: Array.isArray(riskResult?.emergencyReasons)
          ? riskResult.emergencyReasons
          : [],
      },
      aiMessage: aiResult.message,
    });

  } catch (error) {
    console.error(
      'assistant/evaluate error:',
      error,
    );

    // Genel hata durumunda da risk gösterme.
    return res.status(500).json({
      success: false,
      message: 'AI değerlendirmesi alınamadı.',

      risk: {
        riskScore: null,
        riskLevel: null,
        action: null,
        canEvaluate: false,
        reason: 'AI_EVALUATION_UNAVAILABLE',
        emergency: false,
        emergencyReasons: [],
      },

      aiMessage: null,
    });
  }
});

module.exports = router;