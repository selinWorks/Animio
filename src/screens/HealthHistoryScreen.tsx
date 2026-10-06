import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  SlidersHorizontal,
  Stethoscope,
  Syringe,
  Pill,
  HeartPulse,
  FileText,
  Check,
  CalendarDays,
  X,
  Plus,
  Pencil,
  Trash2,
  Scissors,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/AppNavigator';
import {useAuth} from '../data/AuthContext';

import {
  addHealthRecordToFirestore,
  getHealthHistoryFromFirestore,
  updateHealthRecordInFirestore,
  deleteHealthRecordFromFirestore,
} from '../services/firestore';

type HealthHistoryRouteProp = RouteProp<RootStackParamList, 'HealthHistory'>;
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'HealthHistory'
>;

type Props = {
  route: HealthHistoryRouteProp;
};


type HealthCategory =
  | 'checkup'
  | 'vaccine'
  | 'medicine'
  | 'operation'
  | 'other';

type FilterCategory = 'all' | HealthCategory;
type PeriodFilter = '3months' | '6months' | 'year' | 'all';

type HealthRecord = {
  id: string;
  source: 'manual' | 'careEvent';
  sourceId: string;
  title: string;
  category: HealthCategory;
  categoryLabel: string;
  date: string;
  dateValue: Date;
  createdAtValue: Date;
  clinic?: string;
  doctor?: string;
  description?: string;
  attachment?: string;
  medicineName?: string;
  medicineFrequency?: string;
};

const normalizeHealthCategory = (value: unknown) =>
  String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .trim();

const TITLE_PLACEHOLDERS: Record<HealthCategory, string> = {
  checkup: 'Örn. Genel veteriner kontrolü',
  vaccine: 'Örn. Karma aşı, kuduz aşısı',
  medicine: 'Örn. İç parazit ilacı, antibiyotik',
  operation: 'Örn. Kısırlaştırma ameliyatı, diş çekimi',
  other: 'Örn. Alerji takibi, cilt problemi',
};

const isOperationRecord = (record: any) => {
  const values = [
    record.category,
    record.categoryLabel,
    record.type,
    record.title,
    record.name,
  ];

  return values.some(value => {
    const normalized = normalizeHealthCategory(value);

    return [
      'ameliyat',
      'operasyon',
      'kisirlastirma',
      'surgery',
      'operation',
      'sterilization',
      'neuter',
      'spay',
    ].some(keyword => normalized.includes(keyword));
  });
};


const CATEGORY_FILTERS: {key: FilterCategory; label: string}[] = [
  {key: 'all', label: 'Tümü'},
  {key: 'checkup', label: 'Kontroller'},
  {key: 'vaccine', label: 'Aşılar'},
  {key: 'medicine', label: 'İlaç / Parazit'},
  {key: 'operation', label: 'Ameliyat / Kısırlaştırma'},
  {key: 'other', label: 'Diğer'},
];

const PERIOD_OPTIONS: {key: PeriodFilter; label: string}[] = [
  {key: '3months', label: 'Son 3 Ay'},
  {key: '6months', label: 'Son 6 Ay'},
  {key: 'year', label: 'Bu Yıl'},
  {key: 'all', label: 'Tüm Zamanlar'},
];

const CATEGORY_COLORS = {
  checkup: {
    primary: '#7457E8',
    light: '#F0ECFF',
    border: '#DDD4FF',
  },
  vaccine: {
    primary: '#E9689B',
    light: '#FFF0F6',
    border: '#FFD8E7',
  },
  medicine: {
    primary: '#54A98B',
    light: '#EBF8F3',
    border: '#D2EFE4',
  },
  operation: {
    primary: '#8B6BD6',
    light: '#F2ECFF',
    border: '#DCCEFF',
  },
  other: {
    primary: '#D49B3F',
    light: '#FFF7E8',
    border: '#F5E4BF',
  },
};

const parseFirestoreDate = (value: string) => {
  if (!value) {
    return null;
  }

  const isoMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);

    const date = new Date(
      year,
      month - 1,
      day,
    );

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }

  const dotMatch = value.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
  );

  if (dotMatch) {
    const day = Number(dotMatch[1]);
    const month = Number(dotMatch[2]);
    const year = Number(dotMatch[3]);

    const date = new Date(
      year,
      month - 1,
      day,
    );

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }

  return null;
};

const parseCreatedAt = (value: any, fallback: Date) => {
  if (!value) {
    return fallback;
  }

  if (typeof value?.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? fallback : date;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fallback : value;
  }

  const seconds =
    typeof value?.seconds === 'number'
      ? value.seconds
      : typeof value?._seconds === 'number'
        ? value._seconds
        : null;

  if (seconds !== null) {
    const nanoseconds =
      typeof value?.nanoseconds === 'number'
        ? value.nanoseconds
        : typeof value?._nanoseconds === 'number'
          ? value._nanoseconds
          : 0;

    return new Date(seconds * 1000 + nanoseconds / 1000000);
  }

  if (typeof value === 'number' || typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date;
  }

  return fallback;
};

const formatHealthDate = (date: Date) => {
  const months = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];

  return `${date.getDate()} ${
    months[date.getMonth()]
  } ${date.getFullYear()}`;
};

const toFirestoreDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');
  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default function HealthHistoryScreen({route}: Props) {
  const {pet} = route.params;
  const navigation = useNavigation<NavigationProp>();
  const {user} = useAuth();

  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>('all');
  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodFilter>('all');
  const [tempPeriod, setTempPeriod] = useState<PeriodFilter>('all');
  const [filterVisible, setFilterVisible] = useState(false);
  const [addRecordVisible, setAddRecordVisible] = useState(false);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingRecord, setSavingRecord] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const [newCategory, setNewCategory] =
    useState<HealthCategory>('checkup');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newClinic, setNewClinic] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [newMedicineName, setNewMedicineName] = useState('');
  const [newMedicineFrequency, setNewMedicineFrequency] = useState('');

  // =======================================================
  // ÖZEL POPUP
  // =======================================================

  type PopupType =
    | 'error'
    | 'warning'
    | 'info'
    | 'success'
    | 'delete';

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] =
    useState<PopupType>('info');
  const [popupConfirmAction, setPopupConfirmAction] =
    useState<(() => void | Promise<void>) | null>(null);

  const showPopup = (
    title: string,
    message: string,
    type: PopupType = 'info',
    confirmAction: (() => void | Promise<void>) | null = null,
  ) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setPopupConfirmAction(() => confirmAction);
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
    setPopupConfirmAction(null);
  };

  const loadHealthRecords = useCallback(async () => {
    if (!user?.uid || !pet?.id) {
      setRecords([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const firestoreRecords =
        await getHealthHistoryFromFirestore(
          pet.id,
          user.uid,
        );

      const mappedRecords: HealthRecord[] =
        firestoreRecords
          .map((record: any) => {
            const dateValue =
              parseFirestoreDate(
                record.date,
              );
            const resolvedCategory: HealthCategory =
              isOperationRecord(record)
                ? 'operation'
                : (
                    [
                      'checkup',
                      'vaccine',
                      'medicine',
                      'operation',
                      'other',
                    ].includes(String(record.category))
                      ? record.category
                      : 'other'
                  ) as HealthCategory;


            if (!dateValue) {
              return null;
            }

            return {
              id: record.id,
              source:
                record.source === 'careEvent'
                  ? 'careEvent'
                  : 'manual',
              sourceId:
                record.sourceId ||
                record.id,
              title:
                record.title || '',
              category: resolvedCategory,
              categoryLabel:
                resolvedCategory === 'operation'
                  ? 'Ameliyat / Kısırlaştırma'
                  : record.categoryLabel ||
                    categoryLabel(resolvedCategory),
              categoryLabel:
                record.categoryLabel ||
                categoryLabel(
                  record.category as HealthCategory,
                ),
              date:
                formatHealthDate(
                  dateValue,
                ),
              dateValue,
              createdAtValue: parseCreatedAt(
                record.createdAt ?? record.updatedAt,
                dateValue,
              ),
              clinic:
                record.clinic ||
                undefined,
              doctor:
                record.doctor ||
                undefined,
              description:
                record.description ||
                undefined,
              attachment:
                record.attachment ||
                undefined,
              medicineName: record.medicineName || '',
              medicineFrequency: record.medicineFrequency || '',
            };
          })
          .filter(
            (
              record,
            ): record is HealthRecord =>
              record !== null,
          );

      setRecords(mappedRecords);
    } catch (error) {
      console.error(
        'Sağlık geçmişi yüklenemedi:',
        error,
      );

      showPopup(
        'Sağlık geçmişi yüklenemedi',
        'Kayıtlar alınırken bir sorun oluştu. Lütfen tekrar dene.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [pet?.id, user?.uid]);

  useEffect(() => {
    loadHealthRecords();
  }, [loadHealthRecords]);

  const filteredRecords = useMemo(() => {
    let filtered = [...records];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    const now = new Date();

    if (selectedPeriod === '3months') {
      const start = new Date(
        now.getFullYear(),
        now.getMonth() - 3,
        now.getDate(),
      );
      filtered = filtered.filter(item => item.dateValue >= start);
    }

    if (selectedPeriod === '6months') {
      const start = new Date(
        now.getFullYear(),
        now.getMonth() - 6,
        now.getDate(),
      );
      filtered = filtered.filter(item => item.dateValue >= start);
    }

    if (selectedPeriod === 'year') {
      filtered = filtered.filter(
        item => item.dateValue.getFullYear() === now.getFullYear(),
      );
    }

    return filtered.sort((a, b) => {
      const dateDifference =
        b.dateValue.getTime() - a.dateValue.getTime();

      if (dateDifference !== 0) {
        return dateDifference;
      }

      const createdAtDifference =
        b.createdAtValue.getTime() - a.createdAtValue.getTime();

      if (createdAtDifference !== 0) {
        return createdAtDifference;
      }

      return b.id.localeCompare(a.id);
    });
  }, [records, selectedCategory, selectedPeriod]);

  const RECORDS_PER_PAGE = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedPeriod]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / RECORDS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const visibleRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    return filteredRecords.slice(
      startIndex,
      startIndex + RECORDS_PER_PAGE,
    );
  }, [filteredRecords, currentPage]);

  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) => b.dateValue.getTime() - a.dateValue.getTime(),
      ),
    [records],
  );

  const lastVaccine = sortedRecords.find(
    item => item.category === 'vaccine',
  );

  const openFilter = () => {
    setTempPeriod(selectedPeriod);
    setFilterVisible(true);
  };

  const applyFilter = () => {
    setSelectedPeriod(tempPeriod);
    setFilterVisible(false);
  };

  const resetNewRecordForm = () => {
    setEditingRecordId(null);
    setNewCategory('checkup');
    setNewTitle('');
    setNewDate('');
    setNewClinic('');
    setNewDoctor('');
    setNewDescription('');
    setNewMedicineName('');
    setNewMedicineFrequency('');
  };

  const closeAddRecord = () => {
    setAddRecordVisible(false);
    resetNewRecordForm();
  };

  const parseDate = (value: string) => {
    const parts = value.trim().split('.');
    if (parts.length !== 3) {
      return null;
    }

    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);

    if (
      !Number.isInteger(day) ||
      !Number.isInteger(month) ||
      !Number.isInteger(year) ||
      year < 2000 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }

    const date = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (date > today) {
      return null;
    }

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  };

  const formatDate = (date: Date) => {
    return formatHealthDate(date);
  };

  const categoryLabel = (category: HealthCategory) => {
    if (category === 'checkup') {
      return 'Veteriner Kontrolü';
    }

    if (category === 'vaccine') {
      return 'Aşı';
    }

    if (category === 'medicine') {
      return 'İlaç / Parazit';
    }

    if (category === 'operation') {
      return 'Ameliyat / Kısırlaştırma';
    }

    return 'Diğer';
  };

  const openEditRecord = (record: HealthRecord) => {
    const day = String(record.dateValue.getDate()).padStart(2, '0');
    const month = String(record.dateValue.getMonth() + 1).padStart(2, '0');
    const year = record.dateValue.getFullYear();

    setEditingRecordId(record.id);
    setNewCategory(record.category);
    setNewTitle(record.title);
    setNewDate(`${day}.${month}.${year}`);
    setNewClinic(record.clinic ?? '');
    setNewDoctor(record.doctor ?? '');
    setNewDescription(record.description ?? '');
    setAddRecordVisible(true);
    setNewMedicineName((record as any).medicineName ?? '');
    setNewMedicineFrequency(
      (record as any).medicineFrequency ?? '',
    );
  };

  const saveNewRecord = async () => {
    const parsedDate =
      parseDate(newDate);

    if (
      !newTitle.trim() ||
      !parsedDate ||
      !user?.uid ||
      (
        newCategory === 'medicine' &&
        (
          !newMedicineName.trim() ||
          !newMedicineFrequency.trim()
        )
      )
    ) {
      showPopup(
        'Eksik bilgi',
        'Lütfen zorunlu alanları doldur.',
        'warning',
      );
      return;
    }

    const payload = {
      title: newTitle.trim(),
      category: newCategory,
      date: toFirestoreDate(parsedDate),
      clinic: newClinic.trim(),
      doctor: newDoctor.trim(),
      description: newDescription.trim(),

      medicineName:
        newCategory === 'medicine'
          ? newMedicineName.trim()
          : '',

      medicineFrequency:
        newCategory === 'medicine'
          ? newMedicineFrequency.trim()
          : '',
    };

    try {
      setSavingRecord(true);

      if (editingRecordId) {
        const recordToEdit =
          records.find(
            record =>
              record.id ===
              editingRecordId,
          );

        if (
          recordToEdit?.source ===
          'careEvent'
        ) {
          showPopup(
            'Takvim kaydı',
            'Bu kayıt takvimde tamamlanan bir işlemden geliyor. Düzenleme işlemi takvim kaydı üzerinden yapılmalı.',
            'info',
          );
          return;
        }

        await updateHealthRecordInFirestore(
          pet.id,
          recordToEdit?.sourceId ||
            editingRecordId,
          payload,
          user.uid,
        );
      } else {
        await addHealthRecordToFirestore(
          pet.id,
          payload,
          user.uid,
        );
      }

      await loadHealthRecords();
      closeAddRecord();
    } catch (error) {
      console.error(
        'Sağlık kaydı kaydedilemedi:',
        error,
      );

      showPopup(
        'Kayıt kaydedilemedi',
        'Sağlık kaydı kaydedilirken bir sorun oluştu. Lütfen tekrar dene.',
        'error',
      );
    } finally {
      setSavingRecord(false);
    }
  };

  const deleteRecord = () => {
    if (
      !editingRecordId ||
      !user?.uid
    ) {
      return;
    }

    const recordToDelete =
      records.find(
        record =>
          record.id ===
          editingRecordId,
      );

    if (
      recordToDelete?.source ===
      'careEvent'
    ) {
      showPopup(
        'Takvim kaydı',
        'Bu kayıt takvimde tamamlanan bir işlemden geliyor. Sağlık geçmişinden doğrudan silinemez.',
        'info',
      );
      return;
    }

    showPopup(
      'Sağlık kaydı silinsin mi?',
      recordToDelete
        ? `“${recordToDelete.title}” kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz.`
        : 'Bu sağlık kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz.',
      'delete',
      async () => {
        try {
          setSavingRecord(true);

          await deleteHealthRecordFromFirestore(
            pet.id,
            recordToDelete?.sourceId ||
              editingRecordId,
            user.uid,
          );

          await loadHealthRecords();
          closeAddRecord();
        } catch (error) {
          console.error(
            'Sağlık kaydı silinemedi:',
            error,
          );

          showPopup(
            'Kayıt silinemedi',
            'Sağlık kaydı silinirken bir sorun oluştu. Lütfen tekrar dene.',
            'error',
          );
        } finally {
          setSavingRecord(false);
        }
      },
    );
  };

  const getCategoryIcon = (category: HealthCategory, size = 20) => {
    const color = CATEGORY_COLORS[category].primary;

    if (category === 'checkup') {
      return (
        <Stethoscope
          size={size}
          color={color}
          strokeWidth={2}
        />
      );
    }

    if (category === 'vaccine') {
      return (
        <Syringe
          size={size}
          color={color}
          strokeWidth={2}
        />
      );
    }

    if (category === 'medicine') {
      return (
        <Pill
          size={size}
          color={color}
          strokeWidth={2}
        />
      );
    }

    if (category === 'operation') {
      return (
        <Scissors
          size={size}
          color={color}
          strokeWidth={2}
        />
      );
    }

    return (
      <HeartPulse
        size={size}
        color={color}
        strokeWidth={2}
      />
    );
  };


  return (
    <View style={styles.container}>
      <View style={styles.backgroundGlowOne} />
      <View style={styles.backgroundGlowTwo} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <ArrowLeft
              size={22}
              color="#28243F"
              strokeWidth={2}
            />
          </Pressable>

          <View style={styles.headerTextArea}>
            <Text style={styles.headerTitle}>Sağlık Geçmişi</Text>
            <Text style={styles.headerSubtitle}>
              {pet.name} için tamamlanan sağlık kayıtları
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRecordArea}>
            <Text style={styles.summaryNumber}>{records.length}</Text>
            <Text style={styles.summaryRecordLabel}>Kayıt</Text>
          </View>

          <View style={styles.summaryVaccineArea}>
            <View style={styles.summaryVaccineTextArea}>
              <Text style={styles.summarySmallLabel}>Son Aşı:</Text>
              <Text style={styles.summarySmallValue}>
                {lastVaccine ? lastVaccine.date : '—'}
              </Text>
            </View>

            <Syringe
              size={25}
              color="#332D67"
              strokeWidth={2.1}
            />
          </View>
        </View>

        <View style={styles.filterHeader}>
          <Text style={styles.sectionTitle}>
            Sağlık Kayıtları
          </Text>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.addRecordButton}
              onPress={() => {
                resetNewRecordForm();
                setAddRecordVisible(true);
              }}>
              <Plus
                size={16}
                color="#FFFFFF"
                strokeWidth={2.4}
              />
              <Text style={styles.addRecordButtonText}>
                Kayıt Ekle
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterButton,
                selectedPeriod !== 'all' &&
                  styles.filterButtonActive,
              ]}
              onPress={openFilter}>
              <SlidersHorizontal
                size={16}
                color={
                  selectedPeriod !== 'all'
                    ? '#FFFFFF'
                    : '#7457E8'
                }
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  selectedPeriod !== 'all' &&
                    styles.filterButtonTextActive,
                ]}>
                Filtrele
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}>
          {CATEGORY_FILTERS.map(item => {
            const active = selectedCategory === item.key;

            return (
              <Pressable
                key={item.key}
                style={({pressed}) => [
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                  pressed && styles.chipPressed,
                ]}
                onPress={() => setSelectedCategory(item.key)}>
                <Text
                  style={[
                    styles.categoryChipText,
                    active && styles.categoryChipTextActive,
                  ]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.timeline}>
          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator
                size="small"
                color="#7457E8"
              />
              <Text style={styles.loadingText}>
                Sağlık kayıtları yükleniyor...
              </Text>
            </View>
          ) : filteredRecords.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <HeartPulse
                  size={30}
                  color="#7457E8"
                  strokeWidth={1.8}
                />
              </View>

              <Text style={styles.emptyTitle}>
                Kayıt bulunamadı
              </Text>

              <Text style={styles.emptyText}>
                Seçtiğin filtrelere uygun tamamlanmış bir sağlık
                kaydı bulunmuyor.
              </Text>
            </View>
          ) : (
            visibleRecords.map((record, index) => {
              const colors =
                CATEGORY_COLORS[record.category];
              const isLast =
                index === visibleRecords.length - 1;

              return (
                <View
                  key={record.id}
                  style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDotOuter,
                        {backgroundColor: colors.light},
                      ]}>
                      <View
                        style={[
                          styles.timelineDot,
                          {backgroundColor: colors.primary},
                        ]}
                      />
                    </View>

                    {!isLast && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>

                  <View style={styles.timelineContent}>
                    <View style={styles.dateRow}>
                      <CalendarDays
                        size={14}
                        color="#9296A8"
                        strokeWidth={1.8}
                      />
                      <Text style={styles.dateText}>
                        {record.date}
                      </Text>
                    </View>

                    <Pressable
                      style={[
                        styles.recordCard,
                        {borderColor: colors.border},
                      ]}>
                      <View
                        style={[
                          styles.recordAccent,
                          {backgroundColor: colors.primary},
                        ]}
                      />

                      <View style={styles.recordTop}>
                        <View
                          style={[
                            styles.recordIcon,
                            {backgroundColor: colors.light},
                          ]}>
                          {getCategoryIcon(record.category)}
                        </View>

                        <View style={styles.recordTitleArea}>
                          <Text style={styles.recordTitle}>
                            {record.title}
                          </Text>
                          <Text
                            style={[
                              styles.recordCategory,
                              {color: colors.primary},
                            ]}>
                            {record.categoryLabel}
                          </Text>
                        </View>

                        <View style={styles.recordActions}>
                          <Pressable
                            style={({pressed}) => [
                              styles.editRecordButton,
                              pressed && styles.editRecordButtonPressed,
                            ]}
                            onPress={() => {
                              if (record.source === 'careEvent') {
                                showPopup(
                                  'Takvim kaydı',
                                  'Bu kayıt takvimde tamamlanan bir işlemden geliyor. Düzenlemek için ilgili takvim kaydını kullanmalısın.',
                                  'info',
                                );
                                return;
                              }

                              openEditRecord(record);
                            }}
                            hitSlop={6}>
                            <Pencil
                              size={14}
                              color="#7457E8"
                              strokeWidth={2}
                            />
                          </Pressable>
                        </View>
                      </View>

                      {record.clinic && (
                        <Text style={styles.clinicText}>
                          {record.clinic}
                        </Text>
                      )}

                      {record.doctor && (
                        <Text style={styles.doctorText}>
                          {record.doctor}
                        </Text>
                      )}

                      {record.description && (
                        <Text style={styles.descriptionText}>
                          {record.description}
                        </Text>
                      )}

                      {record.category === 'medicine' &&
                        record.medicineName && (
                          <Text style={styles.descriptionText}>
                            İlaç: {record.medicineName}
                          </Text>
                        )}

                      {record.category === 'medicine' &&
                        record.medicineFrequency && (
                          <Text style={styles.descriptionText}>
                            Kullanım sıklığı: {record.medicineFrequency}
                          </Text>
                        )}

                      {record.attachment && (
                        <View style={styles.attachmentRow}>
                          <View style={styles.attachmentIcon}>
                            <FileText
                              size={15}
                              color="#7457E8"
                              strokeWidth={2}
                            />
                          </View>
                          <Text style={styles.attachmentText}>
                            {record.attachment}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}

          {!loading && filteredRecords.length > RECORDS_PER_PAGE && (
            <View style={styles.pagination}>
              <Pressable
                style={({pressed}) => [
                  styles.paginationButton,
                  currentPage === 1 && styles.paginationButtonDisabled,
                  pressed &&
                    currentPage > 1 &&
                    styles.paginationButtonPressed,
                ]}
                disabled={currentPage === 1}
                onPress={() =>
                  setCurrentPage(page => Math.max(1, page - 1))
                }>
                <Text
                  style={[
                    styles.paginationButtonText,
                    currentPage === 1 &&
                      styles.paginationButtonTextDisabled,
                  ]}>
                  ‹ Önceki
                </Text>
              </Pressable>

              <View style={styles.paginationInfo}>
                <Text style={styles.paginationCurrent}>
                  {currentPage}
                </Text>
                <Text style={styles.paginationDivider}>/</Text>
                <Text style={styles.paginationTotal}>
                  {totalPages}
                </Text>
              </View>

              <Pressable
                style={({pressed}) => [
                  styles.paginationButton,
                  currentPage === totalPages &&
                    styles.paginationButtonDisabled,
                  pressed &&
                    currentPage < totalPages &&
                    styles.paginationButtonPressed,
                ]}
                disabled={currentPage === totalPages}
                onPress={() =>
                  setCurrentPage(page =>
                    Math.min(totalPages, page + 1),
                  )
                }>
                <Text
                  style={[
                    styles.paginationButtonText,
                    currentPage === totalPages &&
                      styles.paginationButtonTextDisabled,
                  ]}>
                  Sonraki ›
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={addRecordVisible}
        transparent
        animationType="slide"
        onRequestClose={closeAddRecord}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeAddRecord}
          />

          <View style={styles.addSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.addSheetTitleArea}>
                <Text style={styles.sheetTitle}>
                  {editingRecordId
                    ? 'Sağlık Kaydını Düzenle'
                    : 'Sağlık Kaydı Ekle'}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {editingRecordId
                    ? 'Kayıt bilgilerini güncelle'
                    : 'Geçmişte tamamlanan bir sağlık işlemini kaydet'}
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={closeAddRecord}>
                <X
                  size={20}
                  color="#6D7184"
                  strokeWidth={2}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.addForm}>

              <Text style={styles.inputLabel}>Kayıt Türü</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.formCategoryList}>
                {CATEGORY_FILTERS.filter(
                  item => item.key !== 'all',
                ).map(item => {
                  const category = item.key as HealthCategory;
                  const active = newCategory === category;
                  const colors = CATEGORY_COLORS[category];

                  return (
                    <Pressable
                      key={category}
                      style={[
                        styles.formCategoryChip,
                        active && {
                          backgroundColor: colors.light,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setNewCategory(category)}>
                      {getCategoryIcon(category, 16)}

                      <Text
                        style={[
                          styles.formCategoryText,
                          active && {color: colors.primary},
                        ]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputLabel}>Başlık *</Text>
              <TextInput
                style={styles.textInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder={TITLE_PLACEHOLDERS[newCategory]}
                placeholderTextColor="#AAA7B5"
              />

              {newCategory === 'medicine' && (
                <>
                  <Text style={styles.inputLabel}>İlaç Adı *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newMedicineName}
                    onChangeText={setNewMedicineName}
                    placeholder="Örn. Veterinerin önerdiği ilaç"
                    placeholderTextColor="#AAA7B5"
                  />

                  <Text style={styles.inputLabel}>
                    Günde Kaç Kez Kullanılacak? *
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={newMedicineFrequency}
                    onChangeText={setNewMedicineFrequency}
                    placeholder="Örn. Günde 2 kez"
                    placeholderTextColor="#AAA7B5"
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Tarih *</Text>
              <View style={styles.dateInputWrapper}>
                <TextInput
                  style={styles.dateTextInput}
                  value={newDate}
                  onChangeText={setNewDate}
                  placeholder="GG.AA.YYYY"
                  placeholderTextColor="#AAA7B5"
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
                <View style={styles.dateInputIcon}>
                  <CalendarDays
                    size={18}
                    color="#7457E8"
                    strokeWidth={1.9}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Klinik</Text>
              <TextInput
                style={styles.textInput}
                value={newClinic}
                onChangeText={setNewClinic}
                placeholder="Veteriner kliniği"
                placeholderTextColor="#AAA7B5"
              />

              <Text style={styles.inputLabel}>Veteriner</Text>
              <TextInput
                style={styles.textInput}
                value={newDoctor}
                onChangeText={setNewDoctor}
                placeholder="Veteriner adı"
                placeholderTextColor="#AAA7B5"
              />

              <Text style={styles.inputLabel}>Not</Text>
              <TextInput
                style={[styles.textInput, styles.noteInput]}
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="Bu kayıtla ilgili kısa bir not..."
                placeholderTextColor="#AAA7B5"
                multiline
                textAlignVertical="top"
              />

              <Pressable
                style={({pressed}) => [
                  styles.saveRecordButton,
                  (!newTitle.trim() || !parseDate(newDate)) &&
                    styles.saveRecordButtonDisabled,
                  pressed &&
                    newTitle.trim() &&
                    parseDate(newDate) &&
                    styles.primaryButtonPressed,
                ]}
                disabled={
                  savingRecord ||
                  !newTitle.trim() ||
                  !parseDate(newDate) ||
                  (
                    newCategory === 'medicine' &&
                    (
                      !newMedicineName.trim() ||
                      !newMedicineFrequency.trim()
                    )
                  )
                }
                onPress={saveNewRecord}>
                {savingRecord ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Check
                    size={18}
                    color="#FFFFFF"
                    strokeWidth={2.4}
                  />
                )}
                <Text style={styles.saveRecordButtonText}>
                  {savingRecord
                    ? 'Kaydediliyor...'
                    : editingRecordId
                      ? 'Değişiklikleri Kaydet'
                      : 'Sağlık Kaydını Kaydet'}
                </Text>
              </Pressable>

              {editingRecordId &&
                records.find(
                  record =>
                    record.id === editingRecordId,
                )?.source === 'manual' && (
                <Pressable
                  style={({pressed}) => [
                    styles.deleteRecordButton,
                    pressed && styles.deleteRecordButtonPressed,
                  ]}
                  onPress={deleteRecord}>
                  <Trash2
                    size={17}
                    color="#D65D70"
                    strokeWidth={2}
                  />
                  <Text style={styles.deleteRecordButtonText}>
                    Kaydı Sil
                  </Text>
                </Pressable>
              )}

              <Text style={styles.manualRecordHint}>
                {editingRecordId
                  ? 'Değişiklikler yalnızca bu sağlık kaydına uygulanır.'
                  : 'Bu kayıt geçmişe eklenir ve takvimde yeni bir görev oluşturmaz.'}
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFilterVisible(false)}
          />

          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>
                  Tarih Aralığı
                </Text>
                <Text style={styles.sheetSubtitle}>
                  Görüntülemek istediğin dönemi seç
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() => setFilterVisible(false)}>
                <X
                  size={20}
                  color="#6D7184"
                  strokeWidth={2}
                />
              </Pressable>
            </View>

            <View style={styles.periodList}>
              {PERIOD_OPTIONS.map(option => {
                const active = tempPeriod === option.key;

                return (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.periodOption,
                      active && styles.periodOptionActive,
                    ]}
                    onPress={() => setTempPeriod(option.key)}>
                    <View
                      style={[
                        styles.radioOuter,
                        active && styles.radioOuterActive,
                      ]}>
                      {active && (
                        <View style={styles.radioInner} />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.periodText,
                        active && styles.periodTextActive,
                      ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={({pressed}) => [
                styles.applyButton,
                pressed && styles.primaryButtonPressed,
              ]}
              onPress={applyFilter}>
              <Text style={styles.applyButtonText}>
                Uygula
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* =======================================================
          ÖZEL BİLGİ / HATA / SİLME POPUP
      ======================================================= */}

      <Modal
        visible={popupVisible}
        transparent
        animationType="fade"
        onRequestClose={closePopup}>
        <View style={styles.popupOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closePopup}
          />

          <View style={styles.popupCard}>

            <View
              style={[
                styles.popupIconContainer,
                popupType === 'error' &&
                  styles.popupIconError,
                popupType === 'warning' &&
                  styles.popupIconWarning,
                popupType === 'success' &&
                  styles.popupIconSuccess,
                popupType === 'info' &&
                  styles.popupIconInfo,
                popupType === 'delete' &&
                  styles.popupIconDelete,
              ]}>
              {popupType === 'error' && (
                <AlertCircle
                  size={28}
                  color="#D85F73"
                  strokeWidth={2}
                />
              )}

              {popupType === 'warning' && (
                <AlertCircle
                  size={28}
                  color="#D49B3F"
                  strokeWidth={2}
                />
              )}

              {popupType === 'info' && (
                <CalendarDays
                  size={28}
                  color="#7457E8"
                  strokeWidth={2}
                />
              )}

              {popupType === 'success' && (
                <CheckCircle2
                  size={28}
                  color="#54A98B"
                  strokeWidth={2}
                />
              )}

              {popupType === 'delete' && (
                <Trash2
                  size={28}
                  color="#D65D70"
                  strokeWidth={2}
                />
              )}
            </View>

            <Text style={styles.popupTitle}>
              {popupTitle}
            </Text>

            <Text style={styles.popupMessage}>
              {popupMessage}
            </Text>

            {popupConfirmAction ? (
              <View style={styles.popupButtons}>

                <Pressable
                  style={({pressed}) => [
                    styles.popupCancelButton,
                    pressed &&
                      styles.popupButtonPressed,
                  ]}
                  onPress={closePopup}>
                  <Text style={styles.popupCancelText}>
                    Vazgeç
                  </Text>
                </Pressable>

                <Pressable
                  style={({pressed}) => [
                    styles.popupConfirmButton,
                    popupType === 'delete' &&
                      styles.popupDeleteButton,
                    pressed &&
                      styles.popupButtonPressed,
                  ]}
                  onPress={async () => {
                    const action =
                      popupConfirmAction;

                    closePopup();

                    if (action) {
                      await action();
                    }
                  }}>
                  {popupType === 'delete' && (
                    <Trash2
                      size={16}
                      color="#FFFFFF"
                      strokeWidth={2.2}
                    />
                  )}

                  <Text
                    style={
                      styles.popupConfirmText
                    }>
                    {popupType === 'delete'
                      ? 'Kaydı Sil'
                      : 'Devam Et'}
                  </Text>
                </Pressable>

              </View>
            ) : (
              <Pressable
                style={({pressed}) => [
                  styles.popupOkButton,
                  pressed &&
                    styles.popupButtonPressed,
                ]}
                onPress={closePopup}>
                <Text style={styles.popupOkText}>
                  Tamam
                </Text>
              </Pressable>
            )}

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FE',
    overflow: 'hidden',
  },

  backgroundGlowOne: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#F1EDFF',
    top: -110,
    right: -90,
  },

  backgroundGlowTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFF1F6',
    top: 290,
    left: -150,
  },

  scrollContent: {
    paddingTop: 47,
    paddingHorizontal: 18,
    paddingBottom: 45,
  },

  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEAF8',
    shadowColor: '#463B71',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  headerTextArea: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 22,
    color: '#23203A',
  },

  headerSubtitle: {
    marginTop: 2,
    fontFamily: 'Quicksand-Medium',
    fontSize: 11.5,
    color: '#8A8EA0',
  },


  summaryCard: {
    minHeight: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 6,
    overflow: 'hidden',
    shadowColor: '#514779',
    shadowOffset: {width: 0, height: 7},
    shadowOpacity: 0.11,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 26,
  },

  summaryRecordArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryNumber: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 27,
    color: '#272344',
    lineHeight: 32,
  },

  summaryRecordLabel: {
    marginLeft: 9,
    fontFamily: 'Quicksand-Bold',
    fontSize: 15,
    color: '#302C48',
  },

  summaryVaccineArea: {
    width: '54%',
    minHeight: 60,
    borderRadius: 30,
    backgroundColor: '#E9E4FA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 14,
  },

  summaryVaccineTextArea: {
    flex: 1,
    paddingRight: 10,
  },

  summarySmallLabel: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 10.5,
    color: '#8B84A7',
    marginBottom: 1,
  },

  summarySmallValue: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 11.5,
    color: '#302B58',
  },

  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  sectionTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 17,
    color: '#29263D',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  addRecordButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#7457E8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#7457E8',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },

  addRecordButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 10.5,
    color: '#FFFFFF',
  },

  filterButton: {
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DED6FF',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  filterButtonActive: {
    backgroundColor: '#7457E8',
    borderColor: '#7457E8',
  },

  filterButtonText: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 11,
    color: '#7457E8',
  },

  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  categoryList: {
    paddingRight: 12,
    paddingBottom: 22,
    gap: 8,
  },

  categoryChip: {
    height: 34,
    paddingHorizontal: 15,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryChipActive: {
    backgroundColor: '#7457E8',
    borderColor: '#7457E8',
  },

  categoryChipText: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 11,
    color: '#737688',
  },

  categoryChipTextActive: {
    color: '#FFFFFF',
  },

  timeline: {
    width: '100%',
  },

  timelineItem: {
    flexDirection: 'row',
  },

  timelineLeft: {
    width: 30,
    alignItems: 'center',
  },

  timelineDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginTop: 2,
  },

  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 145,
    backgroundColor: '#E6E1F4',
    marginVertical: -1,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 5,
    paddingBottom: 18,
  },

  dateRow: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
  },

  dateText: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 10.5,
    color: '#85899B',
  },

  recordCard: {
    position: 'relative',
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    paddingLeft: 17,
    overflow: 'hidden',
    shadowColor: '#544A77',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.055,
    shadowRadius: 11,
    elevation: 3,
  },

  recordAccent: {
    position: 'absolute',
    width: 4,
    top: 15,
    bottom: 15,
    left: 0,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },

  recordTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  recordTitleArea: {
    flex: 1,
    paddingRight: 5,
  },

  recordTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 13.5,
    color: '#2D2940',
  },

  recordCategory: {
    marginTop: 3,
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 9.5,
  },

  recordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  editRecordButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#F2EEFF',
    borderWidth: 1,
    borderColor: '#E1D9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  clinicText: {
    marginTop: 13,
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 10.5,
    color: '#59566B',
  },

  doctorText: {
    marginTop: 2,
    fontFamily: 'Quicksand-Medium',
    fontSize: 9.5,
    color: '#9799A8',
  },

  descriptionText: {
    marginTop: 8,
    fontFamily: 'Quicksand-Medium',
    fontSize: 10.5,
    lineHeight: 16,
    color: '#747688',
  },

  attachmentRow: {
    marginTop: 11,
    alignSelf: 'flex-start',
    height: 31,
    borderRadius: 10,
    backgroundColor: '#F4F1FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
  },

  attachmentIcon: {
    marginRight: 6,
  },

  attachmentText: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 10,
    color: '#7457E8',
  },

  pagination: {
    marginTop: 6,
    marginLeft: 35,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  paginationButton: {
    minWidth: 92,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DED6FF',
    backgroundColor: '#F8F6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  paginationButtonDisabled: {
    backgroundColor: '#F5F4F8',
    borderColor: '#E8E6ED',
  },

  paginationButtonPressed: {
    opacity: 0.76,
    transform: [{scale: 0.98}],
  },

  paginationButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 10.5,
    color: '#7457E8',
  },

  paginationButtonTextDisabled: {
    color: '#B8B5C2',
  },

  paginationInfo: {
    height: 38,
    minWidth: 58,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE8F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  paginationCurrent: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 11.5,
    color: '#7457E8',
  },

  paginationDivider: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 10.5,
    color: '#AAA6B6',
  },

  paginationTotal: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 10.5,
    color: '#77738A',
  },

  loadingCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE8F6',
    paddingVertical: 34,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 11,
    color: '#8A8D9D',
  },

  emptyCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE8F6',
    paddingVertical: 38,
    paddingHorizontal: 25,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: '#F0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  emptyTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 15,
    color: '#312D44',
  },

  emptyText: {
    marginTop: 6,
    fontFamily: 'Quicksand-Medium',
    fontSize: 11,
    lineHeight: 17,
    color: '#8A8D9D',
    textAlign: 'center',
  },

  addSheet: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },

  addSheetTitleArea: {
    flex: 1,
    paddingRight: 12,
  },

  addForm: {
    paddingBottom: 14,
  },

  inputLabel: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 11,
    color: '#4C485E',
    marginBottom: 7,
    marginTop: 12,
  },

  formCategoryList: {
    gap: 8,
    paddingRight: 8,
    paddingBottom: 2,
  },

  formCategoryChip: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E8E5EF',
    backgroundColor: '#FCFBFE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  formCategoryText: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 10.5,
    color: '#77798A',
  },

  textInput: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E4F1',
    backgroundColor: '#FBFAFE',
    paddingHorizontal: 14,
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    color: '#302C43',
  },

  dateInputWrapper: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E4F1',
    backgroundColor: '#FBFAFE',
    flexDirection: 'row',
    alignItems: 'center',
  },

  dateTextInput: {
    flex: 1,
    minHeight: 48,
    paddingLeft: 14,
    paddingRight: 8,
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    color: '#302C43',
  },

  dateInputIcon: {
    width: 40,
    height: 40,
    marginRight: 4,
    borderRadius: 12,
    backgroundColor: '#F2EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionButtonPressed: {
    opacity: 0.82,
    transform: [{scale: 0.98}],
  },

  chipPressed: {
    opacity: 0.78,
    transform: [{scale: 0.98}],
  },

  editRecordButtonPressed: {
    opacity: 0.75,
    transform: [{scale: 0.94}],
  },

  primaryButtonPressed: {
    opacity: 0.88,
    transform: [{scale: 0.99}],
  },

  noteInput: {
    minHeight: 90,
    paddingTop: 13,
    paddingBottom: 13,
  },

  saveRecordButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#7457E8',
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#7457E8',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },

  saveRecordButtonDisabled: {
    backgroundColor: '#C9BFF1',
    shadowOpacity: 0,
    elevation: 0,
  },

  saveRecordButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12.5,
    color: '#FFFFFF',
  },

  deleteRecordButton: {
    height: 46,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1CDD4',
    backgroundColor: '#FFF7F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  deleteRecordButtonPressed: {
    opacity: 0.76,
    transform: [{scale: 0.99}],
  },

  deleteRecordButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 11.5,
    color: '#D65D70',
  },

  manualRecordHint: {
    marginTop: 10,
    paddingHorizontal: 8,
    fontFamily: 'Quicksand-Medium',
    fontSize: 9.5,
    lineHeight: 14,
    color: '#9693A3',
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(31, 27, 49, 0.35)',
  },

  /* =======================================================
     ÖZEL POPUP STİLLERİ
  ======================================================= */

  popupOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(35, 30, 58, 0.42)',
    paddingHorizontal: 26,
  },

  popupCard: {
    width: '100%',
    maxWidth: 370,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 23,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',

    shadowColor: '#44376D',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 10,
  },

  popupIconContainer: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  popupIconError: {
    backgroundColor: '#FFF0F3',
    borderWidth: 1,
    borderColor: '#FFD8E0',
  },

  popupIconWarning: {
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#F5E4BF',
  },

  popupIconInfo: {
    backgroundColor: '#F0ECFF',
    borderWidth: 1,
    borderColor: '#DDD4FF',
  },

  popupIconSuccess: {
    backgroundColor: '#EBF8F3',
    borderWidth: 1,
    borderColor: '#D2EFE4',
  },

  popupIconDelete: {
    backgroundColor: '#FFF1F3',
    borderWidth: 1,
    borderColor: '#F4CDD5',
  },

  popupTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 17,
    color: '#2D2940',
    textAlign: 'center',
  },

  popupMessage: {
    marginTop: 8,
    paddingHorizontal: 4,
    fontFamily: 'Quicksand-Medium',
    fontSize: 11.5,
    lineHeight: 18,
    color: '#7D7F91',
    textAlign: 'center',
  },

  popupButtons: {
    width: '100%',
    flexDirection: 'row',
    gap: 9,
    marginTop: 21,
  },

  popupCancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F6F4FA',
    borderWidth: 1,
    borderColor: '#E8E4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  popupCancelText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 11.5,
    color: '#77798A',
  },

  popupConfirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#7457E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,

    shadowColor: '#7457E8',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },

  popupDeleteButton: {
    backgroundColor: '#D65D70',

    shadowColor: '#D65D70',
  },

  popupConfirmText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 11.5,
    color: '#FFFFFF',
  },

  popupOkButton: {
    width: '100%',
    height: 47,
    borderRadius: 15,
    backgroundColor: '#7457E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 21,

    shadowColor: '#7457E8',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.16,
    shadowRadius: 9,
    elevation: 3,
  },

  popupOkText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },

  popupButtonPressed: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },

  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD9E8',
    alignSelf: 'center',
    marginBottom: 18,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  sheetTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 19,
    color: '#29253E',
  },

  sheetSubtitle: {
    marginTop: 3,
    fontFamily: 'Quicksand-Medium',
    fontSize: 10.5,
    color: '#9295A6',
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6F4FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  periodList: {
    gap: 9,
  },

  periodOption: {
    height: 51,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ECE9F2',
    backgroundColor: '#FCFBFE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  periodOptionActive: {
    backgroundColor: '#F3F0FF',
    borderColor: '#CFC4FF',
  },

  radioOuter: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C6C5CE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  radioOuterActive: {
    borderColor: '#7457E8',
  },

  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#7457E8',
  },

  periodText: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 12,
    color: '#656778',
  },

  periodTextActive: {
    color: '#5F46CC',
  },

  applyButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#7457E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#7457E8',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },

  applyButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});

