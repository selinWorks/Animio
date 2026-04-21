import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {usePets} from '../data/PetContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PetDetail'>;
type PetDetailRouteProp = RouteProp<RootStackParamList, 'PetDetail'>;

type PetDetailScreenProps = {
  route: PetDetailRouteProp;
};

type StatusConfig = {
  label: string;
  description: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  heroTint: string;
};

function getPetEmoji(type: string) {
  const lowerType = (type || '').toLowerCase().trim();

  if (lowerType.includes('kedi')) return '🐱';
  if (lowerType.includes('köpek') || lowerType.includes('kopek')) return '🐶';
  if (lowerType.includes('kuş') || lowerType.includes('kus')) return '🐦';
  if (lowerType.includes('balık') || lowerType.includes('balik')) return '🐠';
  if (lowerType.includes('hamster')) return '🐹';
  if (lowerType.includes('tavşan') || lowerType.includes('tavsan')) return '🐰';
  if (lowerType.includes('kaplumbağa') || lowerType.includes('kaplumbaga')) return '🐢';

  return '🐾';
}

function getPetAvatarColor(type: string) {
  const lowerType = (type || '').toLowerCase().trim();

  if (lowerType.includes('kedi')) return '#FFE7EF';
  if (lowerType.includes('köpek') || lowerType.includes('kopek')) return '#E6F0FF';
  if (lowerType.includes('kuş') || lowerType.includes('kus')) return '#FFF3D9';
  if (lowerType.includes('balık') || lowerType.includes('balik')) return '#DCFCE7';
  if (lowerType.includes('hamster')) return '#FDE68A';
  if (lowerType.includes('tavşan') || lowerType.includes('tavsan')) return '#EFE7FF';
  if (lowerType.includes('kaplumbağa') || lowerType.includes('kaplumbaga')) return '#DDF7EE';

  return '#EEF2FF';
}

function getStatusConfig(pet: {
  weight?: string;
  lastVetVisit?: string;
  vaccines?: string;
}): StatusConfig {
  const hasWeight = !!pet.weight;
  const hasVetVisit = !!pet.lastVetVisit;
  const hasVaccines = !!pet.vaccines;

  if (hasWeight && hasVetVisit && hasVaccines) {
    return {
      label: 'Harika durumda',
      description: 'Bakım ve sağlık bilgileri düzenli görünüyor.',
      accent: '#22C55E',
      badgeBg: '#DCFCE7',
      badgeText: '#166534',
      heroTint: '#F4FFF7',
    };
  }

  if (hasVaccines || hasVetVisit) {
    return {
      label: 'Takip sürüyor',
      description: 'Profil güçlü, birkaç bilgiyle daha da tamamlanabilir.',
      accent: '#F59E0B',
      badgeBg: '#FEF3C7',
      badgeText: '#92400E',
      heroTint: '#FFFCF5',
    };
  }

  return {
    label: 'Biraz ilgi istiyor',
    description: 'Daha dolu bir profil, ekranı çok daha güçlü gösterecek.',
    accent: '#EF4444',
    badgeBg: '#FEE2E2',
    badgeText: '#B91C1C',
    heroTint: '#FFF8F8',
  };
}

function getProfileHighlights(pet: {
  age: string | number;
  gender?: string;
  weight?: string;
  vaccines?: string;
}) {
  return [
    {
      label: 'Yaş',
      value: `${pet.age || '-'} yaş`,
    },
    {
      label: 'Cinsiyet',
      value: pet.gender || 'Belirtilmedi',
    },
    {
      label: 'Kilo',
      value: pet.weight || 'Eksik',
    },
    {
      label: 'Aşı durumu',
      value: pet.vaccines ? 'Kayıtlı' : 'Eksik',
    },
  ];
}

function getQuickInsight(pet: {
  vaccines?: string;
  lastVetVisit?: string;
  notes?: string;
  weight?: string;
}) {
  if (pet.lastVetVisit) {
    return `Son veteriner ziyareti ${pet.lastVetVisit} tarihinde kaydedildi.`;
  }

  if (pet.vaccines) {
    return 'Aşı bilgileri mevcut, sağlık takibi aktif görünüyor.';
  }

  if (!pet.weight) {
    return 'Kilo bilgisi henüz eklenmemiş. Küçük bir güncellemeyle profil tamamlanabilir.';
  }

  if (pet.notes) {
    return 'Bu profilin not alanı dolu, bakım tarafında iyi bir başlangıç var.';
  }

  return 'Bu profili daha güçlü göstermek için birkaç bilgi daha eklenebilir.';
}

type InfoLineProps = {
  label: string;
  value: string;
};

function InfoLine({label, value}: InfoLineProps) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLineLabel}>{label}</Text>
      <Text style={styles.infoLineValue}>{value}</Text>
    </View>
  );
}

type HighlightCardProps = {
  label: string;
  value: string;
  index: number;
};

function HighlightCard({label, value, index}: HighlightCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay: 180 + index * 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 360,
        delay: 180 + index * 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, index]);

  return (
    <Animated.View
      style={[
        styles.highlightCard,
        {
          opacity,
          transform: [{translateY}],
        },
      ]}>
      <Text style={styles.highlightLabel}>{label}</Text>
      <Text style={styles.highlightValue}>{value}</Text>
    </Animated.View>
  );
}

export default function PetDetailScreen({route}: PetDetailScreenProps) {
  const {pet} = route.params;
  const navigation = useNavigation<NavigationProp>();
  const {removePet} = usePets();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(20)).current;
  const sectionOpacity = useRef(new Animated.Value(0)).current;
  const sectionTranslate = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslate, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sectionOpacity, {
        toValue: 1,
        duration: 420,
        delay: 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sectionTranslate, {
        toValue: 0,
        duration: 420,
        delay: 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroOpacity, heroTranslate, sectionOpacity, sectionTranslate]);

  const status = useMemo(() => getStatusConfig(pet), [pet]);
  const highlights = useMemo(() => getProfileHighlights(pet), [pet]);
  const quickInsight = useMemo(() => getQuickInsight(pet), [pet]);

  const handleDelete = () => {
    removePet(pet.id);
    setDeleteModalVisible(false);
    navigation.goBack();
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.heroWrap,
            {
              backgroundColor: status.heroTint,
              opacity: heroOpacity,
              transform: [{translateY: heroTranslate}],
            },
          ]}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.statusPill,
                {backgroundColor: status.badgeBg},
              ]}>
              <View
                style={[
                  styles.statusDot,
                  {backgroundColor: status.accent},
                ]}
              />
              <Text style={[styles.statusPillText, {color: status.badgeText}]}>
                {status.label}
              </Text>
            </View>

            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{pet.type}</Text>
            </View>
          </View>

          <View style={styles.heroCenter}>
            <View
              style={[
                styles.avatarOuter,
                {borderColor: status.accent + '30'},
              ]}>
              <View
                style={[
                  styles.avatar,
                  {backgroundColor: getPetAvatarColor(pet.type)},
                ]}>
                <Text style={styles.avatarText}>{getPetEmoji(pet.type)}</Text>
              </View>
            </View>

            <Text style={styles.title}>{pet.name}</Text>
            <Text style={styles.subtitle}>{status.description}</Text>
          </View>

          <View style={styles.heroBottomRow}>
            <View style={styles.heroMiniCard}>
              <Text style={styles.heroMiniLabel}>Yaş</Text>
              <Text style={styles.heroMiniValue}>{pet.age} yaş</Text>
            </View>

            <View style={styles.heroMiniCard}>
              <Text style={styles.heroMiniLabel}>Cinsiyet</Text>
              <Text style={styles.heroMiniValue}>
                {pet.gender || 'Belirtilmedi'}
              </Text>
            </View>

            <View style={styles.heroMiniCard}>
              <Text style={styles.heroMiniLabel}>Kilo</Text>
              <Text style={styles.heroMiniValue}>{pet.weight || 'Eksik'}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: sectionOpacity,
            transform: [{translateY: sectionTranslate}],
          }}>
          <View style={styles.insightPanel}>
            <Text style={styles.panelEyebrow}>Bugünün özeti</Text>
            <Text style={styles.panelTitle}>Profil görünümü güçlü mü?</Text>
            <Text style={styles.panelText}>{quickInsight}</Text>
          </View>

          <View style={styles.highlightsGrid}>
            {highlights.map((item, index) => (
              <HighlightCard
                key={`${item.label}-${index}`}
                label={item.label}
                value={item.value}
                index={index}
              />
            ))}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Sağlık geçmişi</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>Takip</Text>
              </View>
            </View>

            <InfoLine
              label="Aşı bilgileri"
              value={pet.vaccines || 'Henüz eklenmemiş'}
            />
            <InfoLine
              label="Son veteriner ziyareti"
              value={pet.lastVetVisit || 'Henüz eklenmemiş'}
            />
          </View>

          <View style={styles.notesCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitleDark}>Notlar</Text>
              <Text style={styles.notesEmoji}>✦</Text>
            </View>
            <Text style={styles.notesValue}>
              {pet.notes || 'Bu dost için henüz not eklenmemiş.'}
            </Text>
          </View>

          <View style={styles.actionsWrap}>
            <Pressable
              style={styles.editButton}
              onPress={() => navigation.navigate('EditPet', {pet})}>
              <Text style={styles.editButtonText}>Profili Düzenle</Text>
            </Pressable>

            <Pressable
              style={styles.deleteButton}
              onPress={() => setDeleteModalVisible(true)}>
              <Text style={styles.deleteButtonText}>Profili Sil</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Text style={styles.modalEmoji}>🫧</Text>
            </View>

            <Text style={styles.modalTitle}>Profili silmek istiyor musun?</Text>
            <Text style={styles.modalText}>
              {pet.name} için oluşturduğun profil kaldırılacak. Bu işlem geri alınamaz.
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Vazgeç</Text>
              </Pressable>

              <Pressable style={styles.confirmButton} onPress={handleDelete}>
                <Text style={styles.confirmButtonText}>Sil</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 36,
    backgroundColor: '#F6F8FC',
  },

  heroWrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 30,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECEEF4',
    shadowColor: '#101828',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  heroGlowOne: {
    position: 'absolute',
    top: -20,
    right: -10,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(139, 122, 230, 0.10)',
  },
  heroGlowTwo: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  typeChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EEF1F6',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#344054',
  },

  heroCenter: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 18,
  },
  avatarOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    backgroundColor: '#FFFFFFAA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 38,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
    fontWeight: '500',
  },

  heroBottomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroMiniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EDF1F5',
  },
  heroMiniLabel: {
    fontSize: 11,
    color: '#98A2B3',
    textTransform: 'uppercase',
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  heroMiniValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '800',
  },

  insightPanel: {
    backgroundColor: '#111827',
    borderRadius: 26,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#111827',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  panelEyebrow: {
    fontSize: 11,
    color: '#C7D2FE',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '800',
    marginBottom: 8,
  },
  panelTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  panelText: {
    fontSize: 14,
    color: '#D0D5DD',
    lineHeight: 22,
    fontWeight: '500',
  },

  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  highlightCard: {
    width: '48.3%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECEFF4',
    shadowColor: '#101828',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  highlightLabel: {
    fontSize: 12,
    color: '#98A2B3',
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  highlightValue: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '800',
    lineHeight: 24,
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEFF4',
    marginBottom: 14,
    shadowColor: '#101828',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#111827',
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionTitleDark: {
    fontSize: 22,
    color: '#1F2937',
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionBadge: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5B5BD6',
  },

  infoLine: {
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F8',
  },
  infoLineLabel: {
    fontSize: 13,
    color: '#98A2B3',
    fontWeight: '700',
    marginBottom: 6,
  },
  infoLineValue: {
    fontSize: 17,
    color: '#111827',
    fontWeight: '700',
    lineHeight: 24,
  },

  notesCard: {
    backgroundColor: '#F7F0FF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EBDDFF',
    marginBottom: 18,
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  notesEmoji: {
    fontSize: 16,
    color: '#7C3AED',
  },
  notesValue: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    fontWeight: '500',
    marginTop: 6,
  },

  actionsWrap: {
    gap: 12,
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: '#111827',
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F4D4D8',
  },
  deleteButtonText: {
    color: '#C62828',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.34)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 6,
  },
  modalIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F7F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalEmoji: {
    fontSize: 28,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  modalText: {
    fontSize: 15,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F4F4F5',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#344054',
    fontSize: 15,
    fontWeight: '800',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '800',
  },
});