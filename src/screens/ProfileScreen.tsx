import React from 'react';
import {View, Text, StyleSheet, ScrollView, Pressable} from 'react-native';
import {usePets} from '../data/PetContext';

export default function ProfileScreen() {
  const {pets} = usePets();

  const totalPets = pets.length;
  const lastPet = pets.length > 0 ? pets[pets.length - 1] : null;
  const petsWithVaccines = pets.filter(
    pet => pet.vaccines && pet.vaccines.trim(),
  ).length;

  const renderMenuItem = (
    emoji: string,
    title: string,
    subtitle?: string,
  ) => (
    <Pressable style={styles.menuItem}>
      <View style={styles.menuLeft}>
        <View style={styles.menuIconBox}>
          <Text style={styles.menuEmoji}>{emoji}</Text>
        </View>

        <View>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <Text style={styles.menuArrow}>›</Text>
    </Pressable>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatar}>👤</Text>
        </View>
        <Text style={styles.name}>PetCare User</Text>
        <Text style={styles.email}>user@petcare.app</Text>
        <Text style={styles.heroText}>
          Petlerinin bakım bilgilerini tek bir yerden düzenli şekilde takip et.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardPurple]}>
          <Text style={styles.statLabel}>Toplam Pet</Text>
          <Text style={styles.statValue}>{totalPets}</Text>
        </View>

        <View style={[styles.statCard, styles.statCardPeach]}>
          <Text style={styles.statLabel}>Aşı Kaydı</Text>
          <Text style={styles.statValue}>{petsWithVaccines}</Text>
        </View>
      </View>

      <View style={styles.softInfoCard}>
        <Text style={styles.softInfoTitle}>Son Eklenen Pet</Text>
        <Text style={styles.softInfoText}>
          {lastPet ? lastPet.name : 'Henüz pet eklenmedi'}
        </Text>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Ayarlar</Text>

        {renderMenuItem('🔔', 'Bildirimler', 'Hatırlatma ve bakım uyarıları')}
        {renderMenuItem('🔒', 'Gizlilik', 'Veri ve uygulama tercihleri')}
        {renderMenuItem('❓', 'Yardım Merkezi', 'Sık sorulan sorular ve destek')}
        {renderMenuItem('💬', 'Geri Bildirim', 'Görüşlerini bizimle paylaş')}
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Uygulama</Text>

        {renderMenuItem('ℹ️', 'PetCare Hakkında', 'Uygulama bilgileri')}
        {renderMenuItem('✨', 'Yakında Gelecek Özellikler', 'Yeni eklenecek geliştirmeler')}
      </View>

      <View style={styles.versionCard}>
        <Text style={styles.versionLabel}>Version</Text>
        <Text style={styles.versionText}>PetCare v1.0</Text>
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
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  avatarCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    fontSize: 34,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  email: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
    marginBottom: 10,
  },
  heroText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
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
  statCardPeach: {
    backgroundColor: '#FED7AA',
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
  softInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    elevation: 1,
    marginBottom: 16,
  },
  softInfoTitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  softInfoText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    elevation: 2,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuEmoji: {
    fontSize: 18,
  },
  menuTitle: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 24,
    color: '#9CA3AF',
    marginLeft: 12,
  },
  versionCard: {
    backgroundColor: '#FCE7F3',
    borderRadius: 18,
    padding: 16,
    elevation: 1,
    marginBottom: 10,
  },
  versionLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
});