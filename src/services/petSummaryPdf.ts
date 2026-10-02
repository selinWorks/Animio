import {NativeModules} from 'react-native';
import Share from 'react-native-share';
import {generatePDF} from 'react-native-html-to-pdf';

const RNHTMLtoPDF =
  NativeModules.RNHTMLtoPDF;

type PdfWeightRecord = {
  id?: string;
  date?: string;
  weight?: string | number;
};

type PdfHealthRecord = {
  id?: string;
  title?: string;
  name?: string;
  type?: string;
  date?: string;
  clinic?: string;
  doctor?: string;
  description?: string;
  notes?: string;
};

type PetSummaryPdfData = {
  name: string;
  type?: string;
  gender?: string;
  birthYear?: string | number;
  age?: string | number;
  weight?: string | number;
  notes?: string;
  weightHistory?: PdfWeightRecord[];
  healthRecords?: PdfHealthRecord[];
};

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const displayValue = (value: unknown): string => {
  const text = String(value ?? '').trim();
  return text || 'Belirtilmemiş';
};

const formatDate = (value?: string): string => {
  if (!value) {
    return 'Tarih belirtilmemiş';
  }

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (iso) {
    const day = iso[3];
    const month = iso[2];
    const year = iso[1];

    return `${day}.${month}.${year}`;
  }


  return value;
};

const formatWeight = (value?: string | number): string => {
  if (value === undefined || value === null || value === '') {
    return 'Belirtilmemiş';
  }

  return `${value} kg`;
};

const createRows = (
  records: PdfHealthRecord[],
): string => {
  if (records.length === 0) {
    return '<tr><td colspan="3">Henüz kayıt bulunmuyor.</td></tr>';
  }

  return records
    .map(
      record => `
        <tr>
          <td>${escapeHtml(formatDate(record.date))}</td>
          <td>${escapeHtml(
            displayValue(record.title || record.name),
          )}</td>
          <td>${escapeHtml(
            displayValue(
              record.description || record.notes,
            ),
          )}</td>
        </tr>
      `,
    )
    .join('');
};

const createWeightRows = (
  records: PdfWeightRecord[],
): string => {
  if (records.length === 0) {
    return '<tr><td colspan="2">Henüz kilo kaydı bulunmuyor.</td></tr>';
  }

  return records
    .map(
      record => `
        <tr>
          <td>${escapeHtml(formatDate(record.date))}</td>
          <td>${escapeHtml(formatWeight(record.weight))}</td>
        </tr>
      `,
    )
    .join('');
};

export const createPetSummaryPdf = async (
  pet: PetSummaryPdfData,
): Promise<string> => {
  const allHealthRecords = pet.healthRecords ?? [];

  const vaccines = allHealthRecords.filter(record => {
    const type = String(record.type ?? '').toLocaleLowerCase('tr-TR');

    return (
      type.includes('aşı') ||
      type.includes('asi') ||
      type.includes('vaccine') ||
      type.includes('vaccination')
    );
  });

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #302B45;
            padding: 24px;
            font-size: 12px;
          }

          h1 {
            color: #6549D8;
            font-size: 25px;
            margin-bottom: 4px;
          }

          h2 {
            color: #6549D8;
            font-size: 16px;
            margin-top: 28px;
            border-bottom: 1px solid #E5DFFD;
            padding-bottom: 7px;
          }

          .subtitle {
            color: #858197;
            margin-bottom: 24px;
          }

          .profile {
            background: #F5F2FF;
            border-radius: 12px;
            padding: 16px;
            line-height: 1.8;
          }

          .notes {
            background: #FAF8FF;
            padding: 12px;
            border-radius: 8px;
            line-height: 1.7;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          th {
            background: #F0ECFF;
            color: #5540B3;
            text-align: left;
          }

          th, td {
            padding: 9px 7px;
            border: 1px solid #E9E5F2;
            vertical-align: top;
          }

          .footer {
            margin-top: 32px;
            color: #9691A7;
            font-size: 10px;
          }
        </style>
      </head>

      <body>
        <h1>${escapeHtml(pet.name)} — Pet Özeti</h1>
        <p class="subtitle">
          Oluşturulma tarihi: ${escapeHtml(
            new Date().toLocaleDateString('tr-TR'),
          )}
        </p>

        <h2>Profil Bilgileri</h2>
        <div class="profile">
          <strong>Ad:</strong> ${escapeHtml(pet.name)}<br />
          <strong>Tür:</strong> ${escapeHtml(displayValue(pet.type))}<br />
          <strong>Cinsiyet:</strong> ${escapeHtml(displayValue(pet.gender))}<br />
          <strong>Doğum yılı:</strong> ${escapeHtml(displayValue(pet.birthYear))}<br />
          <strong>Yaş:</strong> ${escapeHtml(displayValue(pet.age))}<br />
          <strong>Güncel kilo:</strong> ${escapeHtml(formatWeight(pet.weight))}
        </div>

        <h2>Kilo Geçmişi</h2>
        <table>
          <thead>
            <tr><th>Tarih</th><th>Kilo</th></tr>
          </thead>
          <tbody>
            ${createWeightRows(pet.weightHistory ?? [])}
          </tbody>
        </table>

        <h2>Sağlık Kayıtları</h2>
        <table>
          <thead>
            <tr><th>Tarih</th><th>Kayıt</th><th>Açıklama</th></tr>
          </thead>
          <tbody>
            ${createRows(allHealthRecords)}
          </tbody>
        </table>

        <h2>Aşı Kayıtları</h2>
        <table>
          <thead>
            <tr><th>Tarih</th><th>Aşı</th><th>Açıklama</th></tr>
          </thead>
          <tbody>
            ${createRows(vaccines)}
          </tbody>
        </table>

        <h2>Notlar</h2>
        <div class="notes">
          ${escapeHtml(displayValue(pet.notes)).replace(/\n/g, '<br />')}
        </div>

        <p class="footer">
          Bu belge PetCare uygulamasında kayıtlı bilgilerden oluşturulmuştur.
        </p>
      </body>
    </html>
  `;

  const result = await generatePDF({
    html,
    fileName: `PetOzeti_${Date.now()}`,
  });

  if (!result.filePath) {
    throw new Error('PDF dosyası oluşturulamadı: dosya yolu alınamadı.');
  }

  return result.filePath;
};

export const sharePetSummaryPdf = async (
  filePath: string,
): Promise<void> => {
  await Share.open({
    url: filePath.startsWith('file://')
      ? filePath
      : `file://${filePath}`,
    type: 'application/pdf',
    title: 'Pet Özeti PDF',
    subject: 'PetCare — Pet Özeti',
    failOnCancel: false,
  });
};


const {PdfSaveModule} = NativeModules;

export const savePetSummaryPdf = async (
  filePath: string,
  petName: string,
): Promise<boolean> => {
  if (!PdfSaveModule?.savePdf) {
    throw new Error('PDF kaydetme modülü yüklenemedi.');
  }

  const safeName = petName.replace(/[\\/:*?"<>|]/g, '_');

  return PdfSaveModule.savePdf(
    filePath,
    `PetOzeti_${safeName}.pdf`,
  );
};
