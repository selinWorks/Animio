const express = require('express');
const { calculateRisk } = require('../services/riskScorer');
const { generatePetAdvice } = require('../services/openaiService');

const router = express.Router();

router.post('/evaluate', async (req, res) => {
  try {
    const data = req.body;

    const riskResult = calculateRisk(data);
    const aiMessage = await generatePetAdvice(data, riskResult);

    return res.json({
      success: true,
      input: data,
      risk: riskResult,
      aiMessage,
    });
  } catch (error) {
    console.error('assistant/evaluate error:', error);

    return res.status(500).json({
      success: false,
      message: 'AI değerlendirmesi alınamadı.',
    });
  }
});

module.exports = router;