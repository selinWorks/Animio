import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
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
  date?: string;
  description?: string;
  notes?: string;
  clinic?: string;
  doctor?: string;
};

const formatDate = (value?: string) => {
  if (!value) {
    return 'Tarih belirtilmemiş';
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  return match
    ? `${match[3]}.${match[2]}.${match[1]}`
    : value;
};

const isVaccine = (record: HealthRecord) => {
  const type = String(record.type ?? '').toLocaleLowerCase('tr-TR');

  return (
    type.includes('aşı') ||
    type.includes('asi') ||
    type.includes('vaccine') ||
    type.includes('vaccination')
  );
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
      Alert.alert(
        'Kayıtlar yüklenemedi',
        'Sağlık geçmişi alınırken bir sorun oluştu.',
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
        Alert.alert('Başarılı', 'PDF seçtiğin klasöre kaydedildi.');
      }
    } catch (error: any) {
      const message =
        error?.message ??
        error?.localizedDescription ??
        String(error);

      Alert.alert(
        'Hata ayrıntısı',
        message,
        [{text: 'Tamam'}],
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
            sortedHealthRecords.map((record, index) => (
              <View
                key={record.id ?? `${record.date}-${index}`}
                style={styles.recordRow}>
                <View style={styles.rowIcon}>
                  <HeartPulse size={16} color="#54A98B" />
                </View>

                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>
                    {displayValue(record.title || record.name)}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {formatDate(record.date)} · {displayValue(record.type)}
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