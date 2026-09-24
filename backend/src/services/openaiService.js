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
// DİĞER ALANI İÇİN AÇIKÇA ANLAMSIZ GİRİŞ KONTROLÜ
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

  // Açıkça test / rastgele giriş olduğu bilinen ifadeler.
  // Bu liste SADECE kesin anlamsız örnekleri yakalamak için kullanılır.
  // Sağlıkla ilgili olabilecek kelimeler burada kesinlikle bulunmaz.
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

  // Aynı karakterin anlamsız şekilde tekrar edilmesi
  if (
    text.length >= 4 &&
    /^(.)(\1)+$/u.test(text)
  ) {
    return true;
  }

  // Çok kısa anlamsız girişler.
  // "ağrı", "ateş", "kan", "yara" gibi gerçek kelimeleri
  // yanlışlıkla elememek için burada agresif kontrol yapılmaz.
  if (text.length <= 1) {
    return true;
  }

  return false;
};

// =======================================================
// "DİĞER" ALANINDAKİ METNİN ANLAMLI OLUP OLMADIĞINI KONTROL ET
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

  // Kesin olarak anlamsız olduğu bilinen girişlerde
  // gereksiz AI çağrısı yapma.
  if (isClearlyMeaninglessOther(value)) {
    return false;
  }

  try {
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',

      input: `
Sen bir evcil hayvan sağlık uygulamasında çalışan
METİN ANLAMLILIK DEĞERLENDİRİCİSİSİN.

Aşağıdaki metin, ${petType || 'bir evcil hayvan'} hakkında
kullanıcının "Diğer" alanına kendi yazdığı ifadedir.

Görevin yalnızca şu kararı vermektir:

Bu metin, evcil hayvan hakkında gerçek bir sağlık durumu,
belirti, fiziksel değişiklik, davranış değişikliği,
rahatsızlık, olağandışı durum, bakım sonrası sorun veya
kullanıcının gözlemlediği anlamlı bir durum bildiriyor mu?

Eğer EVET ise:
meaningful = true

Eğer metin açıkça anlamsız, rastgele, test amaçlı,
konu dışı veya herhangi bir anlamlı gözlem içermiyorsa:
meaningful = false

=======================================================
ÇOK ÖNEMLİ KARAR KURALLARI
=======================================================

Bir metnin "meaningful" olması için belirli bir belirti
kelimesini önceden tanıyor olman gerekmez.

Yeni veya daha önce örneğini görmediğin bir sağlık
ifadesi de anlamlı olabilir.

Metni kelime listesine göre değil, ANLAMINA göre değerlendir.

Örneğin aşağıdakiler anlamlıdır:

"kanama var"
"kan gördüm"
"karnı şiş"
"nefes alırken zorlanıyor"
"çok fazla uyuyor"
"normalden farklı davranıyor"
"ayağında şişlik fark ettim"
"gözünün içinde bir şey var"
"yürürken dengesini kaybediyor"
"birdenbire çok huzursuz oldu"
"burnundan sıvı geliyor"
"tuvaletini yaparken zorlanıyor"
"derisinde değişiklik fark ettim"
"yemek yemeyi bıraktı"
"çok su içmeye başladı"
"bugün normalden farklı"

Bunların hepsi belirli bir kelime listesinde bulunmasa
bile anlamlı kullanıcı gözlemleridir.

=======================================================
ANLAMSIZ METİNLER
=======================================================

Aşağıdaki türler anlamlı değildir:

"asdf"
"qwerty"
"xxx"
"12345"
"deneme"
"test"
"abc123"

Ayrıca:

- tamamen rastgele karakterler,
- yalnızca anlamsız harf dizileri,
- açıkça test amaçlı yazılmış ifadeler,
- sağlıkla veya evcil hayvanla hiçbir anlamlı bağlantısı
  olmayan ifadeler

false olmalıdır.

=======================================================
BELİRSİZLİK KURALI
=======================================================

Bir ifade biraz belirsiz olsa bile gerçek bir gözlem veya
durum bildirdiği açıkça anlaşılıyorsa meaningful = true.

Örneğin:

"garip davranıyor"

ifadesi yeterince belirsiz olsa da bir davranış değişikliği
bildirdiği için anlamlı kabul edilebilir.

Ancak:

"garip"

tek başına anlamlı bir sağlık gözlemi oluşturmayabilir.

Bu nedenle zorla bir belirti tahmin etme.

=======================================================
YAZIM HATALARI
=======================================================

Açık bir yazım hatası varsa ve cümlenin gerçek anlamı
kolayca anlaşılabiliyorsa meaningful = true olabilir.

Ancak bir kelimeyi yalnızca başka bir sağlık belirtisine
benziyor diye değiştirme.

Örneğin:

"kufur ediyor"

ifadesini "kusuyor" olarak varsayma.

Çünkü kullanıcının gerçek anlamı kesin olarak bilinmiyor.

=======================================================
ÖNEMLİ
=======================================================

Burada belirti teşhisi yapma.

Metnin hangi hastalığa işaret ettiğini değerlendirme.

Sadece kullanıcının metninin anlamlı bir evcil hayvan
gözlemi olup olmadığına karar ver.

SADECE şu JSON formatında cevap ver:

{
  "meaningful": true
}

veya:

{
  "meaningful": false
}

Kullanıcı metni:
"${value.replace(/"/g, '\\"')}"
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
    } = data;

    // ===================================================
    // AKTİF PROBLEM TÜRLERİ
    // ===================================================

    const activeProblemTypes =
      Array.isArray(problemTypes)
        ? problemTypes
        : problemType
          ? [problemType]
          : [];

    // ===================================================
    // TAKİP CEVAPLARI
    // ===================================================

    const followUp = followUpAnswers || {};

    // ===================================================
    // DİĞER ALANI
    // ===================================================

    const otherDetails =
      typeof followUp.otherDetails === 'string'
        ? followUp.otherDetails.trim()
        : '';

    const onlyOtherSelected =
      activeProblemTypes.length === 1 &&
      activeProblemTypes[0] === 'Diğer';

    // ===================================================
    // DİĞER ALANININ ANLAMLILIK KONTROLÜ
    // ===================================================

    if (onlyOtherSelected) {
      const meaningful =
        await isMeaningfulOtherDetails(
          otherDetails,
          petType,
        );

      if (!meaningful) {
        return {
          success: true,
          evaluated: false,
          message: `DİĞER

      Girdiğiniz ifade evcil hayvanınızla ilgili anlaşılır bir belirti, gözlem veya durum içermiyor. Lütfen gözlemlediğiniz durumu daha açık şekilde yazın.

      Bu değerlendirme veteriner muayenesinin yerine geçmez.`,
        };
      }
    }

    // ===================================================
    // TAKİP CEVAPLARINI AI İÇİN HAZIRLA
    // ===================================================

    const followUpText =
      Object.keys(followUp).length > 0
        ? Object.entries(followUp)
            .map(([key, value]) => {
              const label =
                followUpLabels[key] || key;

              if (key === 'otherDetails') {
                return `
=======================================================
KULLANICININ "DİĞER" ALANINDAKİ DOĞRUDAN BEYANI
=======================================================

"${value}"

BU ALAN ÇOK ÖNEMLİDİR.

Yukarıdaki ifade kullanıcının kendi gözlemidir.

Eğer ifade anlamlı bir sağlık belirtisi, fiziksel
değişiklik, davranış değişikliği, rahatsızlık,
olağandışı durum veya bakım problemi bildiriyorsa,
bu bilgi MEVCUT KULLANICI BELİRTİSİ olarak kabul edilmelidir.

Bu bilgiyi görmezden gelme.

Bu bilgiyi yalnızca "Diğer alanında yazılmış" şeklinde
geçiştirme.

Bu bilgiyi DİKKAT EDİLMESİ GEREKENLER bölümünde dikkate al.

Risk açısından önemliyse DİKKAT EDİLMESİ GEREKENLER
bölümünde kısa şekilde değerlendir.

Uygunsa SONRAKİ ADIMLAR bölümünde dikkate al.

Metinde açıkça belirtilmeyen ayrıntıları uydurma.

Örneğin kullanıcı yalnızca "kanama var" dediyse:
- kanamanın miktarını tahmin etme,
- ne zamandır olduğunu tahmin etme,
- nereden geldiğini tahmin etme,
- nedenini kesin olarak söyleme.

Ancak "kanama var" bilgisini kesinlikle yok sayma.

Aynı şekilde kullanıcı daha önce görülmemiş farklı
bir belirti veya gözlem yazarsa, bunu sadece önceden
tanımlanmış bir kelime listesinde olmadığı için yok sayma.

Metnin anlamını değerlendir ve gerçek bir kullanıcı
gözlemi ise değerlendirmeye dahil et.
`;
              }

              return `- ${label}: ${value}`;
            })
            .join('\n')
        : 'Ek takip bilgisi verilmedi.';

    // ===================================================
    // ANA AI PROMPT
    // ===================================================

    const prompt = `
Sen PetCare uygulamasında çalışan bir evcil hayvan sağlık
ön değerlendirme asistanısın.

Görevin, kullanıcının verdiği bilgilerden yola çıkarak
evcil hayvanın mevcut durumunu anlaşılır ve kişiye özel
şekilde değerlendirmektir.

Kesin tanı koyma.

Ama kullanıcının açıkça bildirdiği gerçek belirtileri,
özellikle "Diğer" alanında yazılanları, kesinlikle yok sayma.

=======================================================
1. EN ÖNEMLİ KURAL: KULLANICININ GERÇEK BİLGİLERİ
=======================================================

Kullanıcının verdiği bilgiler değerlendirmedeki temel
veridir.

Kullanıcı bir belirtiyi açıkça yazdıysa o belirtiyi
değerlendir.

Belirti önceden tanımlanmış bir listede bulunmasa bile,
anlamlı bir sağlık gözlemi olduğu anlaşılıyorsa dikkate al.

Örneğin kullanıcı:

"kanama var"

derse, bunu gerçek bir kullanıcı belirtisi olarak kabul et.

Kullanıcı:

"karnında şişlik fark ettim"

derse, bunu gerçek bir kullanıcı gözlemi olarak kabul et.

Kullanıcı:

"nefes alırken zorlanıyor"

derse, bunu gerçek bir kullanıcı belirtisi olarak kabul et.

Kullanıcı:

"normalden farklı davranıyor"

derse, bunu davranış değişikliği olarak dikkate al.

Kullanıcının yazdığı anlamlı bir belirtiyi sırf sistemde
önceden özel bir kategorisi olmadığı için yok sayma.

=======================================================
2. "DİĞER" ALANI ÖZEL KURALI
=======================================================

"Diğer" alanındaki metin kullanıcının serbest biçimde
yazdığı doğrudan gözlemdir.

Bu nedenle:

- anlamlıysa gerçek kullanıcı verisidir,
- değerlendirmeye dahil edilmelidir,
- diğer belirtilerle birlikte yorumlanmalıdır,
- yalnızca "Diğer" olarak adlandırıldığı için önemsiz
  kabul edilmemelidir.

"Diğer" alanı bir belirti kategorisi değildir.

Kullanıcının kendi cümlesini yazdığı serbest metin alanıdır.

Bu nedenle bu alandaki anlamlı ifadeyi önce anlamlandır,
sonra mevcut durum içinde değerlendir.

=======================================================
3. ANLAMSIZ METİN İLE ANLAMLI METNİ AYIR
=======================================================

Açıkça anlamsız veya rastgele metinleri belirtiye dönüştürme.

Örneğin:

"asdf"
"qwe"
"xxx"
"12345"
"deneme"

gibi ifadeleri sağlık belirtisi olarak yorumlama.

Ancak gerçek bir kullanıcı gözlemi içeren ifadeleri
anlamsız kabul etme.

Örneğin:

"kanama var"
"çok halsiz"
"gözünde değişiklik var"
"yürürken dengesini kaybediyor"
"normalden fazla uyuyor"
"nefes alması farklı"
"birdenbire huzursuz oldu"

gibi ifadeler anlamlı kullanıcı gözlemleridir.

Bunları değerlendirmeye dahil et.

=======================================================
4. BELİRTİ LİSTESİNE BAĞLI KALMA
=======================================================

Kullanıcının belirttiği sağlık durumlarını önceden verilmiş
birkaç örnekle sınırlama.

Senin görevin kelime eşleştirmek değil, kullanıcının
anlamlı gözlemini anlamaktır.

Yeni bir belirti, fiziksel değişiklik veya davranış
değişikliği ile karşılaşırsan:

1. Kullanıcının gerçekten bir durum bildirdiğini belirle.
2. Kullanıcının söylediği durumu olduğu gibi kabul et.
3. Mevcut diğer bilgilerle birlikte değerlendir.
4. Gerekiyorsa risk açısından önemini açıkla.
5. Kullanıcının söylemediği ayrıntıları ekleme.

=======================================================
5. YAZIM HATALARI VE BELİRSİZLİK
=======================================================

Yazım hatası anlamı açıkça belli ediyorsa makul şekilde
yorumlayabilirsin.

Ancak belirsiz bir ifadeyi zorla başka bir belirtiye
dönüştürme.

Örneğin:

"kufur ediyor"

ifadesini otomatik olarak:

"kusuyor"

olarak yorumlama.

Çünkü burada anlam kesin değildir.

Buna karşılık açıkça anlaşılabilen bir yazım hatası
gerçek anlamı değiştirmiyorsa bağlamdan anlaşılabilir.

Kural:

Açık anlam varsa değerlendir.

Gerçek belirsizlik varsa tahmin etme.

=======================================================
6. BİLGİ UYDURMA YASAĞI
=======================================================

Kullanıcı yalnızca bir belirti söylediyse yalnızca o
belirtinin mevcut olduğunu bilirsin.

Örneğin:

"kanama var"

bilgisinden:

- kanamanın miktarını,
- süresini,
- kaynağını,
- rengini,
- nedenini

tahmin etme.

Ama "kanama var" bilgisini de kesinlikle görmezden gelme.

Eksik ayrıntı ile eksik belirti aynı şey değildir.

Belirti mevcut olabilir, ayrıntıları bilinmiyor olabilir.

=======================================================
7. RİSK DEĞERLENDİRMESİ
=======================================================

Sistemin verdiği risk skoru ve risk seviyesi yardımcı
bilgidir.

Ancak kullanıcının açıkça bildirdiği gerçek bir belirtiyi
sırf mevcut risk skorunda özel olarak hesaba katılmadı
diye yok sayma.

Kullanıcının serbest metnindeki anlamlı belirtileri,
mevcut diğer bilgilerle birlikte klinik ön değerlendirme
mantığıyla yorumla.

Risk konusunda kesin tanı veya kesin sonuç verme.

Gerçekten önemli bir uyarı işareti varsa bunu açıkça belirt.

Yeterli veri yoksa gereksiz kesinlik kullanma.

=======================================================
8. OLASI NEDENLER
=======================================================

Olası nedenleri yalnızca mevcut belirtilerle makul şekilde
ilişkiliyse belirt.

Kesin hastalık tanısı koyma.

Kullanıcının söylemediği bir hastalığı varmış gibi yazma.

Belirti çok genel ise uzun ve gereksiz hastalık listesi
oluşturma.

=======================================================
9. TAKİP CEVAPLARI
=======================================================

Takip sorularının cevaplarını mutlaka değerlendir.

Örneğin kusma ile ilgili takip cevapları verilmişse:

- kusma sıklığı,
- kusmuğun görünümü,
- suyu tutabilme,
- karın ağrısı veya şişlik

gibi verilen bilgileri değerlendirmeye dahil et.

Ancak kullanıcıya sorulmayan veya cevaplanmayan bilgileri
varmış gibi kabul etme.

=======================================================
10. META TALİMATLARI KULLANMA
=======================================================

Kullanıcıya sistemin nasıl çalıştığını anlatma.

Şunları kullanıcıya gösterme:

"Risk seviyesini değerlendir."

"Takip cevaplarını analiz et."

"Diğer alanını değerlendir."

"Risk faktörlerini açıkla."

"Belirtileri analiz et."

Bunlar çalışma talimatıdır.

Bunun yerine doğrudan sonucu yaz.

=======================================================
11. VERİLER
=======================================================

Evcil hayvan türü:
${petType || 'Belirtilmedi'}

Seçilen belirtiler / konular:
${
  activeProblemTypes.length > 0
    ? activeProblemTypes.join(', ')
    : 'Belirtilmedi'
}

Süre:
${duration || 'Belirtilmedi'}

Kullanıcının belirttiği aciliyet:
${urgency || 'Belirtilmedi'}

Takip sorularına verilen cevaplar:
${followUpText}

Mevcut sistem risk skoru:
${
  riskResult?.riskScore != null
    ? `${riskResult.riskScore}/100`
    : 'Hesaplanmadı'
}

Mevcut sistem risk seviyesi:
${riskResult?.riskLevel || 'Belirtilmedi'}

Mevcut sistem önerisi:
${riskResult?.action || 'Belirtilmedi'}

=======================================================
12. CEVAP YAPISI
=======================================================

Yanıtı yalnızca aşağıdaki üç başlık altında oluştur.

DİKKAT EDİLMESİ GEREKENLER

Bu bölüm kısa ve doğrudan olmalıdır.

Kullanıcının verdiği bilgiler arasından gerçekten
önemli olan noktaları belirt.

Risk seviyesini etkileyen önemli kullanıcı bilgilerini
de bu bölümün içinde değerlendir.

Aynı bilgiyi tekrar tekrar anlatma.

Kullanıcının seçtiği belirtileri veya cevapları uzun
uzun özetleme.

Yalnızca dikkat edilmesi gereken önemli noktaları,
risk açısından anlamlı bilgileri ve varsa uyarı işaretlerini
kısa şekilde belirt.

Gereksiz genel bilgiler verme.


OLASI NEDENLER

Bu bölüm önemlidir.

Mevcut belirtiler ve kullanıcı tarafından verilen bilgilerle
makul şekilde ilişkili olabilecek olası nedenleri belirt.

En fazla birkaç önemli olasılığa yer ver.

Olasılıkları kısa ve anlaşılır şekilde açıkla.

Kesin hastalık tanısı koyma.

Kullanıcının vermediği bir belirtiyi veya durumu varmış gibi
kabul etme.

Belirti çok genel ise gereksiz uzun hastalık listesi oluşturma.

Olası nedenleri, mevcut belirtilerle bağlantısını açıklayarak
ver.


SONRAKİ ADIMLAR

Kullanıcının mevcut durumda yapabileceği uygun adımları
kısa ve net şekilde belirt.

Evde gözlem yapılabilecek durumları ve dikkat edilmesi
gereken değişiklikleri belirt.

Gerçek bir acil uyarı işareti varsa veteriner hekime
başvurulması gerektiğini açıkça belirt.

Gereksiz tekrar yapma.

=======================================================
13. YAZIM KURALLARI
=======================================================

- Türkçe yaz.
- Sakin ve profesyonel ol.
- Kullanıcıya doğrudan hitap et.
- Kişiye özel yaz.
- Gereksiz tekrar yapma.
- Robotik ifadeler kullanma.
- Kullanıcıya soru sorma.
- Kullanıcının vermediği bilgileri uydurma.
- Kullanıcının verdiği anlamlı belirtileri yok sayma.
- Anlamsız metni belirtiye dönüştürme.
- Gereksiz hastalık listesi oluşturma.
- Gereksiz korkutucu dil kullanma.
- 100-180 kelime arasında kal.

Başlıkları tam olarak şu şekilde kullan:

DİKKAT EDİLMESİ GEREKENLER

OLASI NEDENLER

SONRAKİ ADIMLAR

Başlıkların başına Markdown sembolü koyma.

Başlıkları numaralandırma.

Aynı bilgiyi farklı başlıklarda tekrar etme.

"DURUMUN DEĞERLENDİRMESİ" başlığını kullanma.

"RİSK SEVİYESİNİ ETKİLEYEN NOKTALAR" başlığını kullanma.

Riskle ilgili önemli noktaları "DİKKAT EDİLMESİ GEREKENLER"
bölümünün içinde kısa şekilde belirt.

Yanıtın sonunda yalnızca bir kez:

"Bu değerlendirme veteriner muayenesinin yerine geçmez."

cümlesini kullan.

Bu cümleden sonra başka açıklama ekleme.

=======================================================
14. SON KONTROL
=======================================================

Yanıtı oluşturmadan önce kendi içinde kontrol et:

- Kullanıcının yazdığı her anlamlı belirti dikkate alındı mı?
- "Diğer" alanındaki anlamlı ifade gerçekten değerlendirildi mi?
- Yeni veya daha önce görülmemiş bir belirti sırf listede
  olmadığı için yok sayıldı mı?
- Anlamsız metin yanlışlıkla belirtiye dönüştürüldü mü?
- Yazım hatası nedeniyle yanlış belirti uyduruldu mu?
- Kullanıcının söylemediği ayrıntılar eklendi mi?
- Risk değerlendirmesi gerçek kullanıcı bilgileriyle uyumlu mu?
- Gereksiz tanı veya hastalık listesi oluşturuldu mu?
- Meta talimatlar kullanıcıya gösteriliyor mu?

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
    // ÇIKTI TEMİZLEME
    // ===================================================

    const cleanedOutput = output
      // Markdown başlıklarını temizle
      .replace(/^#{1,6}\s*/gm, '')

      // Bold / italic işaretlerini temizle
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')

      // Markdown yatay çizgilerini temizle
      .replace(/^[-*_]{3,}$/gm, '')

      // Başlıkların başındaki numaraları temizle
      .replace(
        /^(?:\d+\.)\s+(DİKKAT EDİLMESİ GEREKENLER|OLASI NEDENLER|SONRAKİ ADIMLAR)\s*$/gim,
        '$1',
      )

      // Fazla boş satırları azalt
      .replace(/\n{3,}/g, '\n\n')

      .trim();

    return {
      success: true,
      evaluated: true,
      message: cleanedOutput,
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