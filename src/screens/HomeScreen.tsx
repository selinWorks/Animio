import React from 'react';
import {View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  TabParamList,
  RootStackParamList,
} from '../navigation/AppNavigator';
import {usePets} from '../data/PetContext';


type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function HomeScreen() {
  const {pets} = usePets();
  const navigation = useNavigation<NavigationProp>();

  const totalPets = pets.length;
  const lastPet = pets.length > 0 ? pets[pets.length - 1] : null;
  const petsWithVaccines = pets.filter(pet => pet.vaccines && pet.vaccines.trim()).length;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>🐾</Text>
        <Text style={styles.heroTitle}>Welcome to PetCare</Text>
        <Text style={styles.heroSubtitle}>
          Evcil hayvanlarının bakım bilgilerini yumuşak ve düzenli bir şekilde takip et.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardPurple]}>
          <Text style={styles.statLabel}>Toplam Pet</Text>
          <Text style={styles.statValue}>{totalPets}</Text>
        </View>

        <View style={[styles.statCard, styles.statCardMint]}>
          <Text style={styles.statLabel}>Aşı Kaydı</Text>
          <Text style={styles.statValue}>{petsWithVaccines}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('AddPet')}>
          <Text style={styles.primaryButtonText}>+ Yeni Pet Ekle</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Pets')}>
          <Text style={styles.secondaryButtonText}>Petleri Görüntüle</Text>
        </Pressable>
        <Pressable
          style={styles.calendarButton}
          onPress={() => navigation.navigate('Calendar')}>
          <Text style={styles.calendarButtonText}>Bakım Takvimini Aç</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Son Eklenen Pet</Text>

        {lastPet ? (
          <View style={styles.lastPetBox}>
            <View style={styles.petAvatar}>
              <Text style={styles.petAvatarText}>🐶</Text>
            </View>

            <View style={styles.petInfo}>
              <Text style={styles.petName}>{lastPet.name}</Text>
              <Text style={styles.petMeta}>
                {lastPet.type} • {lastPet.age} yaş
              </Text>
              <Text style={styles.petSummary}>
                {lastPet.gender ? lastPet.gender : 'Cinsiyet yok'} •{' '}
                {lastPet.weight ? lastPet.weight : 'Kilo yok'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateEmoji}>🌷</Text>
            <Text style={styles.emptyStateTitle}>Henüz pet eklenmedi</Text>
            <Text style={styles.emptyStateText}>
              İlk petini ekleyerek bakım bilgilerini kaydetmeye başlayabilirsin.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>PetCare Hakkında</Text>
        <Text style={styles.infoText}>
          PetCare; pet bilgilerini, veteriner notlarını, aşı detaylarını ve temel bakım
          verilerini düzenli şekilde takip etmen için tasarlanmış soft ve kullanıcı dostu
          bir mobil uygulamadır.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: '#F8FAFC',
  },
  heroCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
  },
  heroEmoji: {
    fontSize: 34,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    elevation: 2,
  },
  statCardPurple: {
    backgroundColor: '#DDD6FE',
  },
  statCardMint: {
    backgroundColor: '#D1FAE5',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },
  infoCard: {
    backgroundColor: '#FCE7F3',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#A5B4FC',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '700',
  },
  lastPetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
  },
  petAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  petAvatarText: {
    fontSize: 24,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  petMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  petSummary: {
    fontSize: 13,
    color: '#818CF8',
    fontWeight: '600',
  },
  emptyStateBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  emptyStateEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  calendarButton: {
    backgroundColor: '#FCE7F3',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  calendarButtonText: {
    color: '#DB2777',
    fontSize: 15,
    fontWeight: '700',
  },
});

