import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ArrowLeft,
  Download,
  PawPrint,
  Weight,
  HeartPulse,
  Syringe,
  FileText,
  CalendarDays,
  Pill,
  Stethoscope,
  FlaskConical,
  Scissors,
  AlertCircle,
  CheckCircle2,
  FileWarning,
  Info,
} from 'lucide-react-native';

import {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/AppNavigator';
import {useAuth} from '../data/AuthContext';

import {
  getHealthHistoryFromFirestore,
} from '../services/firestore';

import {
  createPetSummaryPdf,
  sharePetSummaryPdf,
  savePetSummaryPdf,
} from '../services/petSummaryPdf';


type Props = NativeStackScreenProps<
  RootStackParamList,
  'PetSummary'
>;


type HealthRecord = {
  id: string;
  title?: string;
  name?: string;
  type?: string;
  category?: string;
  date?: string;
  description?: string;
  notes?: string;
  clinic?: string;
  doctor?: string;
  medicineName?: string;
  medicineFrequency?: string;
  vaccineName?: string;
  [key: string]: unknown;
};


const formatDate = (value?: string) => {
  if (!value) {
    return 'Tarih belirtilmemiş';
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    return `${match[3]}.${match[2]}.${match[1]}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const isVaccine = (record: HealthRecord) => {
  const category = String(
    record.category ?? record.type ?? '',
  )
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return (
    category.includes('asi') ||
    category.includes('vaccine') ||
    category.includes('vaccination')
  );
};


const getHealthCategoryLabel = (record: HealthRecord) => {
  const raw = String(record.category ?? record.type ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (raw.includes('vaccine') || raw.includes('vaccination') || raw.includes('asi')) {
    return 'Aşı';
  }

  if (raw.includes('medicine') || raw.includes('medication') || raw.includes('ilac')) {
    return 'İlaç';
  }

  if (raw.includes('veteriner') || raw.includes('muayene') || raw.includes('doctor') || raw.includes('visit')) {
    return 'Veteriner Muayenesi';
  }

  if (raw.includes('tahlil') || raw.includes('test') || raw.includes('analiz') || raw.includes('laboratuvar') || raw.includes('laboratory')) {
    return 'Tahlil / Laboratuvar';
  }

  if (raw.includes('ameliyat') || raw.includes('operasyon') || raw.includes('kisirlastirma') || raw.includes('surgery') || raw.includes('operation')) {
    return 'Ameliyat / Operasyon';
  }

  return raw ? 'Diğer Sağlık Kaydı' : 'Sağlık Kaydı';
};

const getHealthCategoryIcon = (record: HealthRecord) => {
  const normalize = (value: unknown) =>
    String(value ?? '')
      .toLocaleLowerCase('tr-TR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  // Öncelik: kaydın gerçek kategori alanı
  const category = normalize(record.category || record.type);

  // Yalnızca kategori bilgisi yoksa başlıktan tahmin et
  const text = category || normalize(
    `${record.title ?? ''} ${record.name ?? ''} ${record.description ?? ''}`,
  );

  if (
    text.includes('asi') ||
    text.includes('vaccine') ||
    text.includes('vaccination')
  ) {
    return {Icon: Syringe, color: '#E9689B', background: '#FFF0F6'};
  }

  if (
    text.includes('ilac') ||
    text.includes('medicine') ||
    text.includes('medication')
  ) {
    return {Icon: Pill, color: '#7457E8', background: '#F0ECFF'};
  }

  if (
    text.includes('veteriner') ||
    text.includes('muayene') ||
    text.includes('doctor') ||
    text.includes('visit')
  ) {
    return {Icon: Stethoscope, color: '#359B83', background: '#E8F8F2'};
  }

  if (
    text.includes('tahlil') ||
    text.includes('test') ||
    text.includes('analiz') ||
    text.includes('laboratuvar') ||
    text.includes('laboratory')
  ) {
    return {Icon: FlaskConical, color: '#D99036', background: '#FFF5E5'};
  }

  if (
    text.includes('ameliyat') ||
    text.includes('operasyon') ||
    text.includes('kisirlastirma') ||
    text.includes('surgery') ||
    text.includes('operation')
  ) {
    return {Icon: Scissors, color: '#E9689B', background: '#FFF0F6'};
  }

  return {Icon: HeartPulse, color: '#54A98B', background: '#E8F8F2'};
};


const displayValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return 'Belirtilmemiş';
  }

  return String(value);
};

export default function PetSummaryScreen({route, navigation}: Props) {
  const {pet} = route.params;
  const {user} = useAuth();

  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingPdf, setCreatingPdf] = useState(false);

  type PopupType =
    | 'error'
    | 'success'
    | 'warning'
    | 'info';

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<PopupType>('info');

  const showPopup = (
    title: string,
    message: string,
    type: PopupType = 'info',
  ) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
  };

  const loadHealthRecords = useCallback(async () => {
    if (!user?.uid || !pet?.id) {
      setHealthRecords([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const result = await getHealthHistoryFromFirestore(
        pet.id,
        user.uid,
      );

      setHealthRecords(
        result as HealthRecord[],
      );
    } catch (error) {
      console.error('Pet özeti sağlık kayıtları yüklenemedi:', error);
      showPopup(
        'Kayıtlar yüklenemedi',
        'Sağlık geçmişi alınırken bir sorun oluştu.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [pet.id, user?.uid]);

  useEffect(() => {
    loadHealthRecords();
  }, [loadHealthRecords]);

  const sortedHealthRecords = useMemo(
    () =>
      [...healthRecords].sort((a, b) =>
        String(b.date ?? '').localeCompare(String(a.date ?? '')),
      ),
    [healthRecords],
  );

  const vaccines = useMemo(
    () => sortedHealthRecords.filter(isVaccine),
    [sortedHealthRecords],
  );

  const operations = useMemo(() => {
    const normalize = (value: unknown) =>
      String(value ?? '')
        .toLocaleLowerCase('tr-TR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    return sortedHealthRecords.filter(record => {
      const category = normalize(
        `${record.category ?? ''} ${record.type ?? ''} ${
          record.title ?? ''
        } ${record.name ?? ''}`,
      );

      return (
        category.includes('ameliyat') ||
        category.includes('operasyon') ||
        category.includes('kisirlastirma') ||
        category.includes('surgery') ||
        category.includes('operation') ||
        category.includes('sterilization') ||
        category.includes('neuter') ||
        category.includes('spay')
      );
    });
  }, [sortedHealthRecords]);

  const weightHistory = useMemo(() => {
    const history = (pet as any).weightHistory;

    if (!Array.isArray(history)) {
      return [];
    }

    return [...history].sort((a, b) =>
      String(b.date ?? '').localeCompare(String(a.date ?? '')),
    );
  }, [pet]);

  const handleCreatePdf = async () => {
    try {
      setCreatingPdf(true);

      const filePath = await createPetSummaryPdf({
        name: pet.name,
        type: pet.type,
        gender: pet.gender,
        birthYear: pet.birthYear,
        age: (pet as any).age,
        weight: pet.weight,
        notes: pet.notes,
        weightHistory,
        healthRecords: sortedHealthRecords,
      });

      const saved = await savePetSummaryPdf(filePath, pet.name);

      if (saved) {
        showPopup(
          'PDF hazırlandı',
          'PDF seçtiğin klasöre başarıyla kaydedildi.',
          'success',
        );
      }
    } catch (error: any) {
      const message =
        error?.message ??
        error?.localizedDescription ??
        String(error);

      showPopup(
        'PDF oluşturulamadı',
        message,
        'warning',
      );
    } finally {
      setCreatingPdf(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <ArrowLeft size={21} color="#28243F" />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>Pet Özeti</Text>
            <Text style={styles.subtitle}>
              {pet.name} için detaylı sağlık ve profil raporu
            </Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <PawPrint size={27} color="#7457E8" />
          </View>

          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petType}>
            {displayValue(pet.type)}
          </Text>

          <View style={styles.profileGrid}>
            <ProfileItem label="Cinsiyet" value={pet.gender} />
            <ProfileItem label="Doğum yılı" value={pet.birthYear} />
            <ProfileItem label="Yaş" value={(pet as any).age} />
            <ProfileItem
              label="Güncel kilo"
              value={
                pet.weight !== undefined &&
                pet.weight !== null &&
                pet.weight !== ''
                  ? `${pet.weight} kg`
                  : 'Belirtilmemiş'
              }
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <Weight size={19} color="#7457E8" />
            <Text style={styles.sectionTitle}>Kilo Geçmişi</Text>
            <Text style={styles.count}>{weightHistory.length}</Text>
          </View>

          {weightHistory.length === 0 ? (
            <Text style={styles.emptyText}>
              Henüz kilo geçmişi bulunmuyor.
            </Text>
          ) : (
            weightHistory.map((item: any, index: number) => (
              <View
                key={item.id ?? `${item.date}-${index}`}
                style={styles.recordRow}>
                <View style={styles.rowIcon}>
                  <CalendarDays size={16} color="#7457E8" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>
                    {formatDate(item.date)}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {displayValue(item.weight)} kg
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <HeartPulse size={19} color="#54A98B" />
            <Text style={styles.sectionTitle}>Sağlık Kayıtları</Text>
            <Text style={styles.count}>
              {sortedHealthRecords.length}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#7457E8" />
          ) : sortedHealthRecords.length === 0 ? (
            <Text style={styles.emptyText}>
              Henüz sağlık kaydı bulunmuyor.
            </Text>
          ) : (
            sortedHealthRecords.map((record, index) => {
              const {Icon, color, background} =
                getHealthCategoryIcon(record);

              return (
                <View
                  key={record.id ?? `${record.date}-${index}`}
                  style={styles.recordRow}>
                  <View
                    style={[
                      styles.rowIcon,
                      {backgroundColor: background},
                    ]}>
                    <Icon size={16} color={color} />
                  </View>

                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>
                      {displayValue(record.title || record.name)}
                    </Text>

                    <Text style={styles.rowSubtitle}>
                      {formatDate(record.date)} · {getHealthCategoryLabel(record)}
                    </Text>

                    {!!(record.description || record.notes) && (
                      <Text style={styles.description}>
                        {record.description || record.notes}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <Syringe size={19} color="#E9689B" />
            <Text style={styles.sectionTitle}>Aşı Kayıtları</Text>
            <Text style={styles.count}>{vaccines.length}</Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#7457E8" />
          ) : vaccines.length === 0 ? (
            <Text style={styles.emptyText}>
              Henüz aşı kaydı bulunmuyor.
            </Text>
          ) : (
            vaccines.map((record, index) => (
              <View
                key={record.id ?? `${record.date}-${index}`}
                style={styles.recordRow}>
                <View style={[styles.rowIcon, styles.vaccineIcon]}>
                  <Syringe size={16} color="#E9689B" />
                </View>

                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>
                    {displayValue(record.title || record.name)}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {formatDate(record.date)}
                  </Text>
                  {!!(record.description || record.notes) && (
                    <Text style={styles.description}>
                      {record.description || record.notes}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <FileText size={19} color="#7457E8" />
            <Text style={styles.sectionTitle}>Notlar</Text>
          </View>

          <Text style={styles.notes}>
            {displayValue(pet.notes)}
          </Text>
        </View>

        <Pressable
          style={({pressed}) => [
            styles.pdfButton,
            pressed && styles.pressed,
          ]}
          disabled={creatingPdf || loading}
          onPress={handleCreatePdf}>
          {creatingPdf ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Download size={19} color="#FFFFFF" />
          )}
          <Text style={styles.pdfButtonText}>
            {creatingPdf ? 'PDF hazırlanıyor...' : 'PDF Oluştur ve Paylaş'}
          </Text>
        </Pressable>



            </ScrollView>

            <Modal
              visible={popupVisible}
              transparent
              animationType="fade"
              onRequestClose={closePopup}>
              <View style={styles.popupOverlay}>
                <View style={styles.popupCard}>

                  <View
                    style={[
                      styles.popupIconContainer,
                      popupType === 'error' && styles.popupIconError,
                      popupType === 'success' && styles.popupIconSuccess,
                      popupType === 'warning' && styles.popupIconWarning,
                      popupType === 'info' && styles.popupIconInfo,
                    ]}>
                    {popupType === 'error' && (
                      <AlertCircle
                        size={28}
                        color="#D9536F"
                      />
                    )}

                    {popupType === 'success' && (
                      <CheckCircle2
                        size={29}
                        color="#48A982"
                      />
                    )}

                    {popupType === 'warning' && (
                      <FileWarning
                        size={28}
                        color="#D99036"
                      />
                    )}

                    {popupType === 'info' && (
                      <Info
                        size={28}
                        color="#7457E8"
                      />
                    )}
                  </View>

                  <Text style={styles.popupTitle}>
                    {popupTitle}
                  </Text>

                  <Text style={styles.popupMessage}>
                    {popupMessage}
                  </Text>

                  <Pressable
                    style={({pressed}) => [
                      styles.popupButton,
                      pressed && styles.popupButtonPressed,
                    ]}
                    onPress={closePopup}>
                    <Text style={styles.popupButtonText}>
                      Tamam
                    </Text>
                  </Pressable>

                </View>
              </View>
            </Modal>
          </View>
        );
      }

function ProfileItem({
  label,
  value,
}: {
  label: string;
  value?: unknown;
}) {
  return (
    <View style={styles.profileItem}>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue}>
        {displayValue(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FE',
  },
  content: {
    paddingTop: 48,
    paddingHorizontal: 18,
    paddingBottom: 38,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 22,
    color: '#28243F',
  },
  subtitle: {
    marginTop: 3,
    fontFamily: 'Quicksand-Medium',
    fontSize: 11,
    color: '#89879B',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 19,
    borderWidth: 1,
    borderColor: '#EAE4FF',
    alignItems: 'center',
    marginBottom: 17,
    elevation: 3,
  },
  profileIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: '#F0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  petName: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 21,
    color: '#29243F',
  },
  petType: {
    marginTop: 3,
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    color: '#8A879B',
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F0EDF7',
    paddingTop: 12,
  },
  profileItem: {
    width: '50%',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  profileLabel: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 10,
    color: '#9290A2',
    marginBottom: 4,
  },
  profileValue: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#37324D',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECE8F6',
    elevation: 2,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
    color: '#302B45',
  },
  count: {
    minWidth: 26,
    textAlign: 'center',
    overflow: 'hidden',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: '#F0ECFF',
    color: '#7457E8',
    fontFamily: 'Quicksand-Bold',
    fontSize: 10,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: '#F3F0F8',
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  vaccineIcon: {
    backgroundColor: '#FFF0F6',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#37324D',
  },
  rowSubtitle: {
    marginTop: 4,
    fontFamily: 'Quicksand-Medium',
    fontSize: 10,
    color: '#858296',
  },
  description: {
    marginTop: 6,
    fontFamily: 'Quicksand-Medium',
    fontSize: 11,
    lineHeight: 16,
    color: '#6F6B82',
  },
  emptyText: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 11,
    lineHeight: 17,
    color: '#9290A2',
  },
  notes: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    lineHeight: 19,
    color: '#68647A',
  },
  pdfButton: {
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: '#7457E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 5,
    elevation: 4,
  },
  pdfButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
    transform: [{scale: 0.99}],
  },

    popupOverlay: {
      flex: 1,
      backgroundColor: 'rgba(31, 27, 49, 0.48)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
    },

    popupCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: '#FFFFFF',
      borderRadius: 26,
      paddingHorizontal: 22,
      paddingTop: 24,
      paddingBottom: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#EAE4FF',
      elevation: 10,
      shadowColor: '#28243F',
      shadowOffset: {
        width: 0,
        height: 7,
      },
      shadowOpacity: 0.18,
      shadowRadius: 16,
    },

    popupIconContainer: {
      width: 62,
      height: 62,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },

    popupIconError: {
      backgroundColor: '#FFF0F3',
    },

    popupIconSuccess: {
      backgroundColor: '#EAF8F1',
    },

    popupIconWarning: {
      backgroundColor: '#FFF5E6',
    },

    popupIconInfo: {
      backgroundColor: '#F0ECFF',
    },

    popupTitle: {
      fontFamily: 'Quicksand-Bold',
      fontSize: 17,
      color: '#29243F',
      textAlign: 'center',
      marginBottom: 8,
    },

    popupMessage: {
      fontFamily: 'Quicksand-Medium',
      fontSize: 12,
      lineHeight: 19,
      color: '#777389',
      textAlign: 'center',
      paddingHorizontal: 5,
      marginBottom: 20,
    },

    popupButton: {
      width: '100%',
      minHeight: 46,
      borderRadius: 15,
      backgroundColor: '#7457E8',
      alignItems: 'center',
      justifyContent: 'center',
    },

    popupButtonPressed: {
      opacity: 0.82,
      transform: [{scale: 0.98}],
    },

    popupButtonText: {
      fontFamily: 'Quicksand-Bold',
      fontSize: 12,
      color: '#FFFFFF',
    },

  savePdfButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCD3FF',
    elevation: 0,
    marginTop: 10,
  },

  savePdfButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#7457E8',
  },
});