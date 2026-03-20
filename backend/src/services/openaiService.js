const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generatePetAdvice(data, risk) {
  const prompt = `
Kullanıcı bir evcil hayvan destek uygulaması kullanıyor.

Bilgiler:
- Hayvan türü: ${data.petType}
- Problem türü: ${data.problemType}
- Süre: ${data.duration}
- Aciliyet: ${data.urgency}

Risk analizi:
- Risk skoru: ${risk.riskScore}
- Risk seviyesi: ${risk.riskLevel}
- Kısa aksiyon: ${risk.action}

Görev:
Kullanıcıya Türkçe, kısa, sakin ve anlaşılır bir ön değerlendirme yaz.
Kurallar:
- Veteriner yerine geçmediğini belirt.
- Panik yaptırma.
- Gerekirse veterinere başvurmasını söyle.
- 3 kısa paragrafı geçme.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Sen evcil hayvan sağlığı konusunda ön bilgilendirme yapan yardımcı bir asistansın. Teşhis koymazsın, veteriner yerine geçmezsin.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.4,
  });

  return response.choices[0].message.content;
}

module.exports = { generatePetAdvice };