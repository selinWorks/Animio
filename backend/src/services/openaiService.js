const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =======================================================
// TAKİP SORULARI İÇİN KULLANICI DOSTU İSİMLER
// =======================================================

const followUpLabels = {
  vomitingFrequency: 'Son 24 saatte kusma sayısı',
  vomitAppearance: 'Kusmuğun görünümü',
  canKeepWater: 'Suyu tutabilme durumu',
  abdominalPain: 'Karın ağrısı veya şişlik',

  foodIntake: 'Yemek tüketimi',
  waterIntake: 'Su tüketimi',
  weightLoss: 'Kilo kaybı',

  energyLevel: 'Enerji seviyesi',
  canWalkNormally: 'Normal yürüyebilme',

  foodChange: 'Beslenme değişikliği',
  unusualFood: 'Alışık olmadığı yiyecek veya ödül',
  foreignBodyRisk: 'Yabancı cisim yutma ihtimali',

  careType: 'Aşı veya bakım işleminin türü',
  careTiming: 'Aşı veya bakım işleminin zamanı',
  careProblem: 'İşlemle ilişkili gözlenen sorun',

  otherDetails: 'Kullanıcının bildirdiği ek belirti veya durum',
};

// =======================================================
// DESTEKLENEN HAYVAN TÜRLERİ
// =======================================================

const supportedPetTypes = [
  'Kedi',
  'Köpek',
  'Kuş',
  'Balık',
  'Kemirgen',
  'Sürüngen',
  'Çiftlik Hayvanı',
  'Amfibi',
  'Omurgasız',
  'Diğer Memeliler',
  'Küçük Hayvan',
  'Diğer',
];

// =======================================================
// HAYVAN TÜRÜNE GÖRE AI BAĞLAMI
// =======================================================

const petTypeGuidance = {
  Kedi: `
Kullanıcı bir kedi hakkında bilgi veriyor.

Değerlendirmeyi kedi bağlamında yap.

Kedilerde iştah, su tüketimi, kusma, dışkılama,
idrar, hareket, enerji, davranış, ağrı, solunum
ve görünür fiziksel değişiklikler önem taşıyabilir.

Yalnızca kullanıcı tarafından bildirilen bilgileri kullan.
Kullanıcı tarafından belirtilmeyen semptomları varsayma.
`,

  Köpek: `
Kullanıcı bir köpek hakkında bilgi veriyor.

Değerlendirmeyi köpek bağlamında yap.

İştah, su tüketimi, kusma, dışkılama, hareket,
enerji, davranış, ağrı, solunum ve fiziksel
değişiklikleri kullanıcı tarafından bildirildiği
ölçüde değerlendir.

Kullanıcı tarafından belirtilmeyen bilgileri varsayma.
`,

  Kuş: `
Kullanıcı bir kuş hakkında bilgi veriyor.

Kuşlarda genel durum, solunum, iştah, hareket,
denge, davranış, tüy görünümü ve dışkı gibi
belirtiler kullanıcı tarafından bildirildiyse
değerlendirilebilir.

Bakım koşullarını veya başka belirtileri varsayma.
`,

  Balık: `
Kullanıcı bir balık hakkında bilgi veriyor.

Balık bağlamında yüzme davranışı, denge, hareket,
iştah ve görünür fiziksel değişiklikleri değerlendir.

Su sıcaklığı, su kalitesi veya akvaryum koşulları
kullanıcı tarafından belirtilmediyse bunları varsayma.

Balık olduğu için otomatik olarak risk artırma.
`,

  Kemirgen: `
Kullanıcı bir kemirgen hakkında bilgi veriyor.

İştah, su tüketimi, hareket, enerji, davranış,
dışkılama, solunum ve fiziksel değişiklikleri
kullanıcı tarafından bildirildiği ölçüde değerlendir.

Kullanıcı tarafından verilmeyen bilgileri varsayma.
`,

  Sürüngen: `
Kullanıcı bir sürüngen hakkında bilgi veriyor.

Sürüngenlerde iştah, hareket, davranış, deri
değişiklikleri, solunum ve görünür fiziksel
değişiklikleri kullanıcı tarafından bildirildiği
ölçüde değerlendir.

Sıcaklık, nem, UVB, beslenme düzeni veya yaşam
alanı koşullarını kullanıcı belirtmediyse varsayma.

Sürüngen olması tek başına hastalık veya yüksek
risk anlamına gelmez.
`,

  'Çiftlik Hayvanı': `
Kullanıcı bir çiftlik hayvanı hakkında bilgi veriyor.

Spesifik tür belirtilmediyse inek, koyun, keçi,
at, tavuk veya başka bir tür varsayma.

Yalnızca kullanıcının bildirdiği belirtileri
ve değişiklikleri değerlendir.
`,

  Amfibi: `
Kullanıcı bir amfibi hakkında bilgi veriyor.

Hareket, iştah, davranış, deri görünümü, solunum
ve diğer görünür değişiklikleri kullanıcı tarafından
bildirildiği ölçüde değerlendir.

Sıcaklık, nem veya yaşam alanı koşullarını varsayma.
`,

  Omurgasız: `
Kullanıcı bir omurgasız hayvan hakkında bilgi veriyor.

Spesifik tür belirtilmediyse böcek, örümcek,
yumuşakça, kabuklu veya başka bir tür varsayma.

Yalnızca kullanıcının bildirdiği fiziksel veya
davranışsal değişiklikleri değerlendir.
`,

  'Diğer Memeliler': `
Kullanıcı Kedi veya Köpek dışında bir memeli hakkında
bilgi veriyor.

Spesifik tür belirtilmediyse belirli bir memeli
türü varsayma.

Kullanıcının bildirdiği belirtiler üzerinden
değerlendirme yap.
`,

  'Küçük Hayvan': `
Kullanıcı küçük hayvan kategorisinde bir evcil hayvan
hakkında bilgi veriyor.

Spesifik tür belirtilmediyse belirli bir hayvan
türü varsayma.

Yalnızca kullanıcının bildirdiği belirtileri
ve değişiklikleri değerlendir.
`,

  Diğer: `
Kullanıcı hayvan türü olarak "Diğer" seçmiştir.

Spesifik hayvan türü belirtilmediyse herhangi bir
hayvan türü varsayma.

Değerlendirmeyi yalnızca kullanıcının verdiği
bilgiler üzerinden yap.
`,
};

const defaultPetTypeGuidance = `
Hayvan türü belirtilmemiş veya sistemde tanımlanmamış.

Kullanıcının verdiği bilgiler dışında hayvan türü,
belirti, hastalık veya bakım koşulu varsayma.
`;

// =======================================================
// "DİĞER" ALANI - AÇIKÇA ANLAMSIZ GİRİŞ KONTROLÜ
// =======================================================

const isClearlyMeaninglessOther = value => {
  if (!value || typeof value !== 'string') {
    return true;
  }

  const text = value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ');

  if (!text) {
    return true;
  }

  const meaninglessValues = [
    'asdf',
    'asdfg',
    'asdfgh',
    'qwe',
    'qwer',
    'qwerty',
    'xxx',
    'xxxx',
    'xxxxx',
    'test',
    'deneme',
    'deneme123',
    'abc',
    'abc123',
    'zxc',
    'zxcv',
    'qaz',
    'wsx',
  ];

  if (meaninglessValues.includes(text)) {
    return true;
  }

  // Sadece rakam
  if (/^\d+$/.test(text)) {
    return true;
  }

  // Aynı karakterin anlamsız tekrarı
  if (
    text.length >= 4 &&
    /^(.)(\1)+$/u.test(text)
  ) {
    return true;
  }

  // Tek karakter
  if (text.length <= 1) {
    return true;
  }

  return false;
};

// =======================================================
// "DİĞER" ALANININ ANLAMLILIK KONTROLÜ
// =======================================================

const isMeaningfulOtherDetails = async (
  text,
  petType,
) => {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const value = text.trim();

  if (!value) {
    return false;
  }

  if (isClearlyMeaninglessOther(value)) {
    return false;
  }

  try {
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',

      input: `
Sen PetCare uygulamasında yalnızca metnin anlamlılığını
kontrol eden bir değerlendiricisin.

Hayvan türü:
${petType || 'Belirtilmedi'}

Kullanıcının "Diğer" alanına yazdığı metin:

${JSON.stringify(value)}

Görevin yalnızca metnin anlamlı olup olmadığını
belirlemektir.

TRUE olarak değerlendir:

- gerçek bir sağlık belirtisi,
- fiziksel değişiklik,
- davranış değişikliği,
- rahatsızlık,
- olağandışı durum,
- bakım sonrası sorun,
- kullanıcının gözlemlediği anlamlı bir değişiklik

bildiren ifadeleri.

Örneğin:

"kanama var"
"karnı şiş"
"nefes alırken zorlanıyor"
"çok fazla uyuyor"
"normalden farklı davranıyor"
"ayağında şişlik fark ettim"
"gözünde bir değişiklik var"
"yürürken dengesini kaybediyor"
"birdenbire huzursuz oldu"
"burnundan sıvı geliyor"
"yemek yemeyi bıraktı"
"çok su içmeye başladı"

TRUE olabilir.

FALSE olarak değerlendir:

- rastgele karakterleri,
- test ifadelerini,
- yalnızca rakamları,
- açıkça anlamsız ifadeleri,
- hayvanla ilgili anlamlı bir gözlem içermeyen
  ifadeleri.

Belirsiz ama gerçek bir gözlem olduğu açık olan
ifadeleri TRUE kabul et.

Örneğin:
"garip davranıyor"

anlamlıdır.

Ancak:
"garip"

tek başına yeterli değildir.

Yazım hatası varsa ve gerçek anlam açıkça
anlaşılabiliyorsa TRUE olabilir.

Ancak belirsiz bir kelimeyi başka bir sağlık
belirtisine dönüştürme.

Örneğin:
"kufur ediyor"

ifadesini otomatik olarak "kusuyor" kabul etme.

Tanı koyma.

Hastalık tahmini yapma.

SADECE şu JSON formatında cevap ver:

{
  "meaningful": true
}

veya:

{
  "meaningful": false
}
`,
    });

    const output =
      response.output_text?.trim() || '';

    try {
      const parsed = JSON.parse(output);

      return parsed.meaningful === true;
    } catch (parseError) {
      console.error(
        'isMeaningfulOtherDetails JSON parse error:',
        parseError,
      );

      return false;
    }
  } catch (error) {
    console.error(
      'isMeaningfulOtherDetails error:',
      error,
    );

    return false;
  }
};

// =======================================================
// TAKİP CEVAPLARINI HAZIRLA
// =======================================================

const buildFollowUpText = followUp => {
  if (!followUp || Object.keys(followUp).length === 0) {
    return 'Ek takip bilgisi verilmedi.';
  }

  return Object.entries(followUp)
    .map(([key, value]) => {
      if (
        value === null ||
        value === undefined ||
        value === ''
      ) {
        return null;
      }

      const label =
        followUpLabels[key] || key;

      if (key === 'otherDetails') {
        return `
KULLANICININ SERBEST METİN GÖZLEMİ:

${JSON.stringify(String(value))}

Bu metin anlamlıysa gerçek kullanıcı bilgisi olarak
değerlendir.

Metni kullanıcıya aynen tekrar etme.

Metinde bulunmayan ayrıntıları ekleme.
`;
      }

      return `- ${label}: ${String(value)}`;
    })
    .filter(Boolean)
    .join('\n');
};

// =======================================================
// ÇIKTI TEMİZLEME
// =======================================================

const cleanAiOutput = output => {
  if (!output) {
    return '';
  }

  return output
    // Markdown başlıklarını kaldır
    .replace(/^#{1,6}\s*/gm, '')

    // Bold / italic
    .replace(/\*\*(.*?)\*\*/gs, '$1')
    .replace(/\*(.*?)\*/gs, '$1')
    .replace(/__(.*?)__/gs, '$1')
    .replace(/_(.*?)_/gs, '$1')

    // Gereksiz numaralandırma
    .replace(
      /^\s*\d+[\.\)]\s*/gm,
      '',
    )

    // Gereksiz markdown çizgileri
    .replace(
      /^\s*[-*_]{3,}\s*$/gm,
      '',
    )

    // İstenmeyen başlıkların eski sürümlerini temizle
    .replace(
      /^\s*DİKKAT EDİLMESİ GEREKENLER\s*$/gim,
      '',
    )

    // Risk skorunu tekrar etmeye çalışma:
    // Prompt zaten bunu engelliyor; burada yalnızca
    // açıkça yazılmış "Skor: xx/100" satırlarını temizliyoruz.
    .replace(
      /^\s*(?:Risk\s*)?Skoru?\s*:\s*\d+\s*\/\s*100\s*$/gim,
      '',
    )

    // Fazla boşluk
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// =======================================================
// YANITIN SADECE İSTENEN BÖLÜMLERDEN OLUŞMASINI SAĞLA
// =======================================================

const normalizeAiSections = output => {
  if (!output) {
    return '';
  }

  const cleaned = cleanAiOutput(output);

  const causesIndex = cleaned.search(
    /OLASI NEDENLER/i,
  );

  const nextStepsIndex = cleaned.search(
    /SONRAKİ ADIMLAR/i,
  );

  // İki başlık da bulunduysa yalnızca bunları al.
  if (
    causesIndex !== -1 &&
    nextStepsIndex !== -1
  ) {
    let causesText = cleaned
      .slice(
        causesIndex + 'OLASI NEDENLER'.length,
        nextStepsIndex,
      )
      .trim();

    let nextStepsText = cleaned
      .slice(
        nextStepsIndex + 'SONRAKİ ADIMLAR'.length,
      )
      .trim();

    // Eski gereksiz başlıkların kalıntıları
    causesText = causesText
      .replace(
        /^DİKKAT EDİLMESİ GEREKENLER\s*/i,
        '',
      )
      .trim();

    nextStepsText = nextStepsText
      .replace(
        /^DİKKAT EDİLMESİ GEREKENLER\s*/i,
        '',
      )
      .trim();

    return (
      `OLASI NEDENLER\n\n` +
      `${causesText}\n\n` +
      `SONRAKİ ADIMLAR\n\n` +
      `${nextStepsText}`
    ).trim();
  }

  // Model başlıkları üretmediyse çıktıyı olduğu gibi
  // döndürmek yerine güvenli bir yapı oluştur.
  return cleaned;
};

// =======================================================
// PETCARE AI ÖN DEĞERLENDİRME
// =======================================================

const generatePetAdvice = async (
  data,
  riskResult,
) => {
  try {
    const {
      petType,
      problemTypes,
      problemType,
      duration,
      urgency,
      followUpAnswers,
    } = data || {};

    // ===================================================
    // AKTİF PROBLEMLER
    // ===================================================

    const activeProblemTypes =
      Array.isArray(problemTypes)
        ? problemTypes.filter(Boolean)
        : problemType
          ? [problemType]
          : [];

    // ===================================================
    // HAYVAN TÜRÜ
    // ===================================================

    const normalizedPetType =
      typeof petType === 'string'
        ? petType.trim()
        : '';

    const isSupportedPetType =
      supportedPetTypes.includes(
        normalizedPetType,
      );

    const selectedPetTypeGuidance =
      petTypeGuidance[normalizedPetType] ||
      defaultPetTypeGuidance;

    // ===================================================
    // TAKİP CEVAPLARI
    // ===================================================

    const followUp =
      followUpAnswers &&
      typeof followUpAnswers === 'object'
        ? followUpAnswers
        : {};

    // ===================================================
    // DİĞER
    // ===================================================

    const otherDetails =
      typeof followUp.otherDetails === 'string'
        ? followUp.otherDetails.trim()
        : '';

    const hasOtherSelected =
      activeProblemTypes.includes('Diğer');

    const onlyOtherSelected =
      activeProblemTypes.length === 1 &&
      activeProblemTypes[0] === 'Diğer';

    // ===================================================
    // DİĞER ALANININ ANLAMLILIK KONTROLÜ
    // ===================================================

    if (
      onlyOtherSelected &&
      !otherDetails
    ) {
      return {
        success: true,
        evaluated: false,
        message:
          `DİĞER\n\n` +
          `Lütfen gözlemlediğiniz durumu ` +
          `açıkça belirtin.\n\n` +
          `Bu değerlendirme veteriner muayenesinin ` +
          `yerine geçmez.`,
      };
    }

    if (
      onlyOtherSelected &&
      otherDetails
    ) {
      const meaningful =
        await isMeaningfulOtherDetails(
          otherDetails,
          normalizedPetType,
        );

      if (!meaningful) {
        return {
          success: true,
          evaluated: false,
          message:
            `DİĞER\n\n` +
            `Girdiğiniz ifade evcil hayvanınızla ilgili ` +
            `anlaşılır bir belirti, gözlem veya durum ` +
            `içermiyor. Lütfen gözlemlediğiniz durumu ` +
            `daha açık şekilde yazın.\n\n` +
            `Bu değerlendirme veteriner muayenesinin ` +
            `yerine geçmez.`,
        };
      }
    }

    // ===================================================
    // TAKİP METNİ
    // ===================================================

    const followUpText =
      buildFollowUpText(followUp);

    // ===================================================
    // RİSK BİLGİSİ
    // ===================================================

    const riskScore =
      riskResult?.riskScore != null
        ? riskResult.riskScore
        : null;

    const riskLevel =
      riskResult?.riskLevel || null;

    // ===================================================
    // ANA PROMPT
    // ===================================================

    const prompt = `
Sen PetCare uygulamasında çalışan bir
evcil hayvan sağlık ön değerlendirme asistanısın.

Görevin kullanıcıya uzun bir açıklama yazmak değil;
verilen bilgilerden hareketle kısa, profesyonel ve
yararlı bir ön değerlendirme oluşturmaktır.

Kesin tanı koyma.

=======================================================
1. HAYVAN TÜRÜ
=======================================================

Kullanıcının seçtiği hayvan türü:

${normalizedPetType || 'Belirtilmedi'}

Bu tür değerlendirmede MUTLAKA dikkate alınmalıdır.

${selectedPetTypeGuidance}

Hayvan türünü başka bir türle karıştırma.

Örneğin kullanıcı "Sürüngen" seçtiyse hayvanı
kedi veya köpek gibi değerlendirme.

Hayvan türü değerlendirmeyi gerçekten değiştiriyorsa
tür adını yanıt içinde en fazla BİR KEZ doğal biçimde
kullan.

Örneğin:

"Sürüngenlerde bu tür iştah değişiklikleri..."

gibi.

Ancak sadece tür adını söylemek için gereksiz
bir cümle oluşturma.

=======================================================
2. KULLANICI BİLGİLERİ
=======================================================

Seçilen problem / belirtiler:

${
  activeProblemTypes.length > 0
    ? activeProblemTypes.join(', ')
    : 'Belirtilmedi'
}

Süre:

${duration || 'Belirtilmedi'}

Kullanıcının belirttiği aciliyet:

${urgency || 'Belirtilmedi'}

Takip cevapları:

${followUpText}

=======================================================
3. SERBEST "DİĞER" BİLGİSİ
=======================================================

${
  hasOtherSelected && otherDetails
    ? `
Kullanıcının "Diğer" alanındaki doğrudan ifadesi:

${JSON.stringify(otherDetails)}

Bu ifade anlamlı bir kullanıcı gözlemiyse mutlaka
değerlendirmeye dahil et.

Ancak kullanıcıya aynı cümleyi tekrar etme.

Örneğin kullanıcı "kanama var" dediyse:

"Kanama olduğunu belirttiniz."

şeklinde gereksiz tekrar yapma.

Bunun yerine bu bilginin değerlendirmeye etkisini
doğrudan nedenler veya sonraki adımlar içinde belirt.

Metinde bulunmayan miktar, süre, kaynak, renk veya
neden gibi ayrıntıları uydurma.
`
    : 'Kullanıcı "Diğer" alanında ek bir açıklama vermedi.'
}

=======================================================
4. RİSK SKORU
=======================================================

Sistem tarafından hesaplanan risk skoru:

${
  riskScore !== null
    ? `${riskScore}/100`
    : 'Hesaplanmadı'
}

Sistem tarafından hesaplanan risk seviyesi:

${riskLevel || 'Belirtilmedi'}

Bu bilgiler yalnızca iç değerlendirme bağlamıdır.

ÇOK ÖNEMLİ:

Risk skorunu kullanıcıya tekrar yazma.

"Skorunuz 34/100."

"Risk seviyeniz düşük."

"Mevcut risk skoru..."

gibi cümleler yazma.

Kullanıcı arayüzü risk skorunu zaten göstermektedir.

Aynı şekilde kullanıcının verdiği semptomları da
uzun uzun tekrar etme.

=======================================================
5. PROFESYONEL DEĞERLENDİRME
=======================================================

Yanıtı gereksiz açıklamalarla uzatma.

Kullanıcının söylediği bilgileri tekrar etmek yerine
bu bilgilerin ne anlama gelebileceğini açıkla.

Örneğin:

KÖTÜ:
"Evcil hayvanınız 1-2 gündür iştahsız ve daha fazla
su tüketiyor."

İYİ:
"Beslenme değişiklikleri; çevresel stres, diyet
değişikliği veya bazı metabolik sorunlarla ilişkili
olabilir."

KÖTÜ:
"Evcil hayvanınızın iştahsız olduğunu dikkate alın."

İYİ:
"Beslenme durumu düzelmezse veya yeni belirtiler
eklenirse veteriner değerlendirmesi gerekir."

=======================================================
6. OLASI NEDENLER
=======================================================

En fazla 3 makul olasılık belirt.

Olasılıkları mevcut kullanıcı bilgileriyle
ilişkilendir.

Gereksiz uzun hastalık listesi oluşturma.

Her olasılığı kısa şekilde açıkla.

Örnek:

Beslenme değişikliği:
Yakın zamanda mama veya beslenme düzeni değiştiyse
geçici iştah değişikliğine neden olabilir.

Stres veya çevresel değişiklik:
Yeni ortam veya rutin değişikliği bazı hayvanlarda
iştah ve davranış değişikliğine yol açabilir.

Sağlık sorunu:
Belirtiler devam eder veya başka bulgular eklenirse
altta yatan bir sağlık sorununun değerlendirilmesi
gerekebilir.

Kesin tanı koyma.

Kullanıcının söylemediği bir belirtiyi neden olarak
varmış gibi kabul etme.

=======================================================
7. SONRAKİ ADIMLAR
=======================================================

Kullanıcıya doğrudan uygulanabilir adımlar ver.

Genellikle 2-4 kısa madde yeterlidir.

Gereksiz genel tavsiyeler verme.

Örneğin:

- Beslenme ve su tüketimini takip et.
- Yeni bir belirti eklenip eklenmediğini gözlemle.
- Durum düzelmezse veteriner hekime başvur.

Gerçek bir acil uyarı işareti mevcutsa veteriner
hekime başvurulmasını açıkça belirt.

Kullanıcının söylemediği acil belirtileri varmış
gibi yazma.

=======================================================
8. TEKRAR YASAĞI
=======================================================

Aşağıdakileri YAPMA:

- Kullanıcının verdiği semptomları tekrar tekrar anlatma.
- Risk skorunu tekrar etme.
- Risk seviyesini tekrar etme.
- "Durumu yakından takip edin" gibi tek başına
  bilgi vermeyen cümlelerle bölümü doldurma.
- "Verdiğiniz bilgiler doğrultusunda..." gibi
  gereksiz giriş cümleleri kullanma.
- "Evcil hayvanınızın durumu..." şeklinde aynı bilgiyi
  farklı cümlelerle tekrar etme.
- Uzun genel sağlık açıklamaları yapma.
- Kullanıcıya sistemin nasıl çalıştığını anlatma.
- Meta açıklamalar yapma.
- Kullanıcıya soru sorma.

=======================================================
9. BİLGİ UYDURMA YASAĞI
=======================================================

Kullanıcı yalnızca belirli bir bilgiyi verdiyse
yalnızca o bilgiyi biliyorsun.

Eksik bilgileri tamamlamak için varsayım yapma.

Örneğin:

"Kusuyor."

bilgisinden:

- kaç kez kustuğunu,
- kusmuğun rengini,
- kan olduğunu,
- su içemediğini,
- karın ağrısı olduğunu

varsayma.

Ancak kullanıcı takip sorularında bu bilgileri
verdiyse onları değerlendir.

=======================================================
10. DİL VE ÜSLUP
=======================================================

Türkçe yaz.

Profesyonel fakat anlaşılır ol.

Veteriner hekimin kullanıcıya kısa bir ön değerlendirme
yaptığını düşün.

Korkutucu veya dramatik dil kullanma.

Kesin tanı ifadeleri kullanma.

"Kesinlikle şu hastalık" deme.

"Buna bağlı olabilir", "ilişkili olabilir",
"değerlendirilmesi gerekebilir" gibi uygun
belirsizlik ifadeleri kullan.

Çok uzun cümleler kurma.

Yanıt yaklaşık 80-140 kelime olsun.

=======================================================
11. ÇIKTI FORMATI
=======================================================

SADECE aşağıdaki iki başlığı kullan:

OLASI NEDENLER

SONRAKİ ADIMLAR

Bunun dışında hiçbir başlık kullanma.

Özellikle:

DİKKAT EDİLMESİ GEREKENLER

RİSK SEVİYESİ

DEĞERLENDİRME

DURUMUN DEĞERLENDİRMESİ

RİSKİ ETKİLEYEN NOKTALAR

başlıklarını kullanma.

Başlıkları numaralandırma.

Markdown başlık sembolü kullanma.

Her bölüm kısa paragraflar veya kısa maddeler
şeklinde olabilir.

Yanıtın sonunda yalnızca bir kez:

Bu değerlendirme veteriner muayenesinin yerine geçmez.

cümlesini yaz.

Bu cümleden sonra başka açıklama yazma.

=======================================================
12. SON KONTROL
=======================================================

Yanıtı oluşturmadan önce kontrol et:

- Seçilen hayvan türünü doğru kullandım mı?
- Kullanıcı tarafından verilen gerçek belirtileri
  değerlendirdim mi?
- "Diğer" alanındaki anlamlı bilgiyi dikkate aldım mı?
- Semptomları gereksiz şekilde tekrar ediyor muyum?
- Risk skorunu tekrar ediyor muyum?
- Gereksiz "dikkat edilmesi gerekenler" bölümü
  oluşturuyor muyum?
- Olası nedenler gerçekten verilen bilgilerle
  ilişkili mi?
- Sonraki adımlar uygulanabilir mi?
- Kullanıcının vermediği bilgi uydurdum mu?
- Kesin tanı koydum mu?
- Gereksiz hastalık listesi oluşturdum mu?

Bu kontrolü kullanıcıya gösterme.
`;

    // ===================================================
    // OPENAI
    // ===================================================

    const response =
      await openai.responses.create({
        model: 'gpt-4o-mini',
        input: prompt,
      });

    const output =
      response.output_text?.trim() || '';

    // ===================================================
    // ÇIKTIYI TEMİZLE
    // ===================================================

    const cleanedOutput =
      normalizeAiSections(output);

    // ===================================================
    // SONUÇ
    // ===================================================

    return {
      success: true,
      evaluated: true,
      message: cleanedOutput,
      petType: isSupportedPetType
        ? normalizedPetType
        : null,
    };
  } catch (error) {
    console.error(
      'generatePetAdvice error:',
      error,
    );

    throw error;
  }
};

// =======================================================
// EXPORT
// =======================================================

module.exports = {
  generatePetAdvice,
};