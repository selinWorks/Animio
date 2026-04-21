import React from 'react';
import {View, Text, StyleSheet, ScrollView, Pressable} from 'react-native';
import {
  PawPrint,
  Syringe,
  Plus,
  Calendar,
  List,
  ChevronRight,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {usePets} from '../data/PetContext';

type PetLike = {
  name?: string;
  type?: string;
  animal?: string;
  species?: string;
  age?: string | number;
  gender?: string;
  vaccines?: string;
  weight?: string | number;
};

export default function HomeScreen() {
  const {pets} = usePets();
  const navigation = useNavigation();

  const petList = (pets || []) as PetLike[];
  const totalPets = petList.length;
  const lastPet = totalPets > 0 ? petList[petList.length - 1] : null;
  const petsWithVaccines = petList.filter(
    pet => pet.vaccines && pet.vaccines.trim(),
  ).length;

  const getPetTypeLabel = (pet?: PetLike | null) => {
    if (!pet) return 'Pet';
    return pet.type || pet.animal || pet.species || 'Pet';
  };

  const getPetEmoji = (pet?: PetLike | null) => {
    const key = getPetTypeLabel(pet).toLowerCase().trim();

    if (
      key.includes('dog') ||
      key.includes('köpek') ||
      key.includes('kopek')
    ) {
      return '🐶';
    }
    if (key.includes('cat') || key.includes('kedi')) {
      return '🐱';
    }
    if (
      key.includes('rabbit') ||
      key.includes('tavşan') ||
      key.includes('tavsan')
    ) {
      return '🐰';
    }
    if (key.includes('bird') || key.includes('kuş') || key.includes('kus')) {
      return '🐦';
    }
    if (key.includes('fish') || key.includes('balık') || key.includes('balik')) {
      return '🐠';
    }
    if (key.includes('hamster')) {
      return '🐹';
    }
    if (
      key.includes('turtle') ||
      key.includes('kaplumbağa') ||
      key.includes('kaplumbaga')
    ) {
      return '🐢';
    }

    return '🐾';
  };

  const getGenderLabel = (pet?: PetLike | null) => {
    if (!pet?.gender) return 'Cinsiyet yok';
    return pet.gender;
  };

  const getWeightLabel = (pet?: PetLike | null) => {
    if (!pet?.weight) return 'Kilo bilgisi yok';
    return `${pet.weight} kg`;
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.heroGlowLarge} />
        <View style={styles.heroGlowSmall} />

        <Text style={styles.heroEyebrow}>PetCare Dashboard</Text>
        <Text style={styles.heroTitle}>Dostlarının bakımını tek yerden takip et</Text>

        <Text style={styles.heroSubtitle}>
          Bakım planlarını, aşı kayıtlarını ve günlük takibi sade bir panelden
          yönet.
        </Text>

        <View style={styles.heroInfoRow}>
          <View style={styles.heroChipPrimary}>
            <PawPrint size={14} color="#6658E8" strokeWidth={2.2} />
            <Text style={styles.heroChipPrimaryText}>{totalPets} aktif dostun</Text>
          </View>

          <View style={styles.heroChipSecondary}>
            <Text style={styles.heroChipSecondaryText}>
              {petsWithVaccines} aşı kaydı
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardBlue]}>
          <View style={[styles.statIconWrap, styles.statIconWrapBlue]}>
            <PawPrint size={18} color="#4F6FEA" strokeWidth={2.3} />
          </View>

          <Text style={styles.statLabel}>Toplam Dost Sayısı</Text>
          <Text style={styles.statValue}>{totalPets}</Text>
          <Text style={styles.statFootnote}>Tüm kayıtlı dostların</Text>
        </View>

        <View style={[styles.statCard, styles.statCardMint]}>
          <View style={[styles.statIconWrap, styles.statIconWrapMint]}>
            <Syringe size={18} color="#199473" strokeWidth={2.3} />
          </View>

          <Text style={styles.statLabel}>Aşı Kaydı</Text>
          <Text style={styles.statValue}>{petsWithVaccines}</Text>
          <Text style={styles.statFootnote}>Takip edilen sağlık verileri</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>

        <View style={styles.actionsGrid}>
          <Pressable style={styles.actionCard}>
            <View style={[styles.actionIconWrap, styles.actionIconWrapPurple]}>
              <Plus size={20} color="#6658E8" strokeWidth={2.4} />
            </View>
            <Text style={styles.actionTitle}>Aramıza Hoşgeldin!</Text>
            <Text style={styles.actionSubtitle}>Yeni dost ekle</Text>
          </Pressable>

          <Pressable style={styles.actionCard}>
            <View style={[styles.actionIconWrap, styles.actionIconWrapBlueSoft]}>
              <List size={20} color="#2563EB" strokeWidth={2.4} />
            </View>
            <Text style={styles.actionTitle}>Dostlarım</Text>
            <Text style={styles.actionSubtitle}>Tüm kayıtları gör</Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => navigation.navigate('Calendar' as never)}>
            <View style={[styles.actionIconWrap, styles.actionIconWrapAmber]}>
              <Calendar size={20} color="#D97706" strokeWidth={2.4} />
            </View>
            <Text style={styles.actionTitle}>Takvim</Text>
            <Text style={styles.actionSubtitle}>Planlarını incele</Text>
          </Pressable>

          <Pressable style={styles.actionCard}>
            <View style={[styles.actionIconWrap, styles.actionIconWrapGreen]}>
              <Syringe size={20} color="#199473" strokeWidth={2.4} />
            </View>
            <Text style={styles.actionTitle}>Aşılar</Text>
            <Text style={styles.actionSubtitle}>Sağlık takibini aç</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Son Eklenen Arkadaşımız</Text>

        <Pressable style={styles.lastPetCard}>
          <View style={styles.lastPetLeft}>
            <View style={styles.petAvatar}>
              <Text style={styles.petAvatarEmoji}>{getPetEmoji(lastPet)}</Text>
            </View>

            <View style={styles.petContent}>
              <Text style={styles.petName}>
                {lastPet?.name || 'Henüz pet eklenmedi'}
              </Text>

              <View style={styles.petMetaRow}>
                <Text style={styles.petTypeBadge}>
                  {getPetTypeLabel(lastPet)}
                </Text>
                {lastPet?.age ? (
                  <Text style={styles.petMetaText}>{lastPet.age} yaş</Text>
                ) : null}
              </View>

              <Text style={styles.petSub}>
                {lastPet
                  ? `${getGenderLabel(lastPet)} • ${getWeightLabel(lastPet)}`
                  : 'İlk dostunu ekleyerek bakım takibini başlat'}
              </Text>
            </View>
          </View>

          <ChevronRight size={18} color="#A1A1AA" strokeWidth={2.4} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 120,
    backgroundColor: '#F7F8FC',
  },

  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#ECE7FF',
    borderRadius: 30,
    padding: 22,
    marginBottom: 22,
    elevation: 1,
    shadowColor: '#6D5CE7',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  heroGlowLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    backgroundColor: '#DDD2FF',
    borderRadius: 999,
    top: -82,
    right: -28,
    opacity: 0.9,
  },
  heroGlowSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    backgroundColor: '#F5F2FF',
    borderRadius: 999,
    bottom: -36,
    left: -30,
    opacity: 1,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6658E8',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -0.8,
    marginBottom: 10,
    maxWidth: '84%',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: '#616777',
    maxWidth: '88%',
    marginBottom: 16,
    fontWeight: '500',
  },
  heroInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroChipPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroChipPrimaryText: {
    fontSize: 13,
    color: '#5B4BCF',
    fontWeight: '700',
  },
  heroChipSecondary: {
    backgroundColor: 'rgba(255,255,255,0.52)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroChipSecondaryText: {
    fontSize: 13,
    color: '#5B5F6B',
    fontWeight: '700',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 26,
    padding: 18,
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
  },
  statCardBlue: {
    backgroundColor: '#E8F0FF',
    borderColor: '#D8E5FF',
  },
  statCardMint: {
    backgroundColor: '#DDF4E8',
    borderColor: '#CFEADB',
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statIconWrapBlue: {
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  statIconWrapMint: {
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  statLabel: {
    fontSize: 13,
    color: '#616777',
    marginBottom: 10,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 35,
    lineHeight: 38,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -0.9,
    marginBottom: 6,
  },
  statFootnote: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 17,
  },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    color: '#18181B',
    letterSpacing: -0.3,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 22,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#111827',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    borderWidth: 1,
    borderColor: '#EEF1F6',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionIconWrapPurple: {
    backgroundColor: '#F3EEFF',
  },
  actionIconWrapBlueSoft: {
    backgroundColor: '#EAF2FF',
  },
  actionIconWrapAmber: {
    backgroundColor: '#FFF4D6',
  },
  actionIconWrapGreen: {
    backgroundColor: '#E7FAF2',
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
    textAlign:'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#8A91A1',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
  },

  lastPetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#111827',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    borderWidth: 1,
    borderColor: '#EEF1F6',
  },
  lastPetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  petAvatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#DDF4E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  petAvatarEmoji: {
    fontSize: 28,
  },
  petContent: {
    flex: 1,
  },
  petName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 5,
    letterSpacing: -0.3,
  },
  petMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  petTypeBadge: {
    fontSize: 12,
    color: '#199473',
    fontWeight: '700',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  petMetaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  petSub: {
    fontSize: 13,
    color: '#8A91A1',
    lineHeight: 18,
    fontWeight: '500',
  },
});