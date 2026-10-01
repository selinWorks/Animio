import React, {useCallback, useState} from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Calendar as RNCalendar} from 'react-native-calendars';
import auth from '@react-native-firebase/auth';
import {launchImageLibrary} from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';

import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  PawPrint,
  Cake,
  Scale,
  Syringe,
  Calendar,
  FileText,
  Sparkles,
  CircleAlert,
  UserRound,
  Plus,
  ChevronRight,
  ChevronLeft,
  ArrowLeft as TypeArrowLeft,
  X,
} from 'lucide-react-native';

import {usePets} from '../data/PetContext';
import {addPetToFirestore} from '../services/firestore';

const PET_TYPES = [
  {
    name: 'Kedi',
    image: require('../assets/images/pets/cat-side-pose.png'),
    bgGradient: ['#E6E0FF', '#D6CBFF'],
    badgeColor: '#7C3AED',
  },
  {
    name: 'Köpek',
    image: require('../assets/images/pets/dog-open-eyes.png'),
    bgGradient: ['#FFE4E6', '#FECDD3'],
    badgeColor: '#FF7675',
  },
  {
    name: 'Kuş',
    image: require('../assets/images/pets/bird-soft.png'),
    bgGradient: ['#FEF3C7', '#FDE68A'],
    badgeColor: '#FDCB6E',
  },
  {
    name: 'Diğer',
    image: null,
    bgGradient: ['#D1FAE5', '#A7F3D0'],
    badgeColor: '#00B894',
  },
];

const ANIMAL_SUBTYPES: Record<string, string[]> = {
  Kedi: [
    'British Shorthair',
    'Scottish Fold',
    'Siyam',
    'İran Kedisi',
    'Maine Coon',
    'Ragdoll',
    'Van Kedisi',
    'Tekir',
    'Sfenks',
    'Bengal',
    'Birman',
    'Abyssinian',
    'Diğer',
  ],
  Köpek: [
    'Golden Retriever',
    'Labrador Retriever',
    'Alman Kurdu',
    'French Bulldog',
    'Poodle',
    'Chihuahua',
    'Beagle',
    'Husky',
    'Pomeranian',
    'Rottweiler',
    'Cocker Spaniel',
    'Dachshund',
    'Maltese',
    'Shih Tzu',
    'Border Collie',
    'Diğer',
  ],
  Kuş: [
    'Muhabbet Kuşu',
    'Papağan',
    'Kanarya',
    'Sultan Papağanı',
    'Sevda Papağanı',
    'İspinoz',
    'Güvercin',
    'Serçe',
    'Bülbül',
    'Hint Bülbülü',
    'Diğer',
  ],
  Balık: [
    'Japon Balığı',
    'Beta',
    'Lepistes',
    'Melek Balığı',
    'Koi',
    'Çöpçü Balığı',
    'Neon Tetra',
    'Moli',
    'Plati',
  ],
  Kemirgen: [
    'Hamster',
    'Kobay',
    'Çinçilla',
    'Fare',
    'Sıçan',
    'Gerbil',
    'Sincap',
  ],
  Sürüngen: [
    'Kaplumbağa',
    'Yılan',
    'Kertenkele',
    'İguana',
    'Geko',
    'Sakallı Ejder',
    'Bukalemun',
  ],
  'Çiftlik Hayvanı': [
    'At',
    'İnek',
    'Koyun',
    'Keçi',
    'Ördek',
    'Tavuk',
    'Kaz',
    'Manda',
    'Eşek',
    'Deve',
  ],
  Amfibi: [
    'Kurbağa',
    'Semender',
    'Aksolotl',
  ],
  Omurgasız: [
    'Örümcek',
    'Akrep',
    'Salyangoz',
    'Yengeç',
  ],
  'Diğer Memeliler': [
    'Tavşan',
    'Kirpi',
    'Gelincik',
  ],
};

const GENERAL_ANIMAL_TYPES = Object.keys(ANIMAL_SUBTYPES).filter(
  item => !['Kedi', 'Köpek', 'Kuş'].includes(item),
);

const GENDERS = [
  {label: 'Dişi'},
  {label: 'Erkek'},
];


const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const WHEEL_ITEM_HEIGHT = 48;

type WheelPickerColumnProps = {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  label: string;
};

function WheelPickerColumn({
  items,
  selectedIndex,
  onSelect,
  label,
}: WheelPickerColumnProps) {
  const safeIndex = Math.max(0, Math.min(selectedIndex, items.length - 1));

  return (
    <View style={styles.wheelColumn}>
      <Text style={styles.wheelLabel}>{label}</Text>

      <View style={styles.wheelViewport}>
        <View pointerEvents="none" style={styles.wheelSelection} />

        <ScrollView
          key={`${label}-${safeIndex}-${items.length}`}
          showsVerticalScrollIndicator={false}
          snapToInterval={WHEEL_ITEM_HEIGHT}
          decelerationRate="fast"
          nestedScrollEnabled
          contentOffset={{x: 0, y: safeIndex * WHEEL_ITEM_HEIGHT}}
          contentContainerStyle={styles.wheelContent}
          onMomentumScrollEnd={event => {
            const rawIndex = Math.round(
              event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT,
            );
            onSelect(Math.max(0, Math.min(rawIndex, items.length - 1)));
          }}>
          {items.map((item, index) => {
            const selected = index === safeIndex;

            return (
              <View key={`${label}-${item}-${index}`} style={styles.wheelItem}>
                <Text
                  style={[
                    styles.wheelItemText,
                    selected && styles.wheelItemTextSelected,
                  ]}>
                  {item}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export default function AddPetScreen({navigation}: any) {
  const {addPet} = usePets();

  const [step, setStep] = useState(1);
  const [photoUrl, setPhotoUrl] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [customType, setCustomType] = useState('');
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [typePickerCategory, setTypePickerCategory] = useState<string | null>(null);
  const [selectedOtherCategory, setSelectedOtherCategory] = useState<string | null>(null);

  // Doğum tarihi bilgisi ne kadar biliniyor?
  // day   = tam tarih (GG.AA.YYYY)
  // month = ay/yıl (AA.YYYY)
  // year  = yalnızca yıl (YYYY)
  const [birthDatePrecision, setBirthDatePrecision] =
    useState<'day' | 'month' | 'year'>('year');
  const [birthDate, setBirthDate] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const currentYear = new Date().getFullYear();
  const [birthPickerDate, setBirthPickerDate] =
    useState(new Date());
  const [showBirthDatePicker, setShowBirthDatePicker] =
    useState(false);
  const [birthPickerPrecision, setBirthPickerPrecision] =
    useState<'day' | 'month' | 'year'>('day');

  const [gender, setGender] = useState('');

  const [weight, setWeight] = useState('');
  const [weightGrams, setWeightGrams] = useState('');

  const [vaccines, setVaccines] = useState('');

  const [lastVetVisit, setLastVetVisit] = useState('');
  const [vetDate, setVetDate] = useState(new Date());
  const [showVetDatePicker, setShowVetDatePicker] =
    useState(false);

  const [notes, setNotes] = useState('');

  const [nameErrorVisible, setNameErrorVisible] =
    useState(false);

  const [typeErrorVisible, setTypeErrorVisible] =
    useState(false);

  /* TÜR SEÇİLMEDİ POPUP STATE */
  const [missingTypeVisible, setMissingTypeVisible] =
    useState(false);

  /* CİNSİYET SEÇİLMEDİ POPUP STATE */
  const [genderErrorVisible, setGenderErrorVisible] =
    useState(false);

  /* GEÇERSİZ TÜR POPUP STATE */
  const [invalidTypeVisible, setInvalidTypeVisible] =
    useState(false);

  const [birthDateErrorVisible, setBirthDateErrorVisible] =
    useState(false);

  const [birthDateErrorMessage, setBirthDateErrorMessage] =
    useState('');

  const [successVisible, setSuccessVisible] =
    useState(false);

  const [saveErrorVisible, setSaveErrorVisible] =
    useState(false);

  const [vetDateErrorVisible, setVetDateErrorVisible] =
    useState(false);

  const [vetDateErrorMessage, setVetDateErrorMessage] =
    useState('');

  /* =====================================================
     FORM RESET
  ===================================================== */

  const resetForm = useCallback(() => {
    setStep(1);
    setPhotoUrl('');
    setName('');
    setType('');
    setCustomType('');
    setTypePickerVisible(false);
    setTypePickerCategory(null);
    setSelectedOtherCategory(null);
    setBirthDatePrecision('year');
    setBirthDate('');
    setBirthYear('');
    setBirthPickerDate(new Date());
    setShowBirthDatePicker(false);
    setBirthPickerPrecision('day');
    setGender('');

    setWeight('');
    setWeightGrams('');

    setVaccines('');

    setLastVetVisit('');
    setVetDate(new Date());
    setShowVetDatePicker(false);

    setNotes('');

    setNameErrorVisible(false);
    setTypeErrorVisible(false);
    setMissingTypeVisible(false);
    setGenderErrorVisible(false);
    setInvalidTypeVisible(false);
    setBirthDateErrorVisible(false);
    setBirthDateErrorMessage('');
    setSuccessVisible(false);
    setSaveErrorVisible(false);

    setVetDateErrorVisible(false);
    setVetDateErrorMessage('');
  }, []);

  // AddPet ekranına her yeniden gelindiğinde form temiz başlar.
  // Böylece önceki hayvanın bilgileri yeni hayvana taşınmaz.
  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, [resetForm]),
  );

  /* =====================================================
     PHOTO
  ===================================================== */

  const choosePhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });

    if (result.didCancel || result.errorCode) {
      return;
    }

    const uri = result.assets?.[0]?.uri;

    if (uri) {
      setPhotoUrl(uri);
    }
  };

  /* =====================================================
     STEP 1
  ===================================================== */

  const goNextFromStepOne = () => {
    if (!name.trim()) {
      setNameErrorVisible(true);
      return;
    }

    if (!type) {
      setMissingTypeVisible(true);
      return;
    }

    if (!customType.trim()) {
      setTypeErrorVisible(true);
      return;
    }

    setStep(2);
  };

  /* =====================================================
     STEP 2
  ===================================================== */

  const formatFullDate = (date: Date) => {
    return [
      String(date.getDate()).padStart(2, '0'),
      String(date.getMonth() + 1).padStart(2, '0'),
      date.getFullYear(),
    ].join('.');
  };

  const formatMonthYear = (date: Date) => {
    return [
      String(date.getMonth() + 1).padStart(2, '0'),
      date.getFullYear(),
    ].join('.');
  };

  const normalizeDate = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const getToday = () =>
    normalizeDate(new Date());

  const getDateKey = (date: Date) =>
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');

  const isValidFullDate = (value: string) => {
    const match =
      value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

    if (!match) {
      return false;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const parseFullDate = (value: string) => {
    if (!isValidFullDate(value)) {
      return null;
    }

    const [day, month, year] = value
      .split('.')
      .map(Number);

    return new Date(year, month - 1, day);
  };

  const getBirthDateErrorMessage = () => {
    if (!birthDate.trim()) {
      return 'Doğum tarihi bilgisini girmen gerekiyor.';
    }

    if (birthDatePrecision === 'year') {
      const year = Number(birthDate);

      if (!/^\d{4}$/.test(birthDate)) {
        return 'Geçerli bir doğum yılı gir.\nÖrn. 2026';
      }

      if (year < 1900) {
        return 'Doğum yılı 1900 yılından önce olamaz.';
      }

      if (year > currentYear) {
        return 'Doğum yılı gelecek bir yıl olamaz.';
      }

      return null;
    }

    if (birthDatePrecision === 'month') {
      const match =
        birthDate.match(/^(\d{2})\.(\d{4})$/);

      if (!match) {
        return 'Geçerli bir ay ve yıl gir.\nÖrn. 05.2026';
      }

      const month = Number(match[1]);
      const year = Number(match[2]);

      if (month < 1 || month > 12) {
        return 'Ay 01 ile 12 arasında olmalı.';
      }

      if (year < 1900) {
        return 'Doğum yılı 1900 yılından önce olamaz.';
      }

      if (year > currentYear) {
        return 'Doğum tarihi gelecek bir tarih olamaz.';
      }

      const today = getToday();

      if (
        year === today.getFullYear() &&
        month > today.getMonth() + 1
      ) {
        return 'Doğum ayı gelecek bir ay olamaz.';
      }

      return null;
    }

    if (!isValidFullDate(birthDate)) {
      return 'Geçerli bir doğum tarihi gir.\nÖrn. 18.05.2026';
    }

    const selectedDate = normalizeDate(
      parseFullDate(birthDate) as Date,
    );

    const today = getToday();

    if (selectedDate.getFullYear() < 1900) {
      return 'Doğum yılı 1900 yılından önce olamaz.';
    }

    if (selectedDate > today) {
      return 'Doğum tarihi gelecek bir tarih olamaz.';
    }

    return null;
  };

  const getBirthDateLowerBoundForVet = () => {
    if (birthDatePrecision === 'day') {
      const exactDate = parseFullDate(birthDate);

      if (exactDate) {
        return normalizeDate(exactDate);
      }
    }

    if (birthDatePrecision === 'month') {
      const match =
        birthDate.match(/^(\d{2})\.(\d{4})$/);

      if (match) {
        const month = Number(match[1]);
        const year = Number(match[2]);

        return normalizeDate(
          new Date(year, month - 1, 1),
        );
      }
    }

    const year = Number(birthYear);

    return normalizeDate(
      new Date(year, 0, 1),
    );
  };

  const goNextFromStepTwo = () => {
    const birthDateError =
      getBirthDateErrorMessage();

    if (birthDateError) {
      setBirthDateErrorMessage(birthDateError);
      setBirthDateErrorVisible(true);
      return;
    }

    if (!gender) {
      setGenderErrorVisible(true);
      return;
    }

    setStep(3);
  };

  const changeBirthDatePrecision = (
    precision: 'day' | 'month' | 'year',
  ) => {
    setBirthDatePrecision(precision);

    // Mevcut bilinen yılı koruyalım. Kullanıcı sadece
    // hassasiyetini değiştirsin; tarih yeniden girilebilir.
    if (precision === 'year') {
      if (birthYear) {
        setBirthDate(birthYear);
      } else {
        setBirthDate('');
      }
      return;
    }

    setBirthDate('');
  };

  const handleBirthDateTextChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');

    if (birthDatePrecision === 'day') {
      if (numbers.length > 8) {
        return;
      }

      let formatted = numbers;

      if (numbers.length > 2) {
        formatted =
          numbers.slice(0, 2) +
          '.' +
          numbers.slice(2);
      }

      if (numbers.length > 4) {
        formatted =
          numbers.slice(0, 2) +
          '.' +
          numbers.slice(2, 4) +
          '.' +
          numbers.slice(4);
      }

      setBirthDate(formatted);

      if (numbers.length >= 8) {
        setBirthYear(numbers.slice(4, 8));
      } else if (!numbers) {
        setBirthYear('');
      }

      return;
    }

    if (birthDatePrecision === 'month') {
      if (numbers.length > 6) {
        return;
      }

      let formatted = numbers;

      if (numbers.length > 2) {
        formatted =
          numbers.slice(0, 2) +
          '.' +
          numbers.slice(2);
      }

      setBirthDate(formatted);

      if (numbers.length >= 6) {
        setBirthYear(numbers.slice(2, 6));
      } else if (!numbers) {
        setBirthYear('');
      }

      return;
    }

    if (numbers.length > 4) {
      return;
    }

    setBirthDate(numbers);
    setBirthYear(numbers);
  };

  const openBirthDatePicker = () => {
    let initialDate = getToday();

    if (birthDatePrecision === 'day') {
      const existingDate = parseFullDate(birthDate);
      if (existingDate) {
        initialDate = existingDate;
      }
    } else if (birthDatePrecision === 'month') {
      const match = birthDate.match(/^(\\d{2})\\.(\\d{4})$/);
      if (match) {
        initialDate = new Date(Number(match[2]), Number(match[1]) - 1, 1);
      }
    } else if (/^\\d{4}$/.test(birthDate)) {
      initialDate = new Date(Number(birthDate), 0, 1);
    }

    setBirthPickerPrecision(birthDatePrecision);
    setBirthPickerDate(initialDate);
    setShowBirthDatePicker(true);
  };

  const getBirthPickerYears = () =>
    Array.from(
      {length: currentYear - 1900 + 1},
      (_, index) => String(1900 + index),
    );

  const getBirthPickerDays = () => {
    const year = birthPickerDate.getFullYear();
    const month = birthPickerDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = getToday();

    const maxDay =
      year === today.getFullYear() && month === today.getMonth()
        ? today.getDate()
        : daysInMonth;

    return Array.from(
      {length: maxDay},
      (_, index) => String(index + 1).padStart(2, '0'),
    );
  };

  const getBirthPickerMonths = () => {
    const today = getToday();

    if (birthPickerDate.getFullYear() === today.getFullYear()) {
      return MONTH_NAMES.slice(0, today.getMonth() + 1);
    }

    return MONTH_NAMES;
  };

  const updateBirthPickerDate = (
    nextYear: number,
    nextMonth: number,
    nextDay: number,
  ) => {
    const today = getToday();
    const year = Math.max(1900, Math.min(nextYear, today.getFullYear()));

    let month = Math.max(0, Math.min(nextMonth, 11));
    if (year === today.getFullYear() && month > today.getMonth()) {
      month = today.getMonth();
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const maxDay =
      year === today.getFullYear() && month === today.getMonth()
        ? Math.min(daysInMonth, today.getDate())
        : daysInMonth;

    const day = Math.max(1, Math.min(nextDay, maxDay));
    setBirthPickerDate(new Date(year, month, day));
  };

  const confirmBirthPicker = () => {
    const selectedYear = birthPickerDate.getFullYear();

    setBirthDatePrecision(birthPickerPrecision);
    setBirthYear(String(selectedYear));

    if (birthPickerPrecision === 'day') {
      setBirthDate(formatFullDate(birthPickerDate));
    } else if (birthPickerPrecision === 'month') {
      setBirthDate(formatMonthYear(birthPickerDate));
    } else {
      setBirthDate(String(selectedYear));
    }

    setShowBirthDatePicker(false);
  };

  /* =====================================================
     SAVE
  ===================================================== */

  const formatVetDate = (date: Date) => {
    return formatFullDate(date);
  };

  const isValidVetDate = (value: string) => {
    return isValidFullDate(value);
  };

  const getVetDateErrorMessage = (
    value: string,
  ) => {
    if (!isValidVetDate(value)) {
      return 'Lütfen geçerli bir tarih gir.\nÖrn. 18.09.2026';
    }

    const selectedDate = normalizeDate(
      parseFullDate(value) as Date,
    );

    const today = getToday();

    if (selectedDate > today) {
      return 'Veteriner ziyaret tarihi gelecek bir tarih olamaz.';
    }

    const birthDateError =
      getBirthDateErrorMessage();

    if (birthDateError) {
      return 'Önce doğum tarihi bilgisini düzeltmelisin.';
    }

    const petBirthDate =
      getBirthDateLowerBoundForVet();

    if (selectedDate < petBirthDate) {
      if (birthDatePrecision === 'day') {
        return 'Veteriner ziyaret tarihi dostunun doğum tarihinden önce olamaz.';
      }

      if (birthDatePrecision === 'month') {
        return 'Veteriner ziyaret tarihi dostunun bilinen doğum ayından önce olamaz.';
      }

      return 'Veteriner ziyaret tarihi dostunun doğum yılından önce olamaz.';
    }

    return null;
  };

  const handleVetDateTextChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');

    if (numbers.length > 8) {
      return;
    }

    let formatted = numbers;

    if (numbers.length > 2) {
      formatted =
        numbers.slice(0, 2) +
        '.' +
        numbers.slice(2);
    }

    if (numbers.length > 4) {
      formatted =
        numbers.slice(0, 2) +
        '.' +
        numbers.slice(2, 4) +
        '.' +
        numbers.slice(4);
    }

    setLastVetVisit(formatted);
  };

  const openVetDatePicker = () => {
    const existingDate =
      parseFullDate(lastVetVisit);

    if (existingDate) {
      const error =
        getVetDateErrorMessage(lastVetVisit);

      if (!error) {
        setVetDate(existingDate);
      } else {
        setVetDate(getToday());
      }
    } else {
      setVetDate(getToday());
    }

    setShowVetDatePicker(true);
  };

  const handleSave = async () => {
    const currentUser = auth().currentUser;

    if (!currentUser) {
      return Alert.alert(
        'Hata',
        'Kullanıcı oturumu bulunamadı.',
      );
    }

    try {
      const finalType = customType.trim() || type;

      const trimmedWeight = weight.trim();
      const trimmedWeightGrams = weightGrams.trim();

      const numericWeightKg =
        trimmedWeight === ''
          ? 0
          : Number(trimmedWeight);

      const numericWeightGrams =
        trimmedWeightGrams === ''
          ? 0
          : Number(trimmedWeightGrams);

      const hasKg =
        trimmedWeight !== '' &&
        Number.isFinite(numericWeightKg) &&
        numericWeightKg > 0;

      const hasGrams =
        trimmedWeightGrams !== '' &&
        Number.isFinite(numericWeightGrams) &&
        numericWeightGrams > 0 &&
        numericWeightGrams <= 999;

      const hasValidWeight =
        (hasKg || hasGrams) &&
        Number.isFinite(numericWeightKg) &&
        Number.isFinite(numericWeightGrams) &&
        numericWeightKg >= 0 &&
        numericWeightGrams >= 0 &&
        numericWeightGrams <= 999;

      const numericWeight =
        hasValidWeight
          ? numericWeightKg +
            numericWeightGrams / 1000
          : 0;

      const normalizedWeight =
        hasValidWeight
          ? numericWeight
          : 0;

      const today =
        new Date();

      const initialWeightDate = [
        today.getFullYear(),
        String(
          today.getMonth() + 1,
        ).padStart(2, '0'),
        String(
          today.getDate(),
        ).padStart(2, '0'),
      ].join('-');

      const trimmedVetDate =
        lastVetVisit.trim();

      if (trimmedVetDate !== '') {
        const vetDateError =
          getVetDateErrorMessage(trimmedVetDate);

        if (vetDateError) {
          setVetDateErrorMessage(vetDateError);
          setVetDateErrorVisible(true);
          return;
        }
      }

      const initialWeightHistory =
        hasValidWeight
          ? [
              {
                id:
                  'initial-' +
                  Date.now(),

                weight:
                  numericWeight,

                date:
                  initialWeightDate,

                note:
                  'İlk kilo kaydı',
              },
            ]
          : [];

      const petData = {
        name:
          name.trim(),

        type:
          finalType,

        // Eski alanı koruyoruz; mevcut ekranlar/servisler
        // birthYear kullanmaya devam edebilir.
        birthYear:
          Number(birthYear),

        // Yeni doğum tarihi bilgisi:
        // day   -> GG.AA.YYYY
        // month -> AA.YYYY
        // year  -> YYYY
        birthDate:
          birthDate.trim(),

        birthDatePrecision,

        gender,

        weight:
          hasValidWeight
            ? String(normalizedWeight)
            : '',

        weightHistory:
          initialWeightHistory,

        vaccines:
          vaccines.trim(),

        lastVetVisit:
          lastVetVisit.trim(),

        notes:
          notes.trim(),

        photoUrl,
      };

      console.log(
        '🐾 PET KAYDI BAŞLIYOR:',
        petData,
      );

      const id =
        await addPetToFirestore(
          petData,
          currentUser.uid,
        );

      console.log(
        '✅ PET FIRESTORE KAYDEDİLDİ:',
        id,
      );

      addPet({
        id,
        ...petData,
        ownerId:
          currentUser.uid,
        petMembers: [
          currentUser.uid,
        ],
      });

      console.log(
        '✅ PET CONTEXT\'E EKLENDİ',
      );

      setSuccessVisible(true);
    } catch (error) {
      console.log(
        '❌ PET KAYIT HATASI:',
        error,
      );

      console.log(
        '❌ ERROR CODE:',
        (error as any)?.code,
      );

      console.log(
        '❌ ERROR MESSAGE:',
        (error as any)?.message,
      );

      Alert.alert(
        'Kayıt Sırasında Bir Sorun Oluştu',
        'Dostunuzun bilgileri kaydedilirken beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.',
        [
          {
            text: 'Tekrar Dene',
          },
        ],
      );
    }
  };

  return (
    <LinearGradient
      colors={[
        '#FAF9FF',
        '#FAF9FF',
        '#FAF9FF',
      ]}
      style={styles.screen}>

      {/* ================================================= */}
      {/* HEADER                                            */}
      {/* ================================================= */}

      <View style={styles.header}>

        <Pressable
          style={styles.backButton}
          onPress={() =>
            step > 1
              ? setStep(step - 1)
              : navigation?.goBack?.()
          }>

          <ArrowLeft
            size={22}
            color="#1E2022"
          />

        </Pressable>

        <Text style={styles.headerTitle}>
          Dost Ekle
        </Text>

        <Text style={styles.stepText}>
          {step} / 3
        </Text>

      </View>

      {/* ================================================= */}
      {/* TIMELINE                                          */}
      {/* ================================================= */}

      <View style={styles.timelineTrack}>

        <View style={styles.timelineBaseLine} />

        <View
          style={[
            styles.timelineActiveLine,
            {
              width: `${((step - 1) / 2) * 100}%`,
            },
          ]}
        />

        <View
          style={[
            styles.timelineDot,
            step >= 1 &&
              styles.timelineDotActive,
          ]}>

          <View
            style={[
              styles.timelineDotInner,
              step >= 1 &&
                styles.timelineDotInnerActive,
            ]}
          />

        </View>

        <View
          style={[
            styles.timelineDot,
            step >= 2 &&
              styles.timelineDotActive,
          ]}>

          <View
            style={[
              styles.timelineDotInner,
              step >= 2 &&
                styles.timelineDotInnerActive,
            ]}
          />

        </View>

        <View
          style={[
            styles.timelineDot,
            step >= 3 &&
              styles.timelineDotActive,
          ]}>

          <View
            style={[
              styles.timelineDotInner,
              step >= 3 &&
                styles.timelineDotInnerActive,
            ]}
          />

        </View>

      </View>

      {/* ================================================= */}
      {/* FORM                                              */}
      {/* ================================================= */}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}>

        {/* DECORATION */}

        <View
          pointerEvents="none"
          style={[
            styles.scrollDecoration,
            {
              top: 0,
              left: 20,
            },
          ]}>

        </View>

        <View
          pointerEvents="none"
          style={[
            styles.scrollDecoration,
            {
              top: 180,
              right: 20,
            },
          ]}>


        </View>

        {/* ================================================= */}
        {/* STEP 1                                           */}
        {/* ================================================= */}

        {step === 1 && (
          <>

            <View style={styles.photoSection}>

              <View style={styles.photoGlowOuter}>

                <Pressable
                  style={styles.dashedCircle}
                  onPress={choosePhoto}>

                  {photoUrl ? (
                    <Image
                      source={{uri: photoUrl}}
                      style={styles.photo}
                    />
                  ) : (
                    <PawPrint
                      size={44}
                      color="#6C5CE7"
                      strokeWidth={1.5}
                    />
                  )}

                  <LinearGradient
                    colors={[
                      '#6C5CE7',
                      '#4F46E5',
                    ]}
                    style={styles.cameraBadge}>

                    <Camera
                      size={14}
                      color="#FFFFFF"
                    />

                  </LinearGradient>

                </Pressable>

              </View>

              <Text style={styles.photoTitle}>
                Fotoğraf ekle
              </Text>

            </View>

            <Text style={styles.label}>
              Dostunun adı
            </Text>

            <View style={styles.inputGlowBox}>

              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Örn. Luna"
                placeholderTextColor="#A0A5B5"
                style={styles.input}
              />

            </View>

            <Text style={styles.label}>
              Türünü seç
            </Text>

            <View style={styles.typeGrid}>
              {PET_TYPES.map(item => {
                const selected = type === item.name;

                return (
                  <Pressable
                    key={item.name}
                    onPress={() => {
                      setType(item.name);
                      setCustomType('');
                      setTypePickerCategory(
                        item.name === 'Diğer'
                          ? null
                          : item.name,
                      );
                      if (item.name === 'Diğer') {
                        setSelectedOtherCategory(null);
                      }
                      setTypePickerVisible(true);
                    }}
                    style={styles.typeCardWrapper}>
                    <LinearGradient
                      colors={item.bgGradient}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={[
                        styles.typeCard,
                        selected && styles.typeCardSelected,
                      ]}>
                      {item.image ? (
                        <Image
                          source={item.image}
                          style={styles.petCharacter}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.otherTypePlusCircle}>
                          <Plus
                            size={27}
                            color="#00A884"
                            strokeWidth={2.5}
                          />
                        </View>
                      )}

                      <Text style={styles.typeText}>
                        {item.name}
                      </Text>

                      {selected ? (
                        <LinearGradient
                          colors={['#6C5CE7', '#4F46E5']}
                          style={styles.checkBadgeSelected}>
                          <Check
                            size={11}
                            color="#FFFFFF"
                            strokeWidth={3}
                          />
                        </LinearGradient>
                      ) : (
                        <View style={styles.checkBadgeUnselected} />
                      )}
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>

            {type && customType ? (
              <Pressable
                onPress={() => {
                  setTypePickerCategory(
                    type === 'Diğer'
                      ? selectedOtherCategory
                      : type,
                  );
                  setTypePickerVisible(true);
                }}
                style={styles.selectedSubtypeCard}>
                <View style={styles.selectedSubtypeIcon}>
                  <Check
                    size={18}
                    color="#6C5CE7"
                    strokeWidth={2.5}
                  />
                </View>

                <View style={styles.selectedSubtypeContent}>
                  <Text style={styles.selectedSubtypeLabel}>
                    Seçilen tür
                  </Text>
                  <Text style={styles.selectedSubtypeValue}>
                    {customType}
                  </Text>
                </View>

                <ChevronRight
                  size={21}
                  color="#8B7BC7"
                />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  if (type) {
                    setTypePickerCategory(
                      type === 'Diğer'
                        ? selectedOtherCategory
                        : type,
                    );
                    setTypePickerVisible(true);
                  }
                }}
                disabled={!type}
                style={[
                  styles.chooseSubtypeCard,
                  !type && styles.chooseSubtypeCardDisabled,
                ]}>
                <View style={styles.chooseSubtypeIcon}>
                  <Plus
                    size={20}
                    color={type ? '#6C5CE7' : '#B9B3CC'}
                    strokeWidth={2.4}
                  />
                </View>

                <View style={styles.chooseSubtypeContent}>
                  <Text
                    style={[
                      styles.chooseSubtypeTitle,
                      !type && styles.chooseSubtypeTitleDisabled,
                    ]}>
                    {type
                      ? `${type} türünü seç`
                      : 'Önce genel türünü seç'}
                  </Text>
                  <Text style={styles.chooseSubtypeDescription}>
                    {type
                      ? 'Listeden sana uygun türü seçmek için dokun'
                      : 'Kedi, köpek, kuş veya diğer seçimini yap'}
                  </Text>
                </View>

                <ChevronRight
                  size={21}
                  color={type ? '#8B7BC7' : '#C8C3D4'}
                />
              </Pressable>
            )}

            <Pressable
              style={styles.mainButtonTouch}
              onPress={goNextFromStepOne}>

              <LinearGradient
                colors={[
                  '#6C5CE7',
                  '#4F46E5',
                ]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.mainButton}>

                <Text style={styles.mainButtonText}>
                  Devam Et
                </Text>

                <ArrowRight
                  size={20}
                  color="#FFFFFF"
                  strokeWidth={2}
                />

              </LinearGradient>

            </Pressable>

          </>
        )}

        {/* ================================================= */}
        {/* STEP 2                                           */}
        {/* ================================================= */}

        {step === 2 && (
          <>

            <Text style={styles.sectionTitle}>
              Dostunun bilgileri
            </Text>

            <Text style={styles.sectionSubtitle}>
              Birkaç temel bilgi daha ekleyelim.
            </Text>

            <View style={styles.previewCard}>

              <View
                style={
                  styles.previewIconCircle
                }>

                <PawPrint
                  size={22}
                  color="#6C5CE7"
                />

              </View>

              <View>

                <Text style={styles.previewName}>
                  {name || 'Luna'}
                </Text>

                <Text style={styles.previewType}>
                  {type === 'Diğer'
                    ? customType || 'Kedi'
                    : type}
                </Text>

              </View>

            </View>

            <Text style={styles.label}>
              Doğum tarihi
            </Text>

            <Text style={styles.birthDateDescription}>
              Ne kadarını bildiğine göre bir seçenek seçebilirsin.
            </Text>

            <View style={styles.birthPrecisionRow}>

              <Pressable
                onPress={() =>
                  changeBirthDatePrecision('day')
                }
                style={[
                  styles.birthPrecisionButton,
                  birthDatePrecision === 'day' &&
                    styles.birthPrecisionButtonSelected,
                ]}>

                <Text
                  style={[
                    styles.birthPrecisionText,
                    birthDatePrecision === 'day' &&
                      styles.birthPrecisionTextSelected,
                  ]}>
                  Tam tarih
                </Text>

              </Pressable>

              <Pressable
                onPress={() =>
                  changeBirthDatePrecision('month')
                }
                style={[
                  styles.birthPrecisionButton,
                  birthDatePrecision === 'month' &&
                    styles.birthPrecisionButtonSelected,
                ]}>

                <Text
                  style={[
                    styles.birthPrecisionText,
                    birthDatePrecision === 'month' &&
                      styles.birthPrecisionTextSelected,
                  ]}>
                  Ay / Yıl
                </Text>

              </Pressable>

              <Pressable
                onPress={() =>
                  changeBirthDatePrecision('year')
                }
                style={[
                  styles.birthPrecisionButton,
                  birthDatePrecision === 'year' &&
                    styles.birthPrecisionButtonSelected,
                ]}>

                <Text
                  style={[
                    styles.birthPrecisionText,
                    birthDatePrecision === 'year' &&
                      styles.birthPrecisionTextSelected,
                  ]}>
                  Yıl
                </Text>

              </Pressable>

            </View>

            <View style={styles.ageInputContainer}>

              <Cake
                size={20}
                color="#B7A6F6"
                style={styles.ageIcon}
              />

              <TextInput
                value={birthDate}
                onChangeText={handleBirthDateTextChange}
                keyboardType="numeric"
                maxLength={
                  birthDatePrecision === 'day'
                    ? 10
                    : birthDatePrecision === 'month'
                    ? 7
                    : 4
                }
                placeholder={
                  birthDatePrecision === 'day'
                    ? 'Örn. 18.05.2026'
                    : birthDatePrecision === 'month'
                    ? 'Örn. 05.2026'
                    : 'Örn. 2026'
                }
                placeholderTextColor="#A0A5B5"
                style={styles.ageInput}
              />

              <Pressable
                onPress={openBirthDatePicker}
                style={styles.birthCalendarButton}>

                <Calendar
                  size={20}
                  color="#6C5CE7"
                />

              </Pressable>

            </View>

            <Text style={styles.birthYearHelper}>
              {birthDatePrecision === 'day'
                ? 'Tam tarihi biliyorsan gün, ay ve yılı girebilirsin.'
                : birthDatePrecision === 'month'
                ? 'Sadece ay ve yılı biliyorsan bu seçeneği kullanabilirsin.'
                : 'Sadece yılı biliyorsan yaklaşık doğum tarihi olarak kaydedilir.'}
            </Text>

            <Text style={styles.label}>
              Cinsiyeti
            </Text>

            <View style={styles.genderRow}>

              {GENDERS.map(item => {

                const selected =
                  gender === item.label;

                return (
                  <Pressable
                    key={item.label}
                    onPress={() =>
                      setGender(item.label)
                    }
                    style={[
                      styles.genderButton,
                      selected &&
                        styles.genderButtonSelected,
                    ]}>

                    <Text
                      style={[
                        styles.genderText,
                        selected &&
                          styles.genderTextSelected,
                      ]}>

                      {item.label}

                    </Text>

                    {selected && (
                      <View
                        style={
                          styles.genderCheckBadge
                        }>

                        <Check
                          size={10}
                          color="#FFFFFF"
                          strokeWidth={3}
                        />

                      </View>
                    )}

                  </Pressable>
                );
              })}

            </View>

            <Pressable
              style={styles.mainButtonTouch}
              onPress={goNextFromStepTwo}>

              <LinearGradient
                colors={[
                  '#6C5CE7',
                  '#4F46E5',
                ]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.mainButton}>

                <Text style={styles.mainButtonText}>
                  Devam Et
                </Text>

                <ArrowRight
                  size={20}
                  color="#FFFFFF"
                  strokeWidth={2}
                />

              </LinearGradient>

            </Pressable>

          </>
        )}

        {/* ================================================= */}
        {/* STEP 3                                           */}
        {/* ================================================= */}

        {step === 3 && (
          <>

            <Text style={styles.sectionTitle}>
              Sağlık bilgileri
            </Text>

            <Text style={styles.sectionSubtitle}>
              Dostunun sağlık bilgilerini kaydet.
            </Text>

            <Text style={styles.label}>
              Kilosu
            </Text>

            <View style={styles.iconInputRow}>

              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor:
                      '#FFE8DB',
                  },
                ]}>

                <Scale
                  size={22}
                  color="#FF7A00"
                />

              </View>

              <View style={styles.weightInputRow}>

                <View style={styles.weightInputBox}>

                  <TextInput
                    value={weight}
                    onChangeText={text =>
                      setWeight(
                        text.replace(/[^0-9]/g, ''),
                      )
                    }
                    placeholder="Örn. 4"
                    placeholderTextColor="#A0A5B5"
                    keyboardType="numeric"
                    style={styles.weightInput}
                    maxLength={3}
                  />

                  <Text style={styles.weightUnitText}>
                    kg
                  </Text>

                </View>

                <Text style={styles.weightSlash}>
                  /
                </Text>

                <View style={styles.weightInputBox}>

                  <TextInput
                    value={weightGrams}
                    onChangeText={text => {
                      const numeric =
                        text.replace(/[^0-9]/g, '');

                      if (
                        numeric === '' ||
                        Number(numeric) <= 999
                      ) {
                        setWeightGrams(numeric);
                      }
                    }}
                    placeholder="Örn. 250"
                    placeholderTextColor="#A0A5B5"
                    keyboardType="numeric"
                    style={styles.weightInput}
                    maxLength={3}
                  />

                  <Text style={styles.weightUnitText}>
                    gr
                  </Text>

                </View>

              </View>

            </View>

            <Text style={styles.label}>
              Aşıları
            </Text>

            <View style={styles.iconInputRow}>

              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: '#FFE2E8',
                  },
                ]}>

                <Syringe
                  size={22}
                  color="#FF527B"
                />

              </View>

              <View style={styles.inputBox}>

                <TextInput
                  value={vaccines}
                  onChangeText={setVaccines}
                  placeholder="Örn. Karma aşı, kuduz aşısı"
                  placeholderTextColor="#A0A5B5"
                  style={styles.innerInput}
                />

              </View>

            </View>

            <Text style={styles.label}>
              Son veteriner ziyareti
            </Text>

            <View style={styles.iconInputRow}>

              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: '#E0F2FE',
                  },
                ]}>

                <Calendar
                  size={22}
                  color="#0EA5E9"
                />

              </View>

              <View style={styles.vetInputBox}>

                <TextInput
                  value={lastVetVisit}
                  onChangeText={handleVetDateTextChange}
                  placeholder="Örn. 18.09.2026"
                  placeholderTextColor="#A0A5B5"
                  keyboardType="number-pad"
                  maxLength={10}
                  style={styles.innerInput}
                />

                <Pressable
                  onPress={openVetDatePicker}
                  style={styles.vetCalendarButton}>

                  <Calendar
                    size={20}
                    color="#0EA5E9"
                  />

                </Pressable>

              </View>

            </View>

            <Text style={styles.label}>
              Notlar
            </Text>

            <View
              style={
                styles.iconInputRowTop
              }>

              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor:
                      '#DCFCE7',
                  },
                ]}>

                <FileText
                  size={22}
                  color="#16A34A"
                />

              </View>

              <View
                style={[
                  styles.inputBox,
                  styles.notesInputBox,
                ]}>

                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Eklemek istediğin notlar..."
                  placeholderTextColor="#A0A5B5"
                  multiline
                  style={
                    styles.notesInnerInput
                  }
                />

              </View>

            </View>

            <Pressable
              style={styles.mainButtonTouch}
              onPress={handleSave}>

              <LinearGradient
                colors={[
                  '#6C5CE7',
                  '#4F46E5',
                ]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.saveButton}>

                <Text style={styles.saveButtonText}>
                  Dostu Kaydet
                </Text>

                <PawPrint
                  size={20}
                  color="#FFFFFF"
                  strokeWidth={2.2}
                />

              </LinearGradient>

            </Pressable>

          </>
        )}

      </ScrollView>

      {/* ================================================= */}
      {/* İSİM EKSİK POPUP                                 */}
      {/* ================================================= */}

      <Modal
        visible={nameErrorVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setNameErrorVisible(false)
        }>

        <View style={styles.nameErrorOverlay}>

          <View style={styles.nameErrorCard}>

            <View
              style={
                styles.nameErrorIconWrapper
              }>

              <View
                style={
                  styles.nameErrorIconCircle
                }>

                <Image
                  source={require('../assets/popup-icons/pet-name-warning.png')}
                  style={
                    styles.nameErrorIcon
                  }
                  resizeMode="contain"
                />

              </View>

            </View>

            <Text
              style={styles.nameErrorTitle}>

              Bir isim giriniz!

            </Text>

            <Text
              style={
                styles.nameErrorMessage
              }>

              Dostunun adını henüz girmedin.
              {'\n'}
              Onu tanıyabilmemiz için önce
              bir isim yazmalısın.

            </Text>

            <Pressable
              style={
                styles.nameErrorButton
              }
              onPress={() =>
                setNameErrorVisible(false)
              }>

              <View
                style={
                  styles.nameErrorButtonGradient
                }>

                <Text
                  style={
                    styles.nameErrorButtonText
                  }>

                  Tamam, isim ekleyeyim

                </Text>

              </View>

            </Pressable>

          </View>

        </View>

      </Modal>

      {/* ================================================= */}
      {/* DOĞUM YILI EKSİK POPUP                           */}
      {/* ================================================= */}

      <Modal
        visible={birthDateErrorVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setBirthDateErrorVisible(false)
        }>

        <View style={styles.popupOverlay}>

          <View style={styles.popupCard}>

            <View
              style={[
                styles.popupIconCircle,
                styles.birthYearIconCircle,
              ]}>

              <Cake
                size={42}
                color="#B8A9E8"
                strokeWidth={1.5}
              />

            </View>

            <Text style={styles.popupTitle}>
              Geçersiz doğum tarihi
            </Text>

            <Text style={styles.popupMessage}>
              {birthDateErrorMessage}
            </Text>

            <Pressable
              style={styles.popupButton}
              onPress={() =>
                setBirthDateErrorVisible(false)
              }>

              <View
                style={
                  styles.popupButtonGradient
                }>

                <Text
                  style={
                    styles.popupButtonText
                  }>

                  Tamam

                </Text>

              </View>

            </Pressable>

          </View>

        </View>

      </Modal>

      {/* ================================================= */}
      {/* TÜR SEÇİLMEDİ - EKSİK BİLGİ POPUP                */}
      {/* ================================================= */}

      <Modal
        visible={missingTypeVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setMissingTypeVisible(false)
        }>

        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>

            <View
              style={[
                styles.popupIconCircle,
                styles.missingTypeIconCircle,
              ]}>
              <PawPrint
                size={42}
                color="#8068D8"
                strokeWidth={1.8}
              />
            </View>

            <Text style={styles.popupTitle}>
              Eksik bilgi
            </Text>

            <Text style={styles.popupMessage}>
              Hayvan dostunun türünü seçmedin.
              {'\n'}
              Lütfen devam etmeden önce bir tür seç.
            </Text>

            <Pressable
              style={styles.popupButton}
              onPress={() =>
                setMissingTypeVisible(false)
              }>
              <View style={styles.popupButtonGradient}>
                <Text style={styles.popupButtonText}>
                  Tamam, tür seçeyim
                </Text>
              </View>
            </Pressable>

          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* CİNSİYET SEÇİLMEDİ - EKSİK BİLGİ POPUP           */}
      {/* ================================================= */}

      <Modal
        visible={genderErrorVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setGenderErrorVisible(false)
        }>

        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>

            <View
              style={[
                styles.popupIconCircle,
                styles.genderErrorIconCircle,
              ]}>
              <UserRound
                size={42}
                color="#8B6FC7"
                strokeWidth={1.8}
              />
            </View>

            <Text style={styles.popupTitle}>
              Eksik bilgi
            </Text>

            <Text style={styles.popupMessage}>
              Hayvan dostunun cinsiyetini seçmedin.
              {'\n'}
              Lütfen devam etmeden önce bir seçim yap.
            </Text>

            <Pressable
              style={styles.popupButton}
              onPress={() =>
                setGenderErrorVisible(false)
              }>
              <View style={styles.popupButtonGradient}>
                <Text style={styles.popupButtonText}>
                  Tamam, cinsiyet seçeyim
                </Text>
              </View>
            </Pressable>

          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* TÜR EKSİK POPUP                                  */}
      {/* ================================================= */}

      <Modal
        visible={typeErrorVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setTypeErrorVisible(false)
        }>

        <View style={styles.popupOverlay}>

          <View style={styles.popupCard}>

            <View
              style={[
                styles.popupIconCircle,
                styles.typeErrorIconCircle,
              ]}>

              <CircleAlert
                size={42}
                color="#9B87F5"
                strokeWidth={1.8}
              />

            </View>

            <Text style={styles.popupTitle}>
              Eksik bilgi
            </Text>

            <Text style={styles.popupMessage}>
              Dostunun türünü henüz seçmedin.
              {'\n'}
              Lütfen önce listeden bir tür seç.
            </Text>

            <Pressable
              style={styles.popupButton}
              onPress={() =>
                setTypeErrorVisible(false)
              }>

              <View
                style={
                  styles.popupButtonGradient
                }>

                <Text
                  style={
                    styles.popupButtonText
                  }>

                  Tamam, tür seçeyim

                </Text>

              </View>

            </Pressable>

          </View>

        </View>

      </Modal>

      {/* ================================================= */}
      {/* GEÇERSİZ TÜR POPUP                               */}
      {/* ================================================= */}

      <Modal
        visible={invalidTypeVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setInvalidTypeVisible(false)
        }>

        <View style={styles.popupOverlay}>

          <View style={styles.popupCard}>

            <View
              style={[
                styles.popupIconCircle,
                styles.invalidTypeIconCircle,
              ]}>

              <CircleAlert
                size={42}
                color="#9B87F5"
                strokeWidth={1.8}
              />

            </View>

            <Text style={styles.popupTitle}>
              Geçersiz tür
            </Text>

            <Text style={styles.popupMessage}>
              Yazdığın türü tanıyamadık.
              {'\n'}
              Lütfen geçerli bir hayvan türü gir.
              {'\n'}
              Örn. Tavşan, Hamster veya Balık.
            </Text>

            <Pressable
              style={styles.popupButton}
              onPress={() =>
                setInvalidTypeVisible(false)
              }>

              <View
                style={
                  styles.popupButtonGradient
                }>

                <Text
                  style={
                    styles.popupButtonText
                  }>

                  Tamam

                </Text>

              </View>

            </Pressable>

          </View>

        </View>

      </Modal>

      {/* ================================================= */}
      {/* KAYDETME HATASI POPUP                            */}
      {/* ================================================= */}

      <Modal
        visible={saveErrorVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setSaveErrorVisible(false)
        }>

        <View style={styles.popupOverlay}>

          <View style={styles.popupCard}>

            <View
              style={[
                styles.popupIconCircle,
                styles.saveErrorIconCircle,
              ]}>

              <CircleAlert
                size={44}
                color="#B86BDE"
                strokeWidth={1.8}
              />

            </View>

            <Text style={styles.popupTitle}>
              Kayıt sırasında bir sorun oluştu
            </Text>

            <Text style={styles.popupMessage}>
              Dostunun bilgilerini kaydederken
              {'\n'}
              beklenmeyen bir sorun oluştu.
              {'\n'}
              Lütfen tekrar dene.
            </Text>

            <Pressable
              style={styles.popupButton}
              onPress={() =>
                setSaveErrorVisible(false)
              }>

              <LinearGradient
                colors={[
                  '#6C5CE7',
                  '#4F46E5',
                ]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.popupButtonGradient}>

                <Text style={styles.popupButtonText}>
                  Tekrar Dene
                </Text>

              </LinearGradient>

            </Pressable>

          </View>

        </View>

      </Modal>

      {/* ================================================= */}
      {/* BAŞARILI POPUP                                   */}
      {/* ================================================= */}

      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setSuccessVisible(false)
        }>

        <View style={styles.popupOverlay}>

          <View style={styles.popupCard}>

            <View
              style={[
                styles.popupIconCircle,
                styles.successIconCircle,
              ]}>

              <Check
                size={42}
                color="#22C55E"
                strokeWidth={2.2}
              />

            </View>

            <Text style={styles.popupTitle}>
              Başarılı
            </Text>

            <Text style={styles.popupMessage}>
              Dostun başarıyla eklendi.
            </Text>

            <Pressable
              style={styles.popupButton}
              onPress={() => {
                setSuccessVisible(false);
                resetForm();
                navigation.goBack();
              }}>

              <LinearGradient
                colors={[
                  '#6C5CE7',
                  '#4F46E5',
                ]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={
                  styles.popupButtonGradient
                }>

                <Text
                  style={
                    styles.popupButtonText
                  }>

                  Tamam

                </Text>

              </LinearGradient>

            </Pressable>

          </View>

        </View>

      </Modal>

      <Modal
        visible={typePickerVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          setTypePickerVisible(false);
          setTypePickerCategory(null);
        }}>
        <Pressable
          style={styles.typePickerOverlay}
          onPress={() => {
            setTypePickerVisible(false);
            setTypePickerCategory(null);
          }}>
          <Pressable
            style={styles.typePickerCard}
            onPress={() => {}}>
            <View style={styles.typePickerHeader}>
              <View style={styles.typePickerHeaderIcon}>
                <PawPrint
                  size={21}
                  color="#6C5CE7"
                  strokeWidth={1.9}
                />
              </View>

              <View style={styles.typePickerHeaderText}>
                <Text style={styles.typePickerTitle}>
                  {typePickerCategory
                    ? `${typePickerCategory} türünü seç`
                    : 'Genel türünü seç'}
                </Text>
                <Text style={styles.typePickerSubtitle}>
                  {typePickerCategory
                    ? 'Sana uygun olan türü listeden seç'
                    : 'Önce hayvanının genel grubunu seç'}
                </Text>
              </View>
            </View>

            <ScrollView
              style={styles.typePickerScroll}
              contentContainerStyle={styles.typePickerList}
              showsVerticalScrollIndicator={false}>
              {(typePickerCategory
                ? ANIMAL_SUBTYPES[typePickerCategory] || []
                : GENERAL_ANIMAL_TYPES
              ).map(item => (
                <Pressable
                  key={item}
                  onPress={() => {
                    if (
                      !typePickerCategory &&
                      GENERAL_ANIMAL_TYPES.includes(item)
                    ) {
                      setType('Diğer');
                      setCustomType('');
                      setSelectedOtherCategory(item);
                      setTypePickerCategory(item);
                      return;
                    }

                    setCustomType(item);
                    setTypePickerVisible(false);
                    setTypePickerCategory(null);
                  }}
                  style={styles.typePickerOption}>
                  <Text style={styles.typePickerOptionText}>
                    {item}
                  </Text>

                  <ChevronRight
                    size={19}
                    color="#B3A8D6"
                  />
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.typePickerBottomRow}>
              {typePickerCategory ? (
                <Pressable
                  onPress={() => {
                    if (
                      ['Kedi', 'Köpek', 'Kuş'].includes(
                        typePickerCategory,
                      )
                    ) {
                      setTypePickerVisible(false);
                      setTypePickerCategory(null);
                      return;
                    }

                    setTypePickerCategory(null);
                  }}
                  style={styles.typePickerBackButton}>
                  <TypeArrowLeft
                    size={18}
                    color="#6C5CE7"
                  />
                  <Text style={styles.typePickerBackText}>
                    {['Kedi', 'Köpek', 'Kuş'].includes(
                      typePickerCategory,
                    )
                      ? 'Kapat'
                      : 'Genel türlere dön'}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    setTypePickerVisible(false);
                    setTypePickerCategory(null);
                  }}
                  style={styles.typePickerCloseButton}>
                  <Text style={styles.typePickerCloseText}>
                    Vazgeç
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showBirthDatePicker}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowBirthDatePicker(false)}>

        <View style={styles.birthPickerOverlay}>
          <Pressable
            style={styles.birthPickerBackdrop}
            onPress={() => setShowBirthDatePicker(false)}
          />

          <View style={styles.birthPickerSheet}>
            <View style={styles.birthPickerHandle} />

            <View style={styles.birthPickerHeader}>
              <View style={styles.birthPickerHeaderIcon}>
                <Calendar size={25} color="#6C5CE7" strokeWidth={2} />
              </View>

              <View style={styles.birthPickerHeaderText}>
                <Text style={styles.birthPickerTitle}>Doğum tarihi</Text>
                <Text style={styles.birthPickerSubtitle}>
                  Minik dostunun doğum tarihini seçebilirsin.
                </Text>
              </View>

              <Pressable
                onPress={() => setShowBirthDatePicker(false)}
                style={styles.birthPickerXButton}>
                <X size={24} color="#686580" strokeWidth={2.2} />
              </Pressable>
            </View>

            <View style={styles.birthPickerTabs}>
              {[
                {key: 'day' as const, label: 'Tam tarih'},
                {key: 'month' as const, label: 'Ay ve yıl'},
                {key: 'year' as const, label: 'Sadece yıl'},
              ].map(item => {
                const selected = birthPickerPrecision === item.key;

                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setBirthPickerPrecision(item.key)}
                    style={[
                      styles.birthPickerTab,
                      selected && styles.birthPickerTabSelected,
                    ]}>
                    <Text
                      style={[
                        styles.birthPickerTabText,
                        selected && styles.birthPickerTabTextSelected,
                      ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.birthWheelRow}>
              {birthPickerPrecision === 'day' && (
                <WheelPickerColumn
                  label="Gün"
                  items={getBirthPickerDays()}
                  selectedIndex={birthPickerDate.getDate() - 1}
                  onSelect={index =>
                    updateBirthPickerDate(
                      birthPickerDate.getFullYear(),
                      birthPickerDate.getMonth(),
                      index + 1,
                    )
                  }
                />
              )}

              {birthPickerPrecision !== 'year' && (
                <WheelPickerColumn
                  label="Ay"
                  items={getBirthPickerMonths()}
                  selectedIndex={birthPickerDate.getMonth()}
                  onSelect={index =>
                    updateBirthPickerDate(
                      birthPickerDate.getFullYear(),
                      index,
                      birthPickerDate.getDate(),
                    )
                  }
                />
              )}

              <WheelPickerColumn
                label="Yıl"
                items={getBirthPickerYears()}
                selectedIndex={birthPickerDate.getFullYear() - 1900}
                onSelect={index =>
                  updateBirthPickerDate(
                    1900 + index,
                    birthPickerDate.getMonth(),
                    birthPickerDate.getDate(),
                  )
                }
              />
            </View>

            <View style={styles.birthPickerActions}>
              <Pressable
                onPress={() => setShowBirthDatePicker(false)}
                style={styles.birthPickerCancelButton}>
                <Text style={styles.birthPickerCancelText}>İptal</Text>
              </Pressable>

              <Pressable
                onPress={confirmBirthPicker}
                style={styles.birthPickerConfirmTouch}>
                <LinearGradient
                  colors={['#7C5CE7', '#6544E5']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.birthPickerConfirmButton}>
                  <Text style={styles.birthPickerConfirmText}>Onayla</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showVetDatePicker}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setShowVetDatePicker(false)
        }>

        <Pressable
          style={styles.datePickerOverlay}
          onPress={() =>
            setShowVetDatePicker(false)
          }>

          <Pressable
            style={styles.datePickerCard}
            onPress={() => {}}>

            {/* HEADER */}

            <View style={styles.datePickerHeader}>

              <View style={styles.datePickerHeaderIcon}>

                <Calendar
                  size={21}
                  color="#6C5CE7"
                  strokeWidth={2}
                />

              </View>

              <View style={styles.datePickerHeaderText}>

                <Text style={styles.datePickerTitle}>
                  Veteriner ziyareti
                </Text>

                <Text style={styles.datePickerSubtitle}>
                  Ziyaret tarihini seç
                </Text>

              </View>

            </View>

            {/* CALENDAR */}

            <RNCalendar
              current={vetDate
                .toISOString()
                .split('T')[0]}

              minDate={getDateKey(
                getBirthDateLowerBoundForVet(),
              )}

              maxDate={new Date()
                .toISOString()
                .split('T')[0]}

              onDayPress={day => {
                const selectedDate =
                  new Date(
                    day.year,
                    day.month - 1,
                    day.day,
                  );

                setVetDate(selectedDate);

                setLastVetVisit(
                  formatVetDate(selectedDate),
                );

                setShowVetDatePicker(false);
              }}

              markedDates={{
                [vetDate
                  .toISOString()
                  .split('T')[0]]: {
                  selected: true,
                  selectedColor: '#6C5CE7',
                  selectedTextColor: '#FFFFFF',
                },
              }}

              theme={{
                backgroundColor: '#FFFFFF',
                calendarBackground: '#FFFFFF',

                textSectionTitleColor: '#858B9B',

                selectedDayBackgroundColor: '#6C5CE7',
                selectedDayTextColor: '#FFFFFF',

                todayTextColor: '#6C5CE7',

                dayTextColor: '#1E2022',

                textDisabledColor: '#D6D3E8',

                monthTextColor: '#1E2022',

                arrowColor: '#6C5CE7',

                textMonthFontFamily:
                  'Quicksand-Bold',

                textDayFontFamily:
                  'Quicksand-Regular',

                textDayHeaderFontFamily:
                  'Quicksand-Bold',

                textMonthFontSize: 17,
                textDayFontSize: 14,
                textDayHeaderFontSize: 12,
              }}

              renderArrow={direction =>
                direction === 'left' ? (
                  <View style={styles.calendarArrowButton}>
                    <ChevronLeft size={20} color="#6C5CE7" strokeWidth={2.2} />
                  </View>
                ) : (
                  <View style={styles.calendarArrowButton}>
                    <ChevronRight size={20} color="#6C5CE7" strokeWidth={2.2} />
                  </View>
                )
              }

              enableSwipeMonths

              firstDay={1}

              hideExtraDays

            />

            {/* KAPAT */}

            <Pressable
              style={styles.datePickerCloseButton}
              onPress={() =>
                setShowVetDatePicker(false)
              }>

              <Text style={styles.datePickerCloseText}>
                Kapat
              </Text>

            </Pressable>

          </Pressable>

        </Pressable>

      </Modal>

      <Modal
        visible={vetDateErrorVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setVetDateErrorVisible(false)
        }>

        <View style={styles.popupOverlay}>

          <View style={styles.popupCard}>

            <View
              style={[
                styles.popupIconCircle,
                styles.vetDateErrorIconCircle,
              ]}>

              <Calendar
                size={42}
                color="#6C5CE7"
                strokeWidth={1.7}
              />

            </View>

            <Text style={styles.popupTitle}>
              Geçersiz tarih
            </Text>

            <Text style={styles.popupMessage}>
              {vetDateErrorMessage}
            </Text>

            <Pressable
              style={styles.popupButton}
              onPress={() =>
                setVetDateErrorVisible(false)
              }>

              <View style={styles.popupButtonGradient}>

                <Text style={styles.popupButtonText}>
                  Tamam
                </Text>

              </View>

            </Pressable>

          </View>

        </View>

      </Modal>

    </LinearGradient>
  );
}

/* ===================================================== */
/* STYLES                                                */
/* ===================================================== */

const styles = StyleSheet.create({

  /* ================================================= */
  /* NAME ERROR                                        */
  /* ================================================= */

  nameErrorOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(24, 20, 45, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  nameErrorCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#1E2022',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },

  nameErrorIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  nameErrorIconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#F0EDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nameErrorIcon: {
    width: 85,
    height: 85,
  },

  nameErrorTitle: {
    color: '#1E2022',
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
    textAlign: 'center',
    marginBottom: 9,
  },

  nameErrorMessage: {
    color: '#858B9B',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Quicksand-Regular',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },

  nameErrorButton: {
    width: '100%',
    borderRadius: 18,
  },

  nameErrorButtonGradient: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#9B87F5',

    shadowColor: '#9B87F5',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  nameErrorButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },

  /* ================================================= */
  /* GENERAL POPUPS                                    */
  /* ================================================= */

  popupOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(24, 20, 45, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  popupCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 24,
    alignItems: 'center',

    shadowColor: '#1E2022',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },

  vetDateErrorIconCircle: {
    backgroundColor: '#F0EDFF',
  },

  /* ================================================= */
  /* POPUP ICONS                                       */
  /* ================================================= */

  popupIconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  /* Doğum yılı popup */
  birthYearIconCircle: {
    backgroundColor: '#F6F2FF',
  },

  /* Tür seçilmedi popup */
  missingTypeIconCircle: {
    backgroundColor: '#F0EBFF',
    borderWidth: 1,
    borderColor: '#DED4FF',
  },

  /* Tür boş popup */
  typeErrorIconCircle: {
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F4DFA5',
  },

  /* Cinsiyet seçilmedi popup */
  genderErrorIconCircle: {
    backgroundColor: '#F1ECFF',
    borderWidth: 1,
    borderColor: '#DDD2FF',
  },

  /* Geçersiz tür popup */
  invalidTypeIconCircle: {
    backgroundColor: '#F7F3FF',
  },

  /* Başarılı popup */
  successIconCircle: {
    backgroundColor: '#E9F9EF',
  },

  saveErrorIconCircle: {
    backgroundColor: '#F8EEFF',
  },

  popupTitle: {
    color: '#1E2022',
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
    textAlign: 'center',
    marginBottom: 9,
  },

  popupMessage: {
    color: '#858B9B',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Quicksand-Regular',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },

  /* ================================================= */
  /* POPUP BUTTON                                      */
  /* ================================================= */

  popupButton: {
    width: '100%',
    borderRadius: 18,
  },

  popupButtonGradient: {
    height: 52,
    width: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,

    backgroundColor: '#8068D8',

    shadowColor: '#8068D8',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  popupButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },

  /* ================================================= */
  /* SCREEN                                             */
  /* ================================================= */

  screen: {
    flex: 1,
    position: 'relative',
  },

  scrollDecoration: {
    position: 'absolute',
    zIndex: 0,
    elevation: 0,
    opacity: 0.8,
  },

  scrollView: {
    flex: 1,
    zIndex: 1,
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
  },

  /* ================================================= */
  /* HEADER                                             */
  /* ================================================= */

  header: {
    height: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },

  headerTitle: {
    color: '#1E2022',
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
  },

  stepText: {
    color: '#6C5CE7',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
  },

  /* ================================================= */
  /* TIMELINE                                           */
  /* ================================================= */

  timelineTrack: {
    height: 24,
    marginHorizontal: 24,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
  },

  timelineBaseLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#E2E5ED',
    borderRadius: 2,
  },

  timelineActiveLine: {
    position: 'absolute',
    left: 0,
    height: 3,
    backgroundColor: '#6C5CE7',
    borderRadius: 2,
  },

  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E5ED',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  timelineDotActive: {
    backgroundColor: '#C4B5FD',
    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  timelineDotInnerActive: {
    backgroundColor: '#6C5CE7',
  },

  /* ================================================= */
  /* PHOTO                                              */
  /* ================================================= */

  photoSection: {
    alignItems: 'center',
    marginVertical: 14,
  },

  photoGlowOuter: {
    padding: 6,
    borderRadius: 65,
    backgroundColor:
      'rgba(255, 255, 255, 0.7)',
  },

  dashedCircle: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
    resizeMode: 'cover',
  },

  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,

    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  photoTitle: {
    color: '#2D3436',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
    marginTop: 10,
  },

  /* ================================================= */
  /* LABELS                                             */
  /* ================================================= */

  label: {
    color: '#1E2022',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
    marginTop: 14,
    marginBottom: 8,
  },

  /* ================================================= */
  /* INPUTS                                             */
  /* ================================================= */

  inputGlowBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8E5FF',

    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  input: {
    height: 52,
    paddingHorizontal: 16,
    color: '#1E2022',
    fontSize: 15,
    fontFamily: 'Quicksand-Regular',
  },

  customTypeMargin: {
    marginTop: 12,
  },

  /* ================================================= */
  /* TYPE CARDS                                         */
  /* ================================================= */

  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  typeCardWrapper: {
    width: '48%',
    borderRadius: 22,
  },

  typeCard: {
    height: 82,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    position: 'relative',
    borderWidth: 1.5,
    borderColor:
      'rgba(255, 255, 255, 0.9)',

    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },

  typeCardSelected: {
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },

  otherTypePlusCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },

  chooseSubtypeCard: {
    marginTop: 12,
    minHeight: 70,
    borderRadius: 20,
    backgroundColor: '#F7F5FF',
    borderWidth: 1.5,
    borderColor: '#DDD7F5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  chooseSubtypeCardDisabled: {
    backgroundColor: '#F5F4F8',
    borderColor: '#E7E4ED',
  },

  chooseSubtypeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ECE8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  chooseSubtypeContent: {
    flex: 1,
  },

  chooseSubtypeTitle: {
    color: '#4F46A5',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },

  chooseSubtypeTitleDisabled: {
    color: '#8D8999',
  },

  chooseSubtypeDescription: {
    marginTop: 3,
    color: '#8A91A8',
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Quicksand-Regular',
  },

  selectedSubtypeCard: {
    marginTop: 12,
    minHeight: 70,
    borderRadius: 20,
    backgroundColor: '#F3F0FF',
    borderWidth: 1.5,
    borderColor: '#CFC7F5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  selectedSubtypeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E4DFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  selectedSubtypeContent: {
    flex: 1,
  },

  selectedSubtypeLabel: {
    color: '#8A82B3',
    fontSize: 10,
    fontFamily: 'Quicksand-Bold',
    marginBottom: 2,
  },

  selectedSubtypeValue: {
    color: '#4F46A5',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
  },

  typePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 27, 52, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  typePickerCard: {
    width: '100%',
    maxWidth: 390,
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingTop: 18,
    paddingBottom: 12,
    shadowColor: '#201A3B',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },

  typePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },

  typePickerHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  typePickerHeaderText: {
    flex: 1,
  },

  typePickerTitle: {
    color: '#1E2022',
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
  },

  typePickerSubtitle: {
    color: '#858B9B',
    fontSize: 12,
    fontFamily: 'Quicksand-Regular',
    marginTop: 2,
  },

  typePickerScroll: {
    flexGrow: 0,
  },

  typePickerList: {
    paddingHorizontal: 14,
    paddingBottom: 4,
  },

  typePickerOption: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#FAF9FF',
    borderWidth: 1,
    borderColor: '#ECE9F8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  typePickerOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F0EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  typePickerOptionText: {
    flex: 1,
    color: '#2D3436',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },

  typePickerBottomRow: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },

  typePickerBackButton: {
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F0EDFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  typePickerBackText: {
    color: '#6C5CE7',
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
  },

  typePickerCloseButton: {
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F0EDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  typePickerCloseText: {
    color: '#6C5CE7',
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
  },

  petCharacter: {
    width: 46,
    height: 46,
  },

  typeText: {
    color: '#2D3436',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
    marginLeft: 8,
  },

  checkBadgeUnselected: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor:
      'rgba(255, 255, 255, 0.8)',
    backgroundColor:
      'rgba(255, 255, 255, 0.4)',
  },

  checkBadgeSelected: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  /* ================================================= */
  /* MAIN BUTTON                                        */
  /* ================================================= */

  mainButtonTouch: {
    marginTop: 26,
    borderRadius: 24,

    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },

  mainButton: {
    width: '100%',
    height: 56,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },

  /* ================================================= */
  /* SECTION                                            */
  /* ================================================= */

  sectionTitle: {
    color: '#1E2022',
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
    marginTop: 8,
  },

  sectionSubtitle: {
    color: '#858B9B',
    fontSize: 13,
    fontFamily: 'Quicksand-Regular',
    marginTop: 4,
    marginBottom: 12,
  },

  /* ================================================= */
  /* PREVIEW CARD                                       */
  /* ================================================= */

  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,

    marginBottom: 8,
  },

  previewIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  previewName: {
    color: '#1E2022',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },

  previewType: {
    color: '#858B9B',
    fontSize: 13,
    fontFamily: 'Quicksand-Regular',
    marginTop: 2,
  },

  /* ================================================= */
  /* BIRTH DATE                                        */
  /* ================================================= */

  birthDateDescription: {
    marginTop: -3,
    marginBottom: 10,
    color: '#8A91A8',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Quicksand-Regular',
  },

  birthPrecisionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },

  birthPrecisionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E5ED',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  birthPrecisionButtonSelected: {
    backgroundColor: '#EEF0FF',
    borderColor: '#6C5CE7',
  },

  birthPrecisionText: {
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
    color: '#6B7280',
  },

  birthPrecisionTextSelected: {
    color: '#6C5CE7',
  },

  ageInputContainer: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E5ED',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
  },

  ageIcon: {
    marginRight: 10,
  },

  ageInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: '#1E2022',
  },

  birthCalendarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EDFF',
  },

  birthYearHelper: {
    marginTop: 7,
    marginBottom: 2,
    color: '#8A91A8',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Quicksand-Regular',
  },

  /* ================================================= */
  /* GENDER                                             */
  /* ================================================= */

  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },

  genderButton: {
    flex: 1,
    height: 54,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E5ED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  genderButtonSelected: {
    backgroundColor: '#EEF0FF',
    borderColor: '#6C5CE7',
  },

  genderText: {
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
    color: '#2D3436',
  },

  genderTextSelected: {
    color: '#6C5CE7',
  },

  genderCheckBadge: {
    position: 'absolute',
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ================================================= */
  /* HEALTH INPUTS                                      */
  /* ================================================= */

  weightInputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  weightInputBox: {
    flex: 1,
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  weightInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Quicksand-Regular',
    color: '#1E2022',
  },

  weightUnitText: {
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
    color: '#64748B',
  },

  weightSlash: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
    color: '#94A3B8',
  },

  iconInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  iconInputRowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputBox: {
    flex: 1,
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    justifyContent: 'center',
  },

  vetInputBox: {
    flex: 1,
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 18,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  vetCalendarButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  birthPickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  birthPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 20, 45, 0.56)',
  },

  birthPickerSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    shadowColor: '#1E2022',
    shadowOffset: {width: 0, height: -8},
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 18,
  },

  birthPickerHandle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDD9EC',
    alignSelf: 'center',
    marginBottom: 18,
  },

  birthPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  birthPickerHeaderIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#F0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  birthPickerHeaderText: {
    flex: 1,
    paddingRight: 8,
  },

  birthPickerTitle: {
    color: '#18162B',
    fontSize: 23,
    fontFamily: 'Quicksand-Bold',
  },

  birthPickerSubtitle: {
    marginTop: 2,
    color: '#77738A',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Quicksand-Regular',
  },

  birthPickerXButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F1F8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  birthPickerTabs: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E7E2F5',
    padding: 4,
    flexDirection: 'row',
    marginBottom: 16,
  },

  birthPickerTab: {
    flex: 1,
    minHeight: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  birthPickerTabSelected: {
    backgroundColor: '#EEE9FF',
  },

  birthPickerTabText: {
    color: '#77738A',
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
    textAlign: 'center',
  },

  birthPickerTabTextSelected: {
    color: '#6544D9',
  },

  birthWheelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },

  wheelColumn: {
    flex: 1,
  },

  wheelLabel: {
    color: '#77738A',
    fontSize: 12,
    fontFamily: 'Quicksand-Regular',
    textAlign: 'center',
    marginBottom: 7,
  },

  wheelViewport: {
    height: WHEEL_ITEM_HEIGHT * 3,
    overflow: 'hidden',
    position: 'relative',
  },

  wheelSelection: {
    position: 'absolute',
    zIndex: 0,
    left: 0,
    right: 0,
    top: WHEEL_ITEM_HEIGHT,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 18,
    backgroundColor: '#F1EDFF',
  },

  wheelContent: {
    paddingVertical: WHEEL_ITEM_HEIGHT,
  },

  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  wheelItemText: {
    color: '#B1ADC2',
    fontSize: 16,
    fontFamily: 'Quicksand-Regular',
  },

  wheelItemTextSelected: {
    color: '#5136C8',
    fontSize: 19,
    fontFamily: 'Quicksand-Bold',
  },

  birthPickerActions: {
    flexDirection: 'row',
    gap: 12,
  },

  birthPickerCancelButton: {
    flex: 1,
    height: 54,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#CFC4FF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  birthPickerCancelText: {
    color: '#6C5CE7',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
  },

  birthPickerConfirmTouch: {
    flex: 1,
    borderRadius: 20,
  },

  birthPickerConfirmButton: {
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  birthPickerConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
  },

  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 20, 45, 0.50)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  datePickerCard: {
    width: '100%',
    maxWidth: 370,

    backgroundColor: '#FFFFFF',

    borderRadius: 30,

    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,

    shadowColor: '#1E2022',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,

    elevation: 12,
  },

  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 8,
    marginBottom: 8,
  },

  datePickerHeaderIcon: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor: '#F0EDFF',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,
  },

  datePickerHeaderText: {
    flex: 1,
  },

  datePickerTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
    color: '#1E2022',
  },

  datePickerSubtitle: {
    marginTop: 2,

    fontSize: 13,

    fontFamily: 'Quicksand-Regular',

    color: '#858B9B',
  },

  calendarArrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0EDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  datePickerCloseButton: {
    height: 48,

    borderRadius: 17,

    backgroundColor: '#F0EDFF',

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 8,
    marginHorizontal: 8,
  },

  datePickerCloseText: {
    color: '#6C5CE7',

    fontSize: 14,

    fontFamily: 'Quicksand-Bold',
  },

  innerInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Quicksand-Regular',
    color: '#1E2022',
  },

  notesInputBox: {
    height: 96,
    paddingTop: 12,
    paddingBottom: 12,
  },

  notesInnerInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Quicksand-Regular',
    color: '#1E2022',
    textAlignVertical: 'top',
  },

  /* ================================================= */
  /* SAVE BUTTON                                        */
  /* ================================================= */

  saveButton: {
    width: '100%',
    height: 56,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Quicksand-Bold',
  },

});
